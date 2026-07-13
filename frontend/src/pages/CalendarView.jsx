import { useEffect, useState } from 'react'
import { Card, Calendar, Tooltip } from 'antd'
import { Stats } from '../api/client.js'
import { LoadingState, ErrorState } from '../components/States.jsx'
import useIsMobile from '../hooks/useIsMobile.js'

export default function CalendarView() {
  const isMobile = useIsMobile()
  const [byDate, setByDate] = useState({})
  const [maxVol, setMaxVol] = useState(1)
  const [status, setStatus] = useState('loading')

  const load = () => {
    setStatus('loading')
    Stats.calendar()
      .then(rows => {
        const map = {}
        let max = 1
        rows.forEach(r => {
          const vol = Number(r.volume)
          map[r.date] = { volume: vol, sets: Number(r.total_sets) }
          if (vol > max) max = vol
        })
        setByDate(map); setMaxVol(max); setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [])

  // Intensidad lima según volumen relativo
  const cellRender = (value) => {
    const d = value.format('YYYY-MM-DD')
    const info = byDate[d]
    if (!info) return null
    const ratio = Math.min(1, info.volume / maxVol)
    const bg = `rgba(100, 116, 139, ${0.18 + ratio * 0.62})`
    return (
      <Tooltip title={`${info.sets} series · ${Math.round(info.volume)} kg`}>
        <div style={{ background: bg, borderRadius: 8, height: 36, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: ratio > 0.4 ? '#0b0d10' : 'inherit', fontWeight: 700, fontSize: 12 }}>
          {info.sets}
        </div>
      </Tooltip>
    )
  }

  if (status === 'loading') return <LoadingState rows={1} />
  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <Card title="Calendario de actividad">
      <Calendar fullscreen={!isMobile} cellRender={cellRender} />
    </Card>
  )
}
