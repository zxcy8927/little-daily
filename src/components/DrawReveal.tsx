import { useEffect, useState, type ReactNode } from 'react'
import { motionDuration, reducedMotion } from '../ui/motion'
import './ToolMotion.css'
export default function DrawReveal({ children }: { children: ReactNode }) {
  const [drawing, setDrawing] = useState(() => !reducedMotion())
  useEffect(() => {
    if (!drawing) return
    const timer = setTimeout(
      () => setDrawing(false),
      motionDuration('slow', 2) + motionDuration('medium'),
    )
    return () => clearTimeout(timer)
  }, [drawing])
  return (
    <div className="draw-reveal">
      {drawing && (
        <div className="draw-pending">
          <div className="draw-card-back" aria-hidden="true">
            ?
          </div>
          <p role="status">翻一張，看看今天想去哪。</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setDrawing(false)}
          >
            直接看點子
          </button>
        </div>
      )}
      <div hidden={drawing} className={drawing ? '' : 'draw-result'}>
        {children}
      </div>
    </div>
  )
}
