import { useEffect, useRef, type ReactNode } from 'react'
export default function ExpenseSheet({
  title,
  onClose,
  children,
  closeLabel = '關閉記帳面板',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  closeLabel?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="quick-expense-sheet"
      aria-labelledby="expense-sheet-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <header>
        <h2 id="expense-sheet-title">{title}</h2>
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
          aria-label={closeLabel}
        >
          關閉
        </button>
      </header>
      {children}
    </dialog>
  )
}
