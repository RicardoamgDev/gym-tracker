import { useEffect, useMemo, useState } from 'react'
import { Card, List, Tag, Button, Empty, message, Popconfirm, Collapse, Space } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { Workouts } from '../api/client.js'
import { isThisWeek, workoutVolume } from '../utils/week.js'
import { LoadingState, ErrorState } from '../components/States.jsx'

export default function History() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')

  const load = () => {
    setStatus('loading')
    Workouts.list()
      .then(d => { setItems(d); setStatus('ok') })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [])

  // Solo lo que NO es de la semana en curso
  const past = useMemo(() => items.filter(w => !isThisWeek(w.date)), [items])

  // Agrupado por mes, de más reciente a más antiguo
  const byMonth = useMemo(() => {
    const map = new Map()
    for (const w of past) {
      const k = dayjs(w.date).format('YYYY-MM')
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(w)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [past])

  if (status === 'loading') return <LoadingState rows={2} />
  if (status === 'error') return <ErrorState onRetry={load} />

  if (past.length === 0) {
    return (
      <Card>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Aún no hay entrenamientos de semanas anteriores" />
      </Card>
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {byMonth.map(([month, list]) => (
        <Card key={month} title={dayjs(month + '-01').format('MMMM YYYY')}
          extra={<span style={{ opacity: 0.55, fontSize: 12 }}>{list.length} sesiones</span>}>
          <List
            dataSource={list}
            renderItem={w => (
              <List.Item
                actions={[
                  <Button key="e" type="text" size="small" icon={<EditOutlined />}
                    onClick={() => navigate('/log', { state: { editId: w.id } })} />,
                  <Popconfirm key="d" title="¿Borrar sesión?" onConfirm={async () => {
                    await Workouts.remove(w.id); load(); message.success('Borrado')
                  }}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={w.name || dayjs(w.date).format('DD/MM/YYYY')}
                  description={
                    <Collapse ghost size="small" items={[{
                      key: '1',
                      label: (
                        <span style={{ fontSize: 12 }}>
                          {dayjs(w.date).format('ddd DD/MM')} · {w.sets?.length || 0} series ·{' '}
                          {workoutVolume(w)} kg
                          {w.duration_minutes ? ` · ${w.duration_minutes} min` : ''}
                        </span>
                      ),
                      children: (
                        <div>
                          {(w.sets || []).map((s, i) => (
                            <div key={s.id ?? i} style={{ display: 'flex',
                              justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
                              <span>{s.exercise?.name}</span>
                              <span style={{ opacity: 0.7 }}>{s.weight} kg × {s.reps}</span>
                            </div>
                          ))}
                          {w.notes && (
                            <div style={{ marginTop: 8, opacity: 0.6, fontSize: 12 }}>{w.notes}</div>
                          )}
                        </div>
                      ),
                    }]} />
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ))}
    </Space>
  )
}
