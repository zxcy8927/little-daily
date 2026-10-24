import { useState } from 'react'
import type { DailyTool } from '../../data/tools'
import type { DateBook } from '../../data/books'
import type { Entry } from '../../data/storage'
import { ideas } from '../../data/suggestions'
import { money, useToolBook } from '../../hooks/useToolBook'
import WorkspaceFrame from './WorkspaceFrame'
import EntryEditor from './EntryEditor'
export default function DateWorkspace({
  tool,
  onBack,
}: {
  tool: DailyTool
  onBack: () => void
}) {
  const state = useToolBook<DateBook>('date'),
    { book } = state
  const [amount, setAmount] = useState(''),
    [place, setPlace] = useState('不限'),
    [filter, setFilter] = useState('全部'),
    [idea, setIdea] = useState<(typeof ideas)[number] | null>(null),
    [editing, setEditing] = useState<Entry | null>(null)
  const entries = book.entries.filter(
    (e) => filter === '全部' || (filter === '去過' ? e.done : !e.done),
  )
  return (
    <WorkspaceFrame {...state} tool={tool} onBack={onBack} onUndo={state.undo}>
      <form
        className="tool-form pixel-panel"
        onSubmit={(e) => {
          e.preventDefault()
          const n = Number(amount)
          if (!amount.trim() || !Number.isFinite(n) || n < 0) {
            state.setError('請填寫 0 或以上的兩人預算。')
            return
          }
          const pool = ideas.filter(
              (i) => (place === '不限' || i.place === place) && i.cost <= n,
            ),
            other = pool.filter((i) => i.name !== idea?.name),
            choices = other.length ? other : pool
          setIdea(choices[Math.floor(Math.random() * choices.length)] ?? null)
          state.setError(
            pool.length ? '' : '沒有符合條件的提案，請調整地點或預算。',
          )
        }}
      >
        <div className="form-row">
          <label>
            兩人預算（元）
            <input
              required
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            想待在哪裡
            <select value={place} onChange={(e) => setPlace(e.target.value)}>
              <option>不限</option>
              <option>室內</option>
              <option>戶外</option>
            </select>
          </label>
        </div>
        <button className="primary-button">
          {idea ? '再抽一個' : '抽個約會點子'}
        </button>
        <p className="field-help">金額為兩人粗估花費，請以實際價格為準。</p>
      </form>
      {idea && (
        <article className="record idea" aria-live="polite">
          <span>
            {idea.place} · 兩人約 {money(idea.cost)} 元
          </span>
          <h2>{idea.name}</h2>
          <p>{idea.detail}</p>
          <button
            className="secondary-button"
            disabled={book.entries.some((e) => e.text === idea.name)}
            onClick={() => state.favorite(idea.name, idea.cost)}
          >
            {book.entries.some((e) => e.text === idea.name)
              ? '已收藏'
              : '收藏這個點子'}
          </button>
        </article>
      )}
      <section className="favorites">
        <h2>我的收藏</h2>
        <div className="list-tabs">
          {['全部', '想去', '去過'].map((f) => (
            <button
              className="secondary-button"
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {!entries.length && <p className="empty-state">沒有符合條件的收藏。</p>}
        {entries.map((entry) => (
          <article
            className={'record ' + (entry.done ? 'is-done' : '')}
            key={entry.id}
          >
            <div className="record-body">
              <h3>{entry.text}</h3>
              <p>
                {ideas.find((i) => i.name === entry.text)?.detail} · 約{' '}
                {money(entry.amount)} 元
              </p>
              <p>
                {entry.plannedFor ? '預計 ' + entry.plannedFor : '未安排日期'}
                {entry.done
                  ? ' · 已去過' +
                    (entry.completedOn ? ' ' + entry.completedOn : '')
                  : ''}
              </p>
              {entry.note && <p className="memory-note">{entry.note}</p>}
            </div>
            <div className="record-actions">
              <button
                className="secondary-button"
                onClick={() => setEditing(entry)}
              >
                安排與心得
              </button>
              <button
                className="secondary-button"
                aria-pressed={entry.done}
                onClick={() => state.toggle(entry)}
              >
                {entry.done ? '改回想去' : '記下去過了'}
              </button>
              <button
                className="delete-button"
                aria-label={'取消收藏 ' + entry.text}
                onClick={() => state.remove(entry)}
              >
                取消收藏
              </button>
            </div>
          </article>
        ))}
      </section>
      {editing && (
        <EntryEditor
          mode="date"
          entry={editing}
          onClose={() => setEditing(null)}
          onSave={(entry) =>
            state.save({
              ...book,
              entries: book.entries.map((e) => (e.id === entry.id ? entry : e)),
            })
          }
        />
      )}
    </WorkspaceFrame>
  )
}
