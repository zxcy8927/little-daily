import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { DailyTool } from '../data/tools'
import './ToolWorkspace.css'
import StorageConflict from './StorageConflict'
import FoodInventory from './FoodInventory'
import { ShoppingQuestions, ShoppingAnswers, type Reflection } from './ShoppingReflection'
import { isBook, budgetCategories, bookKey, readBookSnapshot, saveBookSnapshot, type Entry, type Book, type Supply } from '../data/storage'
import { appendSupplies, buildPurchase, selectTasks, summarizeExpenses, expenseCsv, rankPantryRecipes } from '../data/workflows'

const empty: Book = { entries: [], limit: 500 }
const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const money = (value: number) => new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(value)
function readBook(key: string): Book { return readBookSnapshot(localStorage,key.replace('little-daily-tool-', '').replace('-v1','')).book }

const recipes = [
  { name: '番茄炒蛋', ingredients: ['番茄', '蛋'], minutes: 10, steps: ['番茄切塊，蛋打散。', '熱鍋加油，炒蛋至凝固後先盛起。', '炒軟番茄，加回炒蛋，以鹽調味。'] },
  { name: '高麗菜炒飯', ingredients: ['高麗菜', '飯', '蛋'], minutes: 15, steps: ['高麗菜切細，蛋打散。', '熱鍋炒熟蛋和高麗菜。', '加入熟飯炒散，以醬油調味。'] },
  { name: '菇菇豆腐湯', ingredients: ['菇', '豆腐'], minutes: 15, steps: ['菇洗淨，豆腐切塊。', '鍋中加水煮滾，放入菇和豆腐。', '煮至食材熟透，以鹽調味。'] },
  { name: '洋蔥雞肉丼', ingredients: ['洋蔥', '雞肉', '飯'], minutes: 20, steps: ['洋蔥切絲，雞肉切成小塊。', '洋蔥炒軟，加入雞肉、少許水與醬油燜煮。', '確認雞肉熟透後，連同湯汁盛在熟飯上。'] },
  { name: '蒜香青菜麵', ingredients: ['蒜', '青菜', '麵'], minutes: 15, steps: ['麵煮熟瀝乾，留少許煮麵水。', '蒜末用油炒香，加入青菜炒熟。', '放入麵與少許煮麵水拌炒，以鹽調味。'] },
  { name: '馬鈴薯蛋沙拉', ingredients: ['馬鈴薯', '蛋'], minutes: 25, steps: ['馬鈴薯去皮切塊，蒸至鬆軟。', '蛋煮熟剝殼，與馬鈴薯一起壓碎。', '拌入少許美乃滋、鹽和胡椒。'] },
]
const ideas = [
  { name: '帶一杯飲料，去公園散步', place: '戶外', cost: 150, detail: '各自挑一杯喜歡的飲料，走一條平常沒走過的路。' },
  { name: '在家做一頓雙人晚餐', place: '室內', cost: 400, detail: '一起選菜、買食材，一個掌廚、一個負責擺盤。' },
  { name: '交換一首歌的咖啡時間', place: '室內', cost: 500, detail: '找間咖啡店，輪流分享最近常聽的歌和原因。' },
  { name: '逛市場，挑三樣沒吃過的小吃', place: '戶外', cost: 400, detail: '一人選一樣，最後一樣一起決定，邊走邊吃。' },
  { name: '手機相簿小展覽', place: '室內', cost: 0, detail: '各選五張照片，輪流聊聊照片背後的故事。' },
  { name: '黃昏散步與拍照', place: '戶外', cost: 0, detail: '找個附近的散步路線，替對方拍一張今天的照片。' },
]
export default function ToolWorkspace({ tool, onBack }: { tool: DailyTool; onBack: () => void }) {
  const key = `little-daily-tool-${tool.id}-v1`
  const [loaded] = useState(() => { try { return { ...readBookSnapshot(localStorage,tool.id), error:'' } } catch(e) { return {book:empty,raw:null,error:e instanceof Error ? e.message : '無法讀取紀錄。'} } })
  const snapshot=useRef(loaded.raw)
  const [book, setBook] = useState<Book>(loaded.book)
  const [expenseCategory, setExpenseCategory] = useState<Entry['category']>('其他')
  const [editCategory, setEditCategory] = useState<Entry['category']>('其他')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<NonNullable<Entry['priority']>>('normal')
  const [editDueDate, setEditDueDate] = useState('')
  const [editPriority, setEditPriority] = useState<NonNullable<Entry['priority']>>('normal')
  const [editPlan, setEditPlan] = useState('')
  const [editNote, setEditNote] = useState('')
  const [period, setPeriod] = useState('當日')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [maxMinutes, setMaxMinutes] = useState('不限')
  const [readyOnly, setReadyOnly] = useState(false)
  const [favoriteFilter, setFavoriteFilter] = useState('全部')
  const [supplyText, setSupplyText] = useState('')
  const [clearedSupplies,setClearedSupplies] = useState<Supply[] | null>(null)
  const [ledger, setLedger] = useState<Book>(() => {try{return readBook(bookKey('budget'))}catch{return empty}})
  const [reflection,setReflection]=useState<Reflection>({})
  const [editReflection,setEditReflection]=useState<Reflection>({})
  const [editing, setEditing] = useState<Entry | null>(null)
  const [editText, setEditText] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [search, setSearch] = useState('')
  const [onlyReady, setOnlyReady] = useState(false)
  const [text, setText] = useState('')
  const [amount, setAmount] = useState('')
  const [limit, setLimit] = useState(String(book.limit))
  const [error, setError] = useState(loaded.error)
  const [feedback, setFeedback] = useState('')
  const [deleted, setDeleted] = useState<Entry | null>(null)
  const [now, setNow] = useState(Date.now)
  const [date, setDate] = useState(dayKey)
  const [filter, setFilter] = useState('全部')
  const [ingredient, setIngredient] = useState(loaded.book.pantry ?? '')
  const [searched, setSearched] = useState(false)
  const [place, setPlace] = useState('不限')
  const [idea, setIdea] = useState<(typeof ideas)[number] | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0) }, [])
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => window.clearInterval(timer) }, [])
  function save(next: Book) {
    if (loaded.error) { setError(loaded.error); return false }
    if (!isBook(next, tool.id)) { setError('資料不完整，或已達儲存上限，請先整理紀錄。'); return false }
    try { snapshot.current=saveBookSnapshot(localStorage,tool.id,snapshot.current,next); setBook(next); setError(''); setFeedback('已儲存在這個瀏覽器。'); return true }
    catch(e) { setError(e instanceof Error && !(e instanceof DOMException) ? e.message : '目前無法儲存，請確認瀏覽器允許網站儲存資料後再試。'); return false }
  }
  function add(needsAmount = false) {
    const value = Number(amount)
    if (!text.trim()) { setError('先填寫名稱或內容。'); return }
    if (needsAmount && (!amount.trim() || !Number.isFinite(value) || value <= 0 || value > 1e9)) { setError('金額請填大於 0、且不超過十億元的數字。'); return }
    const entry: Entry = { id: crypto.randomUUID(), text: text.trim(), amount: needsAmount ? Math.round(value*100)/100 : 0, date: tool.id === 'shopping' ? new Date().toISOString() : date, done: false, ...(tool.id === 'tasks' ? {dueDate,priority} : {}), ...(tool.id === 'budget' ? {category:expenseCategory} : {}), ...(tool.id === 'shopping' ? reflection : {}) }
    if (save({ ...book, entries: [entry, ...book.entries] })) { setText(''); setAmount(''); setDueDate(''); setPriority('normal');setReflection({}) }
  }
  function startEdit(entry: Entry) { setEditing(entry); setEditText(entry.text); setEditAmount(String(entry.amount)); setEditDate(entry.date); setEditCategory(entry.category ?? '其他'); setEditDueDate(entry.dueDate ?? ''); setEditPriority(entry.priority ?? 'normal'); setEditPlan(entry.plannedFor ?? ''); setEditNote(entry.note ?? ''); setEditReflection({buyReason:entry.buyReason,ownsSimilar:entry.ownsSimilar,useFrequency:entry.useFrequency}); setError('') }
  function finishEdit() {
    const n = Number(editAmount)
    if (!editing || !editText.trim()) { setError('內容不能空白。'); return }
    if ((tool.id === 'budget' || tool.id === 'shopping') && (!editAmount.trim() || !Number.isFinite(n) || n <= 0 || n > 1e9)) { setError('請填寫有效的正數金額。'); return }
    if (!editDate) { setError('請選擇日期。'); return }
    if (save({...book, entries: book.entries.map(e => e.id === editing.id ? {...e, text:editText.trim(), amount:Math.round(n*100)/100, date:editDate, ...(tool.id === 'budget' ? {category:editCategory} : {}), ...(tool.id === 'tasks' ? {dueDate:editDueDate,priority:editPriority} : {}), ...(tool.id === 'date' ? {plannedFor:editPlan,note:editNote} : {}), ...(tool.id === 'shopping' ? editReflection : {})} : e)})) setEditing(null)
  }
  function favorite(name: string, amount: number) {
    if (book.entries.some(e => e.text === name)) return
    save({...book, entries:[{id:crypto.randomUUID(),text:name,amount,date:dayKey(),done:false},...book.entries]})
  }
  function decide(entry: Entry, status: 'thinking' | 'skipped' | 'bought') {
    if(status === 'bought' && Date.now()-Date.parse(entry.date)<86400000) {setError('先給自己一天，再決定是否購買。');return}
    save({...book, entries:book.entries.map(e => e.id === entry.id ? {...e,status,done:status === 'skipped',decidedOn:status === 'thinking' ? undefined : dayKey()} : e)})
  }
  function toggle(id: string) { save({ ...book, entries: book.entries.map(e => e.id === id ? { ...e, done: !e.done, completedOn:e.done ? undefined : dayKey() } : e) }) }
  function remove(id: string) { const entry = book.entries.find(e => e.id === id); if (save({ ...book, entries: book.entries.filter(e => e.id !== id) }) && entry) setDeleted(entry) }
  const spent = book.entries.filter(e => e.date === date).reduce((n, e) => n + Math.round(e.amount*100), 0)/100
  const monthSpent = book.entries.filter(e => e.date.startsWith(date.slice(0,7))).reduce((n,e) => n + Math.round(e.amount*100),0)/100
  function supplies(names: string[]) {
    const next = appendSupplies(book.supplies ?? [], names)
    if(save({...book,supplies:next})) setSupplyText('')
  }
  function transfer(entry: Entry) {
    try {
      const currentShopping=readBook(key), currentBudget=readBookSnapshot(localStorage,'budget')
      const next=buildPurchase(currentShopping,currentBudget.book,entry.id,dayKey())
      if(!isBook(next,'budget')) throw new Error('支出已達上限，請先整理預算紀錄。')
      saveBookSnapshot(localStorage,'budget',currentBudget.raw,next)
      setLedger(next);setError('');setFeedback('已記入今天的購物支出，可在日常預算查看。')
    } catch(e) { setError(e instanceof Error ? e.message : '記帳失敗，請稍後再試。') }
  }
  function exportExpenses() {
    const url=URL.createObjectURL(new Blob([expenseCsv(visible)],{type:'text/csv;charset=utf-8'}))
    const a=document.createElement('a');a.href=url;a.download='little-daily-expenses-'+date+'.csv';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  const monthlyCategories=summarizeExpenses(book.entries,date.slice(0,7))
  const hasIngredients=ingredient.trim().length > 0 || (book.foods ?? []).some(f=>f.state==='available' && (!f.expiresOn || f.expiresOn>=dayKey()))
  const ranked=rankPantryRecipes(recipes,ingredient,book.foods ?? [],dayKey(),maxMinutes,readyOnly)
  const favoriteEntries=book.entries.filter(e=>tool.id !== 'date' || favoriteFilter === '全部' || (favoriteFilter === '去過' ? e.done : !e.done))
  const matched = book.entries.filter(e => e.text.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  const visible = tool.id === 'tasks' ? selectTasks(matched,filter,dayKey()) : matched.filter(e => !onlyReady || tool.id !== 'shopping' || (!e.done && e.status !== 'bought' && e.status !== 'cancelled' && now-new Date(e.date).getTime() >= 86400000)).filter(e => tool.id !== 'budget' || ((period === '當日' ? e.date === date : e.date.startsWith(date.slice(0,7)+'-')) && (categoryFilter === '全部' || (e.category ?? '其他') === categoryFilter)))

  return <section className="workspace" aria-labelledby="workspace-title">
    {!loaded.error && <StorageConflict storageKey={key} snapshot={snapshot}/>}
    <button className="back-button" onClick={onBack}>← 回到日常工具</button>
    <header className="workspace-heading"><span aria-hidden="true">{tool.emoji}</span><div><h1 ref={heading} tabIndex={-1} id="workspace-title">{tool.title}</h1><p>{tool.subtitle}</p></div></header>
    {tool.id === 'cooking' ? <>
      <FoodInventory book={book} onSave={save} today={dayKey()}/ >
      <form className="tool-form pixel-panel" onSubmit={e => { e.preventDefault(); if(save({...book,pantry:ingredient.trim()})) setSearched(true) }}><label>另外還有哪些食材？<input value={ingredient} onChange={e => { setIngredient(e.target.value); setSearched(false) }} placeholder="例如：蛋、番茄、豆腐" maxLength={200}/></label><div className="form-row"><label>料理時間<select value={maxMinutes} onChange={e => setMaxMinutes(e.target.value)}><option>不限</option><option value="10">10 分鐘內</option><option value="15">15 分鐘內</option><option value="20">20 分鐘內</option><option value="30">30 分鐘內</option></select></label><button type="button" className="secondary-button" aria-pressed={readyOnly} onClick={() => setReadyOnly(!readyOnly)}>{readyOnly ? '顯示部分食材符合' : '只看食材齊全'}</button></div><p className="field-help">會自動帶入未到期的冰箱食材；其他食材用逗號或空格分開。從 6 道家常菜找點子，油、鹽等基本調味料另備。</p><button className="primary-button">找找能煮什麼</button></form>
      {searched && <div className="recipe-list" aria-live="polite">{ranked.length ? ranked.map(r => <article className="record recipe" key={r.name}><div className="record-heading"><h2>{r.name}</h2><span>約 {r.minutes} 分鐘</span></div><p>食材：{r.ingredients.join('、')}</p>{r.urgent.length>0 && <p className="urgent-ingredients">先用快到期食材：{r.urgent.join('、')}</p>}{hasIngredients && <p>你有：{r.hits.join('、')}　／　還缺：{r.ingredients.filter(i => !r.hits.includes(i)).join('、') || '主要食材都有了'}</p>}<button className="secondary-button" disabled={book.entries.some(e => e.text === r.name)} onClick={() => favorite(r.name,0)}>{book.entries.some(e => e.text === r.name) ? '已收藏' : '收藏食譜'}</button><button className="secondary-button" disabled={r.hits.length === r.ingredients.length} onClick={() => supplies(r.ingredients.filter(i=>!r.hits.includes(i)))}>缺少食材加入採買</button><ol>{r.steps.map(step => <li key={step}>{step}</li>)}</ol></article>) : <p className="empty-state">沒有符合目前食材與時間條件的料理，試試放寬條件。</p>}</div>}
    </> : tool.id === 'date' ? <>
      <form className="tool-form pixel-panel" onSubmit={e => { e.preventDefault(); const max = Number(amount); if (!amount.trim() || !Number.isFinite(max) || max < 0) { setError('請填寫 0 或以上的兩人預算。'); return } const pool = ideas.filter(i => (place === '不限' || i.place === place) && i.cost <= max); const alternatives = pool.filter(i => i.name !== idea?.name); const choices = alternatives.length ? alternatives : pool; setIdea(choices[Math.floor(Math.random()*choices.length)] || null); setError(pool.length ? '' : '這個條件暫時沒有提案，試試不限地點。') }}><div className="form-row"><label>兩人預算（元）<input type="number" min="0" step="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="例如：500" required/></label><label>想待在哪裡<select value={place} onChange={e => setPlace(e.target.value)}><option>不限</option><option>室內</option><option>戶外</option></select></label></div><button className="primary-button">{idea ? '再抽一個' : '抽個約會點子'}</button><p className="field-help">金額為兩人粗估花費，可依實際情況調整。</p></form>
      {idea && <article className="record idea" aria-live="polite"><span>{idea.place} · 兩人約 {money(idea.cost)} 元</span><h2>{idea.name}</h2><p>{idea.detail}</p><button className="secondary-button" disabled={book.entries.some(e => e.text === idea.name)} onClick={() => favorite(idea.name,idea.cost)}>{book.entries.some(e => e.text === idea.name) ? '已收藏' : '收藏這個點子'}</button></article>}
    </> : <>
      {(tool.id === 'budget') && <label className="date-picker">查看日期<input aria-label="查看紀錄日期" type="date" value={date} required onChange={e => { if(e.target.value) setDate(e.target.value) }}/></label>}
      {tool.id === 'budget' && <div className="budget-summary pixel-panel"><div><span>{date} 可用餘額</span><strong className={spent > book.limit ? 'over-budget' : ''}>{money(book.limit-spent)} <small>元</small></strong><p>當日已花 {money(spent)} 元 · 每日預算 {money(book.limit)} 元</p><p>{date.slice(0,7)} 月累計支出 {money(monthSpent)} 元</p></div><form onSubmit={e => { e.preventDefault(); const n=Number(limit); if(!limit.trim() || !Number.isFinite(n) || n < 0 || n > 1e9) {setError('預算請填 0 至十億元之間的數字。');return} save({...book,limit:Math.round(n*100)/100}) }}><label>每日預算（套用所有日期）<input type="number" value={limit} onChange={e => setLimit(e.target.value)} min="0" max="1000000000" step="0.01" required/></label><button className="secondary-button">儲存預算</button></form></div>}
      {tool.id === 'budget' && <><div className="list-tabs"><button className="secondary-button" aria-pressed={period === '當日'} onClick={()=>setPeriod('當日')}>當日明細</button><button className="secondary-button" aria-pressed={period === '當月'} onClick={()=>setPeriod('當月')}>當月明細</button><button className="secondary-button" disabled={!visible.length} onClick={exportExpenses}>匯出目前清單 CSV</button></div><section className="category-summary pixel-panel"><h2>{date.slice(0,7)} 支出分類</h2>{monthlyCategories.map(row=><div className="category-row" key={row.category}><span>{row.category}</span><meter min="0" max={Math.max(monthSpent,1)} value={row.amount} aria-label={row.category+'支出 '+money(row.amount)+' 元'}/><strong>{money(row.amount)} 元</strong></div>)}<label>明細分類<select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}>{['全部',...budgetCategories].map(c=><option key={c}>{c}</option>)}</select></label></section></>}
      <form className="tool-form pixel-panel" onSubmit={e => { e.preventDefault(); add(tool.id === 'shopping' || tool.id === 'budget') }}>
        
        <div className="form-row"><label>{tool.id === 'shopping' ? '想買的東西' : tool.id === 'budget' ? '這筆花在哪裡' : '要做的事'}<input value={text} onChange={e => setText(e.target.value)} maxLength={200} placeholder="寫一點就好" required/></label>
        {(tool.id === 'shopping' || tool.id === 'budget') && <label>金額（元）<input type="number" min="0.01" max="1000000000" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" required/></label>}</div>{tool.id === 'shopping' && <ShoppingQuestions value={reflection} onChange={setReflection}/ >}{tool.id === 'budget' && <label>支出分類<select value={expenseCategory} onChange={e=>setExpenseCategory(e.target.value as Entry['category'])}>{budgetCategories.map(c=><option key={c}>{c}</option>)}</select></label>}{tool.id === 'tasks' && <div className="form-row"><label>期限（選填）<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label><label>優先順序<select value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}><option value="high">優先處理</option><option value="normal">一般</option><option value="low">不急</option></select></label></div>}<button className="primary-button">{tool.id === 'shopping' ? '先放清單，想一天' : '新增紀錄'}</button>
        {tool.id === 'shopping' && <p className="field-help">加入後等 24 小時，再回來決定。清單不會自動扣款。</p>}
      </form>
      {tool.id === 'tasks' && <div className="list-tabs" aria-label="篩選待辦">{['全部','未完成','今天到期','已逾期','已完成'].map(f => <button key={f} aria-pressed={filter === f} className="secondary-button" onClick={() => setFilter(f)}>{f}</button>)}<span>{book.entries.filter(e => e.done).length} / {book.entries.length} 件完成</span></div>}
      <div className="search-row"><label>搜尋紀錄<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="輸入關鍵字" maxLength={200}/></label>{tool.id === 'shopping' && <button className="secondary-button" aria-pressed={onlyReady} onClick={() => setOnlyReady(!onlyReady)}>{onlyReady ? '顯示全部' : '只看已滿 24 小時'}</button>}</div>
      {tool.id === 'shopping' && <p className="field-help">避免的預計支出（全部不買項目）：{money(book.entries.filter(e => e.done).reduce((n,e) => n + Math.round(e.amount*100),0)/100)} 元，這不是實際存款。已買商品可按「記入今天支出」，不會重複加入。記帳後若修改金額，請至預算工具同步修改。</p>}
      <div className="records">{visible.length === 0 ? <p className="empty-state">{search.trim() || onlyReady || categoryFilter !== '全部' || (tool.id === 'tasks' && filter !== '全部' && filter !== '未完成' && filter !== '已完成') ? '沒有符合條件的紀錄，試試其他關鍵字或顯示全部。' : tool.id === 'tasks' && filter === '已完成' ? '完成第一件事後，會出現在這裡。' : '這裡還沒有紀錄，從上面新增第一筆吧。'}</p> : visible.map(e => { const ready = now-new Date(e.date).getTime() >= 86400000; return <article key={e.id} className={`record ${e.done ? 'is-done' : ''}`}><div className="record-body"><h2>{e.text}</h2>{tool.id === 'shopping' && <ShoppingAnswers entry={e}/ >}{tool.id === 'tasks' && <p className={!e.done && e.dueDate && e.dueDate < dayKey() ? 'over-budget' : 'field-help'}>{e.priority === 'high' ? '優先處理' : e.priority === 'low' ? '不急' : '一般'} · {e.dueDate ? '期限 '+e.dueDate : '未設定期限'}{!e.done && e.dueDate && e.dueDate < dayKey() ? ' · 已逾期' : ''}{e.completedOn ? ' · 完成於 '+e.completedOn : ''}</p>}{tool.id === 'budget' && <span className="entry-tag">{e.category ?? '其他'}</span>}{(tool.id === 'shopping' || tool.id === 'budget') && <p>{money(e.amount)} 元</p>}{tool.id === 'shopping' && <p className="field-help">{e.status === 'bought' ? '已買，可記入今天支出' : e.done ? '已決定不買' : ready ? '已想過一天，現在還需要嗎？' : `冷靜中 · ${new Date(new Date(e.date).getTime()+86400000).toLocaleString('zh-TW')} 後再決定`}</p>}</div><div className="record-actions">{tool.id === 'tasks' && <button className="secondary-button" aria-pressed={e.done} onClick={() => toggle(e.id)}>{e.done ? '改為未完成' : '完成'}</button>}{tool.id === 'shopping' && <>{e.status === 'bought' && <button className="secondary-button" disabled={ledger.entries.some(item=>item.sourceShoppingId === e.id)} onClick={()=>transfer(e)}>{ledger.entries.some(item=>item.sourceShoppingId === e.id) ? '已記帳' : '記入今天支出'}</button>}{e.done || e.status === 'bought' ? <button className="secondary-button" onClick={() => decide(e,'thinking')}>放回考慮</button> : <><button className="secondary-button" onClick={() => decide(e,'skipped')}>決定不買</button><button className="secondary-button" disabled={!ready} onClick={() => decide(e,'bought')}>決定購買</button></>}</>}<button className="secondary-button" aria-label={`編輯 ${e.text}`} onClick={() => startEdit(e)}>編輯</button><button className="delete-button" aria-label={`刪除 ${e.text}`} onClick={() => remove(e.id)}>刪除</button></div></article> })}</div>
    </>}
    {tool.id === 'cooking' && <section className="supply-section pixel-panel"><h2>食材採買清單</h2><form className="form-row" onSubmit={e=>{e.preventDefault();if(supplyText.trim())supplies([supplyText.trim()])}}><label>補充食材<input value={supplyText} onChange={e=>setSupplyText(e.target.value)} maxLength={100} placeholder="也可以自己加一項" required/></label><button className="secondary-button">加入採買</button></form>{book.supplies?.length ? <><ul className="supply-list">{book.supplies.map(item=><li key={item.name}><label><input type="checkbox" checked={item.done} onChange={()=>save({...book,supplies:book.supplies!.map(s=>s.name === item.name ? {...s,done:!s.done} : s)})}/><span className={item.done ? 'crossed' : ''}>{item.name}</span></label></li>)}</ul><button className="secondary-button" disabled={!book.supplies.some(s=>s.done)} onClick={()=>{const cleared=book.supplies!.filter(s=>s.done);if(save({...book,supplies:book.supplies!.filter(s=>!s.done)})) setClearedSupplies(cleared)}}>清除已買食材</button></> : <p className="empty-state">從料理結果加入缺少的食材，或自己新增。</p>}</section>}
    {tool.id === 'cooking' && clearedSupplies && <div className="undo-row"><span>已清除 {clearedSupplies.length} 項已買食材</span><button className="secondary-button" onClick={()=>{const names=new Set(book.supplies?.map(s=>s.name));if(save({...book,supplies:[...book.supplies ?? [],...clearedSupplies.filter(s=>!names.has(s.name))]}))setClearedSupplies(null)}}>復原清除食材</button></div>}
    {(tool.id === 'cooking' || tool.id === 'date') && <section className="favorites"><h2>我的收藏</h2>{tool.id === 'date' && <div className="list-tabs">{['全部','想去','去過'].map(f=><button key={f} className="secondary-button" aria-pressed={favoriteFilter === f} onClick={()=>setFavoriteFilter(f)}>{f}</button>)}</div>}{favoriteEntries.length === 0 ? <p className="empty-state">目前沒有符合條件的收藏。喜歡的{tool.id === 'cooking' ? '食譜' : '約會點子'}可以先收在這裡。</p> : favoriteEntries.map(e => <article className={e.done ? 'record is-done' : 'record'} key={e.id}><div className="record-body"><h3>{e.text}</h3>{tool.id === 'date' ? <p>{ideas.find(i => i.name === e.text)?.detail} · 約 {money(e.amount)} 元</p> : <ol>{recipes.find(r => r.name === e.text)?.steps.map(step => <li key={step}>{step}</li>)}</ol>}</div><div className="record-actions">{tool.id === 'date' && <><span className="field-help">{e.plannedFor ? '預計 '+e.plannedFor : '還沒選日期'}{e.done ? ' · 已去過'+(e.completedOn ? ' '+e.completedOn : '') : ''}</span>{e.note && <p className="memory-note">{e.note}</p>}<button className="secondary-button" onClick={()=>startEdit(e)}>安排與心得</button><button className="secondary-button" aria-pressed={e.done} onClick={()=>toggle(e.id)}>{e.done ? '改回想去' : '記下去過了'}</button></>}<button className="delete-button" aria-label={`取消收藏 ${e.text}`} onClick={() => remove(e.id)}>取消收藏</button></div></article>)}</section>}
    {editing && <EditDialog onClose={() => {setEditing(null);setError('')}}><form onSubmit={e => {e.preventDefault();finishEdit()}}><h2 id="edit-title">編輯紀錄</h2><label>內容<input autoFocus readOnly={tool.id === 'date'} value={editText} onChange={e => setEditText(e.target.value)} maxLength={200} required/></label>{(tool.id === 'budget' || tool.id === 'shopping') && <label>金額（元）<input type="number" min="0.01" max="1000000000" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} required/></label>}{(tool.id === 'budget') && <label>日期<input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} required/></label>}{tool.id === 'budget' && <label>分類<select value={editCategory} onChange={e=>setEditCategory(e.target.value as Entry['category'])}>{budgetCategories.map(c=><option key={c}>{c}</option>)}</select></label>}{tool.id === 'tasks' && <><label>期限（選填）<input type="date" value={editDueDate} onChange={e=>setEditDueDate(e.target.value)}/></label><label>優先順序<select value={editPriority} onChange={e=>setEditPriority(e.target.value as typeof editPriority)}><option value="high">優先處理</option><option value="normal">一般</option><option value="low">不急</option></select></label></>}{tool.id === 'date' && <><label>安排日期（選填）<input type="date" value={editPlan} onChange={e=>setEditPlan(e.target.value)}/></label><label>約會心得（選填）<textarea value={editNote} onChange={e=>setEditNote(e.target.value)} maxLength={500} rows={3}/></label></>}{tool.id === 'shopping' && <ShoppingQuestions value={editReflection} onChange={setEditReflection}/ >}{tool.id === 'shopping' && <p className="field-help">編輯不會重設冷靜期；已記帳金額請至預算工具另行修改。</p>}<p role="alert" className="form-error">{error}</p><div className="record-actions"><button className="primary-button">儲存修改</button><button type="button" className="secondary-button" onClick={() => {setEditing(null);setError('')}}>取消</button></div></form></EditDialog>}
    {deleted && <div className="undo-row"><span>已刪除「{deleted.text}」</span><button className="secondary-button" onClick={() => { if(save({...book, entries:[deleted,...book.entries]})) setDeleted(null) }}>復原上一筆刪除</button></div>}<p role="alert" className="form-error">{error}</p><p role="status" className="save-feedback">{feedback}</p>
  </section>
}


function EditDialog({children,onClose}:{children:ReactNode;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null)
  useEffect(()=> { const dialog=ref.current; const previous=document.activeElement; dialog?.showModal(); return () => { dialog?.close(); if(previous instanceof HTMLElement) previous.focus() } },[])
  return <dialog ref={ref} className="edit-dialog" aria-labelledby="edit-title" onCancel={e=>{e.preventDefault();onClose()}}>{children}</dialog>
}
