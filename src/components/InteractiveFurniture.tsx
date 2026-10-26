import { useState, type ReactNode } from 'react'
export type InteractiveKind = 'lamp' | 'plant' | 'coffee'
export default function InteractiveFurniture({
  kind,
  name,
  area,
  children,
  disabled = false,
}: {
  kind: InteractiveKind
  name: string
  area: [number, number, number, number]
  children: ReactNode
  disabled?: boolean
}) {
  const [active, setActive] = useState(kind === 'lamp')
  const [touches, setTouches] = useState(0)
  const [x, y, width, height] = area
  const label =
    kind === 'plant'
      ? `摸摸${name}`
      : kind === 'lamp'
        ? `${active ? '關閉' : '開啟'}${name}`
        : `${active ? '停止' : '啟動'}${name}`
  const touch = () => {
    setActive((value) => !value)
    setTouches((value) => value + 1)
  }
  return (
    <g
      className={`room-object room-object-${kind}${active ? ' is-active' : ''}`}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      aria-label={disabled ? undefined : label}
      aria-pressed={disabled || kind === 'plant' ? undefined : active}
      onClick={
        disabled
          ? undefined
          : (event) => {
              event.stopPropagation()
              touch()
            }
      }
      onKeyDown={
        disabled
          ? undefined
          : (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                event.stopPropagation()
                touch()
              }
            }
      }
    >
      <rect
        className="room-object-hit"
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        rx="6"
      />
      <g
        key={touches}
        className={
          kind === 'plant' && touches ? 'room-leaves-touch' : undefined
        }
      >
        {children}
      </g>
      {!disabled && kind === 'lamp' && (
        <ellipse
          className="room-lamp-glow"
          cx={x + width / 2}
          cy={y + height * 0.55}
          rx={width * 0.45}
          ry={height * 0.45}
          fill="var(--color-gold)"
          opacity={active ? '.22' : '0'}
          pointerEvents="none"
        />
      )}
      {!disabled && kind === 'coffee' && active && (
        <g
          className="room-coffee-steam"
          pointerEvents="none"
          fill="none"
          stroke="var(--color-on-accent)"
          strokeWidth="3"
        >
          <path
            d={`M${x + width * 0.5} ${y + height * 0.3}q-7-10 0-20t0-20M${x + width * 0.65} ${y + height * 0.3}q7-10 0-20t0-20`}
          />
        </g>
      )}
    </g>
  )
}
