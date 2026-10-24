import { useEffect, useRef, useState } from 'react'
import { budgetCategories, type Entry } from '../../data/storage'
export default function EntryEditor({
  entry,
  mode,
  onSave,
  onClose,
}: {
  entry: Entry
  mode: 'budget' | 'tasks' | 'date'
  onSave: (next: Entry) => boolean
  onClose: () => void
}) {
  const [draft, setDraft] = useState({ ...entry }),
    [error, setError] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = dialog.current,
      previous = document.activeElement
    d?.showModal()
    return () => {
      d?.close()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="edit-dialog"
      aria-labelledby="edit-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (
            !draft.text.trim() ||
            !draft.date ||
            (mode === 'budget' &&
              (!Number.isFinite(draft.amount) ||
                draft.amount <= 0 ||
                draft.amount > 1e9))
          ) {
            setError('請填寫內容、日期與有效金額。')
            return
          }
          if (
            onSave({
              ...draft,
              text: draft.text.trim(),
              amount: Math.round(draft.amount * 100) / 100,
            })
          )
            onClose()
          else setError('儲存未完成，請保留輸入並檢查是否有其他分頁更新。')
        }}
      >
        <h2 id="edit-title">{mode === 'date' ? '安排與心得' : '編輯紀錄'}</h2>
        <label>
          內容
          <input
            required
            maxLength={200}
            value={draft.text}
            readOnly={mode === 'date'}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          />
        </label>
        {mode === 'budget' && (
          <>
            <label>
              金額（元）
              <input
                type="number"
                min="0.01"
                max="1000000000"
                step="0.01"
                required
                value={draft.amount}
                onChange={(e) =>
                  setDraft({ ...draft, amount: Number(e.target.value) })
                }
              />
            </label>
            <label>
              日期
              <input
                type="date"
                required
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </label>
            <label>
              分類
              <select
                value={draft.category ?? '其他'}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    category: e.target.value as Entry['category'],
                  })
                }
              >
                {budgetCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {mode === 'tasks' && (
          <>
            <label>
              期限（選填）
              <input
                type="date"
                value={draft.dueDate ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, dueDate: e.target.value })
                }
              />
            </label>
            <label>
              優先順序
              <select
                value={draft.priority ?? 'normal'}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    priority: e.target.value as Entry['priority'],
                  })
                }
              >
                <option value="high">優先處理</option>
                <option value="normal">一般</option>
                <option value="low">不急</option>
              </select>
            </label>
          </>
        )}
        {mode === 'date' && (
          <>
            <label>
              安排日期（選填）
              <input
                type="date"
                value={draft.plannedFor ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, plannedFor: e.target.value })
                }
              />
            </label>
            <label>
              心得
              <textarea
                maxLength={500}
                value={draft.note ?? ''}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            </label>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="record-actions">
          <button className="primary-button">儲存修改</button>
          <button type="button" className="secondary-button" onClick={onClose}>
            取消
          </button>
        </div>
      </form>
    </dialog>
  )
}
