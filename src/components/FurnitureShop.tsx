import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import {
  furnitureCatalog,
  readGame,
  type Book,
  type FurnitureId,
  type FurniturePlacement,
} from '../data/storage'
import {
  buyFurniture,
  furnitureSpent,
  furnitureBalance,
  placeFurniture,
  positionItem,
  storeFurniture,
} from '../data/furniture'
import FurnitureArt from './FurnitureArt'
export default function FurnitureShop({
  book,
  onSave,
  preview,
  onPreview,
  demo = false,
  mode = 'coins',
  editorHost,
}: {
  book: Book
  onSave: (book: Book) => boolean
  preview: FurniturePlacement | null
  onPreview: (item: FurniturePlacement | null) => void
  demo?: boolean
  mode?: 'coins' | 'paid'
  editorHost?: HTMLElement | null
}) {
  const [filter, setFilter] = useState('金幣商店'),
    [category, setCategory] = useState('全部'),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [base, setBase] = useState(() => {
      try {
        return demo ? 120 : readGame(localStorage).coins
      } catch {
        return null
      }
    })
  useEffect(() => {
    const refresh = () => {
      try {
        setBase(demo ? 120 : readGame(localStorage).coins)
      } catch {
        setBase(null)
      }
    }
    window.addEventListener('little-daily-saved', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('little-daily-saved', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [demo])
  const state = book.furniture ?? { owned: [], layout: [] },
    wallet = base === null ? null : furnitureBalance(book, base),
    item = furnitureCatalog.find((i) => i.id === preview?.id),
    owned = !!item && state.owned.some((p) => p.id === item.id)
  const items = furnitureCatalog.filter(
    (i) =>
      (mode === 'paid' ? i.payment === 'paid' : i.payment === 'coins') &&
      (mode === 'paid' ||
        filter === '全部' ||
        (filter === '金幣商店' && i.payment === 'coins') ||
        (filter === '付費精選' && i.payment === 'paid') ||
        (filter === '我的收藏' && state.owned.some((p) => p.id === i.id))) &&
      (category === '全部' || i.category === category),
  )
  function begin(id: FurnitureId) {
    onPreview(state.layout.find((p) => p.id === id) ?? positionItem(id))
    setError('')
    setMessage('')
    requestAnimationFrame(() =>
      document
        .getElementById('room-main-preview')
        ?.scrollIntoView({ behavior: 'auto', block: 'start' }),
    )
  }
  function confirm() {
    if (!preview || !item) return
    try {
      let next: Book
      if (owned) {
        next = placeFurniture(book, preview)
      } else {
        const latest = demo ? 120 : readGame(localStorage).coins
        next = buyFurniture(book, item.id, latest, preview)
      }
      if (onSave(next)) {
        setMessage(
          owned
            ? '擺好了，下次回家也在這裡。'
            : `已收藏「${item.name}」，花費 ${item.price} 金幣，已經放進房間了。`,
        )
        onPreview(null)
        setError('')
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const controls =
    preview && item ? (
      <div className="placement-panel" id="furniture-placement-controls">
        <div className="placement-title">
          <FurnitureArt id={item.id} />
          <div>
            <span>先擺擺看，還沒存下來</span>
            <h4>{item.name}</h4>
            <p>
              {owned
                ? '已經是你的了，換個位置試試。'
                : item.payment === 'coins'
                  ? item.price + ' 金幣 · 買一次就好，之後可以一直換位置'
                  : '這件先免費試擺，還不能買。'}
            </p>
          </div>
          <button
            className="boutique-secondary"
            onClick={() => {
              onPreview(null)
              setError('')
            }}
          >
            取消試擺
          </button>
        </div>
        <div className="placement-actions">
          <div className="position-presets" aria-label="快速擺放位置">
            {[
              ['左側', 100, 350],
              ['中央', 470, 350],
              ['右側', 620, 350],
              ['牆面', 420, 165],
            ].map(([label, x, y]) => (
              <button
                key={label}
                onClick={() =>
                  onPreview(positionItem(item.id, Number(x), Number(y)))
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="position-arrows" aria-label="微調位置">
            {[
              ['往左', -20, 0, '←'],
              ['往上', 0, -20, '↑'],
              ['往下', 0, 20, '↓'],
              ['往右', 20, 0, '→'],
            ].map(([label, x, y, icon]) => (
              <button
                key={label}
                aria-label={String(label)}
                onClick={() =>
                  onPreview(
                    positionItem(
                      item.id,
                      preview.x + Number(x),
                      preview.y + Number(y),
                    ),
                  )
                }
              >
                {icon}
              </button>
            ))}
          </div>
          <button
            className="boutique-primary"
            disabled={
              item.payment === 'paid' ||
              wallet === null ||
              (!owned && (wallet ?? 0) < item.price)
            }
            onClick={confirm}
          >
            {owned
              ? '儲存擺放'
              : item.payment === 'paid'
                ? '尚未開放購買'
                : (wallet ?? 0) < item.price
                  ? '金幣不足'
                  : `確認購買 ${item.price} 金幣 並擺放`}
          </button>
        </div>
        {item.payment === 'paid' && (
          <p className="paid-preview-note">
            放心試擺，現在不會收錢，也還不算買下來。
          </p>
        )}
      </div>
    ) : null
  return (
    <section className="furniture-shop" aria-labelledby="furniture-shop-title">
      <div className="furniture-shop-heading">
        <div>
          <h3 id="furniture-shop-title">
            {mode === 'paid' ? '付費物品預覽' : '小屋選物店'}
          </h3>
          <p>
            {mode === 'paid'
              ? '還不能買，先放進房間看看合不合。'
              : '喜歡哪件？先放進房間看看。'}
          </p>
        </div>
        <div className="wallet-pill">
          <span>可用金幣</span>
          <strong>
            {wallet === null ? '無法讀取' : Math.max(0, wallet) + ' 金幣'}
          </strong>
          <small>家具已花費 {furnitureSpent(book)} 金幣</small>
        </div>
      </div>
      {controls && (editorHost ? createPortal(controls, editorHost) : controls)}
      <div className="furniture-filters">
        {(mode === 'paid' ? [] : ['金幣商店', '我的收藏']).map((f) => (
          <button
            key={f}
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === '我的收藏' ? ' · ' + state.owned.length : ''}
          </button>
        ))}
        <label>
          物品分類
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {['全部', '家具', '布織', '植栽', '擺飾', '燈飾'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="furniture-grid">
        {items.map((i) => {
          const has = state.owned.some((p) => p.id === i.id),
            placed = state.layout.some((p) => p.id === i.id)
          return (
            <article
              key={i.id}
              className={
                'furniture-card ' + (i.payment === 'paid' ? 'is-premium' : '')
              }
            >
              <div className="furniture-card-art">
                <FurnitureArt id={i.id} />
                <span>
                  {has
                    ? '已收藏'
                    : i.payment === 'paid'
                      ? '付費精選'
                      : i.price + ' 金幣'}
                </span>
              </div>
              <div className="furniture-card-copy">
                <small>{i.category}</small>
                <h4>{i.name}</h4>
                <p>{i.description}</p>
                <button
                  className="boutique-secondary"
                  aria-label={'試擺 ' + i.name}
                  onClick={() => begin(i.id)}
                >
                  {has ? (placed ? '調整擺放' : '放進房間') : '放進房間試擺'}
                </button>
                {has && placed && (
                  <button
                    className="furniture-store"
                    onClick={() => {
                      if (onSave(storeFurniture(book, i.id))) {
                        if (preview?.id === i.id) onPreview(null)
                        setMessage('已收起，物品仍在我的收藏。')
                      }
                    }}
                  >
                    收起物品
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
      {!items.length && (
        <p className="furniture-empty">
          這一格還空著。換個分類，或去金幣商店逛逛。
        </p>
      )}
      <p className="furniture-error" role="alert">
        {error}
      </p>
      <p className="furniture-message" role="status">
        {message}
      </p>
      <p className="furniture-footnote">
        金幣是遊戲點數，不是真錢。家具買一次就好，收起再擺不用再付。付費物品現在只供試擺。
      </p>
    </section>
  )
}
