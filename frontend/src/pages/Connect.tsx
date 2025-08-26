import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'

export default function Connect() {
  const { t } = useTranslation();
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
      setMsg(`${t('common.success')}: ${res.message}`)
    } catch (e:any) {
      setErr(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="card">
      <h2>{t('connect.title')}</h2>
      <p className="muted">{t('connect.description')}</p>
      <form onSubmit={onSubmit}>
        <div className="row mt12">
          <div className="col">
            <label>{t('connect.region')}</label>
            <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="ap-northeast-1" />
          </div>
          <div className="col">
            <label>{t('connect.endpoint')}</label>
            <input value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="s3.amazonaws.com または http://minio:9000" />
          </div>
        </div>
        <div className="mt16">
          <button type="submit" disabled={loading}>
            {loading ? t('connect.applying') : t('connect.apply')}
          </button>
        </div>
      </form>
      {msg && <p className="mt12" style={{color:'#22c55e'}}>{msg}</p>}
      {err && <p className="mt12" style={{color:'#f87171'}}>{t('common.error')}: {err}</p>}
      <div className="mt12 muted">
        {t('connect.example')}
      </div>
    </div>
  )
}
