package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/marcboeker/go-duckdb"
)

// Global DB connection (single in-memory DuckDB instance)
var db *sql.DB

func main() {
	var err error
	// Open in-memory DuckDB; can be switched to file by using a filepath DSN
	db, err = sql.Open("duckdb", "")
	if err != nil {
		log.Fatalf("failed to open duckdb: %v", err)
	}
	// Ensure single connection to avoid multiple isolated in-memory instances
	db.SetMaxOpenConns(1)
	db.SetConnMaxLifetime(0)

	if err := initDuckDB(); err != nil {
		log.Fatalf("failed to init duckdb: %v", err)
	}

	http.HandleFunc("/health", withCORS(healthHandler))
	http.HandleFunc("/connect", withCORS(connectHandler))
	http.HandleFunc("/quick", withCORS(quickHandler))
	http.HandleFunc("/query", withCORS(queryHandler))

	addr := ":8080"
	log.Printf("Backend listening on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}

func initDuckDB() error {
	// Install and load httpfs extension for S3 access
	stmts := []string{
		"INSTALL httpfs",
		"LOAD httpfs",
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			return fmt.Errorf("%s: %w", s, err)
		}
	}
	// Optionally set region from env if present (DuckDB picks AWS_* automatically)
	if v := os.Getenv("AWS_REGION"); v != "" {
		if _, err := db.Exec("SET s3_region='" + escSQL(v) + "'"); err != nil {
			return fmt.Errorf("SET s3_region: %w", err)
		}
	}
	return nil
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"status": "ok", "time": time.Now().UTC()})
}

type ConnectRequest struct {
	S3Region   string `json:"s3_region"`
	S3Endpoint string `json:"s3_endpoint"`
}

type ConnectResponse struct {
	OK      bool   `json:"ok"`
	Message string `json:"message"`
}

func connectHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var req ConnectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if req.S3Region != "" {
		if _, err := db.Exec("SET s3_region='" + escSQL(req.S3Region) + "'"); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": fmt.Sprintf("set region: %v", err)})
			return
		}
	}
	if req.S3Endpoint != "" {
		if _, err := db.Exec("SET s3_endpoint='" + escSQL(req.S3Endpoint) + "'"); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": fmt.Sprintf("set endpoint: %v", err)})
			return
		}
	}
	writeJSON(w, http.StatusOK, ConnectResponse{OK: true, Message: "httpfs configured"})
}

type QuickRequest struct {
	URI    string `json:"uri"`
	Format string `json:"format"`
	Limit  int    `json:"limit"`
}

type QueryRequest struct {
	SQL string `json:"sql"`
}

func quickHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var req QuickRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if req.URI == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "uri is required"})
		return
	}
	format := strings.ToLower(strings.TrimSpace(req.Format))
	if req.Limit <= 0 {
		req.Limit = 100
	}
	var reader string
	switch format {
	case "parquet":
		reader = "read_parquet"
	case "json", "jsonl", "ndjson":
		reader = "read_json_auto"
	case "csv":
		reader = "read_csv_auto"
	default:
		reader = "read_parquet" // best effort
	}
	sqlText := fmt.Sprintf("SELECT * FROM %s('%s') LIMIT %d", reader, escSQL(req.URI), req.Limit)
	rows, cols, err := runQuery(sqlText)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"rows": rows,
		"columns": cols,
		"sql": sqlText,
	})
}

func queryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var req QueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if strings.TrimSpace(req.SQL) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "sql is required"})
		return
	}
	rows, cols, err := runQuery(req.SQL)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"rows": rows, "columns": cols})
}

func runQuery(sqlText string) ([]map[string]any, []string, error) {
	start := time.Now()
	defer func() { log.Printf("Query took %s: %s", time.Since(start), truncate(sqlText, 200)) }()
	rows, err := db.Query(sqlText)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	cols, err := rows.Columns()
	if err != nil {
		return nil, nil, err
	}
	colTypes, _ := rows.ColumnTypes()
	result := make([]map[string]any, 0, 128)
	for rows.Next() {
		vals := make([]any, len(cols))
		scanArgs := make([]any, len(cols))
		for i := range vals {
			// Allocate type-aware containers when possible
			switch colTypes[i].DatabaseTypeName() {
			case "BOOLEAN":
				var v sql.NullBool
				scanArgs[i] = &v
			case "TINYINT", "SMALLINT", "INTEGER", "BIGINT", "HUGEINT", "UTINYINT", "USMALLINT", "UINTEGER", "UBIGINT":
				var v sql.NullInt64
				scanArgs[i] = &v
			case "FLOAT", "DOUBLE", "DECIMAL":
				var v sql.NullFloat64
				scanArgs[i] = &v
			case "DATE", "TIME", "TIMESTAMP":
				var v sql.NullString
				scanArgs[i] = &v
			default:
				var v any
				scanArgs[i] = &v
			}
		}
		if err := rows.Scan(scanArgs...); err != nil {
			return nil, nil, err
		}
		row := make(map[string]any, len(cols))
		for i, c := range cols {
			switch v := scanArgs[i].(type) {
			case *sql.NullBool:
				if v.Valid { row[c] = v.Bool } else { row[c] = nil }
			case *sql.NullInt64:
				if v.Valid { row[c] = v.Int64 } else { row[c] = nil }
			case *sql.NullFloat64:
				if v.Valid { row[c] = v.Float64 } else { row[c] = nil }
			case *sql.NullString:
				if v.Valid { row[c] = v.String } else { row[c] = nil }
			case *any:
				val := *v
				switch vv := val.(type) {
				case []byte:
					row[c] = string(vv)
				default:
					row[c] = vv
				}
			default:
				row[c] = nil
			}
		}
		result = append(result, row)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}
	return result, cols, nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

func escSQL(s string) string {
	return strings.ReplaceAll(s, "'", "''")
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "... (" + strconv.Itoa(len(s)) + ")"
}
