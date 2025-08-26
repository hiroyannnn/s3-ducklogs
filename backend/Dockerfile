# syntax=docker/dockerfile:1

# --- Build stage ---
FROM golang:1.24-bookworm AS builder

# Build prerequisites and DuckDB shared library
ARG DUCKDB_VERSION=0.10.3
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake pkg-config ca-certificates curl git unzip && rm -rf /var/lib/apt/lists/* \
 && arch=$(dpkg --print-architecture) \
 && case "$arch" in \
      amd64) f=libduckdb-linux-amd64.zip ;; \
      arm64) f=libduckdb-linux-aarch64.zip ;; \
      *) echo "unsupported arch: $arch" && exit 1 ;; \
    esac \
 && curl -fsSL -o /tmp/$f https://github.com/duckdb/duckdb/releases/download/v${DUCKDB_VERSION}/$f \
 && unzip -j /tmp/$f -d /usr/local/lib \
 && rm -f /tmp/$f \
 && ldconfig

WORKDIR /app
COPY . .

# Enable CGO for duckdb
ENV CGO_ENABLED=1
ENV CGO_LDFLAGS=-L/usr/local/lib

RUN go mod download
# Ensure output directory exists, then build
RUN mkdir -p /out \
    && go build -o /out/s3-ducklogs-backend ./

# --- Runtime stage ---
FROM debian:bookworm-slim AS runtime

# Minimal runtime deps only; copy DuckDB shared lib from builder
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/lib/libduckdb.so* /usr/local/lib/
ENV LD_LIBRARY_PATH=/usr/local/lib:${LD_LIBRARY_PATH}

WORKDIR /srv
COPY --from=builder /out/s3-ducklogs-backend /usr/local/bin/s3-ducklogs-backend

# Non-root
RUN useradd -m appuser
USER appuser

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["/usr/local/bin/s3-ducklogs-backend"]
