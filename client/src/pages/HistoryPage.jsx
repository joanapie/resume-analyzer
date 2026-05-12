import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const STATUS_MAP = {
  PENDING: { label: 'Queued', bg: 'var(--bg-tertiary)', color: 'var(--text-hint)' },
  PROCESSING: { label: 'Analyzing', bg: 'var(--accent-bg)', color: 'var(--accent-text)' },
  COMPLETED: { label: 'Completed', bg: 'var(--success-bg)', color: 'var(--success-text)' },
  FAILED: { label: 'Failed', bg: 'var(--danger-bg)', color: 'var(--danger-text)' },
}

const MODE_MAP = {
  resume: { label: 'Resume Review', bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
  jd: { label: 'JD Match', bg: 'var(--accent-bg)', color: 'var(--accent-text)' },
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.PENDING
  return <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 'var(--radius-sm)', background: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span>
}

function ModeBadge({ mode }) {
  const m = MODE_MAP[mode] || MODE_MAP.resume
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: m.bg, color: m.color, fontWeight: 500 }}>{m.label}</span>
}

function formatDate(str) {
  return new Date(str).toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function HistoryPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)


  useEffect(() => {
    const token = localStorage.getItem('token')

    function fetchList() {
      fetch('/api/resumes', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { setList(data); setLoading(false) })
        .catch(err => { setError(err.message); setLoading(false) })
    }

    fetchList()

    // Auto-refresh if any resume is still analyzing
    const timer = setInterval(() => {
      const hasAnalyzing = list.some(
        item => item.status === 'PENDING' || item.status === 'PROCESSING'
      )
      if (hasAnalyzing) fetchList()
    }, 3000)

    return () => clearInterval(timer)
  }, [list.length])

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>Loading...</div>
  if (error) return <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>{error}</div>

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>History</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{list.length} resume{list.length !== 1 ? 's' : ''} total</p>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg)', color: 'var(--text-muted)' }}>
          <p>No resumes analyzed yet</p>
          <Link to="/" style={{ fontSize: 14, display: 'block', marginTop: 8 }}>Upload your first resume</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(item => (
            <div key={item.id} style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <p style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{item.filename}</p>
                  <ModeBadge mode={item.mode} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-hint)', margin: 0 }}>{formatDate(item.createdAt)}</p>
              </div>
              <StatusBadge status={item.status} />
              {item.status === 'COMPLETED' && (
                <Link to={`/result/${item.id}`} style={{ fontSize: 13, padding: '6px 14px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  View result
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
