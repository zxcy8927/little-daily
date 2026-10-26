import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type { Entry } from '../data/storage'
import './ToolMotion.css'
export default function TaskMotionRow({
  entry,
  onComplete,
  children,
}: {
  entry: Entry
  onComplete: () => void
  children: ReactNode
}) {
  const row = useRef<HTMLElement>(null),
    start = useRef<{ x: number; y: number } | null>(null),
    previous = useRef<number | null>(null)
  const [drag, setDrag] = useState(0),
    [distance, setDistance] = useState(0)
  useLayoutEffect(() => {
    const top = row.current?.getBoundingClientRect().top ?? 0
    setDistance(previous.current === null ? 0 : previous.current - top)
    previous.current = top
  }, [entry.done])
  return (
    <article
      ref={row}
      className={'record task-motion-row' + (entry.done ? ' is-done' : '')}
      style={
        {
          '--task-from': `${distance}px`,
          transform: drag ? `translateX(${drag}px)` : undefined,
        } as CSSProperties
      }
      onClickCapture={() => {
        previous.current = row.current?.getBoundingClientRect().top ?? null
      }}
      onPointerDown={(event) => {
        if (
          entry.done ||
          (event.target as Element).closest('button,input,a,select,textarea')
        )
          return
        start.current = { x: event.clientX, y: event.clientY }
        previous.current = row.current?.getBoundingClientRect().top ?? null
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!start.current) return
        const dx = event.clientX - start.current.x,
          dy = event.clientY - start.current.y
        if (Math.abs(dy) > 35) {
          start.current = null
          setDrag(0)
        } else setDrag(Math.min(90, Math.max(0, dx)))
      }}
      onPointerUp={(event) => {
        const point = start.current
        start.current = null
        setDrag(0)
        if (
          point &&
          !entry.done &&
          event.clientX - point.x >= 70 &&
          Math.abs(event.clientY - point.y) < 35
        )
          onComplete()
      }}
      onPointerCancel={() => {
        start.current = null
        setDrag(0)
      }}
    >
      {entry.done && (
        <svg className="task-check" aria-hidden="true" viewBox="0 0 20 20">
          <path
            d="m3 10 5 5 9-11"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>
      )}
      {children}
    </article>
  )
}
