import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket.js'
import { ResumeResult, JDResult, Card } from '../components/AnalysisView.jsx'

function QueueStatus({ status, queuePosition }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{
        width: 48, height: 48, border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 24px',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ fontWeight: 500, marginBottom: 8 }}>
        {status === 'PENDING' ? 'Queued...' : 'Analyzing with AI...'}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Usually takes 10–30 seconds</p>
      {queuePosition && (
        <div style={{ display: 'inline-block', padding: '16px 28px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Queue position</p>
          <p style={{ fontSize: 32, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>#{queuePosition}</p>
          <p style={{ fontSize: 12, color: 'var(--text-hint)' }}>~{queuePosition * 20}s estimated wait</p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
            {Array.from({ length: Math.min(queuePosition, 5) }).map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'var(--border)' }} />
            ))}
            {queuePosition > 5 && <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>+{queuePosition - 5}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function ShareButton({ resumeId }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleShare() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/resumes/${resumeId}/share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      const url = `${window.location.origin}/share/${json.shareToken}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      alert('Failed to generate share link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleShare} disabled={loading} style={{
      fontSize: 13, padding: '8px 16px',
      border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
      color: copied ? 'var(--success-text)' : 'var(--text-muted)',
      background: copied ? 'var(--success-bg)' : 'transparent',
      cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
    }}>
      {loading ? 'Generating...' : copied ? '✓ Link copied!' : '🔗 Share'}
    </button>
  )
}

function StartInterviewButton({ resumeId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      navigate(`/interview/${json.sessionId}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleStart} disabled={loading} style={{
        fontSize: 13, padding: '8px 16px',
        borderRadius: 'var(--radius-md)',
        background: loading ? 'var(--bg-tertiary)' : 'var(--accent)',
        color: loading ? 'var(--text-hint)' : '#fff',
        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 500, transition: 'all 0.2s',
      }}>
        {loading ? 'Generating questions...' : 'Start Mock Interview'}
      </button>
      {error && <p style={{ fontSize: 12, color: 'var(--danger-text)', marginTop: 6 }}>{error}</p>}
    </div>
  )
}

export default function ResultPage() {
  const { id } = useParams()
  const { status, data, error, queuePosition } = useWebSocket(id)

  if (error) return (
    <div>
      <Card style={{ background: 'var(--danger-bg)', border: '0.5px solid var(--danger)' }}>
        <p style={{ color: 'var(--danger-text)', fontWeight: 500 }}>Analysis failed</p>
        <p style={{ color: 'var(--danger-text)', fontSize: 14, marginTop: 4 }}>{error}</p>
      </Card>
      <Link to="/" style={{ fontSize: 14 }}>← Back to upload</Link>
    </div>
  )

  if (status !== 'COMPLETED') return <QueueStatus status={status} queuePosition={queuePosition} />

  const isJD = data.overallMatch !== undefined

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>
          {isJD ? 'JD Match Result' : 'Analysis Result'}
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {isJD && <StartInterviewButton resumeId={id} />}
          <ShareButton resumeId={id} />
          <Link to="/" style={{ fontSize: 13, padding: '8px 16px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
            Analyze another
          </Link>
        </div>
      </div>
      {isJD ? <JDResult data={data} /> : <ResumeResult data={data} />}
    </div>
  )
}
