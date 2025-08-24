# syntax=docker/dockerfile:1

# --- Build stage ---
FROM golang:1.22-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake pkg-config ca-certificates curl git \
    libduckdb-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# Enable CGO for duckdb
ENV CGO_ENABLED=1

RUN go mod download
RUN go build -o /out/s3-ducklogs-backend ./

# --- Runtime stage ---
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends libduckdb0 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /srv
COPY --from=builder /out/s3-ducklogs-backend /usr/local/bin/s3-ducklogs-backend

# Non-root
RUN useradd -m appuser
USER appuser

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["/usr/local/bin/s3-ducklogs-backend"]
