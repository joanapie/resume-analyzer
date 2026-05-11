function ScoreRing({ score }) {
  const r = 52, cx = 64, cy = 64
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--accent)' : 'var(--danger)'
  return (
    <div style={{ position: 'relative', width: 128, height: 128 }}>
      <svg width="128" height="128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 28, fontWeight: 600, color }}>{score}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 100</span>
      </div>
    </div>
  )
}

function ScoreBar({ label, score, max }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 500 }}>{score} / {max}</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const map = {
    'High':   { bg: 'var(--danger-bg)',  color: 'var(--danger-text)' },
    'Medium': { bg: 'var(--warning-bg)', color: 'var(--warning-text)' },
    'Low':    { bg: 'var(--success-bg)', color: 'var(--success-text)' },
  }
  const style = map[priority] || map['Low']
  return (
    <span style={{ ...style, fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
      {priority} priority
    </span>
  )
}

export function Card({ children, style }) {
  return (
    <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16, ...style }}>
      {children}
    </div>
  )
}

export function SectionTitle({ children }) {
  return <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>{children}</h2>
}

function KeywordTag({ word, matched }) {
  return (
    <span style={{
      fontSize: 13, padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontWeight: 500,
      background: matched ? 'var(--success-bg)' : 'var(--danger-bg)',
      color: matched ? 'var(--success-text)' : 'var(--danger-text)',
    }}>
      {matched ? '✓' : '✗'} {word}
    </span>
  )
}

function SuggestionList({ suggestions }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {suggestions.map((s, i) => (
        <div key={i} style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontWeight: 500 }}>
              {s.category}
            </span>
            <PriorityBadge priority={s.priority} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{s.issue}</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.recommendation}</p>
        </div>
      ))}
    </div>
  )
}

function ATSCard({ atsAnalysis }) {
  if (!atsAnalysis) return null
  const { score, passed = [], failed = [], tips = [] } = atsAnalysis
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)'
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionTitle>🤖 ATS Compatibility</SectionTitle>
        <span style={{ fontSize: 22, fontWeight: 600, color }}>{score}/100</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
      {passed.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Passed checks</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {passed.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {failed.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Issues found</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {failed.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>✗</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {tips.length > 0 && (
        <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Tips to improve ATS score</p>
          {tips.map((t, i) => (
            <p key={i} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>• {t}</p>
          ))}
        </div>
      )}
    </Card>
  )
}

export function ResumeResult({ data }) {
  const { overallScore, scoreDetail, summary, strengths, suggestions, atsAnalysis } = data
  return (
    <>
      <Card>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ScoreRing score={overallScore} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Overall score</span>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>{summary}</p>
            <ScoreBar label="Project experience" score={scoreDetail.projectScore}    max={40} />
            <ScoreBar label="Skill match"        score={scoreDetail.skillMatchScore} max={20} />
            <ScoreBar label="Content"            score={scoreDetail.contentScore}    max={15} />
            <ScoreBar label="Structure"          score={scoreDetail.structureScore}  max={15} />
            <ScoreBar label="Expression"         score={scoreDetail.expressionScore} max={10} />
          </div>
        </div>
      </Card>
      <ATSCard atsAnalysis={atsAnalysis} />
      <Card>
        <SectionTitle>Strengths</SectionTitle>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {strengths.map((s, i) => (
            <li key={i} style={{ padding: '10px 14px', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--success-text)' }}>{s}</li>
          ))}
        </ul>
      </Card>
      <Card>
        <SectionTitle>Suggestions</SectionTitle>
        <SuggestionList suggestions={suggestions} />
      </Card>
    </>
  )
}

export function JDResult({ data }) {
  const { overallMatch, scoreDetail, summary, matchedKeywords, missingKeywords, suggestions } = data
  return (
    <>
      <Card>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ScoreRing score={overallMatch} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>JD match</span>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>{summary}</p>
            <ScoreBar label="Skill match"       score={scoreDetail.skillMatch}       max={35} />
            <ScoreBar label="Experience match"  score={scoreDetail.experienceMatch}  max={30} />
            <ScoreBar label="Achievement match" score={scoreDetail.achievementMatch} max={20} />
            <ScoreBar label="Culture fit"       score={scoreDetail.cultureFit}       max={15} />
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle>Keyword analysis</SectionTitle>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Matched</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {matchedKeywords.map((w, i) => <KeywordTag key={i} word={w} matched />)}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Missing</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {missingKeywords.map((w, i) => <KeywordTag key={i} word={w} matched={false} />)}
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle>Suggestions</SectionTitle>
        <SuggestionList suggestions={suggestions} />
      </Card>
    </>
  )
}
