import { useState, useEffect, useRef } from 'react'

export function useWebSocket(resumeId) {
  const [status, setStatus] = useState('PENDING')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [queuePosition, setQueuePosition] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    if (!resumeId) return

    // First do a quick HTTP check in case already done
    const token = localStorage.getItem('token')
    fetch(`/api/resumes/${resumeId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(json => {
        if (json.status === 'COMPLETED') {
          setStatus('COMPLETED')
          setData(json.analysis)
          return // No need for WS
        }
        if (json.status === 'FAILED') {
          setStatus('FAILED')
          setError(json.error)
          return
        }
        if (json.queuePosition) setQueuePosition(json.queuePosition)

        // Open WebSocket for live updates
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const ws = new WebSocket(`${protocol}://localhost:8080/ws?resumeId=${resumeId}`)
        wsRef.current = ws

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data)
          setStatus(msg.status)
          if (msg.status === 'COMPLETED') {
            setData(msg.analysis)
            ws.close()
          } else if (msg.status === 'FAILED') {
            setError(msg.error || 'Analysis failed')
            ws.close()
          } else if (msg.queuePosition) {
            setQueuePosition(msg.queuePosition)
          }
        }

        ws.onerror = () => setError('Connection error, please refresh')
      })
      .catch(() => setError('Failed to fetch status'))

    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [resumeId])

  return { status, data, error, queuePosition }
}
