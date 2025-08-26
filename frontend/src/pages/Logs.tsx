import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'

type Row = Record<string, any>

function DataTable({ rows, columns }: { rows: Row[]; columns: string[] }) {
  const { t } = useTranslation();

  if (!rows?.length) return <div className="muted">{t('logs.noData')}</div>
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
  const { t } = useTranslation();
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
      <h2>{t('logs.title')}</h2>
      <form onSubmit={submit}>
        <div className="row mt12">
          <div className="col">
            <label>{t('logs.uri')}</label>
            <input value={uri} onChange={e=>setUri(e.target.value)} />
          </div>
          <div style={{width:180}}>
            <label>{t('logs.format')}</label>
            <select value={format} onChange={e=>setFormat(e.target.value as any)}>
              <option value="parquet">{t('logs.parquet')}</option>
              <option value="json">{t('logs.json')}</option>
              <option value="jsonl">{t('logs.jsonl')}</option>
              <option value="ndjson">{t('logs.ndjson')}</option>
              <option value="csv">{t('logs.csv')}</option>
            </select>
          </div>
          <div style={{width:140}}>
            <label>{t('logs.limit')}</label>
            <input type="number" value={limit} onChange={e=>setLimit(parseInt(e.target.value||'0')||0)} />
          </div>
        </div>
        <div className="mt16">
          <button type="submit" disabled={loading}>
            {loading ? t('logs.loading') : t('logs.load')}
          </button>
        </div>
      </form>
      {err && <p className="mt12" style={{color:'#f87171'}}>{t('common.error')}: {err}</p>}
      {sql && <p className="mt12 muted">SQL: <code>{sql}</code></p>}
      <DataTable rows={rows} columns={cols} />
    </div>
  )
}
