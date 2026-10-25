import InteractionSettings from './components/InteractionSettings'
import BottomNav from './components/BottomNav'
import QuickExpense from './components/QuickExpense'
import { errorText } from './ui/copy'
import { furnitureSpent } from './data/furniture'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { shoppingProgress, coolingEnd } from './data/shopping'
import { readBookSnapshot } from './data/storage'
import ShoppingJourney from './components/ShoppingJourney'
import PetDiary from './components/PetDiary'
import BackupPanel from './components/BackupPanel'
import ToolWorkspace from './components/ToolWorkspace'
import ToolCard from './components/ToolCard'
import HomeOverview from './components/HomeOverview'
import WeeklyReview from './components/WeeklyReview'
import HomeCustomization from './components/HomeCustomization'
import SafetyBackups from './components/SafetyBackups'
import InstallStatus from './components/InstallStatus'
import OnboardingTour from './components/OnboardingTour'
import { rememberTour, shouldShowTour } from './data/onboarding'
import './Product.css'
import { tools } from './data/tools'
import {
  notifySaved,
  gameKey,
  initialGame,
  keys,
  nextCheckIn,
  readGame,
  readPreferences,
  savePreferences,
  defaultPreferences,
  type HomePreferences,
} from './data/storage'
import { hashForTool, toolFromHash } from './data/routes'
import './App.css'
import './Refinements.css'
import PageBoundary from './components/PageBoundary'

const HomeWorld = lazy(() =>
  import('./components/WorldBoutique').then((m) => ({ default: m.HomeWorld })),
)

