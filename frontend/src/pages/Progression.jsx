import { useEffect, useState } from 'react'
import { Card, Select, Segmented, Row, Col, Statistic, Tag } from 'antd'
import { RiseOutlined } from '@ant-design/icons'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { Exercises, Stats } from '../api/client.js'
import { BRAND } from '../theme/tokens.js'
import { EmptyState, LoadingState } from '../components/States.jsx'

export default function Progression() {
  const [exercises, setExercises] = useState([])
  const [exerciseId, setExerciseId] = useState(null)
  const [data, setData] = useState([])
  const [metric, setMetric] = useState('max_weight')
  const [loading, setLoading] = useState(false)

  useEffect(() => { Exercises.list().then(setExercises) }, [])

  useEffect(() => {
    if (!exerciseId) return
    setLoading(true)
    Stats.progression(exerciseId)
      .then(d => setData(d.map(x => ({
        ...x,
        max_weight: Number(x.max_weight),
        volume: Number(x.volume),
        avg_rpe: x.avg_rpe == null ? null : Number(x.avg_rpe),
      }))))
      .finally(() => setLoading(false))
  }, [exerciseId])

  const labels = { max_weight: 'Peso máx (kg)', volume: 'Volumen (kg)', avg_rpe: 'RPE medio' }

  // KPIs derivados
  const first = data[0]?.[metric]
  const last = data[data.length - 1]?.[metric]
  const delta = first && last ? Math.round(((last - first) / first) * 100) : 0
  const maxWeight = Math.max(0, ...data.map(d => d.max_weight))
  const estimatedRM = maxWeight ? Math.round(maxWeight * 1.15) : 0

  return (
    <>
      <Card
        title="Progresión por ejercicio"
        style={{ marginBottom: 16 }}
        extra={
          <Select
            showSearch placeholder="Elige un ejercicio" style={{ width: 240 }}
            optionFilterProp="label" value={exerciseId} onChange={setExerciseId}
            options={exercises.map(e => ({
              value: e.id, label: `${e.name} (${e.muscle_group?.name})`,
            }))}
          />
        }
      >
        <Segmented
          value={metric} onChange={setMetric} style={{ marginBottom: 16 }}
          options={[
            { label: 'Peso máx', value: 'max_weight' },
            { label: 'Volumen', value: 'volume' },
            { label: 'RPE', value: 'avg_rpe' },
          ]}
        />

        {!exerciseId ? <EmptyState title="Selecciona un ejercicio" description="Verás tu curva de progreso." />
          : loading ? <LoadingState rows={1} />
          : data.length === 0 ? <EmptyState title="Sin datos aún" description="Registra series de este ejercicio." />
          : (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={8}><Statistic title="Máximo actual" value={maxWeight} suffix="kg" /></Col>
              <Col xs={8}><Statistic title="1RM estimado" value={estimatedRM} suffix="kg" /></Col>
              <Col xs={8}>
                <Statistic title="Progreso" value={delta} suffix="%"
                  valueStyle={{ color: delta >= 0 ? '#52c41a' : '#ff4d4f' }}
                  prefix={delta >= 0 ? '+' : ''} />
              </Col>
            </Row>
            <div style={{ marginBottom: 8 }}>
              <Tag icon={<RiseOutlined />} color="success">
                {labels[metric]}
              </Tag>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gtArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey={metric} name={labels[metric]}
                      stroke={BRAND} strokeWidth={2} fill="url(#gtArea)" dot />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </Card>
    </>
  )
}
