import { useLayoutEffect, useRef, useState } from 'react'
import PixelPet from './PixelPet'
import { tourCardPosition, tourSteps } from '../data/onboarding'
import './OnboardingTour.css'

export default function OnboardingTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [box, setBox] = useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)
  const [position, setPosition] = useState({ left: 16, top: 16 })
  const dialog = useRef<HTMLDialogElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const current = tourSteps[step]
  useLayoutEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    const scroll = window.scrollY
    element?.showModal()
    return () => {
      element?.close()
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true })
      window.scrollTo({ top: scroll, behavior: 'auto' })
    }
  }, [])
  useLayoutEffect(() => {
    const element = current.target
      ? document.querySelector<HTMLElement>(current.target)
      : null
    const expanded: HTMLDetailsElement[] = []
    for (
      let node: HTMLElement | null = element;
      node;
      node = node.parentElement
    ) {
      if (node instanceof HTMLDetailsElement && !node.open) {
        expanded.push(node)
        node.open = true
      }
    }
    element?.scrollIntoView({ block: 'center', behavior: 'auto' })
    const measure = () => {
      const rect = element?.getBoundingClientRect()
      const target =
        rect && rect.width > 0 && rect.height > 0
          ? {
              left: Math.max(8, rect.left - 6),
              top: Math.max(8, rect.top - 6),
              width: Math.min(window.innerWidth - 16, rect.width + 12),
              height: Math.min(window.innerHeight - 16, rect.height + 12),
            }
          : null
      setBox(target)
      setPosition(
        tourCardPosition(
          { width: window.innerWidth, height: window.innerHeight },
          {
            width: card.current?.offsetWidth ?? 400,
            height: card.current?.offsetHeight ?? 420,
          },
          target,
        ),
      )
    }
    measure()
    title.current?.focus({ preventScroll: true })
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    if (card.current) observer.observe(card.current)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
      cancelAnimationFrame(frame)
      observer.disconnect()
      expanded.forEach((details) => {
        details.open = false
      })
    }
  }, [current])
  return (
    <dialog
      ref={dialog}
      className="onboarding-dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      {box ? (
        <div
          className="tour-highlight"
          aria-hidden="true"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
          }}
        />
      ) : (
        <div className="tour-shade" aria-hidden="true" />
      )}
      <div ref={card} className="tour-card" style={position}>
        <div className="tour-topline">
          <span>
            小兔的新手導覽 · {step + 1} / {tourSteps.length}
          </span>
          <button type="button" className="tour-skip" onClick={onClose}>
            先跳過
          </button>
        </div>
        {step === 0 && (
          <div className="tour-pet">
            <PixelPet />
          </div>
        )}
        <div
          className="tour-progress"
          role="progressbar"
          aria-label="導覽進度"
          aria-valuemin={1}
          aria-valuemax={tourSteps.length}
          aria-valuenow={step + 1}
        >
          {tourSteps.map((_, i) => (
            <span key={i} className={i <= step ? 'is-active' : ''} />
          ))}
        </div>
        <div aria-live="polite" aria-atomic="true">
          <h2 ref={title} tabIndex={-1} id="tour-title">
            {current.title}
          </h2>
          <p id="tour-description">{current.text}</p>
          <p className="tour-hint">{current.hint}</p>
        </div>
        <div className="tour-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={step === 0}
            onClick={() => setStep((n) => n - 1)}
          >
            上一步
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() =>
              step === tourSteps.length - 1 ? onClose() : setStep((n) => n + 1)
            }
          >
            {step === 0
              ? '帶我逛逛 →'
              : step === tourSteps.length - 1
                ? '開始我的日常'
                : '下一步 →'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
