import { useEffect, useState } from 'react'
import ExpenseSheet from './ExpenseSheet'
import { useWakeScreen } from '../ui/wake-screen'
import './CookingSteps.css'
function StepTimer() {
  const [remaining, setRemaining] = useState(0),
    [deadline, setDeadline] = useState<number | null>(null),
    [finished, setFinished] = useState(false)
  useEffect(() => {
    if (deadline === null) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(left)
      if (!left) {
        setDeadline(null)
        setFinished(true)
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [deadline])
  return (
    <section className="step-timer" aria-label="這一步的計時">
      <div className="step-timer-options">
        {[1, 3, 5].map((minutes) => (
          <button
            key={minutes}
            type="button"
            className="secondary-button"
            onClick={() => {
              setRemaining(minutes * 60)
              setDeadline(Date.now() + minutes * 60000)
              setFinished(false)
            }}
          >
            {minutes} 分鐘
          </button>
        ))}
      </div>
      {remaining > 0 && (
        <>
          <p role="timer" aria-label="剩餘時間">
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:
            {String(remaining % 60).padStart(2, '0')}
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setDeadline(
                deadline === null ? Date.now() + remaining * 1000 : null,
              )
            }
          >
            {deadline === null ? '繼續計時' : '暫停計時'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setDeadline(null)
              setRemaining(0)
            }}
          >
            清除計時
          </button>
        </>
      )}
      {finished && <p role="status">時間到了，看看鍋裡的狀況。</p>}
      <small>切換步驟會清除這一步的計時。離開畫面後不會發送提醒。</small>
    </section>
  )
}
export default function CookingSteps({
  recipe,
  onClose,
}: {
  recipe: { name: string; steps: readonly string[] }
  onClose: () => void
}) {
  const [step, setStep] = useState(0)
  const wake = useWakeScreen()
  return (
    <ExpenseSheet
      title={recipe.name + ' · 一步一步煮'}
      onClose={onClose}
      closeLabel="關閉料理步驟"
    >
      <p className="field-help">{wake}</p>
      <div className="cooking-step" aria-live="polite">
        <span>
          第 {step + 1} 步，共 {recipe.steps.length} 步
        </span>
        <p>{recipe.steps[step]}</p>
      </div>
      <StepTimer key={step} />
      <div className="step-navigation">
        <button
          type="button"
          className="secondary-button"
          disabled={step === 0}
          onClick={() => setStep((n) => n - 1)}
        >
          上一步
        </button>
        {step < recipe.steps.length - 1 ? (
          <button
            type="button"
            className="primary-button"
            onClick={() => setStep((n) => n + 1)}
          >
            下一步
          </button>
        ) : (
          <button type="button" className="primary-button" onClick={onClose}>
            煮好了，收起步驟
          </button>
        )}
      </div>
    </ExpenseSheet>
  )
}
