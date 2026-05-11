import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ResumeResult, JDResult, Card } from '../components/AnalysisView.jsx'

export default function SharePage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/resumes/share/${token}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setData(json.analysis)
        setMeta({ filename: json.filename, mode: json.mode, createdAt: json.createdAt })
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [token])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>Loading...</div>
  )

  if (error) return (
    <div>
      <Card style={{ background: 'var(--danger-bg)', border: '0.5px solid var(--danger)' }}>
        <p style={{ color: 'var(--danger-text)', fontWeight: 500 }}>Result not found</p>
        <p style={{ color: 'var(--danger-text)', fontSize: 14, marginTop: 4 }}>{error}</p>
      </Card>
      <Link to="/" style={{ fontSize: 14 }}>← Go to Resume Analyzer</Link>
    </div>
  )

  const isJD = data.overallMatch !== undefined

  return (
    <div>
      {/* Shared banner */}
      <div style={{
        padding: '12px 16px', borderRadius: 'var(--radius-md)',
        background: 'var(--accent-bg)', border: '0.5px solid var(--accent)',
        marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-text)', marginBottom: 2 }}>
            📤 Shared resume analysis
          </p>
          <p style={{ fontSize: 12, color: 'var(--accent-text)', opacity: 0.8 }}>
            {meta?.filename} · {new Date(meta?.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Link to="/auth" style={{
          fontSize: 13, padding: '6px 14px',
          border: '0.5px solid var(--accent)', borderRadius: 'var(--radius-md)',
          color: 'var(--accent-text)', fontWeight: 500,
        }}>
          Try it yourself →
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>
          {isJD ? 'JD Match Result' : 'Analysis Result'}
        </h1>
      </div>

      {isJD ? <JDResult data={data} /> : <ResumeResult data={data} />}
    </div>
  )
}
