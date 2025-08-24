export type ConnectReq = { s3_region?: string; s3_endpoint?: string }
export type QuickReq = { uri: string; format: 'parquet'|'json'|'jsonl'|'ndjson'|'csv'; limit?: number }
export type QueryReq = { sql: string }

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8080'

async function http<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let msg = await res.text()
    try { const j = JSON.parse(msg); msg = j.error || msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export const api = {
  connect: (data: ConnectReq) => http<{ ok: boolean; message: string }>("/connect", data),
  quick: (data: QuickReq) => http<{ rows: any[]; columns: string[]; sql: string }>("/quick", data),
  query: (data: QueryReq) => http<{ rows: any[]; columns: string[] }>("/query", data),
}
