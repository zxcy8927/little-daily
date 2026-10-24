import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ShoppingBook } from '../data/books'
import {
  readBookSnapshot,
  saveBookSnapshot,
  type Book,
  type Entry,
} from '../data/storage'
import {
  coolingEnd,
  settleShopping,
  shoppingProgress,
  recordSaved,
  editShopping,
  cancelShopping,
  savingsCsv,
} from '../data/shopping'
import { exportText, isNative } from '../native'
import {
  requestReminders,
  syncReminders,
  getReminderStatus,
} from '../reminders'
import { buildPurchase } from '../data/workflows'
import {
  ShoppingQuestions,
  ShoppingAnswers,
  type Reflection,
} from './ShoppingReflection'
const WorldBoutique = lazy(() => import('./WorldBoutique'))
import StorageConflict from './StorageConflict'
import './ToolWorkspace.css'
import './ShoppingJourney.css'
const cash = (n: number) =>
  'NT$' + n.toLocaleString('zh-TW', { maximumFractionDigits: 2 })
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const empty: ShoppingBook = { entries: [], limit: 500 }
export default function ShoppingJourney({ onBack }: { onBack: () => void }) {
  const [loaded] = useState(() => {
    try {
      return { ...readBookSnapshot(localStorage, 'shopping'), error: '' }
    } catch {
      return {
        book: empty,
        raw: null,
        error: '原紀錄無法讀取，請先保留備份，再重新整理。',
      }
    }
  })
  const snapshot = useRef(loaded.raw)
  const [real, setReal] = useState<ShoppingBook>(loaded.book),
    [demo, setDemo] = useState<ShoppingBook | null>(null),
    [offset, setOffset] = useState(0),
    [clock, setClock] = useState(Date.now())
  const [name, setName] = useState(''),
    [amount, setAmount] = useState(''),
    [days, setDays] = useState(7),
    [reflection, setReflection] = useState<Reflection>({}),
    [message, setMessage] = useState(''),
    [error, setError] = useState(loaded.error)
  const [review, setReview] = useState<Entry | null>(null),
    [reviewError, setReviewError] = useState(''),
    [note, setNote] = useState(''),
    [filter, setFilter] = useState('考慮中'),
    [search, setSearch] = useState(''),
    [saved, setSaved] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [goalName, setGoalName] = useState(loaded.book.savingsGoal?.name ?? ''),
    [goalTarget, setGoalTarget] = useState(
      String(loaded.book.savingsGoal?.target ?? ''),
    )
  const [month, setMonth] = useState(today().slice(0, 7)),
    [reminderStatus, setReminderStatus] = useState(getReminderStatus)
  useEffect(() => {
    const open = () => {
      setView('清單')
      requestAnimationFrame(() =>
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      )
    }
    window.addEventListener('little-daily-shopping-entry', open)
    return () => window.removeEventListener('little-daily-shopping-entry', open)
  }, [])
  const formRef = useRef<HTMLFormElement>(null)
  const [view, setView] = useState('清單')
  const [purchase, setPurchase] = useState<Entry | null>(null)
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLElement | null>(null)
  const book = demo ?? real,
    now = clock + offset,
    progress = shoppingProgress(book)
  useEffect(() => {
    const update = () => setReminderStatus(getReminderStatus())
    window.addEventListener('little-daily-reminder-status', update)
    return () =>
      window.removeEventListener('little-daily-reminder-status', update)
  }, [])
  useEffect(() => {
    const update = () => setClock(Date.now())
    const t = setInterval(update, 60000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  useEffect(() => {
    if (review) {
      setReviewError('')
      trigger.current = document.activeElement as HTMLElement
      dialog.current?.showModal()
    } else if (trigger.current?.isConnected) trigger.current.focus()
    else if (trigger.current)
      document
        .querySelector<HTMLButtonElement>(
          '.journey-navigation button[aria-pressed="true"]',
        )
        ?.focus()
  }, [review])
  function save(next: Book, onFailure?: (message: string) => void) {
    try {
      if (demo) {
        setDemo(next)
      } else {
        if (loaded.error) throw new Error(loaded.error)
        snapshot.current = saveBookSnapshot(
          localStorage,
          'shopping',
          snapshot.current,
          next,
        )
        setReal(next)
      }
      setError('')
      return true
    } catch (e) {
      const message =
        e instanceof Error ? e.message : '儲存失敗，請檢查瀏覽器空間。'
      setError(message)
      onFailure?.(message)
      return false
    }
  }
  function trial() {
    setGoalName('')
    setGoalTarget('')
    setDays(7)
    setEditing(null)
    setDemo(empty)
    setOffset(0)
    setMessage('試玩已開始，資料與時間只存在這次試玩，不會寫入正式紀錄。')
    setError('')
    setFilter('考慮中')
    setSearch('')
    setName('')
    setAmount('')
    setReflection({})
    setSaved({})
    setPurchase(null)
  }
  function startEdit(item: Entry) {
    setView('清單')
    setEditing(item.id)
    setName(item.text)
    setAmount(String(item.amount))
    setReflection({
      buyReason: item.buyReason,
      ownsSimilar: item.ownsSimilar,
      useFrequency: item.useFrequency,
    })
    setDays(item.coolingDays ?? 1)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    formRef.current?.querySelector('input')?.focus()
  }
  function clearDraft() {
    setEditing(null)
    setName('')
    setAmount('')
    setReflection({})
    setDays(7)
  }
  function toggleCancelled(item: Entry, restore = false) {
    try {
      if (save(cancelShopping(book, item.id, restore))) {
        setMessage(
          restore
            ? '已復原考慮清單，保留原到期時間。'
            : '已撤回，可在「已撤回」隨時復原，不會增加避免支出或金幣。',
        )
        if (editing === item.id) clearDraft()
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const monthly = {
      ...book,
      entries: book.entries.filter((e) => e.decidedOn?.startsWith(month + '-')),
    },
    monthlyProgress = shoppingProgress(monthly)
  const visible = book.entries
    .filter((e) => e.text.includes(search))
    .filter((e) => {
      if (filter === '全部') return true
      if (filter === '不買紀錄')
        return e.status === 'skipped' || (e.done && e.status !== 'bought')
      if (filter === '已購買') return e.status === 'bought'
      if (filter === '已撤回') return e.status === 'cancelled'
      return (
        !e.done &&
        e.status !== 'skipped' &&
        e.status !== 'bought' &&
        e.status !== 'cancelled'
      )
    })
  return (
    <section className="workspace shopping-journey">
      {!demo && !loaded.error && (
        <StorageConflict
          storageKey="little-daily-tool-shopping-v1"
          snapshot={snapshot}
        />
      )}
      <button className="back-button" onClick={onBack}>
        ← 回到日常工具
      </button>
      <header className="workspace-heading">
        <div>
          <h1>購物冷靜清單</h1>
          <p>記下物品和價格，冷靜期結束後再回顧。</p>
        </div>
      </header>
      <details className="compact-disclosure" open={!!demo}>
        <summary>新手試玩與使用說明</summary>
        <aside className="trial-bar">
          <div>
            <strong>
              {demo ? '正在獨立試玩' : '第一次來？用衣服 NT$1,500 試走一次'}
            </strong>
            <p>
              {demo
                ? '可快轉時間，不影響你的正式紀錄。'
                : '加入清單、等候回顧、記錄不買，最後佈置小世界。'}
            </p>
          </div>
          {demo ? (
            <>
              <button
                className="secondary-button"
                onClick={() => {
                  setOffset(offset + 7 * 86400000)
                  setMessage('試玩時間已前進 7 天，可以回顧剛才加入的物品。')
                }}
              >
                試玩快轉 7 天
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setGoalName(real.savingsGoal?.name ?? '')
                  setGoalTarget(String(real.savingsGoal?.target ?? ''))
                  setDays(7)
                  setEditing(null)
                  setDemo(null)
                  setOffset(0)
                  setSearch('')
                  setName('')
                  setAmount('')
                  setReflection({})
                  setFilter('考慮中')
                  setMessage('已回到正式紀錄。')
                  setPurchase(null)
                  setSaved({})
                }}
              >
                結束試玩
              </button>
            </>
          ) : (
            <button className="secondary-button" onClick={trial}>
              開始獨立試玩
            </button>
          )}
        </aside>
      </details>
      <p className="form-error" role="alert">
        {error}
      </p>
      <p className="save-feedback" role="status">
        {message}
      </p>
      <nav className="journey-navigation" aria-label="購物功能">
        {['清單', '小屋與商店', '省錢回顧'].map((v) => (
          <button
            key={v}
            className="secondary-button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
          >
            {v}
          </button>
        ))}
      </nav>
      <div hidden className="journey-steps" aria-label="使用步驟">
        <span>1 加入想買的東西</span>
        <span>2 等待與回顧</span>
        <span>3 記下決定</span>
        <span>4 存下與解鎖</span>
      </div>
      <section className="savings-stats" aria-label="省錢成果">
        <div>
          <span>累計避免支出</span>
          <strong>{cash(progress.avoided)}</strong>
          <small>決定不買的預計金額</small>
        </div>
        <div>
          <span>已自行存下</span>
          <strong>{cash(progress.saved)}</strong>
          <small>依你手動確認，無連接銀行</small>
        </div>
        <div>
          <span>購物累計獲得金幣</span>
          <strong>G {progress.coins}</strong>
          <small>每筆完成不買 +50，與金額無關</small>
        </div>
      </section>
      {purchase && (
        <div className="pixel-panel reward-receipt" role="status">
          <h2>
            {purchase.status === 'skipped'
              ? '已記錄不買：' + purchase.text
              : '已記下這次購買決定'}
          </h2>
          <p>
            {purchase.status === 'skipped'
              ? `避免支出 ${cash(purchase.amount)} · +50 遊戲金幣。金幣已加入可用餘額。`
              : '若已實際購買，可再記入日常預算。'}
          </p>
          <p>避免支出不代表銀行存款增加；實際存下後，再確認已存金額。</p>
          {purchase.status === 'skipped' && (
            <button
              className="secondary-button"
              onClick={() => setView('小屋與商店')}
            >
              前往小屋
            </button>
          )}
        </div>
      )}

      {view === '小屋與商店' && (
        <Suspense fallback={<p role="status">正在開啟小屋…</p>}>
          <WorldBoutique
            key={demo ? 'demo-world' : 'my-world'}
            book={book}
            onSave={save}
            demo={!!demo}
          />
        </Suspense>
      )}
      <div hidden={view !== '清單'}>
        <form
          id="shopping-entry"
          ref={formRef}
          className="tool-form pixel-panel"
          onSubmit={(e) => {
            e.preventDefault()
            const value = Number(amount)
            if (
              !name.trim() ||
              !Number.isFinite(value) ||
              value <= 0 ||
              value > 1e9
            ) {
              setError('請填名稱與有效的正數金額。')
              return
            }
            if (editing) {
              try {
                if (
                  save(editShopping(book, editing, name, value, reflection))
                ) {
                  clearDraft()
                  setMessage('已修改，原冷靜期與到期時間保留。')
                }
              } catch (err) {
                setError((err as Error).message)
              }
              return
            }
            const entry: Entry = {
              id: crypto.randomUUID(),
              text: name.trim(),
              amount: Math.round(value * 100) / 100,
              date: new Date(now).toISOString(),
              done: false,
              status: 'thinking',
              coolingDays: days,
              ...reflection,
            }
            if (save({ ...book, entries: [entry, ...book.entries] })) {
              setName('')
              setAmount('')
              setReflection({})
              setFilter('考慮中')
              setMessage('已加入冷靜清單，到期後再回來看看。')
            }
          }}
        >
          <h2>{editing ? '修改考慮中的物品' : '先放進冷靜清單'}</h2>
          <div className="form-row">
            <label>
              想買的東西
              <input
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：衣服"
              />
            </label>
            <label>
              預計金額（NT$）
              <input
                required
                type="number"
                min="0.01"
                max="1000000000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500"
              />
            </label>
            <label>
              冷靜多久
              <select
                disabled={!!editing}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={1}>1 天</option>
                <option value={3}>3 天</option>
                <option value={7}>7 天（推薦）</option>
              </select>
            </label>
          </div>
          <details className="compact-disclosure">
            <summary>多想一下（選填）</summary>
            <ShoppingQuestions value={reflection} onChange={setReflection} />
          </details>
          <button className="primary-button">
            {editing ? '儲存物品修改' : '加入冷靜清單'}
          </button>
          {editing && (
            <button
              className="secondary-button"
              type="button"
              onClick={clearDraft}
            >
              取消修改
            </button>
          )}
          <p className="field-help">
            冷靜期結束才記下決定，不會自動購買、轉帳或發送通知。
          </p>
        </form>
        <div className="list-tabs">
          {['考慮中', '不買紀錄', '已購買', '已撤回', '全部'].map((f) => (
            <button
              className="secondary-button"
              aria-pressed={f === filter}
              key={f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <label>
          搜尋物品
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="輸入名稱"
          />
        </label>
        <div className="record-list">
          {!visible.length && (
            <p className="empty-state">
              這裡還沒有紀錄。從上面加入一件想買的東西吧。
            </p>
          )}
          {visible.map((item) => {
            const completed =
                item.done ||
                item.status === 'skipped' ||
                item.status === 'bought' ||
                item.status === 'cancelled',
              remaining = Math.max(0, coolingEnd(item) - now)
            return (
              <article className="record" key={item.id}>
                <div className="record-body">
                  <h2>{item.text}</h2>
                  <strong>{cash(item.amount)}</strong>
                  <ShoppingAnswers entry={item} />
                  {!completed && (
                    <>
                      <p>
                        {remaining
                          ? `冷靜中 · 還有 ${Math.ceil(remaining / 3600000)} 小時`
                          : '冷靜期結束，現在還需要嗎？'}
                      </p>
                      <small>
                        {item.coolingDays ?? 1} 天冷靜期 ·{' '}
                        {new Date(coolingEnd(item)).toLocaleString('zh-TW')}{' '}
                        到期
                      </small>
                    </>
                  )}
                  {completed && (
                    <p>
                      {item.status === 'cancelled'
                        ? '已撤回，不計入成果。'
                        : item.status === 'bought'
                          ? '已決定購買。'
                          : '已決定不買 · 避免支出 ' + cash(item.amount)}
                      {item.note && ' · ' + item.note}
                    </p>
                  )}
                  {item.rewardCoins !== undefined && (
                    <p>已領取 G {item.rewardCoins} · 每筆只領一次</p>
                  )}
                </div>
                <div className="record-actions">
                  {!completed && (
                    <>
                      <button
                        className="secondary-button"
                        onClick={() => startEdit(item)}
                      >
                        修改物品
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => toggleCancelled(item)}
                      >
                        撤回物品
                      </button>
                    </>
                  )}
                  {item.status === 'cancelled' && (
                    <button
                      className="secondary-button"
                      onClick={() => toggleCancelled(item, true)}
                    >
                      復原到考慮清單
                    </button>
                  )}
                  {!completed && (
                    <button
                      className="primary-button"
                      disabled={remaining > 0}
                      onClick={() => {
                        setReview(item)
                        setNote('')
                      }}
                    >
                      回顧並決定
                    </button>
                  )}
                  {(item.status === 'skipped' ||
                    (item.done && item.status !== 'bought')) && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        try {
                          const value =
                            saved[item.id] ?? String(item.savedAmount ?? 0)
                          if (!value.trim()) throw new Error('請填已存金額。')
                          if (save(recordSaved(book, item.id, Number(value))))
                            setMessage(
                              '已更新自行存下的金額；請自行完成實際轉帳。',
                            )
                        } catch (err) {
                          setError((err as Error).message)
                        }
                      }}
                    >
                      <label>
                        這筆已自行存下（NT$）
                        <input
                          type="number"
                          min="0"
                          max={item.amount}
                          step="0.01"
                          required
                          value={
                            saved[item.id] ?? String(item.savedAmount ?? 0)
                          }
                          onChange={(e) =>
                            setSaved({ ...saved, [item.id]: e.target.value })
                          }
                        />
                      </label>
                      <button className="secondary-button">確認已存金額</button>
                    </form>
                  )}
                  {item.status === 'bought' && (
                    <button
                      className="secondary-button"
                      onClick={() => {
                        if (demo) {
                          setMessage('試玩：已示範記帳，正式預算未變動。')
                          return
                        }
                        try {
                          const latest = readBookSnapshot(
                              localStorage,
                              'shopping',
                            ),
                            budget = readBookSnapshot(localStorage, 'budget')
                          saveBookSnapshot(
                            localStorage,
                            'budget',
                            budget.raw,
                            buildPurchase(
                              latest.book,
                              budget.book,
                              item.id,
                              today(),
                            ),
                          )
                          setMessage('已記入日常預算，不會重複入帳。')
                        } catch (e) {
                          setError((e as Error).message)
                        }
                      }}
                    >
                      記入今天支出
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <div hidden={view !== '省錢回顧'}>
        <section className="pixel-panel savings-goal">
          <h2>存錢目標</h2>
          <p>以累計「已自行存下」計算進度；避免支出不會直接填滿目標。</p>
          {book.savingsGoal && (
            <div>
              <strong>
                {book.savingsGoal.name} · {cash(progress.saved)} /{' '}
                {cash(book.savingsGoal.target)}
              </strong>
              <progress
                value={Math.min(progress.saved, book.savingsGoal.target)}
                max={book.savingsGoal.target}
                aria-label="存錢目標進度"
              />
              <p>
                {progress.saved >= book.savingsGoal.target
                  ? '存錢目標已達成。'
                  : '距離目標還有 ' +
                    cash(book.savingsGoal.target - progress.saved)}
              </p>
            </div>
          )}
          <form
            className="form-row"
            onSubmit={(e) => {
              e.preventDefault()
              const value = Number(goalTarget)
              if (
                !goalName.trim() ||
                goalName.trim().length > 60 ||
                !Number.isFinite(value) ||
                value <= 0 ||
                value > 1e9
              ) {
                setError('請填目標名稱與有效的正數金額。')
                return
              }
              if (
                save({
                  ...book,
                  savingsGoal: {
                    name: goalName.trim(),
                    target: Math.round(value * 100) / 100,
                  },
                })
              )
                setMessage('存錢目標已儲存。')
            }}
          >
            <label>
              存錢目標名稱
              <input
                required
                maxLength={60}
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="例如：旅行基金"
              />
            </label>
            <label>
              目標金額（NT$）
              <input
                required
                type="number"
                min="0.01"
                max="1000000000"
                step="0.01"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
              />
            </label>
            <button className="secondary-button">儲存存錢目標</button>
          </form>
        </section>
        <section className="pixel-panel monthly-savings">
          <h2>每月省錢回顧</h2>
          <label>
            回顧月份
            <input
              type="month"
              value={month}
              onChange={(e) => {
                if (e.target.value) setMonth(e.target.value)
              }}
            />
          </label>
          <p>
            {month} · {monthlyProgress.count} 次不買 · 避免支出{' '}
            {cash(monthlyProgress.avoided)} · 這些物品目前已存{' '}
            {cash(monthlyProgress.saved)}
          </p>
          <p className="field-help">
            依決定月份分組；已存金額是目前回報值，不代表當月銀行入帳。
          </p>
          <button
            className="secondary-button"
            onClick={() => {
              void exportText(
                savingsCsv(book, month),
                'little-daily-savings-' + month + '.csv',
                'text/csv;charset=utf-8',
              )
                .then(() => setMessage('已開啟成果匯出，請確認檔案已保存。'))
                .catch(() => setError('匯出未完成，請稍後再試。'))
            }}
          >
            匯出這個月 CSV
          </button>
        </section>
        <section className="pixel-panel reminder-settings">
          <h2>冷靜期到期提醒</h2>
          <p>
            {isNative
              ? '需你同意通知權限。通知不顯示物品名稱與金額；系統省電可能影響送達。'
              : '網頁版可直接查看到期清單；背景到期提醒會在手機 App 測試版提供。'}
          </p>
          <button
            disabled={!isNative || !!demo}
            className="secondary-button"
            onClick={() => {
              void (async () => {
                try {
                  const enabled = !book.remindersEnabled
                  if (enabled) await requestReminders()
                  const next = { ...book, remindersEnabled: enabled }
                  if (save(next)) setReminderStatus(await syncReminders(next))
                } catch (e) {
                  setReminderStatus((e as Error).message)
                }
              })()
            }}
          >
            {book.remindersEnabled ? '關閉到期提醒' : '開啟到期提醒'}
          </button>
          <p role="status">
            {demo ? '試玩模式不申請通知權限或排程通知。' : reminderStatus}
          </p>
        </section>
      </div>
      {review && (
        <dialog
          className="edit-dialog"
          ref={dialog}
          aria-labelledby="review-title"
          onCancel={(e) => {
            e.preventDefault()
            setReview(null)
          }}
        >
          <h2 id="review-title">現在，還想買 {review.text} 嗎？</h2>
          <p>{cash(review.amount)} · 已完成冷靜期</p>
          <ShoppingAnswers entry={review} />
          {reviewError && (
            <p className="form-error" role="alert">
              {reviewError} 原因已保留，請稍後再試或複製後備存。
            </p>
          )}
          <label>
            這次決定的原因
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="例如：衣櫃已有類似的，先把錢留給旅行。"
            />
          </label>
          <p>
            決定不買：記錄避免支出，獲得 50
            金幣。決定購買：保留紀錄，可另行記帳。送出後保留這次決定。
          </p>
          {(['skipped', 'bought'] as const).map((status) => (
            <button
              key={status}
              className={
                status === 'skipped' ? 'primary-button' : 'secondary-button'
              }
              disabled={!note.trim()}
              onClick={() => {
                try {
                  const next = settleShopping(
                    book,
                    review.id,
                    status,
                    now,
                    note,
                  )
                  if (save(next, setReviewError)) {
                    setPurchase(next.entries.find((e) => e.id === review.id)!)
                    setReview(null)
                    setFilter(status === 'skipped' ? '不買紀錄' : '已購買')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    setMessage(
                      status === 'skipped'
                        ? '不買決定已記下，+50 金幣！'
                        : '已記下購買決定。',
                    )
                  }
                } catch (e) {
                  setReviewError((e as Error).message)
                }
              }}
            >
              {status === 'skipped' ? '決定不買，留下這筆錢' : '決定購買'}
            </button>
          ))}
          <button className="secondary-button" onClick={() => setReview(null)}>
            還想再想想
          </button>
        </dialog>
      )}
    </section>
  )
}
