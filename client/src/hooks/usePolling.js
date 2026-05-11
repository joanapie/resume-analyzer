import { useState, useEffect, useRef } from 'react'

export function usePolling(resumeId) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('PENDING')
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!resumeId) return

    async function poll() {
      try {
        const res = await fetch(`/api/resumes/${resumeId}/status`)
        if (!res.ok) throw new Error('查询失败')
        const json = await res.json()

        setStatus(json.status)
        if (json.status === 'COMPLETED') {
          setData(json.analysis)
        } else if (json.status === 'FAILED') {
          setError(json.error || '分析失败，请重试')
        } else {
          timerRef.current = setTimeout(poll, 2000)
        }
      } catch (err) {
        setError(err.message)
      }
    }

    poll()
    return () => clearTimeout(timerRef.current)
  }, [resumeId])

  return { status, data, error }
}
