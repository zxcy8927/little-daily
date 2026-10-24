import { useMemo } from 'react'
import { readBookSnapshot, toolIds, type Book } from '../data/storage'
import { dashboard } from '../data/workflows'
import './HomeOverview.css'
import { formatDate } from '../ui/format'

export default function HomeOverview({
  now,
  onOpen,
  hidden = [],
}: {
  now: number
  onOpen: (id: string) => void
  hidden?: string[]
}) {
  const result = useMemo(() => {
    const d = new Date(now)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const books: Partial<Record<string, Book>> = {}
    const errors: string[] = []
    for (const id of toolIds) {
      try {
        books[id] = readBookSnapshot(localStorage, id).book
      } catch {
        errors.push(id)
      }
    }
    return { ...dashboard(books, date, now), errors, date }
  }, [now])
  const money = (value: number) =>
    new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(value)
  const shown = (id: string) => !hidden.includes(id)
  const failed = (id: string) => result.errors.includes(id)
  return (
    <section className="home-overview" aria-labelledby="overview-title">
      <div className="section-heading">
        <h2 id="overview-title">今天的小日子</h2>
        <span>{formatDate(result.date, new Date(now))}</span>
      </div>
      <div className="overview-grid">
        {shown('budget') && (
          <button className="overview-card" onClick={() => onOpen('budget')}>
            <span>今日可用預算</span>
            <strong className={result.remaining < 0 ? 'over-budget' : ''}>
              {failed('budget')
                ? '暫時無法讀取'
                : `${money(result.remaining)} 元`}
            </strong>
            <small>
              {failed('budget')
                ? '開啟預算工具檢查'
                : `已花 ${money(result.spent)} 元`}
            </small>
          </button>
        )}
        {shown('tasks') && (
          <button className="overview-card" onClick={() => onOpen('tasks')}>
            <span>今天的待辦</span>
            <strong>
              {failed('tasks') ? '暫時無法讀取' : `${result.due} 件到期`}
            </strong>
            <small>
              {failed('tasks')
                ? '開啟待辦工具檢查'
                : `${result.overdue} 件逾期 · ${result.pending} 件待完成`}
            </small>
          </button>
        )}
        {shown('shopping') && (
          <button className="overview-card" onClick={() => onOpen('shopping')}>
            <span>買之前再想想</span>
            <strong>
              {failed('shopping') ? '暫時無法讀取' : `${result.ready} 件可決定`}
            </strong>
            <small>依每筆冷靜期顯示到期清單</small>
          </button>
        )}
        {shown('dog') && (
          <button className="overview-card" onClick={() => onOpen('dog')}>
            <span>寵物的小日子</span>
            <strong>
              {failed('dog') ? '暫時無法讀取' : `${result.petNotes} 筆今日紀錄`}
            </strong>
            <small>
              {failed('dog')
                ? '開啟寵物日記檢查'
                : `${result.pets} 隻使用中的寵物`}
            </small>
          </button>
        )}
      </div>
      {result.errors.length > 0 && (
        <p className="form-error" role="status">
          部分紀錄暫時無法讀取，請開啟對應工具檢查，原資料仍保留。
        </p>
      )}
      <div className="today-lists">
        {shown('tasks') && (
          <section>
            <h3>先做這幾件</h3>
            {result.dueTasks.length ? (
              <ul>
                {result.dueTasks.map((e) => (
                  <li key={e.id}>
                    <button onClick={() => onOpen('tasks')}>
                      <span>{e.text}</span>
                      <small>
                        {e.dueDate === result.date
                          ? '今天到期'
                          : `期限 ${e.dueDate}`}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                {failed('tasks')
                  ? '待辦紀錄暫時無法讀取。'
                  : '今天沒有到期或逾期的待辦。'}
              </p>
            )}
          </section>
        )}
        {(shown('date') || shown('cooking')) && (
          <section>
            <h3>{shown('date') ? '接下來的小約定' : '食材小提醒'}</h3>
            {shown('date') &&
              (result.upcomingDates.length ? (
                <ul>
                  {result.upcomingDates.map((e) => (
                    <li key={e.id}>
                      <button onClick={() => onOpen('date')}>
                        <span>{e.text}</span>
                        <small>{e.plannedFor}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  {failed('date')
                    ? '約會紀錄暫時無法讀取。'
                    : '還沒有安排日期的約會，想到再記就好。'}
                </p>
              ))}
            <div className="quick-links">
              {shown('cooking') && (
                <button onClick={() => onOpen('cooking')}>
                  {failed('cooking')
                    ? '查看食材採買清單'
                    : result.supplies + ' 項食材待買'}{' '}
                  →
                </button>
              )}
              {shown('date') && (
                <button onClick={() => onOpen('date')}>
                  {failed('date')
                    ? '查看約會提案'
                    : result.dates + ' 個今日約會'}{' '}
                  →
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </section>
  )
}