function profile() {
  try {
    return { game: readGame(localStorage), error: '' }
  } catch {
    return {
      game: initialGame,
      error: '簽到資料暫時無法讀取，原資料仍保留，請先檢查瀏覽器儲存設定。',
    }
  }
}
function loadHome() {
  try {
    return { ...readPreferences(localStorage), error: '' }
  } catch {
    return {
      preferences: defaultPreferences,
      raw: null,
      error: '首頁設定無法讀取，原設定仍保留，請先重新整理後再試。',
    }
  }
}
function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export default function App() {
  const [account, setAccount] = useState(profile)
  const [home, setHome] = useState(loadHome)
  const [quickExpense, setQuickExpense] = useState(false)
  const [budgetRevision, setBudgetRevision] = useState(0)
  const [expenseReceived, setExpenseReceived] = useState<{
    id: string
    reply: string
  } | null>(null)
  const [settingsError, setSettingsError] = useState('')
  const [tourOpen, setTourOpen] = useState(() => shouldShowTour(localStorage))
  const [tourMessage, setTourMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now)
  const [selectedId, setSelectedId] = useState(() =>
    toolFromHash(window.location.hash),
  )
  const lastTool = useRef<string | null>(null)
  const selectedTool = tools.find((t) => t.id === selectedId)
  let shoppingCoins = 0,
    spentCoins = 0,
    readyCount = 0,
    thinkingCount = 0,
    shoppingError = false
  try {
    const shopping = readBookSnapshot(localStorage, 'shopping').book
    shoppingCoins = shoppingProgress(shopping).coins
    spentCoins = furnitureSpent(shopping)
    thinkingCount = shopping.entries.filter(
      (e) => !e.done && (!e.status || e.status === 'thinking'),
    ).length
    readyCount = shopping.entries.filter(
      (e) =>
        !e.done &&
        (!e.status || e.status === 'thinking') &&
        coolingEnd(e) <= now,
    ).length
  } catch {
    shoppingError = true
  }
  const totalCoins = Math.max(
    0,
    account.game.coins + shoppingCoins - spentCoins,
  )
  const today = localDate(new Date(now))
  const checkedIn = account.game.lastCheckIn === today
  const level = Math.floor(account.game.xp / 100) + 1
  const progress = account.game.xp % 100
  function refresh() {
    setAccount(profile())
    setHome(loadHome())
    setNow(Date.now())
  }
  useEffect(() => {
    if (!expenseReceived) return
    const timer = setTimeout(() => setExpenseReceived(null), 4000)
    return () => clearTimeout(timer)
  }, [expenseReceived])
  function customize(next: HomePreferences) {
    try {
      if (home.error) throw new Error(home.error)
      const raw = savePreferences(localStorage, home.raw, next)
      setHome({ preferences: next, raw, error: '' })
      setSettingsError('')
    } catch (e) {
      setSettingsError(
        errorText(e, '首頁設定還沒存好，請檢查瀏覽器的儲存設定。'),
      )
    }
  }
  const visibleTools = home.preferences.order
    .filter((id) => !home.preferences.hidden.includes(id))
    .map((id) => tools.find((t) => t.id === id)!)
  useEffect(() => {
    const route = () => {
      setSelectedId(toolFromHash(window.location.hash))
      setNow(Date.now())
      setAccount(profile())
      setHome(loadHome())
    }
    const storage = (event: StorageEvent) => {
      if (event.key === null || keys.includes(event.key)) {
        setAccount(profile())
        setHome(loadHome())
        setNow(Date.now())
      }
    }
    const tick = window.setInterval(() => setNow(Date.now()), 30000)
    const focus = () => {
      setNow(Date.now())
      setAccount(profile())
      setHome(loadHome())
    }
    window.addEventListener('hashchange', route)
    window.addEventListener('storage', storage)
    window.addEventListener('focus', focus)
    window.addEventListener('little-daily-saved', focus)
    document.addEventListener('visibilitychange', focus)
    return () => {
      clearInterval(tick)
      window.removeEventListener('hashchange', route)
      window.removeEventListener('storage', storage)
      window.removeEventListener('focus', focus)
      window.removeEventListener('little-daily-saved', focus)
      document.removeEventListener('visibilitychange', focus)
    }
  }, [])
  useEffect(() => {
    document.title = selectedTool
      ? `${selectedTool.title} · Little Daily`
      : selectedId === 'house'
        ? '小屋與商店 · Little Daily'
        : selectedId === 'more'
          ? '更多 · Little Daily'
          : 'Little Daily | 生活裡的小事'
    if (!selectedTool && !selectedId && lastTool.current) {
      const target =
        lastTool.current === 'shopping'
          ? document.querySelector<HTMLButtonElement>(
              '.home-primary-actions .secondary-button',
            )
          : document.querySelector<HTMLButtonElement>(
              `[data-tool-id="${lastTool.current}"]`,
            )
      const notebook = target?.closest<HTMLDetailsElement>(
        'details.home-notebook',
      )
      if (notebook) notebook.open = true
      target?.focus()
    }
  }, [selectedTool, selectedId])
  function finishTour() {
    try {
      rememberTour(localStorage)
      setTourMessage('')
    } catch {
      setTourMessage(
        '導覽已結束，但瀏覽器未能儲存完成狀態；下次開啟可能會再出現。',
      )
    }
    setTourOpen(false)
  }
  function open(id: string | null, view: '清單' | '小屋與商店' = '清單') {
    if (view === '小屋與商店') id = 'house'
    if (id) lastTool.current = id
    window.location.hash = hashForTool(id)
  }
  async function checkIn() {
    if (busy) return
    setBusy(true)
    const perform = () => {
      const latest = readGame(localStorage)
      const next = nextCheckIn(latest, localDate(new Date()))
      if (next !== latest) localStorage.setItem(gameKey, JSON.stringify(next))
      notifySaved()
      setAccount({ game: next, error: '' })
      setNow(Date.now())
      setNotice(
        next === latest
          ? '今天已經簽到過了。'
          : '今天也留了一筆。拿到 10 金幣、10 經驗值',
      )
    }
    try {
      if (navigator.locks)
        await navigator.locks.request('little-daily-checkin', perform)
      else perform()
    } catch {
      setNotice('無法儲存簽到，原資料仍保留，請檢查瀏覽器儲存設定後再試。')
    } finally {
      setBusy(false)
    }
  }
  if (selectedTool)
    return (
      <main className="app-shell">
        {selectedTool.id === 'shopping' ? (
          <ShoppingJourney
            key="shopping-list"
            onBack={() => open(null)}
            onHome={() => open('house')}
          />
        ) : selectedTool.id === 'dog' ? (
          <PetDiary onBack={() => open(null)} />
        ) : (
          <ToolWorkspace
            key={selectedTool.id}
            tool={selectedTool}
            onBack={() => open(null)}
          />
        )}
        <BottomNav current={selectedId} />
      </main>
    )
  if (selectedId === 'house')
    return (
      <main className="app-shell">
        <PageBoundary>
          <ShoppingJourney
            key="house"
            onBack={() => open(null)}
            initialView="小屋與商店"
          />
        </PageBoundary>
        <BottomNav current={selectedId} />
      </main>
    )
  return (
    <main className="app-shell">
      <header className="site-header">
        <div>
          <div className="brand">LITTLE DAILY</div>
          <p className="muted">生活裡的小事，慢慢整理。</p>
        </div>
        <div className="header-actions">
          <button className="tour-launch" onClick={() => setTourOpen(true)}>
            新手導覽
          </button>
          <div className="coin-pill" aria-label={`可用金幣 ${totalCoins}`}>
            可用金幣 {totalCoins}
          </div>
        </div>
      </header>
      {account.error && (
        <p className="home-alert" role="alert">
          {account.error}
        </p>
      )}
      {selectedId !== 'more' && (
        <>
          <HomeOverview
            now={now}
            onOpen={open}
            mode="budget"
            onRecord={() => setQuickExpense(true)}
            received={expenseReceived}
            revision={budgetRevision}
          />
          <PageBoundary>
            <Suspense
              fallback={
                <p className="home-room-loading" role="status">
                  小兔還在整理房間，等一下下。
                </p>
              }
            >
              <HomeWorld onDecorate={() => open('shopping', '小屋與商店')} />
            </Suspense>
          </PageBoundary>
          <section
            className="home-purchase"
            aria-labelledby="home-purchase-title"
          >
            <div>
              <h2 id="home-purchase-title">想買的，先放著</h2>
              <p>過幾天還想要，再來決定。</p>
            </div>
            <div
              className="home-primary-actions"
              role="group"
              aria-label="首頁快速操作"
            >
              <button
                className="secondary-button"
                onClick={() => open('shopping')}
              >
                新增想買物品
              </button>
            </div>
            {shoppingError ? (
              <p className="form-error" role="alert">
                想買清單讀不到，先保留備份，別急著新增。
              </p>
            ) : readyCount > 0 ? (
              <button className="home-ready" onClick={() => open('shopping')}>
                有 {readyCount} 件想買的東西，現在可以決定了 →
              </button>
            ) : (
              <p className="home-quiet">
                {thinkingCount > 0
                  ? `有 ${thinkingCount} 件還在冷靜，過幾天再來看看。`
                  : '目前沒有東西在冷靜，錢包很安全。'}
              </p>
            )}
          </section>
        </>
      )}
      {selectedId === 'more' && (
        <>
          <h1>更多生活小事</h1>
          <InteractionSettings />
          <BackupPanel onImported={refresh} />
          <button className="secondary-button" onClick={() => open('house')}>
            小屋與商店
          </button>
          <HomeOverview
            now={now}
            onOpen={open}
            hidden={home.preferences.hidden}
            mode="reminders"
          />
          <details className="home-notebook compact-disclosure" open>
            <summary>生活小本子</summary>
            <p className="field-help">
              記帳、照顧毛孩，或想想晚餐。需要的時候再打開。
            </p>
            <details className="compact-disclosure">
              <summary>查看本週生活回顧</summary>
              <WeeklyReview now={now} />
            </details>
            <section className="tools-section" aria-labelledby="tools-title">
              <div className="section-heading">
                <h2 id="tools-title">日常工具</h2>
                <span>挑一件現在想做的事</span>
              </div>
              <HomeCustomization
                value={home.preferences}
                onChange={customize}
                error={settingsError || home.error}
              />
              <div className="tool-grid">
                {visibleTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onSelect={(t) => open(t.id)}
                  />
                ))}
              </div>
            </section>
            <div className="home-growth">
              <span>日常成長 · LV. {level}</span>
              <div
                className="xp-track"
                role="progressbar"
                aria-label="升級經驗值"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="xp-fill"
                  style={{ transform: `scaleX(${progress / 100})` }}
                />
              </div>
              <small>{progress} / 100 經驗值</small>
            </div>
            <section
              className="checkin pixel-panel"
              aria-labelledby="checkin-title"
            >
              <div>
                <h2 id="checkin-title">今天有來，記一下</h2>
                <p>
                  {checkedIn
                    ? '今天已經記下了，明天見。'
                    : '每天一次，替自己的日常留個紀錄。'}
                </p>
                <span className="reward">10 金幣 · 10 經驗值</span>
              </div>
              <button
                className="primary-button"
                disabled={checkedIn || busy || !!account.error}
                onClick={() => void checkIn()}
              >
                {busy ? '儲存中…' : checkedIn ? '✓ 已簽到' : '記下今天'}
              </button>
            </section>
            {notice && (
              <p className="notice" role="status">
                {notice}
              </p>
            )}
            <details className="compact-disclosure">
              <summary>資料備份、還原與安裝</summary>
              <SafetyBackups onRestored={refresh} />
              <InstallStatus />
            </details>
          </details>
        </>
      )}
      {tourMessage && (
        <p className="tour-message" role="status">
          {tourMessage}
        </p>
      )}
      {tourOpen && <OnboardingTour onClose={finishTour} />}
      {quickExpense && (
        <QuickExpense
          onClose={() => setQuickExpense(false)}
          onRecorded={(entry, reply) => {
            refresh()
            setBudgetRevision((n) => n + 1)
            setExpenseReceived({ id: entry.id, reply })
          }}
        />
      )}
      <BottomNav current={selectedId} />
      <footer>
        <span>Little Daily / 日子慢慢過</span>
        <span className="site-version">
          本機測試版 1.6 · 進度儲存在這個瀏覽器
        </span>
      </footer>
    </main>
  )
}
