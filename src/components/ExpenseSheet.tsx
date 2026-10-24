import { useEffect, useRef, type ReactNode } from 'react'
export default function ExpenseSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
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
          aria-label="關閉記帳面板"
        >
          關閉
        </button>
      </header>
      {children}
    </dialog>
  )
}
