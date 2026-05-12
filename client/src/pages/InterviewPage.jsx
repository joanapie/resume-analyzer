import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'

const CATEGORY_COLORS = {
  'Technical':     { bg: 'var(--accent-bg)',   color: 'var(--accent-text)' },
  'Behavioral':    { bg: 'var(--success-bg)',  color: 'var(--success-text)' },
  'System Design': { bg: 'var(--warning-bg)',  color: 'var(--warning-text)' },
  'Resume':        { bg: 'var(--danger-bg)',   color: 'var(--danger-text)' },
}

const DIFFICULTY_COLORS = {
  'Easy':   { color: 'var(--success-text)' },
  'Medium': { color: 'var(--warning-text)' },
  'Hard':   { color: 'var(--danger-text)' },
}

function Badge({ label, style }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '2px 8px',
      borderRadius: 'var(--radius-sm)', ...style,
    }}>{label}</span>
  )
}

function QuestionCard({ q, index, isActive, onSelect }) {
  const cat = CATEGORY_COLORS[q.category] || CATEGORY_COLORS['Technical']
  const diff = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS['Medium']
  return (
    <button onClick={() => onSelect(index)} style={{
      width: '100%', textAlign: 'left', padding: '14px 16px',
      border: `0.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)',
      background: isActive ? 'var(--accent-bg)' : 'var(--bg)',
      cursor: 'pointer', transition: 'all 0.15s', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
          Q{index + 1}
        </span>
        <Badge label={q.category} style={cat} />
        <Badge label={q.difficulty} style={{ color: diff.color, background: 'transparent', border: `0.5px solid ${diff.color}` }} />
      </div>
      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
        {q.question.length > 100 ? q.question.slice(0, 100) + '...' : q.question}
      </p>
    </button>
  )
}

function EvaluationStream({ sessionId, question, answer, onReset }) {
  const [feedback, setFeedback] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const feedbackRef = useRef('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    feedbackRef.current = ''
    setFeedback('')
    setDone(false)
    setError(null)

    const ctrl = new AbortController()

    fetch(`/api/interview/${sessionId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question, answer }),
      signal: ctrl.signal,
    }).then(async res => {
      if (!res.ok) throw new Error('Evaluation failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const msg = JSON.parse(line.slice(6))
            if (msg.text) {
              feedbackRef.current += msg.text
              setFeedback(feedbackRef.current)
            }
            if (msg.done) setDone(true)
            if (msg.error) setError(msg.error)
          } catch {}
        }
      }
    }).catch(err => {
      if (err.name !== 'AbortError') setError(err.message)
    })

    return () => ctrl.abort()
  }, [sessionId, question, answer])

  function renderMarkdown(text) {
    // Split into lines and process
    const lines = text.split('\n')
    let html = ''
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      // Headings
      if (line.startsWith('## ')) {
        html += `<p style="font-size:14px;font-weight:600;margin:14px 0 4px">${line.slice(3).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`
      } else if (line.startsWith('### ')) {
        html += `<p style="font-size:13px;font-weight:600;margin:10px 0 4px">${line.slice(4).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`
      } else if (line.startsWith('- ')) {
        // Collect consecutive list items
        let items = ''
        while (i < lines.length && lines[i].startsWith('- ')) {
          items += `<li>${lines[i].slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`
          i++
        }
        html += `<ul style="margin:6px 0;padding-left:20px;list-style:disc">${items}</ul>`
        continue
      } else if (line.trim() === '') {
        // skip blank lines
      } else {
        html += `<p style="margin:4px 0">${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`
      }
      i++
    }
    return html
  }

  return (
    <div>
      <div style={{
        padding: '16px 20px', borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
        marginBottom: 16, minHeight: 120,
      }}>
        {error ? (
          <p style={{ color: 'var(--danger-text)', fontSize: 14 }}>{error}</p>
        ) : feedback ? (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)' }}>
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(feedback) }} />
            {!done && <span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--accent)', marginLeft: 2, animation: 'blink 1s infinite', verticalAlign: 'middle' }} />}
          </div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)' }}>
            <span style={{ color: 'var(--text-hint)' }}>Evaluating your answer...</span>
            <span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--accent)', marginLeft: 2, animation: 'blink 1s infinite', verticalAlign: 'middle' }} />
          </div>
        )}
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      {done && (
        <button onClick={onReset} style={{
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          border: '0.5px solid var(--border)', background: 'transparent',
          color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
        }}>
          Try another answer
        </button>
      )}
    </div>
  )
}

