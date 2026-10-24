import FurnitureShop from './FurnitureShop'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Book, FurniturePlacement } from '../data/storage'
import { readBookSnapshot, saveBookSnapshot, readGame } from '../data/storage'
import { shoppingProgress } from '../data/shopping'
import { roomThemes, type RoomTheme } from '../data/rooms'
import PixelRoom from './PixelRoom'
import {
  furnitureBalance,
  furnitureSpent,
  positionItem,
} from '../data/furniture'
import './WorldBoutique.css'
export function HomeWorld() {
  useEffect(() => {
    document
      .getElementById('my-little-world')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])
  const [loaded] = useState(() => {
    try {
      return { ...readBookSnapshot(localStorage, 'shopping'), error: '' }
    } catch {
      return {
        book: { entries: [], limit: 500 } as Book,
        raw: null,
        error: '小屋紀錄暫時無法讀取，請先保留備份後重新整理。',
      }
    }
  })
  const [book, setBook] = useState(loaded.book),
    [error, setError] = useState(loaded.error),
    snapshot = useRef(loaded.raw)
  useEffect(() => {
    const refresh = () => {
      try {
        const next = readBookSnapshot(localStorage, 'shopping')
        snapshot.current = next.raw
        setBook(next.book)
        setError('')
      } catch {
        setError('小屋紀錄暫時無法讀取，請先保留備份。')
      }
    }
    const changed = (e: StorageEvent) => {
      if (e.key === null || e.key === 'little-daily-tool-shopping-v1') refresh()
    }
    window.addEventListener('little-daily-saved', refresh)
    window.addEventListener('storage', changed)
    return () => {
      window.removeEventListener('little-daily-saved', refresh)
      window.removeEventListener('storage', changed)
    }
  }, [])
  function save(next: Book) {
    try {
      if (loaded.error) throw new Error(loaded.error)
      snapshot.current = saveBookSnapshot(
        localStorage,
        'shopping',
        snapshot.current,
        next,
      )
      setBook(next)
      setError('')
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '佈置尚未儲存，請稍後再試。')
      return false
    }
  }
  return (
    <>
      <WorldBoutique
        book={book}
        onSave={save}
        onStart={() => {
          window.location.hash = '#/shopping'
        }}
      />
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </>
  )
}
export default function WorldBoutique({
  book,
  onSave,
  onStart,
  demo = false,
}: {
  book: Book
  onSave: (book: Book) => boolean
  onStart?: () => void
  demo?: boolean
}) {
  const [tab, setTab] = useState('選物店')
  const [selected, setSelected] = useState<RoomTheme>('meadow'),
    [details, setDetails] = useState(false)
  const [baseCoins, setBaseCoins] = useState<number | null>(() => {
    try {
      return demo ? 120 : readGame(localStorage).coins
    } catch {
      return null
    }
  })
  useEffect(() => {
    const refresh = () => {
      try {
        setBaseCoins(demo ? 120 : readGame(localStorage).coins)
      } catch {
        setBaseCoins(null)
      }
    }
    window.addEventListener('little-daily-saved', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('little-daily-saved', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [demo])
  const wallet = baseCoins === null ? null : furnitureBalance(book, baseCoins)
  const [editorHost, setEditorHost] = useState<HTMLDivElement | null>(null)
  const [furniturePreview, setFurniturePreview] =
    useState<FurniturePlacement | null>(null)
  const dialog = useRef<HTMLDialogElement>(null),
    previous = useRef<HTMLElement | null>(null)
  const room = roomThemes.find((t) => t.id === selected)!,
    progress = shoppingProgress(book)
  const placed = (label: string) =>
    book.supplies?.find((s) => s.name === label)?.done ?? true
  useLayoutEffect(() => {
    if (details) {
      previous.current = document.activeElement as HTMLElement
      dialog.current?.showModal()
    }
    return () => {
      dialog.current?.close()
      previous.current?.focus({ preventScroll: true })
    }
  }, [details])
  const count = [50, 100, 150].filter((n) => progress.coins >= n).length
  return (
    <section
      className="world-boutique"
      id="my-little-world"
      aria-labelledby="world-title"
    >
      <div className="boutique-heading">
        <div>
          <h2 id="world-title">我的小屋</h2>
        </div>
        <span className="world-level">
          小屋成長 <b>{String(count).padStart(2, '0')}</b>
          <small>/ 03 件裝飾</small>
        </span>
      </div>
      <div className="boutique-main" id="room-main-preview">
        <div className={'room-display theme-' + selected}>
          <div className="room-topline">
            <span>
              <i />
              {(room.premium ? '完整主題試住' : '我的免費小屋') +
                ' · ' +
                room.name}
            </span>
            <span>
              {room.premium
                ? '預覽不會更動你的紀錄'
                : '可用金幣 ' + (wallet === null ? '無法讀取' : wallet + ' G')}
            </span>
          </div>
          <div className="room-picture">
            <PixelRoom
              theme={selected}
              coins={progress.coins}
              placed={placed}
              layout={book.furniture?.layout}
              preview={furniturePreview}
            />
            {furniturePreview && (
              <div className="room-placement-targets" aria-label="房間擺放位置">
                {[
                  ['窗邊', 100, 350, 14, 85],
                  ['桌旁', 470, 350, 65, 85],
                  ['右側', 620, 350, 86, 85],
                  ['牆面', 420, 165, 58, 39],
                ].map(([label, x, y, left, top]) => (
                  <button
                    key={label}
                    aria-label={'擺在' + label}
                    aria-pressed={
                      furniturePreview.x === Number(x) &&
                      furniturePreview.y === Number(y)
                    }
                    style={{ left: left + '%', top: top + '%' }}
                    onClick={() =>
                      setFurniturePreview(
                        positionItem(furniturePreview.id, Number(x), Number(y)),
                      )
                    }
                  >
                    ＋
                  </button>
                ))}
              </div>
            )}
            {furniturePreview && (
              <button
                className="scene-preview-badge"
                onClick={() =>
                  document
                    .getElementById('room-main-preview')
                    ?.scrollIntoView({ behavior: 'auto', block: 'start' })
                }
              >
                物品試擺中 · 調整位置 ↓
              </button>
            )}
            {!furniturePreview && !book.furniture?.layout.length && (
              <div className="room-caption">
                <span>{room.premium ? '主題預覽' : '我的小屋'}</span>
                <strong>{room.name}</strong>
              </div>
            )}
          </div>
          <div ref={setEditorHost} className="room-editor-host" />
          <div className="room-bottomline">
            <span>
              {room.premium
                ? '這是主題預覽，尚未購買或永久解鎖。'
                : '購物累計獲得 ' +
                  progress.coins +
                  ' G · 家具已花費 ' +
                  furnitureSpent(book) +
                  ' G'}
            </span>
            {room.premium ? (
              <button onClick={() => setSelected('meadow')}>
                回到我的小屋 ↗
              </button>
            ) : (
              <button
                onClick={() => {
                  setTab('即將推出')
                  setFurniturePreview(null)
                  document
                    .getElementById('room-collections')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                看看其他風格 ↗
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="world-actions">
        {onStart ? (
          <button className="boutique-primary" onClick={onStart}>
            新增想買物品
          </button>
        ) : (
          <button
            className="boutique-secondary"
            onClick={() =>
              window.dispatchEvent(new Event('little-daily-shopping-entry'))
            }
          >
            回到冷靜清單
          </button>
        )}
      </div>
      <nav className="world-navigation" aria-label="小屋功能">
        {['選物店', '成長裝飾', '即將推出'].map((t) => (
          <button
            key={t}
            className="secondary-button"
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t)
              setFurniturePreview(null)
            }}
          >
            {t}
          </button>
        ))}
      </nav>
      {tab === '選物店' && (
        <FurnitureShop
          book={book}
          onSave={onSave}
          preview={furniturePreview}
          onPreview={setFurniturePreview}
          demo={demo}
          editorHost={editorHost}
        />
      )}
      <section hidden={tab !== '成長裝飾'} aria-label="成長裝飾">
        <div className="earned-strip">
          <div>
            <strong>成長裝飾</strong>
            <span>
              {count === 3
                ? '三件成長裝飾都收集到了。'
                : '下一件裝飾：再累積 ' +
                  Math.max(0, [50, 100, 150][count] - progress.coins) +
                  ' 金幣'}
            </span>
          </div>
          <div className="earned-items">
            {[
              ['小盆栽', 50, 'sprout'],
              ['暖心燈', 100, 'lamp'],
              ['星空窗', 150, 'star'],
            ].map(([name, cost, icon]) => (
              <button
                key={name}
                disabled={progress.coins < Number(cost)}
                aria-pressed={
                  progress.coins >= Number(cost) && placed(String(name))
                }
                onClick={() =>
                  onSave({
                    ...book,
                    supplies: [
                      ...(book.supplies ?? []).filter((s) => s.name !== name),
                      { name: String(name), done: !placed(String(name)) },
                    ],
                  })
                }
              >
                <span
                  className={'earned-symbol symbol-' + icon}
                  aria-hidden="true"
                >
                  {icon === 'sprout' ? '✿' : icon === 'lamp' ? '◒' : '✦'}
                </span>
                <span>
                  <strong>{name}</strong>
                  <small>
                    {progress.coins >= Number(cost)
                      ? placed(String(name))
                        ? '已擺放 · 點選收起'
                        : '已收藏 · 點選擺放'
                      : cost + ' G 解鎖'}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section hidden={tab !== '即將推出'} aria-label="即將推出">
        <section
          className="room-collections"
          id="room-collections"
          aria-labelledby="collections-title"
        >
          <div className="collection-heading">
            <div>
              <h3 id="collections-title">小屋主題</h3>
              <p>選擇風格，預覽房間效果。</p>
            </div>
            <span className="collection-note">開發中 · 可免費預覽</span>
          </div>
          <div className="room-cards">
            {roomThemes.map((t) => (
              <button
                key={t.id}
                className={
                  'room-card theme-' +
                  t.id +
                  (selected === t.id ? ' is-selected' : '')
                }
                aria-pressed={selected === t.id}
                onClick={() => {
                  setSelected(t.id)
                  document
                    .getElementById('room-main-preview')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                <div className="room-card-art">
                  <PixelRoom
                    theme={t.id}
                    coins={progress.coins}
                    placed={placed}
                    mini
                  />
                  <span className="room-card-label">{t.label}</span>
                  {selected === t.id && (
                    <span className="room-selected">✓ 正在看</span>
                  )}
                </div>
                <div className="room-card-copy">
                  <h4>{t.name}</h4>
                  <p>{t.subtitle}</p>
                  <div>
                    <small>
                      {t.premium ? '專屬家具 · 完整氛圍' : '日常成長免費解鎖'}
                    </small>
                    <b>{t.premium ? '試住 →' : '回家 →'}</b>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="collection-offer">
            <div className="offer-mark" aria-hidden="true">
              ✦
            </div>
            <div>
              <h4>主題擴充開發中</h4>
              <p>
                主題包規劃採一次解鎖：整組家具、牆地面與專屬燈光。冷靜清單、金幣獎勵、存錢紀錄與備份持續免費。
              </p>
              <span>
                主題擴充尚未開放購買，價格待定。本版可免費試住，不會收費。
              </span>
            </div>
            <button
              className="boutique-secondary"
              onClick={() => {
                if (selected === 'meadow') setSelected('cafe')
                setDetails(true)
              }}
            >
              看看整組內容 ↗
            </button>
          </div>
        </section>
        {tab === '即將推出' && (
          <FurnitureShop
            key="paid"
            mode="paid"
            book={book}
            onSave={onSave}
            preview={furniturePreview}
            onPreview={setFurniturePreview}
            demo={demo}
            editorHost={editorHost}
          />
        )}
      </section>
      {details && (
        <dialog
          className="collection-dialog"
          ref={dialog}
          aria-labelledby="collection-dialog-title"
          onCancel={(e) => {
            e.preventDefault()
            setDetails(false)
          }}
        >
          <button
            className="collection-close"
            aria-label="關閉主題預覽"
            onClick={() => setDetails(false)}
          >
            ×
          </button>
          <PixelRoom theme={selected} coins={progress.coins} placed={placed} />
          <div className="collection-dialog-copy">
            <h2 id="collection-dialog-title">{room.name}</h2>
            <p>{room.subtitle}</p>
            <ul>
              {room.items.map((item) => (
                <li key={item}>
                  <span>✦</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="collection-value">
              <strong>{room.objects}</strong>
              <p>
                {room.premium
                  ? '一次解鎖的主題包構想，價格待定。實際購買尚未開放。'
                  : '免費使用，完成不買決定即可慢慢解鎖裝飾。'}
              </p>
            </div>
            <button
              className="boutique-primary"
              onClick={() => {
                setDetails(false)
                requestAnimationFrame(() =>
                  document
                    .getElementById('room-main-preview')
                    ?.scrollIntoView({ behavior: 'auto', block: 'start' }),
                )
              }}
            >
              {room.premium ? '免費試住這個主題 →' : '回到我的小屋 →'}
            </button>
            <small>試住只改變目前預覽，不會扣款或改寫存錢紀錄。</small>
          </div>
        </dialog>
      )}
    </section>
  )
}
