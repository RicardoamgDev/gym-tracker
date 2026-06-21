import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeModeProvider, useThemeMode } from './context/ThemeContext.jsx'
import { lightTheme, darkTheme } from './theme/tokens.js'

function ThemedApp() {
  const { isDark } = useThemeMode()
  return (
    <ConfigProvider locale={esES} theme={isDark ? darkTheme : lightTheme}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <ThemedApp />
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
