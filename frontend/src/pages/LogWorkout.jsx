import { useEffect, useState } from 'react'
import {
  Card, Form, InputNumber, Input, Button, Select, DatePicker,
  Table, Space, message, Popconfirm, Divider, Tag, Modal, Alert,
} from 'antd'
import {
  DeleteOutlined, PlusOutlined, EditOutlined, CloseOutlined, SaveOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { Exercises, MuscleGroups, Workouts } from '../api/client.js'

export default function LogWorkout() {
  const [exercises, setExercises] = useState([])
  const [muscleGroups, setMuscleGroups] = useState([])
  const [selectedMuscle, setSelectedMuscle] = useState(null)
  const [sets, setSets] = useState([])
  const [history, setHistory] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [newExOpen, setNewExOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()      // sesión (fecha, duración, notas)
  const [setForm] = Form.useForm()   // añadir serie
  const [exForm] = Form.useForm()    // nuevo ejercicio

  const loadAll = () => {
    Exercises.list().then(setExercises)
    MuscleGroups.list().then(setMuscleGroups)
    Workouts.list().then(setHistory)
  }
  useEffect(() => {
    loadAll()
    form.setFieldsValue({ date: dayjs() })
  }, [])

  const filteredExercises = selectedMuscle
    ? exercises.filter(e => e.muscle_group_id === selectedMuscle)
    : exercises

  const addSet = (values) => {
    const ex = exercises.find(e => e.id === values.exercise_id)
    setSets([...sets, {
      key: `${Date.now()}-${Math.random()}`,
      exercise_id: values.exercise_id,
      exercise_name: ex?.name,
      muscle: ex?.muscle_group?.name,
      reps: values.reps,
      weight: values.weight ?? 0,
      rpe: values.rpe ?? null,
    }])
    setForm.resetFields(['reps', 'weight', 'rpe'])
  }

  // Crear un ejercicio nuevo sin salir de la sesión
  const createExercise = async (v) => {
    try {
      const created = await Exercises.create(v)
      const list = await Exercises.list()
      setExercises(list)
      setNewExOpen(false)
      exForm.resetFields()
      // lo dejamos seleccionado y quitamos el filtro para que se vea
      setSelectedMuscle(null)
      setForm.setFieldsValue({ exercise_id: created.id })
      message.success(`"${created.name}" creado y seleccionado`)
    } catch {
      message.error('No se pudo crear el ejercicio (¿nombre repetido?)')
    }
  }

  const resetEditor = () => {
    setSets([])
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ date: dayjs() })
  }

  // Cargar una sesión guardada en el editor
  const startEdit = (w) => {
    setEditingId(w.id)
    setSets((w.sets || []).map((s, i) => ({
      key: `${w.id}-${s.id ?? i}`,
      exercise_id: s.exercise_id,
      exercise_name: s.exercise?.name,
      muscle: s.exercise?.muscle_group?.name,
      reps: Number(s.reps),
      weight: Number(s.weight ?? 0),
      rpe: s.rpe == null ? null : Number(s.rpe),
    })))
    form.setFieldsValue({
      date: dayjs(w.date),
      duration_minutes: w.duration_minutes ?? null,
      notes: w.notes ?? null,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveWorkout = async (values) => {
    if (sets.length === 0) return message.warning('Agrega al menos una serie')
    const payload = {
      date: (values.date || dayjs()).format('YYYY-MM-DD'),
      duration_minutes: values.duration_minutes ?? null,
      notes: values.notes ?? null,
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
        message.success('Entrenamiento guardado')
      }
      resetEditor()
      loadAll()
    } catch {
      message.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const setColumns = [
    { title: 'Ejercicio', dataIndex: 'exercise_name' },
    { title: 'Músculo', dataIndex: 'muscle', render: m => m && <Tag>{m}</Tag> },
    { title: 'Reps', dataIndex: 'reps' },
    { title: 'Peso', dataIndex: 'weight' },
    { title: 'RPE', dataIndex: 'rpe', render: v => v ?? '—' },
    {
      title: '', width: 50, render: (_, r) => (
        <Button type="text" danger size="small" icon={<DeleteOutlined />}
          onClick={() => setSets(sets.filter(s => s.key !== r.key))} />
      ),
    },
  ]

  return (
    <>
      <Card
        title={editingId
          ? 'Editar sesión'
          : `Nueva sesión — ${dayjs().format('DD/MM/YYYY')}`}
        style={{ marginBottom: 24 }}
        extra={editingId && (
          <Button size="small" icon={<CloseOutlined />} onClick={resetEditor}>
            Cancelar edición
          </Button>
        )}
      >
        {editingId && (
          <Alert
            type="info" showIcon style={{ marginBottom: 16 }}
            message="Estás editando una sesión guardada"
            description="Al guardar se reemplazan sus series por las de esta lista."
          />
        )}

        <Form form={form} layout="inline" onFinish={saveWorkout}>
          <Form.Item name="date" label="Fecha" rules={[{ required: true }]}>
            <DatePicker format="DD/MM/YYYY" allowClear={false} />
          </Form.Item>
          <Form.Item name="duration_minutes" label="Duración (min)">
            <InputNumber min={0} max={600} placeholder="60" />
          </Form.Item>
          <Form.Item name="notes" label="Notas">
            <Input placeholder="Cómo te sentiste..." style={{ width: 300 }} />
          </Form.Item>
        </Form>

        <Divider orientation="left">Agregar serie</Divider>
        <Form form={setForm} layout="inline" onFinish={addSet}>
          <Form.Item label="Grupo muscular">
            <Select
              allowClear
              showSearch
              placeholder="Filtrar por músculo"
              style={{ width: 180 }}
              optionFilterProp="label"
              value={selectedMuscle}
              options={muscleGroups.map(mg => ({ value: mg.id, label: mg.name }))}
              onChange={(val) => {
                setSelectedMuscle(val || null)
                setForm.resetFields(['exercise_id'])
              }}
            />
          </Form.Item>
          <Form.Item name="exercise_id" rules={[{ required: true }]}>
            <Select
              showSearch placeholder="Ejercicio" style={{ width: 220 }}
              optionFilterProp="label"
              options={filteredExercises.map(e => ({ value: e.id, label: e.name }))}
            />
          </Form.Item>
          <Form.Item>
            <Button icon={<PlusOutlined />} onClick={() => setNewExOpen(true)}>
              Nuevo ejercicio
            </Button>
          </Form.Item>
          <Form.Item name="reps" rules={[{ required: true }]}>
            <InputNumber min={1} placeholder="Reps" />
          </Form.Item>
          <Form.Item name="weight">
            <InputNumber min={0} step={0.5} placeholder="Peso" />
          </Form.Item>
          <Form.Item name="rpe">
            <InputNumber min={1} max={10} step={0.5} placeholder="RPE" />
          </Form.Item>
          <Form.Item>
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => setForm.submit()}>
              Añadir serie
            </Button>
          </Form.Item>
        </Form>

        <Table
          style={{ marginTop: 16 }}
          rowKey="key"
          columns={setColumns} dataSource={sets} pagination={false} size="small"
          locale={{ emptyText: 'Sin series todavía' }}
        />

        <Button
          type="primary" style={{ marginTop: 16 }} loading={saving}
          icon={<SaveOutlined />} onClick={() => form.submit()}
        >
          {editingId ? 'Guardar cambios' : 'Guardar entrenamiento'}
        </Button>
      </Card>

      <Card title="Historial">
        <Table
          rowKey="id"
          dataSource={history}
          rowClassName={(r) => (r.id === editingId ? 'gt-row-editing' : '')}
          columns={[
            { title: 'Fecha', dataIndex: 'date', render: d => dayjs(d).format('DD/MM/YYYY') },
            { title: 'Series', render: (_, r) => r.sets?.length || 0 },
            {
              title: 'Volumen (kg)',
              render: (_, r) => Math.round((r.sets || [])
                .reduce((s, x) => s + x.reps * x.weight, 0)),
            },
            { title: 'Duración', dataIndex: 'duration_minutes', render: v => v ? `${v} min` : '—' },
            { title: 'Notas', dataIndex: 'notes', ellipsis: true },
            {
              title: '', width: 96, render: (_, r) => (
                <Space size={4}>
                  <Button type="text" size="small" icon={<EditOutlined />}
                    onClick={() => startEdit(r)} />
                  <Popconfirm title="¿Borrar sesión?" onConfirm={async () => {
                    await Workouts.remove(r.id)
                    if (r.id === editingId) resetEditor()
                    loadAll(); message.success('Borrado')
                  }}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* Crear ejercicio sin salir de la sesión */}
      <Modal
        title="Nuevo ejercicio"
        open={newExOpen}
        onCancel={() => setNewExOpen(false)}
        onOk={() => exForm.submit()}
        okText="Crear y seleccionar"
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form form={exForm} layout="vertical" onFinish={createExercise}
          initialValues={{ unit: 'kg' }} preserve={false}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input placeholder="Ej. Press inclinado con mancuernas" autoFocus />
          </Form.Item>
          <Form.Item name="muscle_group_id" label="Grupo muscular" rules={[{ required: true }]}>
            <Select
              showSearch optionFilterProp="label" placeholder="Elige el grupo"
              options={muscleGroups.map(mg => ({ value: mg.id, label: mg.name }))}
            />
          </Form.Item>
          <Form.Item name="unit" label="Unidad">
            <Select options={[
              { value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
