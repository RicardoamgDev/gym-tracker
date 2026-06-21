import { useState } from 'react'
import { Card, Form, Input, Button, Tabs, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Brand from '../components/Brand.jsx'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const doLogin = async (v) => {
    setLoading(true)
    try { await login(v); navigate('/') }
    catch (e) { message.error(e.response?.data?.message || 'Error al iniciar sesión') }
    finally { setLoading(false) }
  }

  const doRegister = async (v) => {
    setLoading(true)
    try { await register(v); navigate('/') }
    catch (e) {
      const errs = e.response?.data?.errors
      message.error(errs ? Object.values(errs)[0][0] : 'Error al registrarse')
    }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20,
      background: `
        radial-gradient(60vw 60vh at 15% 0%, rgba(163,230,53,0.16), transparent 55%),
        radial-gradient(55vw 55vh at 100% 100%, rgba(34,211,238,0.14), transparent 55%),
        #0b0d10`,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="gt-fade-in">
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <Brand size={20} iconSize={34} />
          <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600,
                        letterSpacing: '0.02em' }}>
            Registra. Progresa. Repite.
          </div>
        </div>

        <Card
          variant="borderless"
          style={{
            background: 'rgba(21,24,29,0.92)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Tabs
            centered
            items={[
              {
                key: 'login', label: 'Iniciar sesión',
                children: (
                  <Form layout="vertical" onFinish={doLogin} requiredMark={false}>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                      <Input size="large" placeholder="tu@email.com" />
                    </Form.Item>
                    <Form.Item name="password" label="Contraseña" rules={[{ required: true }]}>
                      <Input.Password size="large" placeholder="••••••••" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                      Entrar
                    </Button>
                  </Form>
                ),
              },
              {
                key: 'register', label: 'Crear cuenta',
                children: (
                  <Form layout="vertical" onFinish={doRegister} requiredMark={false}>
                    <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
                      <Input size="large" placeholder="Tu nombre" />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                      <Input size="large" placeholder="tu@email.com" />
                    </Form.Item>
                    <Form.Item name="password" label="Contraseña" rules={[{ required: true, min: 6 }]}>
                      <Input.Password size="large" placeholder="Mínimo 6 caracteres" />
                    </Form.Item>
                    <Form.Item name="password_confirmation" label="Repetir contraseña"
                      dependencies={['password']}
                      rules={[
                        { required: true },
                        ({ getFieldValue }) => ({
                          validator: (_, value) =>
                            !value || getFieldValue('password') === value
                              ? Promise.resolve()
                              : Promise.reject(new Error('Las contraseñas no coinciden')),
                        }),
                      ]}>
                      <Input.Password size="large" placeholder="••••••••" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                      Registrarse
                    </Button>
                  </Form>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  )
}
