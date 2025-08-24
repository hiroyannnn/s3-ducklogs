import React, { useMemo, useState } from 'react'
import { api } from '../api'

type Row = Record<string, any>

function DataTable({ rows, columns }: { rows: Row[]; columns: string[] }) {
  if (!rows?.length) return <div className="muted">結果がありません</div>
  return (
    <div className="scroll mt12">
      <table>
        <thead>
          <tr>
            {columns.map(c => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map(c => <td key={c}>{fmt(r[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function fmt(v: any) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export default function Logs() {
  const [uri, setUri] = useState('s3://your-bucket/logs/*.parquet')
  const [format, setFormat] = useState<'parquet'|'json'|'jsonl'|'ndjson'|'csv'>('parquet')
  const [limit, setLimit] = useState(100)
  const [rows, setRows] = useState<Row[]>([])
  const [cols, setCols] = useState<string[]>([])
  const [sql, setSql] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr('')
    try {
      const res = await api.quick({ uri, format, limit })
      setRows(res.rows); setCols(res.columns); setSql(res.sql)
    } catch (e:any) {
      setErr(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="card">
      <h2>ログ一覧</h2>
      <form onSubmit={submit}>
        <div className="row mt12">
          <div className="col">
            <label>URI (s3://bucket/path/*.parquet 等)</label>
            <input value={uri} onChange={e=>setUri(e.target.value)} />
          </div>
          <div style={{width:180}}>
            <label>形式</label>
            <select value={format} onChange={e=>setFormat(e.target.value as any)}>
              <option value="parquet">parquet</option>
              <option value="json">json</option>
              <option value="jsonl">jsonl</option>
              <option value="ndjson">ndjson</option>
              <option value="csv">csv</option>
            </select>
          </div>
          <div style={{width:140}}>
            <label>Limit</label>
            <input type="number" value={limit} onChange={e=>setLimit(parseInt(e.target.value||'0')||0)} />
          </div>
        </div>
        <div className="mt16"><button type="submit" disabled={loading}>{loading?'読み込み中…':'読み込む'}</button></div>
      </form>
      {err && <p className="mt12" style={{color:'#f87171'}}>Error: {err}</p>}
      {sql && <p className="mt12 muted">SQL: <code>{sql}</code></p>}
      <DataTable rows={rows} columns={cols} />
    </div>
  )
}
