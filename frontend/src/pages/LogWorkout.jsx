import { useEffect, useState } from 'react'
import {
  Card, Form, DatePicker, InputNumber, Input, Button, Select,
  Table, Space, message, Popconfirm, Divider, Tag,
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { Exercises, Workouts } from '../api/client.js'

export default function LogWorkout() {
  const [exercises, setExercises] = useState([])
  const [sets, setSets] = useState([])
  const [history, setHistory] = useState([])
  const [form] = Form.useForm()
  const [setForm] = Form.useForm()

  const loadAll = () => {
    Exercises.list().then(setExercises)
    Workouts.list().then(setHistory)
  }
  useEffect(loadAll, [])

  const addSet = (values) => {
    const ex = exercises.find(e => e.id === values.exercise_id)
    setSets([...sets, {
      key: Date.now(),
      exercise_id: values.exercise_id,
      exercise_name: ex?.name,
      muscle: ex?.muscle_group?.name,
      reps: values.reps,
      weight: values.weight ?? 0,
      rpe: values.rpe ?? null,
    }])
    setForm.resetFields(['reps', 'weight', 'rpe'])
  }

  const saveWorkout = async (values) => {
    if (sets.length === 0) return message.warning('Agrega al menos una serie')
    try {
      await Workouts.create({
        date: values.date.format('YYYY-MM-DD'),
        duration_minutes: values.duration_minutes ?? null,
        notes: values.notes ?? null,
        sets: sets.map((s, i) => ({
          exercise_id: s.exercise_id, set_number: i + 1,
          reps: s.reps, weight: s.weight, rpe: s.rpe,
        })),
      })
      message.success('Entrenamiento guardado')
      setSets([])
      form.resetFields()
      loadAll()
    } catch (e) {
      message.error('Error al guardar')
    }
  }

  const setColumns = [
    { title: 'Ejercicio', dataIndex: 'exercise_name' },
    { title: 'Músculo', dataIndex: 'muscle', render: m => m && <Tag>{m}</Tag> },
    { title: 'Reps', dataIndex: 'reps' },
    { title: 'Peso', dataIndex: 'weight' },
    { title: 'RPE', dataIndex: 'rpe', render: v => v ?? '—' },
    {
      title: '', render: (_, r) => (
        <DeleteOutlined onClick={() => setSets(sets.filter(s => s.key !== r.key))} />
      ),
    },
  ]

  return (
    <>
      <Card title="Nueva sesión" style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline" onFinish={saveWorkout}
              initialValues={{ date: dayjs() }} style={{ marginBottom: 16 }}>
          <Form.Item name="date" label="Fecha" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="duration_minutes" label="Duración (min)">
            <InputNumber min={0} max={600} />
          </Form.Item>
          <Form.Item name="notes" label="Notas">
            <Input placeholder="Cómo te sentiste..." style={{ width: 220 }} />
          </Form.Item>
        </Form>

        <Divider orientation="left">Agregar serie</Divider>
        <Form form={setForm} layout="inline" onFinish={addSet}>
          <Form.Item name="exercise_id" rules={[{ required: true }]}>
            <Select
              showSearch placeholder="Ejercicio" style={{ width: 220 }}
              optionFilterProp="label"
              options={exercises.map(e => ({
                value: e.id, label: `${e.name} (${e.muscle_group?.name})`,
              }))}
            />
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
            <Button icon={<PlusOutlined />} onClick={() => setForm.submit()}>Añadir</Button>
          </Form.Item>
        </Form>

        <Table
          style={{ marginTop: 16 }}
          columns={setColumns} dataSource={sets} pagination={false} size="small"
        />

        <Button type="primary" style={{ marginTop: 16 }} onClick={() => form.submit()}>
          Guardar entrenamiento
        </Button>
      </Card>

      <Card title="Historial">
        <Table
          rowKey="id"
          dataSource={history}
          columns={[
            { title: 'Fecha', dataIndex: 'date' },
            { title: 'Series', render: (_, r) => r.sets?.length || 0 },
            {
              title: 'Volumen (kg)',
              render: (_, r) => Math.round((r.sets || [])
                .reduce((s, x) => s + x.reps * x.weight, 0)),
            },
            { title: 'Duración', dataIndex: 'duration_minutes', render: v => v ? `${v} min` : '—' },
            { title: 'Notas', dataIndex: 'notes', ellipsis: true },
            {
              title: '', render: (_, r) => (
                <Popconfirm title="¿Borrar?" onConfirm={async () => {
                  await Workouts.remove(r.id); loadAll(); message.success('Borrado')
                }}>
                  <DeleteOutlined />
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>
    </>
  )
}
