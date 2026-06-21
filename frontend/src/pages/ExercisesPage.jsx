import { useEffect, useMemo, useState } from 'react'
import {
  Card, Table, Form, Input, Select, Button, Tag, message,
  Popconfirm, Space, ColorPicker,
} from 'antd'
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { Exercises, MuscleGroups } from '../api/client.js'
import { BRAND } from '../theme/tokens.js'

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([])
  const [groups, setGroups] = useState([])
  const [q, setQ] = useState('')
  const [groupFilter, setGroupFilter] = useState(null)
  const [exForm] = Form.useForm()
  const [mgForm] = Form.useForm()

  const load = () => {
    Exercises.list().then(setExercises)
    MuscleGroups.list().then(setGroups)
  }
  useEffect(load, [])

  const addExercise = async (v) => {
    try {
      await Exercises.create(v)
      message.success('Ejercicio creado')
      exForm.resetFields()
      load()
    } catch { message.error('Error') }
  }

  const addGroup = async (v) => {
    try {
      await MuscleGroups.create({
        name: v.name,
        color: typeof v.color === 'string' ? v.color : v.color?.toHexString(),
      })
      message.success('Grupo creado')
      mgForm.resetFields()
      load()
    } catch { message.error('Error o nombre duplicado') }
  }

  const filtered = useMemo(() => exercises.filter(e =>
    (!q || e.name.toLowerCase().includes(q.toLowerCase())) &&
    (!groupFilter || e.muscle_group_id === groupFilter)
  ), [exercises, q, groupFilter])

  const catalogCount = exercises.filter(e => e.user_id == null).length

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card title="Nuevo ejercicio">
        <Form form={exForm} layout="inline" onFinish={addExercise} initialValues={{ unit: 'kg' }}>
          <Form.Item name="name" rules={[{ required: true }]}>
            <Input placeholder="Nombre (ej. Press banca)" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="muscle_group_id" rules={[{ required: true }]}>
            <Select placeholder="Grupo muscular" style={{ width: 180 }}
              options={groups.map(g => ({ value: g.id, label: g.name }))} />
          </Form.Item>
          <Form.Item name="unit">
            <Select style={{ width: 90 }} options={[
              { value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' },
            ]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Crear</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={`Ejercicios (${filtered.length})`}
        extra={
          <Space>
            <Input
              allowClear prefix={<SearchOutlined />} placeholder="Buscar..."
              value={q} onChange={e => setQ(e.target.value)} style={{ width: 180 }}
            />
            <Select
              allowClear placeholder="Grupo" style={{ width: 150 }}
              value={groupFilter} onChange={setGroupFilter}
              options={groups.map(g => ({ value: g.id, label: g.name }))}
            />
          </Space>
        }
      >
        <Table rowKey="id" dataSource={filtered} pagination={{ pageSize: 12, showSizeChanger: false }}
          columns={[
            { title: 'Nombre', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
            {
              title: 'Grupo muscular',
              render: (_, r) => (
                <Tag color={r.muscle_group?.color}>{r.muscle_group?.name}</Tag>
              ),
            },
            { title: 'Unidad', dataIndex: 'unit', width: 80 },
            {
              title: 'Origen', width: 110,
              render: (_, r) => r.user_id == null
                ? <Tag color={BRAND} style={{ color: '#0b0d10', fontWeight: 600 }}>Catálogo</Tag>
                : <Tag>Mío</Tag>,
            },
            {
              title: '', width: 50, render: (_, r) => r.user_id == null ? null : (
                <Popconfirm title="¿Borrar ejercicio?" onConfirm={async () => {
                  await Exercises.remove(r.id); load(); message.success('Borrado')
                }}>
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]} />
      </Card>

      <Card title="Nuevo grupo muscular"
        extra={<span style={{ opacity: 0.55, fontSize: 12 }}>{catalogCount} ejercicios en el catálogo</span>}>
        <Form form={mgForm} layout="inline" onFinish={addGroup} initialValues={{ color: BRAND }}>
          <Form.Item name="name" rules={[{ required: true }]}>
            <Input placeholder="Nombre del grupo" />
          </Form.Item>
          <Form.Item name="color" label="Color">
            <ColorPicker />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Crear grupo</Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  )
}
