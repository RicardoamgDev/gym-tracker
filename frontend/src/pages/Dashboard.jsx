import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Tag } from 'antd'
import {
  ThunderboltFilled, BarsOutlined, CalendarFilled, FireFilled,
} from '@ant-design/icons'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { Stats } from '../api/client.js'
import { muscleColor, BRAND } from '../theme/tokens.js'
import { EmptyState, LoadingState, ErrorState } from '../components/States.jsx'

function StatChip({ icon, tint = BRAND }) {
  return (
    <span style={{
      width: 40, height: 40, borderRadius: 12, flex: '0 0 auto',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: `${tint}22`, color: tint, fontSize: 19,
    }}>{icon}</span>
  )
}

export default function Dashboard() {
  const [weekly, setWeekly] = useState([])
  const [muscle, setMuscle] = useState([])
  const [status, setStatus] = useState('loading') // loading | ok | error

  const load = () => {
    setStatus('loading')
    Promise.all([Stats.weeklyVolume(), Stats.muscleDistribution()])
      .then(([w, m]) => {
        setWeekly(w.map(x => ({ ...x, volume: Number(x.volume) })))
        setMuscle(m.map(x => ({ ...x, volume: Number(x.volume) })))
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [])

  if (status === 'loading') return <LoadingState rows={2} />
  if (status === 'error') return <ErrorState onRetry={load} />

  const totalVolume = weekly.reduce((s, x) => s + x.volume, 0)
  const totalSets = muscle.reduce((s, x) => s + Number(x.total_sets), 0)
  const topMuscle = muscle[0]?.muscle_group
  const totalMuscleVol = muscle.reduce((s, x) => s + x.volume, 0) || 1

  if (weekly.length === 0 && muscle.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Aún no hay entrenamientos"
          description="Registra tu primera sesión para ver tu progreso aquí."
          actionLabel="Registrar entrenamiento"
          onAction={() => (location.href = '/log')}
        />
      </Card>
    )
  }

  const fmt = (n) => `${(n / 1000).toFixed(1)}t`

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card className="gt-stat gt-lift" styles={{ body: { display: 'flex', gap: 14, alignItems: 'center' } }}>
            <StatChip icon={<ThunderboltFilled />} />
            <Statistic title="Volumen total" value={Math.round(totalVolume)} suffix="kg" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="gt-stat gt-lift" styles={{ body: { display: 'flex', gap: 14, alignItems: 'center' } }}>
            <StatChip icon={<BarsOutlined />} tint="#22d3ee" />
            <Statistic title="Series totales" value={totalSets} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="gt-stat gt-lift" styles={{ body: { display: 'flex', gap: 14, alignItems: 'center' } }}>
            <StatChip icon={<CalendarFilled />} tint="#a78bfa" />
            <Statistic title="Semanas activas" value={weekly.length} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="gt-stat gt-lift" styles={{ body: { display: 'flex', gap: 14, alignItems: 'center' } }}>
            <StatChip icon={<FireFilled />} tint={topMuscle ? muscleColor(topMuscle) : '#fb923c'} />
            <div>
              <div style={{ opacity: 0.6, fontSize: 12 }}>Músculo top</div>
              <div style={{ marginTop: 4 }}>
                {topMuscle
                  ? <Tag color={muscleColor(topMuscle)} style={{ fontSize: 14, fontWeight: 700, marginInlineEnd: 0 }}>{topMuscle}</Tag>
                  : <span style={{ fontSize: 20, fontWeight: 700 }}>—</span>}
              </div>
              <div style={{ opacity: 0.55, fontSize: 12, marginTop: 2 }}>
                {topMuscle && `${Math.round((muscle[0].volume / totalMuscleVol) * 100)}% del volumen`}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Volumen por semana"
            extra={<span style={{ opacity: 0.5, fontSize: 12 }}>kg</span>}>
            {weekly.length === 0 ? <EmptyState title="Sin datos semanales" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${Math.round(v)} kg`, 'Volumen']} />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                    {weekly.map((_, i) => (
                      <Cell key={i} fill={i === weekly.length - 1 ? BRAND : 'rgba(163,230,53,0.32)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Reparto por grupo">
            {muscle.length === 0 ? <EmptyState title="Sin datos" /> : (
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={muscle} dataKey="volume" nameKey="muscle_group"
                         cx="50%" cy="50%" innerRadius={70} outerRadius={105} paddingAngle={2}>
                      {muscle.map((m, i) => (
                        <Cell key={i} fill={m.color || muscleColor(m.muscle_group)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${Math.round(v)} kg`, 'Volumen']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '42%', left: 0, right: 0,
                              textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>{fmt(totalMuscleVol)}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>volumen</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  {muscle.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                                          fontSize: 13, padding: '2px 4px' }}>
                      <span>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4,
                          background: m.color || muscleColor(m.muscle_group), marginRight: 8 }} />
                        {m.muscle_group}
                      </span>
                      <span style={{ opacity: 0.6 }}>
                        {Math.round((m.volume / totalMuscleVol) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </>
  )
}
