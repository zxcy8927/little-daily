import { useEffect, useState } from 'react'
import { readBookSnapshot } from '../data/storage'
import { formatDate } from '../ui/format'
import PixelPet from './PixelPet'
import './YesterdayReview.css'

const seenKey = 'little-daily-yesterday-seen-v1'
const keyFor = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
function readYesterday(now: number) {
  const current = new Date(now),
    today = keyFor(current)
  try {
    if (localStorage.getItem(seenKey) === today) return null
    const yesterday = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() - 1,
    )
    const date = keyFor(yesterday)
    const book = readBookSnapshot(localStorage, 'budget').book
    const entries = book.entries.filter((entry) => entry.date === date)
    if (!entries.length) return null
    const spent =
      entries.reduce((sum, entry) => sum + Math.round(entry.amount * 100), 0) /
      100
    return { date, spent, limit: book.limit, kept: spent <= book.limit }
  } catch {
    return null
  }
}
function DailyReview({ now }: { now: number }) {
  const today = keyFor(new Date(now))
  const [review] = useState(() => readYesterday(now))
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    if (!review) return
    // Presentation-only marker; never changes the books, rewards or backup format.
    try {
      localStorage.setItem(seenKey, today)
    } catch {
      /* A blocked preference must not block bookkeeping. */
    }
  }, [review, today])
  if (!review || dismissed) return null
  const money = (n: number) =>
    n.toLocaleString('zh-TW', { maximumFractionDigits: 2 })
  return (
    <aside className="yesterday-review" aria-labelledby="yesterday-title">
      <div className={'yesterday-pet' + (review.kept ? ' yesterday-kept' : '')}>
        <PixelPet state={review.kept ? 'happy' : 'idle'} />
        {review.kept && (
          <svg
            className="yesterday-coin"
            aria-hidden="true"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 2h12v3h3v14h-3v3H6v-3H3V5h3z"
              fill="var(--color-gold)"
              stroke="var(--color-gold-ink)"
              strokeWidth="2"
            />
          </svg>
        )}
      </div>
      <div>
        <h2 id="yesterday-title">昨天的帳，收好了</h2>
        <p>
          {formatDate(review.date, new Date(now))} · 記了 NT$
          {money(review.spent)}
        </p>
        <p>
          {review.kept
            ? '昨天留在額度裡了，小兔幫你把這一天收好。'
            : '昨天花得多了一點。記下來就好，今天我也在。'}
        </p>
        <small>按目前每日預算 NT${money(review.limit)} 回看。</small>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setDismissed(true)}
        >
          好，過今天了
        </button>
      </div>
    </aside>
  )
}
export default function YesterdayReview({ now }: { now: number }) {
  return <DailyReview key={keyFor(new Date(now))} now={now} />
}
