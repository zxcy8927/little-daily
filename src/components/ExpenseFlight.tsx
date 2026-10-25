import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { motionDuration, reducedMotion } from '../ui/motion'
import './ExpenseMotion.css'
export default function ExpenseFlight({ amount }: { amount: number }) {
  const marker = useRef<HTMLSpanElement>(null)
  const [style, setStyle] = useState<CSSProperties | null>(null)
  useLayoutEffect(() => {
    if (reducedMotion()) return
    const source = marker.current
      ?.closest('form')
      ?.querySelector('button[type="submit"]')
    const form = marker.current?.closest('form')
    const destination =
      form?.closest('dialog')?.querySelector('[data-budget-target]') ??
      form?.querySelector('[data-budget-target]') ??
      document.querySelector('[data-budget-target]')
    if (!source || !destination) return
    const start = source.getBoundingClientRect(),
      end = destination.getBoundingClientRect()
    if (end.bottom < 0 || end.top > window.innerHeight || end.width <= 0) return
    setStyle({
      '--flight-x': `${start.left + start.width / 2}px`,
      '--flight-y': `${start.top}px`,
      '--flight-end-x': `${end.left + end.width / 2}px`,
      '--flight-end-y': `${end.top + end.height / 2}px`,
    } as CSSProperties)
    const timer = setTimeout(
      () => setStyle(null),
      motionDuration('slow') + motionDuration('medium'),
    )
    const stop = () => setStyle(null)
    window.addEventListener('resize', stop)
    window.addEventListener('scroll', stop, true)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', stop)
      window.removeEventListener('scroll', stop, true)
    }
  }, [amount])
  return (
    <span ref={marker} aria-hidden="true">
      {style && (
        <span className="expense-flight" style={style}>
          <span className="expense-flight-amount">
            NT${amount.toLocaleString('zh-TW')}
          </span>
          <svg
            className="expense-flight-coin"
            viewBox="0 0 24 24"
            width="30"
            height="30"
          >
            <path
              d="M6 2h12v3h3v14h-3v3H6v-3H3V5h3z"
              fill="var(--color-gold)"
              stroke="var(--color-gold-ink)"
              strokeWidth="2"
            />
            <path d="M10 7h6v3h-3v4h3v3h-6V7z" fill="var(--color-gold-ink)" />
          </svg>
        </span>
      )}
    </span>
  )
}
