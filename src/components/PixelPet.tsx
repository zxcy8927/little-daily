import { useEffect, useRef, useState } from 'react'
import { readBookSnapshot, type Book } from '../data/storage'
import { dashboard } from '../data/workflows'
import { budgetState } from './BudgetGauge'
import './PixelPet.css'

export type PetState = 'idle' | 'happy' | 'worried' | 'sleepy' | 'asleep'
const descriptions: Record<PetState, string> = {
  idle: '陪你坐著',
  happy: '開心地晃晃',
  worried: '安靜陪著你',
  sleepy: '有點睏了',
  asleep: '睡著了',
}
export function petState(now: Date, book?: Book): PetState {
  const hour = now.getHours()
  if (hour < 6) return 'asleep'
  if (hour >= 22) return 'sleepy'
  if (!book) return 'idle'
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const { spent } = dashboard({ budget: book }, date, now.getTime())
  const status = budgetState(book.limit, spent).name
  return status === 'over' ? 'worried' : status === 'low' ? 'sleepy' : 'idle'
}
function currentState() {
  try {
    return petState(new Date(), readBookSnapshot(localStorage, 'budget').book)
  } catch {
    return petState(new Date())
  }
}
export default function PixelPet({
  state,
  interactive = false,
  room = false,
}: {
  state?: PetState
  interactive?: boolean
  room?: boolean
}) {
  const [automatic, setAutomatic] = useState(() => state ?? currentState())
  const [reaction, setReaction] = useState<'hello' | 'secret' | null>(null)
  const taps = useRef({ count: 0, time: 0 })
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (state) return
    const refresh = () => setAutomatic(currentState())
    refresh()
    const clock = setInterval(refresh, 30000)
    window.addEventListener('little-daily-saved', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(clock)
      window.removeEventListener('little-daily-saved', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [state])
  useEffect(() => () => clearTimeout(timer.current), [])
  const mood = reaction ? 'happy' : (state ?? automatic)
  const touch = () => {
    const now = Date.now()
    const count = now - taps.current.time <= 2000 ? taps.current.count + 1 : 1
    taps.current = { count: count === 5 ? 0 : count, time: now }
    setReaction(count === 5 ? 'secret' : 'hello')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setReaction(null), 2400)
  }
  return (
    <svg
      className={room ? 'pixel-pet-room' : 'pixel-pet'}
      viewBox="-12 -30 104 110"
      x={room ? -12 : undefined}
      y={room ? -30 : undefined}
      width={room ? 104 : undefined}
      height={room ? 110 : undefined}
      role={interactive ? 'group' : 'img'}
      aria-label={`小兔，${descriptions[mood]}`}
      shapeRendering="crispEdges"
      overflow="visible"
    >
      <g
        className={`pet-character pet-${mood}`}
        data-pet-state={mood}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? '摸摸小兔' : undefined}
        onClick={interactive ? touch : undefined}
        onKeyDown={
          interactive
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  touch()
                }
              }
            : undefined
        }
      >
        <rect
          className="pet-hit-area"
          x={room ? -30 : -8}
          y={room ? -25 : -5}
          width={room ? 140 : 96}
          height={room ? 120 : 85}
          rx="8"
          fill="transparent"
        />
        <g className="pet-body">
          <g className="pet-ear pet-ear-left">
            <rect x="15" y="4" width="15" height="29" fill="#e2a9c8" />
            <rect x="20" y="9" width="5" height="19" fill="#ffecf1" />
          </g>
          <g className="pet-ear pet-ear-right">
            <rect x="50" y="4" width="15" height="29" fill="#e2a9c8" />
            <rect x="55" y="9" width="5" height="19" fill="#ffecf1" />
          </g>
          <rect x="10" y="26" width="60" height="39" fill="#e2a9c8" />
          <rect x="15" y="31" width="50" height="29" fill="#f6d5b7" />
          <g className="pet-eyes" fill="#34302c">
            {mood === 'happy' ? (
              <path d="M24 45v-5h9v5h-3v-2h-3v2zM47 45v-5h9v5h-3v-2h-3v2z" />
            ) : mood === 'asleep' || mood === 'sleepy' ? (
              <path d="M25 45h8v3h-8zM47 45h8v3h-8z" />
            ) : (
              <>
                <rect x="25" y="40" width="8" height="8" />
                <rect x="47" y="40" width="8" height="8" />
              </>
            )}
          </g>
          {mood === 'worried' && (
            <path d="M24 36l9 3M47 39l9-3" stroke="#72533f" strokeWidth="2" />
          )}
          <rect x="36" y="49" width="8" height="5" fill="#e9939e" />
          <rect x="19" y="50" width="7" height="4" fill="#f3a3a8" />
          <rect x="54" y="50" width="7" height="4" fill="#f3a3a8" />
          <rect x="22" y="65" width="36" height="10" fill="#a6b9e3" />
        </g>
        {mood === 'asleep' && (
          <text
            className="pet-snore"
            x="63"
            y="13"
            fill="var(--color-text)"
            fontSize="12"
          >
            z
          </text>
        )}
        {reaction === 'secret' && (
          <g className="pet-secret" fill="var(--color-gold)">
            <path d="M-1 14h4V8h4v6h4v4H7v6H3v-6h-4zM69 5h4V0h4v5h4v4h-4v5h-4V9h-4z" />
          </g>
        )}
      </g>
      {interactive && (
        <text
          className="pet-reply"
          role="status"
          aria-live="polite"
          x="40"
          y="-15"
          textAnchor="middle"
          fill="var(--color-text)"
          fontSize="10"
        >
          {reaction === 'secret'
            ? '好啦，耳朵借你摸。'
            : reaction
              ? '嗯，我在。'
              : ''}
        </text>
      )}
    </svg>
  )
}
