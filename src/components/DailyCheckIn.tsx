import PixelPet from './PixelPet'
import ExpenseSheet from './ExpenseSheet'
import './DailyCheckIn.css'
export function DailyGreeting({
  text,
  busy,
  onCheckIn,
  onDismiss,
}: {
  text: string
  busy: boolean
  onCheckIn: () => void
  onDismiss: () => void
}) {
  return (
    <aside className="daily-greeting" aria-label="小兔的招呼">
      <button
        className="greeting-pet-button"
        type="button"
        aria-label="摸摸小兔，記下今天"
        disabled={busy}
        onClick={onCheckIn}
      >
        <PixelPet state="idle" />
      </button>
      <div>
        <p>{text}</p>
        <small>{busy ? '正在記下今天…' : '10 金幣 · 10 經驗值'}</small>
      </div>
      <button
        className="greeting-close"
        type="button"
        onClick={onDismiss}
        aria-label="先收起小兔的招呼"
      >
        ×
      </button>
    </aside>
  )
}
export default function DailyCheckIn({
  checked,
  busy,
  disabled,
  onCheckIn,
}: {
  checked: boolean
  busy: boolean
  disabled: boolean
  onCheckIn: () => void
}) {
  return (
    <section
      className="checkin pixel-panel daily-checkin"
      aria-labelledby="checkin-title"
    >
      <div>
        <h2 id="checkin-title">今天有來，記一下</h2>
        <p>
          {checked
            ? '今天的小記號收好了。想再坐一下也可以。'
            : '不用趕進度，摸摸小兔，記下今天就好。'}
        </p>
        <span className="reward">10 金幣 · 10 經驗值</span>
      </div>
      <button
        className="primary-button checkin-pet-button"
        type="button"
        disabled={checked || busy || disabled}
        onClick={onCheckIn}
        aria-label={
          checked ? '今天已記下' : busy ? '正在記下今天' : '摸摸小兔，記下今天'
        }
      >
        <PixelPet state={checked ? 'happy' : 'idle'} />
        <span>
          {checked ? '今天已記下' : busy ? '記一下…' : '摸摸小兔'}
        </span>
      </button>
    </section>
  )
}
export function CheckInNotice({
  text,
  error,
  onClose,
}: {
  text: string
  error: boolean
  onClose: () => void
}) {
  return (
    <aside className="daily-greeting checkin-notice" aria-label="簽到回應">
      <PixelPet state={error ? 'idle' : 'happy'} />
      <p role={error ? 'alert' : 'status'}>{text}</p>
      <button
        className="greeting-close"
        type="button"
        aria-label="收起簽到回應"
        onClick={onClose}
      >
        ×
      </button>
    </aside>
  )
}
export type GrowthCard = { level: number; coins: number; xp: number }
export function LevelUnlockCard({
  card,
  onClose,
}: {
  card: GrowthCard
  onClose: () => void
}) {
  return (
    <ExpenseSheet title="新的成長卡" closeLabel="收起成長卡" onClose={onClose}>
      <section className="level-unlock-card" aria-label="成長卡已解鎖">
        <PixelPet state="happy" />
        <p>LV. {card.level}</p>
        <h2>成長卡已解鎖</h2>
        <p>小日子又多留了一點，這張卡替你收好今天。</p>
        <p className="reward">
          這次拿到 {card.coins} 金幣 · {card.xp} 經驗值
        </p>
        <button type="button" className="primary-button" onClick={onClose}>
          好，收下今天
        </button>
      </section>
    </ExpenseSheet>
  )
}
