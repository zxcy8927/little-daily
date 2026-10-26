import './ToolMotion.css'
import { motionDuration } from '../ui/motion'
import { useEffect, useState } from 'react'
import type { Entry } from '../data/storage'
import PixelPet from './PixelPet'
import { shoppingCopy } from '../ui/shopping-copy'
import './ShoppingReceipt.css'

export default function ShoppingReceipt({
  entry,
  onHome,
}: {
  entry: Entry
  onHome: () => void
}) {
  const skipped = entry.status === 'skipped'
  const [celebrating, setCelebrating] = useState(skipped)
  useEffect(() => {
    if (!skipped) return
    const timer = window.setTimeout(
      () => setCelebrating(false),
      motionDuration('slow', 2) + motionDuration('fast'),
    )
    return () => window.clearTimeout(timer)
  }, [skipped])
  return (
    <section
      className={
        'pixel-panel reward-receipt' +
        (skipped ? '' : ' is-bought') +
        (celebrating ? ' is-celebrating' : '')
      }
      role="status"
      aria-label="這次的決定"
    >
      {skipped && (
        <div className="reward-pet" aria-hidden="true">
          <PixelPet state="happy" />
          <svg className="piggy-scene" viewBox="0 0 80 80" aria-hidden="true">
            <path
              d="M18 40h36v7h9v18h-8v8h-8v-7H26v7h-8v-9h-6V47h6z"
              fill="var(--color-wall)"
              stroke="var(--color-wood)"
              strokeWidth="3"
            />
            <path
              d="M29 42h15M51 48h3"
              stroke="var(--color-text)"
              strokeWidth="3"
            />
            <rect
              className="piggy-coin"
              x="31"
              y="16"
              width="13"
              height="13"
              fill="var(--color-gold)"
              stroke="var(--color-gold-ink)"
              strokeWidth="2"
            />
          </svg>
        </div>
      )}
      <div className="reward-copy">
        <h2>
          {skipped ? `${entry.text}，這次先不買。` : '想清楚了，那就買吧。'}
        </h2>
        <p>
          {skipped
            ? shoppingCopy.petThanks
            : '真的買了，再把這筆記到今天支出。'}
        </p>
        {skipped && (
          <>
            <strong className="reward-coins">
              +{entry.rewardCoins ?? 0} 金幣
            </strong>
            <p className="field-help">
              少花了 NT$
              {entry.amount.toLocaleString('zh-TW', {
                maximumFractionDigits: 2,
              })}
              。這是避免支出，還不是銀行存款。
            </p>
            <button className="secondary-button" onClick={onHome}>
              前往小屋
            </button>
          </>
        )}
      </div>
    </section>
  )
}
