import { useState } from 'react'
import { Form, Input, Button, message, ConfigProvider } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useThemeMode } from '../context/ThemeContext.jsx'
import { lightTheme } from '../theme/tokens.js'
import Brand from '../components/Brand.jsx'

// Mismo personaje (misma ropa), sólo cabeza calva + barba (sin ojos/cejas/boca).
// Registrarse -> normal
function RegularCharacter() {
  return (
    <svg className="gt-auth-hero" viewBox="0 0 220 250" fill="none" aria-hidden="true">
      <ellipse cx="110" cy="238" rx="70" ry="10" fill="rgba(0,0,0,0.22)" />
      <path d="M84 172 h20 v60 a10 10 0 0 1 -20 0 z" fill="#4b5563" />
      <path d="M116 172 h20 v60 a10 10 0 0 1 -20 0 z" fill="#4b5563" />
      <rect x="78" y="164" width="64" height="26" rx="11" fill="#5b6472" />
      <path d="M56 116 q-13 38 -6 68 q9 11 18 2 q-5 -33 8 -62 z" fill="#e7b58e" />
      <path d="M164 116 q13 38 6 68 q-9 11 -18 2 q5 -33 -8 -62 z" fill="#e7b58e" />
      <path d="M110 86 C74 86 50 104 50 138 C50 170 74 184 110 184 C146 184 170 170 170 138 C170 104 146 86 110 86 Z" fill="#9aa1ab" />
      <path d="M96 90 q14 15 28 0 l-6 -13 h-16 z" fill="#868d97" />
      <rect x="99" y="70" width="22" height="22" rx="9" fill="#d9a97f" />
      <circle cx="110" cy="52" r="30" fill="#e7b58e" />
      <circle cx="80" cy="54" r="6" fill="#e7b58e" />
      <circle cx="140" cy="54" r="6" fill="#e7b58e" />
      <path d="M85 58 Q90 88 110 90 Q130 88 135 58 Q122 70 110 70 Q98 70 85 58 Z" fill="#33373f" />
    </svg>
  )
}

// Entrar -> mismo, pero fornido con torso en V (triángulo invertido), misma camiseta gris
function MuscularCharacter() {
  return (
    <svg className="gt-auth-hero" viewBox="0 0 240 250" fill="none" aria-hidden="true">
      <ellipse cx="120" cy="240" rx="82" ry="10" fill="rgba(0,0,0,0.22)" />
      <path d="M96 176 h20 v58 a10 10 0 0 1 -20 0 z" fill="#4b5563" />
      <path d="M124 176 h20 v58 a10 10 0 0 1 -20 0 z" fill="#4b5563" />
      <rect x="90" y="168" width="60" height="24" rx="10" fill="#5b6472" />
      <path d="M54 116 q-16 32 -7 60 q9 13 21 6 q10 -5 7 -18 q-10 -28 3 -50 z" fill="#e7b58e" />
      <circle cx="64" cy="186" r="12" fill="#d9a97f" />
      <path d="M186 116 q16 32 7 60 q-9 13 -21 6 q-10 -5 -7 -18 q10 -28 -3 -50 z" fill="#e7b58e" />
      <circle cx="176" cy="186" r="12" fill="#d9a97f" />
      <path d="M48 112 Q120 92 192 112 L150 174 Q120 184 90 174 Z" fill="#9aa1ab" />
      <path d="M104 94 q16 12 32 0 l-6 -14 h-20 z" fill="#868d97" />
      <rect x="107" y="72" width="26" height="22" rx="9" fill="#d9a97f" />
      <circle cx="120" cy="52" r="30" fill="#e7b58e" />
      <circle cx="90" cy="54" r="6" fill="#e7b58e" />
      <circle cx="150" cy="54" r="6" fill="#e7b58e" />
      <path d="M95 58 Q100 88 120 90 Q140 88 145 58 Q132 70 120 70 Q108 70 95 58 Z" fill="#33373f" />
    </svg>
  )
}

export default function Login() {
  const { login, register } = useAuth()
  const { toggle } = useThemeMode()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
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
    <div className="gt-auth-wrap">
      <div className={`gt-auth-card gt-fade-in mode-${mode}`}>
        <aside className="gt-auth-left">
          <span className="gt-brand" style={{ fontSize: 16 }}><span className="gt-brand-text">Gym&nbsp;Tracker</span></span>
          <div className="gt-auth-hero-wrap" data-mode={mode}>
            <div className="gt-auth-figure gt-figure-register"><RegularCharacter /></div>
            <div className="gt-auth-figure gt-figure-login"><MuscularCharacter /></div>
          </div>
        </aside>

        <section className="gt-auth-right">
          <div className="gt-auth-logo"><Brand showText={false} iconSize={40} /></div>

          <div className="gt-auth-tabs" data-mode={mode}>
            <button type="button" className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}>Registrarse</button>
            <button type="button" className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}>Entrar</button>
            <span className="gt-auth-underline" />
          </div>

          <ConfigProvider theme={lightTheme}>
            <div key={mode} className="gt-auth-forms gt-fade-in">
              {mode === 'login' ? (
                <Form layout="vertical" onFinish={doLogin} requiredMark={false}>
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email válido' }]}>
                    <Input size="large" prefix={<MailOutlined />} placeholder="Email" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: 'Contraseña' }]}>
                    <Input.Password size="large" prefix={<LockOutlined />} placeholder="Contraseña" />
                  </Form.Item>
                  <Button className="gt-auth-btn" htmlType="submit" block size="large" loading={loading}>
                    LOGIN
                  </Button>
                  <div className="gt-auth-forgot">¿Olvidaste tu contraseña?</div>
                </Form>
              ) : (
                <Form layout="vertical" onFinish={doRegister} requiredMark={false}>
                  <Form.Item name="name" rules={[{ required: true, message: 'Tu nombre' }]}>
                    <Input size="large" prefix={<UserOutlined />} placeholder="Nombre" />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email válido' }]}>
                    <Input size="large" prefix={<MailOutlined />} placeholder="Email" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Mínimo 6 caracteres' }]}>
                    <Input.Password size="large" prefix={<LockOutlined />} placeholder="Contraseña" />
                  </Form.Item>
                  <Form.Item name="password_confirmation" dependencies={['password']}
                    rules={[
                      { required: true, message: 'Repite la contraseña' },
                      ({ getFieldValue }) => ({
                        validator: (_, value) =>
                          !value || getFieldValue('password') === value
                            ? Promise.resolve()
                            : Promise.reject(new Error('Las contraseñas no coinciden')),
                      }),
                    ]}>
                    <Input.Password size="large" prefix={<LockOutlined />} placeholder="Repetir contraseña" />
                  </Form.Item>
                  <Button className="gt-auth-btn" htmlType="submit" block size="large" loading={loading}>
                    REGISTER
                  </Button>
                </Form>
              )}
            </div>
          </ConfigProvider>
        </section>
      </div>

      <button type="button" className="gt-auth-theme" onClick={toggle} aria-label="Cambiar tema">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 3 a9 9 0 0 1 0 18 z" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}
