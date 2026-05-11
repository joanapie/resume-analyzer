import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function update(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name }

      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      login(json.token, json.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        {mode === 'login' ? 'Welcome back' : 'Create account'}
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
        {mode === 'login' ? 'Sign in to access your resume history' : 'Get started with Resume Analyzer'}
      </p>

      <div style={{
        background: 'var(--bg)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '28px 24px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {mode === 'register' && (
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Name</label>
            <input
              name="name" value={form.name} onChange={update}
              placeholder="Your name"
              style={{
                width: '100%', padding: '10px 12px',
                border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email</label>
          <input
            name="email" value={form.email} onChange={update}
            type="email" placeholder="you@example.com"
            style={{
              width: '100%', padding: '10px 12px',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Password</label>
          <input
            name="password" value={form.password} onChange={update}
            type="password" placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', padding: '10px 12px',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)', color: 'var(--danger-text)', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '12px', borderRadius: 'var(--radius-md)',
            background: loading ? 'var(--bg-tertiary)' : 'var(--accent)',
            color: loading ? 'var(--text-hint)' : '#fff',
            fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none', marginTop: 4,
          }}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null) }}
          style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  )
}
