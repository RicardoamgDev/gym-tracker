// Logo de marca: mancuerna con degradado lima→cian + wordmark.
export default function Brand({ size = 16, showText = true, iconSize, style }) {
  const ic = iconSize || size + 8
  return (
    <span className="gt-brand" style={{ fontSize: size, ...style }}>
      <svg width={ic} height={ic} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="gtBrandGrad" x1="0" y1="0" x2="24" y2="24"
            gradientUnits="userSpaceOnUse">
            <stop stopColor="#a3e635" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <g fill="url(#gtBrandGrad)">
          <rect x="1"    y="8"   width="2.6" height="8"  rx="1.1" />
          <rect x="4.1"  y="5"   width="2.8" height="14" rx="1.3" />
          <rect x="17.1" y="5"   width="2.8" height="14" rx="1.3" />
          <rect x="20.4" y="8"   width="2.6" height="8"  rx="1.1" />
          <rect x="6.6"  y="10.4" width="10.8" height="3.2" rx="1.4" />
        </g>
      </svg>
      {showText && <span className="gt-brand-text">Gym&nbsp;Tracker</span>}
    </span>
  )
}
