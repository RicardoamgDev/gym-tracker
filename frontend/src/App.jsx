import { Layout, Menu, Spin, Button, Dropdown, Avatar, Switch, Grid } from 'antd'
import {
  DashboardOutlined, PlusCircleOutlined, LineChartOutlined,
  CalendarOutlined, AppstoreOutlined, LogoutOutlined, UserOutlined,
  MoonFilled, SunFilled,
} from '@ant-design/icons'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import LogWorkout from './pages/LogWorkout.jsx'
import Progression from './pages/Progression.jsx'
import CalendarView from './pages/CalendarView.jsx'
import ExercisesPage from './pages/ExercisesPage.jsx'
import Login from './pages/Login.jsx'
import Brand from './components/Brand.jsx'
import { BRAND, INK } from './theme/tokens.js'
import { useAuth } from './context/AuthContext.jsx'
import { useThemeMode } from './context/ThemeContext.jsx'
import useIsMobile from './hooks/useIsMobile.js'

const { Header, Content, Sider, Footer } = Layout

const nav = [
  { key: '/', icon: <DashboardOutlined />, label: 'Resumen' },
  { key: '/log', icon: <PlusCircleOutlined />, label: 'Registrar' },
  { key: '/progression', icon: <LineChartOutlined />, label: 'Progresión' },
  { key: '/calendar', icon: <CalendarOutlined />, label: 'Calendario' },
  { key: '/exercises', icon: <AppstoreOutlined />, label: 'Ejercicios' },
]

function ThemeToggle() {
  const { isDark, toggle } = useThemeMode()
  return (
    <Switch
      checked={isDark}
      onChange={toggle}
      checkedChildren={<MoonFilled />}
      unCheckedChildren={<SunFilled />}
    />
  )
}

function Routed() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/log" element={<LogWorkout />} />
      <Route path="/progression" element={<Progression />} />
      <Route path="/calendar" element={<CalendarView />} />
      <Route path="/exercises" element={<ExercisesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <Dropdown menu={{ items: [
      { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar sesión',
        onClick: () => { logout(); navigate('/login') } },
    ] }}>
      <Button type="text" icon={<Avatar size="small" style={{ background: BRAND, color: INK }}
        icon={<UserOutlined />} />}>
        {user?.name}
      </Button>
    </Dropdown>
  )
}

function MobileShell() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                       padding: '0 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <Brand size={14} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ThemeToggle /><UserMenu />
        </div>
      </Header>
      <Content style={{ padding: 16, paddingBottom: 80 }} className="gt-fade-in">
        <Routed />
      </Content>
      <Footer style={{ position: 'fixed', bottom: 0, width: '100%', padding: 0,
                       borderTop: '1px solid rgba(128,128,128,.2)' }}>
        <Menu mode="horizontal" selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          style={{ justifyContent: 'space-around', borderBottom: 'none' }}
          items={nav.map(n => ({ key: n.key, icon: n.icon, label: '' }))} />
      </Footer>
    </Layout>
  )
}

function DesktopShell() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ padding: '20px 16px 12px' }}>
          <Brand size={15} />
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}
              style={{ background: 'transparent', borderInlineEnd: 'none' }}
              items={nav} onClick={({ key }) => navigate(key)} />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', display: 'flex',
                         justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            {nav.find(i => i.key === location.pathname)?.label || 'Gym Tracker'}
          </span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <ThemeToggle /><UserMenu />
          </div>
        </Header>
        <Content style={{ margin: 24 }} className="gt-fade-in"><Routed /></Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const isMobile = useIsMobile()

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: '20vh' }} />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={
        user ? (isMobile ? <MobileShell /> : <DesktopShell />) : <Navigate to="/login" replace />
      } />
    </Routes>
  )
}
