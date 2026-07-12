// Sistema de diseño Gym Tracker v2.1 — "Grafito"
import { theme as antdTheme } from 'antd'

// Acento principal: slate/grafito (reemplaza el neón lima)
export const BRAND = '#64748b'         // slate-500
export const BRAND_STRONG = '#475569'  // slate-600
export const BRAND_SOFT = 'rgba(100, 116, 139, 0.16)'
export const ACCENT_2 = '#94a3b8'      // slate-400 (realces/gradientes)
export const INK = '#0b0d10'           // texto oscuro sobre superficies claras

// Colores por grupo muscular (deben coincidir con MuscleGroupSeeder del backend)
export const MUSCLE_COLORS = {
  'Pecho':        '#fb7185',
  'Espalda':      '#38bdf8',
  'Piernas':      '#a78bfa',
  'Hombros':      '#fb923c',
  'Bíceps':       '#c084fc',
  'Tríceps':      '#2dd4bf',
  'Core':         '#facc15',
  'Glúteos':      '#f472b6',
  'Pantorrillas': '#34d399',
}
export const muscleColor = (name) => MUSCLE_COLORS[name] || BRAND

// rgba a partir del slate, útil para heatmaps/realces
export const brandAlpha = (a) => `rgba(100, 116, 139, ${a})`

// Tokens compartidos
const shared = {
  colorPrimary: BRAND,
  colorInfo: BRAND,
  colorSuccess: '#4ade80',
  colorWarning: '#fbbf24',
  colorError: '#f87171',
  fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  borderRadius: 12,
  borderRadiusLG: 18,
  controlHeight: 42,
  fontWeightStrong: 700,
}

// Botón primario: slate con texto blanco (look grafito)
const sharedComponents = {
  Button: { primaryColor: '#ffffff', fontWeight: 700, primaryShadow: '0 6px 16px rgba(71,85,105,0.20)' },
  Statistic: { contentFontSize: 30 },
  Tabs: { inkBarColor: BRAND, itemSelectedColor: BRAND, titleFontSize: 15 },
  Segmented: { itemSelectedBg: BRAND, itemSelectedColor: '#ffffff' },
}

export const lightTheme = {
  algorithm: antdTheme.defaultAlgorithm,
  token: { ...shared, colorBgLayout: '#eef1f4' },
  components: {
    ...sharedComponents,
    Card: { borderRadiusLG: 18 },
    // Sidebar siempre oscuro: identidad de marca constante en ambos modos
    Layout: { headerBg: '#ffffff', siderBg: INK },
    Menu: { itemBorderRadius: 10 },
  },
}

export const darkTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...shared,
    colorBgLayout: '#0b0d10',
    colorBgContainer: '#15181d',
    colorBgElevated: '#1b1f26',
    colorBorder: 'rgba(255,255,255,0.10)',
    colorBorderSecondary: 'rgba(255,255,255,0.07)',
  },
  components: {
    ...sharedComponents,
    Card: { borderRadiusLG: 18, colorBgContainer: '#15181d' },
    Layout: { headerBg: '#101317', siderBg: INK, bodyBg: '#0b0d10' },
    Menu: {
      itemBorderRadius: 10,
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: BRAND_SOFT,
      darkItemSelectedColor: '#cbd5e1',
      darkItemHoverColor: '#e2e8f0',
    },
  },
}
