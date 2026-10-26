import RollingAmount from './RollingAmount'
import PixelPet from './PixelPet'
import { reviewReply } from '../ui/review-copy'
import { reviewImage, shareReviewImage } from '../ui/review-image'
import './ToolMotion.css'
import { formatDate } from '../ui/format'
import { useEffect, useMemo, useState } from 'react'
import { readBookSnapshot, toolIds, type Book } from '../data/storage'
import { shiftDate, weeklyReview } from '../data/workflows'
export default function WeeklyReview({ now }: { now: number }) {
  const d = new Date(now)
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const [offset, setOffset] = useState(0)
  const result = useMemo(() => {
    const books: Partial<Record<string, Book>> = {}
    const errors: string[] = []
    for (const id of toolIds) {
      try {
        books[id] = readBookSnapshot(localStorage, id).book
      } catch {
        errors.push(id)
      }
    }
    return {
      ...weeklyReview(books, shiftDate(today, offset * 7)),
      previous: weeklyReview(books, shiftDate(today, (offset - 1) * 7)),
      errors,
    }
  }, [today, offset, now])
  const money = (n: number) =>
    new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(n)
  const [image, setImage] = useState<{ url: string; filename: string } | null>(
    null,
  )
  const [shareMessage, setShareMessage] = useState('')
  const [sharing, setSharing] = useState(false)
  useEffect(() => {
    setImage(null)
    setShareMessage('')
  }, [result.start])
  const reply = reviewReply(result, result.previous)
  const failed = (id: string) => result.errors.includes(id)
  return (
    <section
      className="weekly-review pixel-panel"
      aria-labelledby="weekly-title"
    >
      <div className="section-heading">
        <h2 id="weekly-title">這週，生活留了些什麼</h2>
        <span>
          {formatDate(result.start)} ～ {formatDate(result.end)}
        </span>
      </div>
      <div className="week-controls">
        <button
          className="secondary-button"
          onClick={() => setOffset((n) => n - 1)}
        >
          ← 上一週
        </button>
        <button
          className="secondary-button"
          disabled={offset === 0}
          onClick={() => setOffset((n) => n + 1)}
        >
          下一週 →
        </button>
        {offset !== 0 && (
          <button className="secondary-button" onClick={() => setOffset(0)}>
            回到本週
          </button>
        )}
      </div>
      <div className="review-grid" key={result.start}>
        <div>
          <span>實際支出</span>
          <strong>
            {failed('budget') ? (
              '暫時無法讀取'
            ) : (
              <span className="review-number">
                <RollingAmount value={result.spent} initial={0} />{' '}
              </span>
            )}
          </strong>
        </div>
        <div>
          <span>避免的預計支出</span>
          <strong>
            {failed('shopping') ? (
              '暫時無法讀取'
            ) : (
              <span className="review-number">
                <RollingAmount value={result.avoided} initial={0} />
              </span>
            )}
          </strong>
          <small>不是實際存款，不會加入預算餘額</small>
        </div>
        <div>
          <span>完成待辦</span>
          <strong>
            {failed('tasks') ? (
              '暫時無法讀取'
            ) : (
              <span className="review-number">
                <RollingAmount value={result.completed} prefix="" initial={0} />{' '}
                件
              </span>
            )}
          </strong>
        </div>
        <div>
          <span>用完冰箱食材</span>
          <strong>
            {failed('cooking') ? (
              '暫時無法讀取'
            ) : (
              <span className="review-number">
                <RollingAmount value={result.foodsUsed} prefix="" initial={0} />{' '}
                項
              </span>
            )}
          </strong>
        </div>
      </div>
      <div className="review-pet-summary">
        <PixelPet
          state={result.avoided > 0 || result.completed > 0 ? 'happy' : 'idle'}
        />
        <p>{reply}</p>
      </div>
      <button
        type="button"
        className="secondary-button"
        disabled={result.errors.length > 0}
        onClick={() => {
          try {
            setImage({
              url: reviewImage({
                period:
                  formatDate(result.start) + ' ～ ' + formatDate(result.end),
                spent: result.spent,
                avoided: result.avoided,
                completed: result.completed,
                foodsUsed: result.foodsUsed,
                reply,
              }),
              filename: 'little-daily-week-' + result.start + '.png',
            })
            setShareMessage('')
          } catch {
            setShareMessage('這次圖片沒做好，紀錄都還在，等一下再試。')
          }
        }}
      >
        做成分享圖片
      </button>
      {image && (
        <div className="review-image-panel">
          <img
            className="review-image-preview"
            src={image.url}
            alt="這週小記分享圖片，包含支出、避免支出、完成待辦與食材彙總"
          />
          <p className="field-help">只放彙總數字，不含逐筆紀錄。看過再分享。</p>
          <button
            type="button"
            className="secondary-button"
            disabled={sharing}
            onClick={async () => {
              setSharing(true)
              try {
                const result = await shareReviewImage(image.url, image.filename)
                setShareMessage(
                  result === 'downloaded'
                    ? '圖片已下載，可以自己留著或分享。'
                    : result === 'cancelled'
                      ? ''
                      : '已開啟分享。',
                )
              } catch {
                setShareMessage('這次沒分享成功，圖片還在這裡。')
              } finally {
                setSharing(false)
              }
            }}
          >
            分享或下載圖片
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setImage(null)}
          >
            收起圖片
          </button>
        </div>
      )}
      {shareMessage && <p role="status">{shareMessage}</p>}
      <p className="field-help">
        {failed('dog')
          ? '寵物日記暫時無法讀取'
          : `${result.petNotes} 筆寵物日記`}{' '}
        ·{' '}
        {failed('date')
          ? '約會紀錄暫時無法讀取'
          : `${result.dates} 次約會完成紀錄`}
      </p>
      {result.avoidedItems.length > 0 && (
        <details className="avoided-details">
          <summary>
            看看這週決定不買的 {result.avoidedItems.length} 件東西
          </summary>
          <ul>
            {result.avoidedItems.map((e) => (
              <li key={e.id}>
                <span>{e.text}</span>
                <span>
                  {money(e.amount)} 元 ·{' '}
                  {e.decidedOn ? formatDate(e.decidedOn) : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="field-help">
        從週一算到週日，這週還會繼續累積。改回未完成或考慮中，這裡也會跟著改；沒有日期的舊紀錄不列入。
      </p>
      {result.errors.length > 0 && (
        <p role="status" className="form-error">
          部分紀錄無法讀取，對應項目暫不統計。
        </p>
      )}
    </section>
  )
}
