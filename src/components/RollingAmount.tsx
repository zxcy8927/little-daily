import { useLayoutEffect, useRef, useState } from 'react'
import './ExpenseMotion.css'
const money = (value: number) =>
  new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(value)
export default function RollingAmount({
  value,
  prefix = 'NT$',
  initial,
}: {
  value: number
  prefix?: string
  initial?: number
}) {
  const previous = useRef(initial ?? value)
  const [from, setFrom] = useState(initial ?? value)
  useLayoutEffect(() => {
    setFrom(previous.current)
    previous.current = value
  }, [value])
  const next = `${prefix}${money(value)}`
  const old = `${prefix}${money(from)}`.padStart(next.length, ' ')
  const length = Math.max(old.length, next.length)
  const padded = next.padStart(length, ' ')
  return (
    <span className="rolling-amount">
      <span className="sr-only">{next}</span>
      <span aria-hidden="true" className="rolling-amount-digits" key={value}>
        {Array.from(padded).map((char, index) => {
          const before = old.padStart(length, ' ')[index]
          return (
            <span className="rolling-digit" key={length - index}>
              {before === char ? (
                <span>{char}</span>
              ) : (
                <span className="rolling-digit-track">
                  <span>{before}</span>
                  <span>{char}</span>
                </span>
              )}
            </span>
          )
        })}
      </span>
    </span>
  )
}
