import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'

type Row = Record<string, any>

function DataTable({ rows, columns }: { rows: Row[]; columns: string[] }) {
  const { t } = useTranslation();

  if (!rows?.length) return <div className="muted">{t('sql.noData')}</div>
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

export default function SQL() {
  const { t } = useTranslation();
  const [sql, setSql] = useState('SELECT 1 AS ok')
  const [rows, setRows] = useState<Row[]>([])
  const [cols, setCols] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const run = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr('')
    try {
      const res = await api.query({ sql })
      setRows(res.rows); setCols(res.columns)
    } catch (e:any) {
      setErr(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="card">
      <h2>{t('sql.title')}</h2>
      <form onSubmit={run}>
        <label>{t('sql.query')}</label>
        <textarea rows={8} value={sql} onChange={e=>setSql(e.target.value)} spellCheck={false} />
        <div className="mt12">
          <button type="submit" disabled={loading}>
            {loading ? t('sql.executing') : t('sql.execute')}
          </button>
        </div>
      </form>
      {err && <p className="mt12" style={{color:'#f87171'}}>{t('common.error')}: {err}</p>}
      <DataTable rows={rows} columns={cols} />
    </div>
  )
}
