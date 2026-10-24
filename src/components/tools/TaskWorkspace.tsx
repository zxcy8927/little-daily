import { formatDate } from '../../ui/format'
import { useState } from 'react'
import type { DailyTool } from '../../data/tools'
import type { TaskBook } from '../../data/books'
import type { Entry } from '../../data/storage'
import { selectTasks } from '../../data/workflows'
import { dayKey, useToolBook } from '../../hooks/useToolBook'
import WorkspaceFrame from './WorkspaceFrame'
import EntryEditor from './EntryEditor'
export default function TaskWorkspace({
  tool,
  onBack,
}: {
  tool: DailyTool
  onBack: () => void
}) {
  const state = useToolBook<TaskBook>('tasks'),
    { book, save } = state
  const [text, setText] = useState(''),
    [dueDate, setDueDate] = useState(''),
    [priority, setPriority] = useState<Entry['priority']>('normal'),
    [filter, setFilter] = useState('全部'),
    [search, setSearch] = useState(''),
    [editing, setEditing] = useState<Entry | null>(null)
  const entries = selectTasks(
    book.entries.filter((e) =>
      e.text.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    ),
    filter,
    dayKey(),
  )
  return (
    <WorkspaceFrame {...state} tool={tool} onBack={onBack} onUndo={state.undo}>
      <form
        className="tool-form pixel-panel"
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) {
            state.setError('想做哪件事？先寫一點就好。')
            return
          }
          if (
            save({
              ...book,
              entries: [
                {
                  id: crypto.randomUUID(),
                  text: text.trim(),
                  amount: 0,
                  date: dayKey(),
                  done: false,
                  dueDate,
                  priority,
                },
                ...book.entries,
              ],
            })
          ) {
            setText('')
            setDueDate('')
            setPriority('normal')
          }
        }}
      >
        <label>
          要做的事
          <input
            required
            maxLength={200}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className="form-row">
          <label>
            期限（選填）
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          <label>
            優先順序
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Entry['priority'])}
            >
              <option value="high">優先處理</option>
              <option value="normal">一般</option>
              <option value="low">不急</option>
            </select>
          </label>
        </div>
        <button className="primary-button">新增紀錄</button>
      </form>
      <div className="list-tabs" aria-label="篩選待辦">
        {['全部', '未完成', '今天到期', '已逾期', '已完成'].map((f) => (
          <button
            className="secondary-button"
            key={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <span>
          {book.entries.filter((e) => e.done).length} / {book.entries.length}{' '}
          件完成
        </span>
      </div>
      <label>
        搜尋紀錄
        <input
          type="search"
          maxLength={200}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="records">
        {!entries.length && (
          <div className="empty-state">
            <p>
              {!book.entries.length
                ? '今天有什麼掛在心上？先記一件就好。'
                : '這裡沒找到，換個關鍵字或看看其他分類。'}
            </p>
            {!!book.entries.length && (search || filter !== '全部') && (
              <button
                className="secondary-button"
                onClick={() => {
                  setSearch('')
                  setFilter('全部')
                }}
              >
                顯示全部待辦
              </button>
            )}
          </div>
        )}
        {entries.map((entry) => (
          <article
            className={'record ' + (entry.done ? 'is-done' : '')}
            key={entry.id}
          >
            <div className="record-body">
              <h2>{entry.text}</h2>
              <p
                className={
                  !entry.done && entry.dueDate && entry.dueDate < dayKey()
                    ? 'over-budget'
                    : 'field-help'
                }
              >
                {entry.priority === 'high'
                  ? '優先處理'
                  : entry.priority === 'low'
                    ? '不急'
                    : '一般'}{' '}
                ·{' '}
                {entry.dueDate
                  ? '期限 ' + formatDate(entry.dueDate)
                  : '還沒訂期限'}
                {!entry.done && entry.dueDate && entry.dueDate < dayKey()
                  ? ' · 已逾期'
                  : ''}
                {entry.completedOn
                  ? ' · 完成於 ' + formatDate(entry.completedOn)
                  : ''}
              </p>
            </div>
            <div className="record-actions">
              <button
                className="secondary-button"
                aria-pressed={entry.done}
                onClick={() => state.toggle(entry)}
              >
                {entry.done ? '改為未完成' : '完成'}
              </button>
              <button
                className="secondary-button"
                aria-label={'編輯 ' + entry.text}
                onClick={() => setEditing(entry)}
              >
                編輯
              </button>
              <button
                className="delete-button"
                aria-label={'刪除 ' + entry.text}
                onClick={() => state.remove(entry)}
              >
                刪除
              </button>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <EntryEditor
          mode="tasks"
          entry={editing}
          onClose={() => setEditing(null)}
          onSave={(entry) =>
            save({
              ...book,
              entries: book.entries.map((e) => (e.id === entry.id ? entry : e)),
            })
          }
        />
      )}
    </WorkspaceFrame>
  )
}
