import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UploadPage() {
  const [mode, setMode] = useState('resume')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [jd, setJd] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef()
  const navigate = useNavigate()

  const ALLOWED = ['.pdf', '.docx', '.doc', '.txt']

  function validate(f) {
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!ALLOWED.includes(ext)) { setError('Only PDF, DOCX, and TXT files are supported'); return false }
    if (f.size > 10 * 1024 * 1024) { setError('File size must not exceed 10MB'); return false }
    return true
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && validate(f)) { setFile(f); setError(null) }
  }

  function onSelect(e) {
    const f = e.target.files[0]
    if (f && validate(f)) { setFile(f); setError(null) }
  }

  async function handleUpload() {
    if (!file) return
    if (mode === 'jd' && !jd.trim()) { setError('Please paste a job description'); return }
    setUploading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('mode', mode)
      if (mode === 'jd') form.append('jobDescription', jd.trim())

      const token = localStorage.getItem('token')
      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      navigate(`/result/${json.resumeId}`)
    } catch (err) {
      setError(err.message); setUploading(false)
    }
  }

  const canSubmit = file && !uploading && (mode === 'resume' || jd.trim().length > 0)

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 8 }}>Upload Resume</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Choose a mode below, then upload your resume.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
        {[{ key: 'resume', label: 'Resume Review' }, { key: 'jd', label: 'JD Match' }].map(({ key, label }) => (
          <button key={key} onClick={() => { setMode(key); setError(null) }} style={{
            padding: '8px 20px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500,
            background: mode === key ? 'var(--bg)' : 'transparent',
            color: mode === key ? 'var(--accent)' : 'var(--text-muted)',
            border: mode === key ? '0.5px solid var(--border)' : 'none',
            transition: 'all 0.15s', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div onClick={() => inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)} onDrop={onDrop}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius-lg)', background: dragging ? 'var(--accent-bg)' : 'var(--bg)',
              padding: '48px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
            }}>
            <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: 'none' }} onChange={onSelect} />
            {file ? (
              <>
                <p style={{ fontWeight: 500, marginBottom: 4, fontSize: 14 }}>{file.name}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{(file.size / 1024).toFixed(0)} KB · Click to change</p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 500, marginBottom: 4, fontSize: 14 }}>Drop file here or click to browse</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>PDF / DOCX / TXT · Max 10MB</p>
              </>
            )}
          </div>
        </div>

        {mode === 'jd' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <textarea value={jd} onChange={e => setJd(e.target.value)}
              placeholder="Paste the job description here..."
              style={{
                width: '100%', height: 210, padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                border: `0.5px solid ${jd.trim() ? 'var(--border-strong)' : 'var(--border)'}`,
                background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
                lineHeight: 1.6, resize: 'none', outline: 'none', transition: 'border 0.15s',
              }} />
            <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 6 }}>
              {jd.trim().length > 0 ? `${jd.trim().length} characters` : 'Paste a JD to enable match analysis'}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', color: 'var(--danger-text)', fontSize: 14, marginTop: 16 }}>
          {error}
        </div>
      )}

      <button onClick={handleUpload} disabled={!canSubmit} style={{
        width: '100%', padding: '14px', marginTop: 16, borderRadius: 'var(--radius-md)',
        background: canSubmit ? 'var(--accent)' : 'var(--bg-tertiary)',
        color: canSubmit ? '#fff' : 'var(--text-hint)',
        fontSize: 15, fontWeight: 500, cursor: canSubmit ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s', border: 'none',
      }}>
        {uploading ? 'Uploading...' : mode === 'jd' ? 'Analyze JD Match' : 'Analyze Resume'}
      </button>
    </div>
  )
}
