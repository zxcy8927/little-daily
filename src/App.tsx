import {furnitureSpent} from './data/furniture'
import { HomeWorld } from './components/WorldBoutique'
import { useEffect, useRef, useState } from 'react'
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
import { notifySaved, gameKey, initialGame, keys, nextCheckIn, readGame, readPreferences, savePreferences, defaultPreferences, type HomePreferences } from './data/storage'
import { hashForTool, toolFromHash } from './data/routes'
import './App.css'

function profile() {
  try { return { game:readGame(localStorage), error:'' } }
  catch { return {game:initialGame,error:'簽到資料暫時無法讀取，原資料仍保留，請先檢查瀏覽器儲存設定。'} }
}
function loadHome(){try{return {...readPreferences(localStorage),error:''}}catch{return {preferences:defaultPreferences,raw:null,error:'首頁設定無法讀取，原設定仍保留，請先重新整理後再試。'}}}
function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}
export default function App() {
  const [account, setAccount] = useState(profile)
  const [home,setHome]=useState(loadHome)
  const [settingsError,setSettingsError]=useState('')
  const [tourOpen,setTourOpen]=useState(()=>shouldShowTour(localStorage))
  const [tourMessage,setTourMessage]=useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now)
  const [selectedId, setSelectedId] = useState(() => toolFromHash(window.location.hash))
  const lastTool = useRef<string | null>(null)
  const selectedTool = tools.find(t=>t.id === selectedId)
  let shoppingCoins=0,spentCoins=0,readyCount=0
  try{const shopping=readBookSnapshot(localStorage,'shopping').book;shoppingCoins=shoppingProgress(shopping).coins;spentCoins=furnitureSpent(shopping);readyCount=shopping.entries.filter(e=>!e.done&&(!e.status||e.status==='thinking')&&coolingEnd(e)<=now).length}catch{/* Preserve unreadable shopping data. */}
  const totalCoins=Math.max(0,account.game.coins+shoppingCoins-spentCoins)
  const today = localDate(new Date(now))
  const checkedIn = account.game.lastCheckIn === today
  const level = Math.floor(account.game.xp / 100) + 1
  const progress = account.game.xp % 100
  function refresh() { setAccount(profile());setHome(loadHome());setNow(Date.now()) }
  function customize(next:HomePreferences){try{if(home.error)throw new Error(home.error);const raw=savePreferences(localStorage,home.raw,next);setHome({preferences:next,raw,error:''});setSettingsError('')}catch(e){setSettingsError(e instanceof Error && !(e instanceof DOMException) ? e.message : '無法儲存首頁設定，請檢查瀏覽器儲存設定。')}}
  const visibleTools=home.preferences.order.filter(id=>!home.preferences.hidden.includes(id)).map(id=>tools.find(t=>t.id===id)!)
  useEffect(() => {
    const route = () => { setSelectedId(toolFromHash(window.location.hash)); setNow(Date.now()); setAccount(profile());setHome(loadHome()) }
    const storage = (event: StorageEvent) => { if(event.key === null || keys.includes(event.key)) {setAccount(profile());setHome(loadHome());setNow(Date.now())} }
    const tick = window.setInterval(()=>setNow(Date.now()),30000)
    const focus = () => {setNow(Date.now());setAccount(profile());setHome(loadHome())}
    window.addEventListener('hashchange',route)
    window.addEventListener('storage',storage)
    window.addEventListener('focus',focus)
    window.addEventListener('little-daily-saved',focus)
    document.addEventListener('visibilitychange',focus)
    return () => {clearInterval(tick);window.removeEventListener('hashchange',route);window.removeEventListener('storage',storage);window.removeEventListener('focus',focus);window.removeEventListener('little-daily-saved',focus);document.removeEventListener('visibilitychange',focus)}
  },[])
  useEffect(() => {
    document.title = selectedTool ? `${selectedTool.title} · Little Daily` : 'Little Daily | 生活裡的小事'
    if (!selectedTool && lastTool.current) {
      document.querySelector<HTMLButtonElement>(`[data-tool-id="${lastTool.current}"]`)?.focus()
    }
  },[selectedTool])
  function finishTour(){try{rememberTour(localStorage);setTourMessage('')}catch{setTourMessage('導覽已結束，但瀏覽器未能儲存完成狀態；下次開啟可能會再出現。')}setTourOpen(false)}
  function open(id: string | null) {
    if(id) lastTool.current=id
    window.location.hash=hashForTool(id)
  }
  async function checkIn() {
    if(busy) return
    setBusy(true)
    const perform = () => {
      const latest = readGame(localStorage)
      const next = nextCheckIn(latest,localDate(new Date()))
      if(next !== latest) localStorage.setItem(gameKey,JSON.stringify(next))
      notifySaved();setAccount({game:next,error:''});setNow(Date.now())
      setNotice(next === latest ? '今天已經簽到過了。' : '今天的簽到記好了。+10 金幣、+10 EXP')
    }
    try {
      if(navigator.locks) await navigator.locks.request('little-daily-checkin',perform)
      else perform()
    } catch { setNotice('無法儲存簽到，原資料仍保留，請檢查瀏覽器儲存設定後再試。') }
    finally { setBusy(false) }
  }
  if(selectedTool) return <main className="app-shell"><nav className="tool-nav" aria-label="日常工具導覽"><a href={hashForTool(null)}>首頁</a>{tools.map(t=><a key={t.id} href={hashForTool(t.id)} aria-current={selectedId === t.id ? 'page' : undefined} onClick={()=>{lastTool.current=t.id}}>{t.title}</a>)}</nav>{selectedTool.id === 'shopping' ? <ShoppingJourney onBack={()=>open(null)}/> : selectedTool.id === 'dog' ? <PetDiary onBack={()=>open(null)}/> : <ToolWorkspace key={selectedTool.id} tool={selectedTool} onBack={()=>open(null)}/>}</main>
  return <main className="app-shell">
    <header className="site-header"><div><div className="brand">LITTLE DAILY</div><p className="muted">生活裡的小事，慢慢整理。</p></div><div className="header-actions"><button className="tour-launch" onClick={()=>setTourOpen(true)}>新手導覽</button><div className="coin-pill" aria-label={`可用金幣 ${totalCoins}`}>可用金幣 {totalCoins}</div></div></header>
    {account.error && <p className="home-alert" role="alert">{account.error}</p>}
    <section className="home-intro"><div><h1>少買一點，多一點自己的生活。</h1><p>先記下想買的東西，到期再決定。</p><div className="home-primary-actions" role="group" aria-label="首頁快速操作"><button className="primary-button" onClick={()=>open('shopping')}>新增想買物品</button><button className="secondary-button" onClick={()=>open('shopping')}>到期可決定 {readyCount} 件</button><button className="secondary-button" onClick={()=>{document.querySelector<HTMLDetailsElement>('.home-room')?.setAttribute('open','');document.getElementById('my-little-world')?.scrollIntoView({behavior:'smooth',block:'start'})}}>查看我的小屋</button></div></div><div className="home-growth"><span>日常成長 · LV. {level}</span><div className="xp-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="升級經驗值"><div className="xp-fill" style={{width:`${progress}%`}}/></div><small>{progress} / 100 EXP</small></div></section>
    <HomeOverview now={now} onOpen={open} hidden={home.preferences.hidden}/ >
    <details className="compact-disclosure home-room"><summary>我的小屋與選物店</summary><HomeWorld/></details>
    <details className="compact-disclosure"><summary>查看本週生活回顧</summary><WeeklyReview now={now}/></details>
    <section className="tools-section" aria-labelledby="tools-title"><div className="section-heading"><h2 id="tools-title">日常工具</h2><span>挑一件現在想做的事</span></div><HomeCustomization value={home.preferences} onChange={customize} error={settingsError || home.error}/ ><div className="tool-grid">{visibleTools.map(tool=><ToolCard key={tool.id} tool={tool} onSelect={t=>open(t.id)}/>)}</div></section>
    <section className="checkin pixel-panel" aria-labelledby="checkin-title"><div><h2 id="checkin-title">今天有來，記一下</h2><p>{checkedIn ? '今天已經記下了，明天見。' : '每天一次，替自己的日常留個紀錄。'}</p><span className="reward">+10 金幣 · +10 EXP</span></div><button className="primary-button" disabled={checkedIn || busy || !!account.error} onClick={()=>void checkIn()}>{busy ? '儲存中…' : checkedIn ? '✓ 已簽到' : '記下今天'}</button></section>
    {notice && <p className="notice" role="status">{notice}</p>}
    <details className="compact-disclosure"><summary>資料備份、還原與安裝</summary><BackupPanel onImported={refresh}/>
    <SafetyBackups onRestored={refresh}/ >
    <InstallStatus/></details>
    <section className="app-help tour-invitation" aria-labelledby="tour-invitation-title"><div><h2 id="tour-invitation-title">第一次使用？讓小兔帶你逛逛</h2><p>約一分鐘，認識首頁、日常工具與資料備份。</p></div><button className="secondary-button" onClick={()=>setTourOpen(true)}>開始新手導覽</button></section>
    {tourMessage && <p className="tour-message" role="status">{tourMessage}</p>}
    {tourOpen && <OnboardingTour onClose={finishTour}/ >}
    <footer><span>Little Daily / 日子慢慢過</span><span className="site-version">本機測試版 1.6 · 進度儲存在這個瀏覽器</span></footer>
  </main>
}
