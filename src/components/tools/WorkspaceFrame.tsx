import { useEffect, useRef, type ReactNode } from 'react'
import type { DailyTool } from '../../data/tools'
import StorageConflict from '../StorageConflict'
import ToolIcon from '../ToolIcon'
export default function WorkspaceFrame({
  readError,
  tool,
  onBack,
  error,
  feedback,
  snapshot,
  deleted,
  onUndo,
  children,
}: {
  readError?: string
  tool: DailyTool
  onBack: () => void
  error: string
  feedback: string
  snapshot: { current: string | null }
  deleted?: { text: string } | null
  onUndo: () => void
  children: ReactNode
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
    window.scrollTo(0, 0)
  }, [])
  return (
    <section
      className={'workspace workspace-' + tool.id}
      aria-labelledby="workspace-title"
    >
      {!readError && (
        <StorageConflict
          storageKey={`little-daily-tool-${tool.id}-v1`}
          snapshot={snapshot}
        />
      )}
      {tool.id !== 'budget' && (
        <button className="back-button" onClick={onBack}>
          ← 回到日常工具
        </button>
      )}
      <header className="workspace-heading">
        <ToolIcon id={tool.id} />
        <div>
          <h1 id="workspace-title" ref={heading} tabIndex={-1}>
            {tool.title}
          </h1>
          <p>{tool.subtitle}</p>
        </div>
      </header>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="save-feedback" role="status">
          {feedback}
        </p>
      )}
      {children}
      {deleted && (
        <div className="undo-row">
          <span>已刪除「{deleted.text}」</span>
          <button className="secondary-button" onClick={onUndo}>
            復原上一筆
          </button>
        </div>
      )}
    </section>
  )
}
