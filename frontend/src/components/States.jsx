import { Empty, Button, Skeleton, Result, Card, Space } from 'antd'
import {
  PlusOutlined, WifiOutlined, CheckCircleFilled, ReloadOutlined,
} from '@ant-design/icons'

// Estado vacío con CTA
export function EmptyState({ title = 'Aún no hay datos', description, actionLabel, onAction }) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Space direction="vertical" size={4}>
          <span style={{ fontWeight: 600 }}>{title}</span>
          {description && <span style={{ opacity: 0.65 }}>{description}</span>}
        </Space>
      }
    >
      {actionLabel && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Empty>
  )
}

// Carga: skeleton de tarjetas
export function LoadingState({ rows = 3 }) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}><Skeleton active paragraph={{ rows: 2 }} /></Card>
      ))}
    </Space>
  )
}

// Error (incl. sin conexión)
export function ErrorState({ title = 'No se pudo cargar', subTitle, onRetry }) {
  return (
    <Result
      icon={<WifiOutlined style={{ color: '#ff4d4f' }} />}
      title={title}
      subTitle={subTitle || 'Revisa tu conexión e inténtalo de nuevo.'}
      extra={onRetry && (
        <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
          Reintentar
        </Button>
      )}
    />
  )
}

// Éxito (p.ej. entrenamiento guardado)
export function SuccessState({ title = '¡Listo!', subTitle, extra }) {
  return (
    <Result
      icon={<CheckCircleFilled style={{ color: '#52c41a' }} />}
      title={title}
      subTitle={subTitle}
      extra={extra}
    />
  )
}
