import React, { useState } from 'react'
import { api } from '../api'

export default function Connect() {
  const [region, setRegion] = useState('ap-northeast-1')
  const [endpoint, setEndpoint] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string>('')
  const [err, setErr] = useState<string>('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErr(''); setMsg('')
    try {
      const res = await api.connect({ s3_region: region, s3_endpoint: endpoint || undefined })
      setMsg(`OK: ${res.message}`)
    } catch (e:any) {
      setErr(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="card">
      <h2>接続設定</h2>
      <p className="muted">DuckDB httpfs 拡張を有効化し、S3 リージョン/エンドポイントを設定します。AWS 認証情報は環境変数から自動取得されます。</p>
      <form onSubmit={onSubmit}>
        <div className="row mt12">
          <div className="col">
            <label>Region</label>
            <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="ap-northeast-1" />
          </div>
          <div className="col">
            <label>Endpoint (任意: S3互換)</label>
            <input value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="s3.amazonaws.com または http://minio:9000" />
          </div>
        </div>
        <div className="mt16">
          <button type="submit" disabled={loading}>{loading? '適用中…':'適用'}</button>
        </div>
      </form>
      {msg && <p className="mt12" style={{color:'#22c55e'}}>{msg}</p>}
      {err && <p className="mt12" style={{color:'#f87171'}}>Error: {err}</p>}
      <div className="mt12 muted">
        例: aws s3 に対しては endpoint 空欄でOK / MinIO等は endpoint を指定し、必要に応じて AWS_* を設定
      </div>
    </div>
  )
}