export default function InterviewPage() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/interview/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setSession(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [sessionId])

  function handleSelect(index) {
    setActiveIndex(index)
    setAnswer('')
    setSubmitted(false)
    setShowHint(false)
  }

  function handleSubmit() {
    if (!answer.trim()) return
    setSubmitted(true)
    setShowHint(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>Loading session...</div>
  )

  if (error || !session) return (
    <div>
      <div style={{ padding: 16, background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--danger-text)', marginBottom: 16 }}>
        {error || 'Session not found'}
      </div>
      <Link to="/history" style={{ fontSize: 14 }}>← Back to history</Link>
    </div>
  )

  const questions = session.questions || []
  const activeQ = questions[activeIndex]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Mock Interview</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Target role: <strong style={{ color: 'var(--accent)' }}>{session.role}</strong>
          </p>
        </div>
        <Link to="/history" style={{
          fontSize: 13, padding: '7px 14px',
          border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)',
          color: 'var(--text-muted)',
        }}>
          ← Back
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Left: question list */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Questions
          </p>
          {questions.map((q, i) => (
            <QuestionCard key={q.id} q={q} index={i} isActive={i === activeIndex} onSelect={handleSelect} />
          ))}
        </div>

        {/* Right: question + answer */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeQ && (
            <>
              {/* Question */}
              <div style={{
                padding: '20px 24px', borderRadius: 'var(--radius-lg)',
                border: '0.5px solid var(--border)', background: 'var(--bg)',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Badge label={activeQ.category} style={CATEGORY_COLORS[activeQ.category] || CATEGORY_COLORS['Technical']} />
                  <Badge label={activeQ.difficulty} style={{
                    color: DIFFICULTY_COLORS[activeQ.difficulty]?.color || 'var(--text-muted)',
                    background: 'transparent',
                    border: `0.5px solid ${DIFFICULTY_COLORS[activeQ.difficulty]?.color || 'var(--border)'}`,
                  }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, marginBottom: 0 }}>
                  {activeQ.question}
                </p>
              </div>

              {!submitted ? (
                <>
                  {/* Answer textarea */}
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Type your answer here... Speak as you would in a real interview."
                    style={{
                      width: '100%', minHeight: 180, padding: '14px 16px',
                      borderRadius: 'var(--radius-lg)',
                      border: `0.5px solid ${answer.trim() ? 'var(--border-strong)' : 'var(--border)'}`,
                      background: 'var(--bg)', color: 'var(--text)',
                      fontSize: 14, lineHeight: 1.7, resize: 'vertical',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <button
                      onClick={() => setShowHint(h => !h)}
                      style={{
                        fontSize: 13, color: 'var(--text-hint)', background: 'none',
                        border: 'none', cursor: 'pointer', padding: 0,
                      }}
                    >
                      {showHint ? 'Hide hint' : 'Show hint'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!answer.trim()}
                      style={{
                        padding: '10px 28px', borderRadius: 'var(--radius-md)',
                        background: answer.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: answer.trim() ? '#fff' : 'var(--text-hint)',
                        fontSize: 14, fontWeight: 500, border: 'none',
                        cursor: answer.trim() ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Submit answer →
                    </button>
                  </div>

                  {showHint && (
                    <div style={{
                      marginTop: 12, padding: '12px 16px',
                      borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)',
                      border: '0.5px solid var(--warning-text)', fontSize: 13,
                      color: 'var(--warning-text)', lineHeight: 1.6,
                    }}>
                      <strong>Hint:</strong> {activeQ.hint}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Submitted answer preview */}
                  <div style={{
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)', marginBottom: 16,
                    fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                  }}>
                    <p style={{ fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>Your answer:</p>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p>
                  </div>

                  {/* AI streaming evaluation */}
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: 'var(--text)' }}>
                      AI feedback:
                    </p>
                    <EvaluationStream
                      sessionId={sessionId}
                      question={activeQ}
                      answer={answer}
                      onReset={() => { setSubmitted(false); setAnswer('') }}
                    />
                  </div>
                </>
              )}

              {/* Progress */}
              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => handleSelect(Math.max(0, activeIndex - 1))}
                  disabled={activeIndex === 0}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-md)',
                    border: '0.5px solid var(--border)', background: 'transparent',
                    color: activeIndex === 0 ? 'var(--text-hint)' : 'var(--text-muted)',
                    fontSize: 13, cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-hint)', flex: 1, textAlign: 'center' }}>
                  {activeIndex + 1} / {questions.length}
                </span>
                <button
                  onClick={() => handleSelect(Math.min(questions.length - 1, activeIndex + 1))}
                  disabled={activeIndex === questions.length - 1}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-md)',
                    border: '0.5px solid var(--border)', background: 'transparent',
                    color: activeIndex === questions.length - 1 ? 'var(--text-hint)' : 'var(--text-muted)',
                    fontSize: 13, cursor: activeIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
