import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import UploadPage from './pages/UploadPage.jsx'
import ResultPage from './pages/ResultPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import SharePage from './pages/SharePage.jsx'
import InterviewPage from './pages/InterviewPage.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Loading...</div>
  return user ? children : <Navigate to="/auth" replace />
}

function Layout() {
  const { user, logout } = useAuth()
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{
        background: 'var(--bg)', borderBottom: '0.5px solid var(--border)',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--accent)' }}>
            Resume Analyzer
          </span>
          {user && (
            <nav style={{ display: 'flex', gap: 4 }}>
              {[
                { to: '/', label: 'Upload' },
                { to: '/history', label: 'History' },
              ].map(({ to, label }) => (
                <NavLink key={to} to={to} end style={({ isActive }) => ({
                  padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                  fontSize: 14, fontWeight: 500,
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  background: isActive ? 'var(--accent-bg)' : 'transparent',
                  transition: 'all 0.15s',
                })}>{label}</NavLink>
              ))}
            </nav>
          )}
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Hi, {user.name}</span>
            <button onClick={logout} style={{
              fontSize: 13, padding: '6px 14px',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)', cursor: 'pointer', background: 'transparent',
            }}>Log out</button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 1060, margin: '0 auto', padding: '40px 24px' }}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/share/:token" element={<SharePage />} />
          <Route path="/" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
          <Route path="/result/:id" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="/interview/:sessionId" element={<PrivateRoute><InterviewPage /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
