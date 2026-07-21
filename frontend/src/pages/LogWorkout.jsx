import { useEffect, useMemo, useState } from 'react'
import {
  Card, Form, Input, InputNumber, Button, Select, Steps, Drawer, List,
  Tag, Empty, message, Popconfirm, Modal, Space, Divider, Alert, ColorPicker,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, LeftOutlined, CheckOutlined,
  EditOutlined, ClockCircleOutlined, CalendarOutlined, RightOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { Exercises, MuscleGroups, Workouts } from '../api/client.js'
import { isThisWeek, workoutVolume, groupByExercise } from '../utils/week.js'
import { BRAND } from '../theme/tokens.js'
import { useAuth } from '../context/AuthContext.jsx'
import { focusNextOnEnter } from '../utils/formNav.js'

export default function LogWorkout() {
  const navigate = useNavigate()
  const location = useLocation()

  const [exercises, setExercises] = useState([])
  const [groups, setGroups] = useState([])
  const [history, setHistory] = useState([])

  const [step, setStep] = useState(0)           // 0 = datos, 1 = ejercicios
  const [name, setName] = useState('')
  const [startedAt, setStartedAt] = useState(null)
  const [notes, setNotes] = useState('')
  const [sets, setSets] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showWeek, setShowWeek] = useState(false)
  const [restored, setRestored] = useState(false)
  const [draftRecovered, setDraftRecovered] = useState(false)

  const { user } = useAuth()
  const draftKey = user ? `gt:draft:${user.id}` : null

  // Selector en cascada: categoría -> ejercicio -> series
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickGroup, setPickGroup] = useState(null)
  const [pickExercise, setPickExercise] = useState(null)
  const [newExOpen, setNewExOpen] = useState(false)
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [setForm] = Form.useForm()
  const [exForm] = Form.useForm()
  const [groupForm] = Form.useForm()

  // Recupera el borrador guardado (cambio de pestaña, cierre del navegador...)
  useEffect(() => {
    if (!draftKey || restored) return
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const d = JSON.parse(raw)
        if (d && (d.sets?.length || d.name)) {
          setName(d.name || '')
          setNotes(d.notes || '')
          setSets(d.sets || [])
          setEditingId(d.editingId ?? null)
          setStartedAt(d.startedAt ? dayjs(d.startedAt) : null)
          setStep(d.step ?? 0)
          setDraftRecovered(true)
        }
      }
    } catch { /* borrador corrupto: se ignora */ }
    setRestored(true)
  }, [draftKey, restored])

  // Autoguardado en cada cambio
  useEffect(() => {
    if (!draftKey || !restored) return
    const vacio = !name && sets.length === 0 && !startedAt
    if (vacio) { localStorage.removeItem(draftKey); return }
    localStorage.setItem(draftKey, JSON.stringify({
      step, name, notes, sets, editingId,
      startedAt: startedAt ? startedAt.toISOString() : null,
    }))
  }, [draftKey, restored, step, name, notes, sets, editingId, startedAt])

  const loadAll = () => {
    Exercises.list().then(setExercises)
    MuscleGroups.list().then(setGroups)
    Workouts.list().then(setHistory)
  }
  useEffect(loadAll, [])

  // Entrar en modo edición desde Historial (navigate('/log', { state: { editId } }))
  useEffect(() => {
    const editId = location.state?.editId
    if (!editId || history.length === 0) return
    const w = history.find(x => x.id === editId)
    if (w) startEdit(w)
    navigate('/log', { replace: true, state: null })
  }, [location.state, history])

  const weekSessions = useMemo(
    () => history.filter(w => isThisWeek(w.date)),
    [history],
  )

  const resetAll = () => {
    setStep(0); setName(''); setStartedAt(null); setNotes('')
    setSets([]); setEditingId(null); setDraftRecovered(false)
    if (draftKey) localStorage.removeItem(draftKey)
  }

  const beginSession = () => {
    if (!name.trim()) return message.warning('Ponle un nombre a la sesión')
    setStartedAt(dayjs())
    setStep(1)
  }

  const startEdit = (w) => {
    setEditingId(w.id)
    setName(w.name || '')
    setStartedAt(w.started_at ? dayjs(w.started_at) : dayjs(w.date))
    setNotes(w.notes || '')
    setSets((w.sets || []).map((s, i) => ({
      key: `${w.id}-${s.id ?? i}`,
      exercise_id: s.exercise_id,
      exercise_name: s.exercise?.name,
      muscle: s.exercise?.muscle_group?.name,
      reps: Number(s.reps),
      weight: Number(s.weight ?? 0),
      rpe: s.rpe == null ? null : Number(s.rpe),
    })))
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ---- selector ----
  const openPicker = () => { setPickGroup(null); setPickExercise(null); setPickerOpen(true) }
  const chooseExercise = (ex) => {
    setPickExercise(ex)
  }

  // Abre el panel directamente en las series de un ejercicio ya presente
  const addSetsTo = (exerciseId) => {
    const ex = exercises.find(e => e.id === exerciseId)
    if (!ex) return message.warning('Ejercicio no encontrado')
    setPickGroup(groups.find(g => g.id === ex.muscle_group_id) || null)
    setPickExercise(ex)
    setPickerOpen(true)
  }
  // Al entrar en un ejercicio, precargamos los valores de su última serie
  useEffect(() => {
    if (!pickerOpen || !pickExercise) return
    const last = [...sets].reverse().find(s => s.exercise_id === pickExercise.id)
    setForm.setFieldsValue({
      weight: last?.weight ?? null,
      reps: last?.reps ?? null,
      rpe: last?.rpe ?? null,
    })
  }, [pickerOpen, pickExercise])

  const addSet = (v) => {
    setSets(prev => [...prev, {
      key: `${Date.now()}-${Math.random()}`,
      exercise_id: pickExercise.id,
      exercise_name: pickExercise.name,
      muscle: pickExercise.muscle_group?.name,
      reps: v.reps,
      weight: v.weight ?? 0,
      rpe: v.rpe ?? null,
    }])
    message.success('Serie añadida')
  }

  const createGroup = async (v) => {
    try {
      const created = await MuscleGroups.create({
        name: v.name,
        color: typeof v.color === 'string' ? v.color : v.color?.toHexString(),
      })
      const list = await MuscleGroups.list()
      setGroups(list)
      setNewGroupOpen(false)
      groupForm.resetFields()
      // entramos directo en la categoría recién creada
      setPickGroup(list.find(g => g.id === created.id) || created)
      message.success(`Categoría "${created.name}" creada`)
    } catch {
      message.error('No se pudo crear (¿nombre repetido?)')
    }
  }

  const createExercise = async (v) => {
    try {
      const created = await Exercises.create(v)
      const list = await Exercises.list()
      setExercises(list)
      setNewExOpen(false)
      exForm.resetFields()
      const full = list.find(e => e.id === created.id) || created
      setPickGroup(groups.find(g => g.id === full.muscle_group_id) || null)
      chooseExercise(full)
      message.success(`"${full.name}" creado`)
    } catch {
      message.error('No se pudo crear (¿nombre repetido?)')
    }
  }

  // ---- guardar ----
  const finish = async () => {
    if (sets.length === 0) return message.warning('Añade al menos una serie')
    const start = startedAt || dayjs()
    const end = dayjs()
    const payload = {
      name: name.trim() || null,
      date: start.format('YYYY-MM-DD'),
      started_at: start.format('YYYY-MM-DD HH:mm:ss'),
      ended_at: end.format('YYYY-MM-DD HH:mm:ss'),
      duration_minutes: Math.max(0, end.diff(start, 'minute')),
      notes: notes.trim() || null,
      sets: sets.map((s, i) => ({
        exercise_id: s.exercise_id, set_number: i + 1,
        reps: s.reps, weight: s.weight, rpe: s.rpe,
      })),
    }
    setSaving(true)
    try {
      if (editingId) {
        await Workouts.update(editingId, payload)
        message.success('Sesión actualizada')
      } else {
        await Workouts.create(payload)
        message.success('Sesión guardada')
      }
      resetAll(); loadAll()
    } catch {
      message.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const grouped = groupByExercise(sets)
  const exercisesOfGroup = pickGroup
    ? exercises.filter(e => e.muscle_group_id === pickGroup.id)
    : []

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Steps
          size="small"
          current={step}
          onChange={(s) => { if (s === 0 || startedAt) setStep(s) }}
          items={[{ title: 'Sesión' }, { title: 'Ejercicios' }]}
          style={{ marginBottom: 20 }}
        />

        {step === 0 && (
          <div>
            {draftRecovered && (
              <Alert
                type="warning" showIcon style={{ marginBottom: 16 }}
                message="Recuperamos una sesión sin terminar"
                description="Se guardó automáticamente en este dispositivo. Continúa donde ibas o descártala."
                action={<Button size="small" onClick={resetAll}>Descartar</Button>}
              />
            )}
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Nombre de la sesión</div>
            <Input
              size="large" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej. Push Day" onPressEnter={beginSession} autoFocus
            />

            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              <Tag icon={<CalendarOutlined />} style={{ padding: '6px 12px', fontSize: 14 }}>
                {dayjs().format('DD/MM/YYYY')}
              </Tag>
              <Tag icon={<ClockCircleOutlined />} style={{ padding: '6px 12px', fontSize: 14 }}>
                Inicio {dayjs().format('HH:mm')}
              </Tag>
            </div>
            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 8 }}>
              La fecha y la hora de inicio se registran solas al continuar.
              La hora de fin se guarda al finalizar la sesión.
            </div>

            <Button type="primary" size="large" block style={{ marginTop: 20 }}
              onClick={beginSession} icon={<RightOutlined />}>
              {editingId ? 'Continuar edición' : 'Comenzar sesión'}
            </Button>
          </div>
        )}

        {step === 1 && (
          <div>
            {draftRecovered && !editingId && (
              <Alert
                type="warning" showIcon style={{ marginBottom: 16 }}
                message="Sesión recuperada"
                description="Estos datos se guardaron solos en este dispositivo."
                action={<Button size="small" onClick={resetAll}>Descartar</Button>}
              />
            )}
            {editingId && (
              <Alert type="info" showIcon style={{ marginBottom: 16 }}
                message="Editando una sesión guardada"
                description="Al finalizar se reemplazan sus series por las de esta lista." />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{name || 'Sesión'}</div>
              <Button type="text" size="small" icon={<EditOutlined />}
                onClick={() => setStep(0)} />
            </div>
            <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 16 }}>
              {dayjs(startedAt).format('DD/MM/YYYY')} · inicio {dayjs(startedAt).format('HH:mm')}
            </div>

            <Button type="primary" size="large" block icon={<PlusOutlined />}
              onClick={openPicker}>
              Añadir ejercicio
            </Button>

            <Divider orientation="left" style={{ marginTop: 24 }}>
              Ejercicios de la sesión ({grouped.length})
            </Divider>

            {grouped.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Todavía no has añadido ejercicios" />
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {grouped.map(g => (
                  <Card key={g.exercise_id} size="small" className="gt-ex-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{g.name}</div>
                        {g.muscle && <Tag style={{ marginTop: 4 }}>{g.muscle}</Tag>}
                      </div>
                      <Space size={4}>
                        <Button size="small" type="primary" ghost icon={<PlusOutlined />}
                          onClick={() => addSetsTo(g.exercise_id)}>
                          Serie
                        </Button>
                        <Button type="text" danger size="small" icon={<DeleteOutlined />}
                          onClick={() => setSets(sets.filter(s => s.exercise_id !== g.exercise_id))} />
                      </Space>
                    </div>
                    {g.sets.map((s, i) => (
                      <div key={s.key} style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', padding: '6px 0',
                        borderTop: '1px solid rgba(128,128,128,.15)' }}>
                        <span style={{ opacity: 0.6, fontSize: 12 }}>Serie {i + 1}</span>
                        <span style={{ fontWeight: 600 }}>
                          {s.weight} kg × {s.reps}{s.rpe ? ` · RPE ${s.rpe}` : ''}
                        </span>
                        <Button type="text" danger size="small" icon={<DeleteOutlined />}
                          onClick={() => setSets(sets.filter(x => x.key !== s.key))} />
                      </div>
                    ))}
                  </Card>
                ))}
              </Space>
            )}

            <Input.TextArea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Notas de la sesión (opcional)"
              autoSize={{ minRows: 2 }} style={{ marginTop: 16 }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button type="primary" loading={saving} icon={<CheckOutlined />}
                onClick={finish} style={{ flex: 1 }}>
                {editingId ? 'Guardar cambios' : 'Finalizar sesión'}
              </Button>
              <Button type="text" onClick={resetAll}>Cancelar</Button>
            </div>
          </div>
        )}
      </Card>

      <Card title="Esta semana"
        extra={<Button type="link" size="small" onClick={() => setShowWeek(v => !v)}>
          {showWeek ? 'Ocultar' : `Ver historial de la semana (${weekSessions.length})`}
        </Button>}>
        {!showWeek ? null : weekSessions.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Sin entrenamientos esta semana" />
        ) : (
          <List
            dataSource={weekSessions}
            renderItem={w => (
              <List.Item
                actions={[
                  <Button key="e" type="text" size="small" icon={<EditOutlined />}
                    onClick={() => startEdit(w)} />,
                  <Popconfirm key="d" title="¿Borrar sesión?" onConfirm={async () => {
                    await Workouts.remove(w.id); loadAll(); message.success('Borrado')
                  }}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={w.name || dayjs(w.date).format('DD/MM/YYYY')}
                  description={
                    <span style={{ fontSize: 12 }}>
                      {dayjs(w.date).format('ddd DD/MM')} · {w.sets?.length || 0} series ·{' '}
                      {workoutVolume(w)} kg
                      {w.duration_minutes ? ` · ${w.duration_minutes} min` : ''}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
        {showWeek && (
          <Button type="link" size="small" style={{ paddingInline: 0, marginTop: 8 }}
            onClick={() => navigate('/history')}>
            Ver historial completo →
          </Button>
        )}
      </Card>

      {/* Selector en cascada: categoría -> ejercicio -> series */}
      <Drawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        placement="bottom"
        height="82%"
        title={
          pickExercise ? (
            <Space><Button type="text" size="small" icon={<LeftOutlined />}
              onClick={() => setPickExercise(null)} />{pickExercise.name}</Space>
          ) : pickGroup ? (
            <Space><Button type="text" size="small" icon={<LeftOutlined />}
              onClick={() => setPickGroup(null)} />{pickGroup.name}</Space>
          ) : 'Elige una categoría'
        }
      >
        {/* Paso A: categorías */}
        {!pickGroup && (
          <>
          <Button block icon={<PlusOutlined />} style={{ marginBottom: 12 }}
            onClick={() => setNewGroupOpen(true)}>
            Crear categoría nueva
          </Button>
          <List
            dataSource={groups}
            renderItem={g => (
              <List.Item className="gt-pick-row" onClick={() => setPickGroup(g)}>
                <Space>
                  <span style={{ width: 12, height: 12, borderRadius: 6,
                    background: g.color || '#64748b', display: 'inline-block' }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{g.name}</span>
                </Space>
                <RightOutlined style={{ opacity: 0.4 }} />
              </List.Item>
            )}
          />
          </>
        )}

        {/* Paso B: ejercicios de la categoría */}
        {pickGroup && !pickExercise && (
          <>
            <Button block icon={<PlusOutlined />} style={{ marginBottom: 12 }}
              onClick={() => { exForm.setFieldsValue({ muscle_group_id: pickGroup.id }); setNewExOpen(true) }}>
              Crear ejercicio nuevo
            </Button>
            {exercisesOfGroup.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No hay ejercicios en esta categoría" />
            ) : (
              <List
                dataSource={exercisesOfGroup}
                renderItem={ex => (
                  <List.Item className="gt-pick-row" onClick={() => chooseExercise(ex)}>
                    <span style={{ fontSize: 16 }}>{ex.name}</span>
                    <RightOutlined style={{ opacity: 0.4 }} />
                  </List.Item>
                )}
              />
            )}
          </>
        )}

        {/* Paso C: series del ejercicio */}
        {pickExercise && (
          <>
            <Form form={setForm} layout="vertical" onFinish={addSet} onKeyDown={focusNextOnEnter}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Form.Item name="weight" label="Peso (kg)" style={{ flex: 1 }}>
                  <InputNumber min={0} step={0.5} size="large" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="reps" label="Reps" rules={[{ required: true }]} style={{ flex: 1 }}>
                  <InputNumber min={1} size="large" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="rpe" label="RPE" style={{ flex: 1 }}>
                  <InputNumber min={1} max={10} step={0.5} size="large" style={{ width: '100%' }} />
                </Form.Item>
              </div>
              <Button type="primary" block size="large" icon={<PlusOutlined />}
                onClick={() => setForm.submit()}>
                Añadir serie
              </Button>
            </Form>

            <Divider orientation="left">Series de {pickExercise.name}</Divider>
            {sets.filter(s => s.exercise_id === pickExercise.id).length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin series aún" />
            ) : (
              sets.filter(s => s.exercise_id === pickExercise.id).map((s, i) => (
                <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '8px 0',
                  borderBottom: '1px solid rgba(128,128,128,.15)' }}>
                  <span style={{ opacity: 0.6 }}>Serie {i + 1}</span>
                  <span style={{ fontWeight: 600 }}>
                    {s.weight} kg × {s.reps}{s.rpe ? ` · RPE ${s.rpe}` : ''}
                  </span>
                  <Button type="text" danger size="small" icon={<DeleteOutlined />}
                    onClick={() => setSets(sets.filter(x => x.key !== s.key))} />
                </div>
              ))
            )}

            <Button block size="large" style={{ marginTop: 16 }}
              onClick={() => { setPickExercise(null); setPickGroup(null) }}>
              Añadir otro ejercicio
            </Button>
            <Button type="primary" block size="large" style={{ marginTop: 8 }}
              onClick={() => setPickerOpen(false)}>
              Listo
            </Button>
          </>
        )}
      </Drawer>

      <Modal
        title="Nueva categoría" open={newGroupOpen}
        onCancel={() => setNewGroupOpen(false)} onOk={() => groupForm.submit()}
        okText="Crear" cancelText="Cancelar" destroyOnClose
      >
        <Form form={groupForm} layout="vertical" onFinish={createGroup}
          initialValues={{ color: BRAND }} preserve={false} onKeyDown={focusNextOnEnter}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input placeholder="Ej. Antebrazos" autoFocus />
          </Form.Item>
          <Form.Item name="color" label="Color">
            <ColorPicker />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Nuevo ejercicio" open={newExOpen}
        onCancel={() => setNewExOpen(false)} onOk={() => exForm.submit()}
        okText="Crear" cancelText="Cancelar" destroyOnClose
      >
        <Form form={exForm} layout="vertical" onFinish={createExercise}
          initialValues={{ unit: 'kg' }} preserve={false} onKeyDown={focusNextOnEnter}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input placeholder="Ej. Press inclinado con mancuernas" autoFocus />
          </Form.Item>
          <Form.Item name="muscle_group_id" label="Grupo muscular" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label"
              options={groups.map(g => ({ value: g.id, label: g.name }))} />
          </Form.Item>
          <Form.Item name="unit" label="Unidad">
            <Select options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
