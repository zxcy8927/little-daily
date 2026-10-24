import { budgetCategories, normalizePetBook, validDate, type Book, type Entry, type Supply, type Food } from './storage'

export function buildPurchase(shopping: Book, budget: Book, id: string, date: string, expenseId = crypto.randomUUID()) {
  const item = shopping.entries.find(e => e.id === id)
  if (!item || item.status !== 'bought') throw new Error('請先將商品標記為已買。')
  if (!validDate(date)) throw new Error('記帳日期不正確。')
  if (budget.entries.some(e => e.sourceShoppingId === id || e.id === `purchase-${id}`)) throw new Error('這筆購物已記帳，不會重複加入。')
  if (!Number.isFinite(item.amount) || item.amount <= 0) throw new Error('購物金額需大於 0。')
  const expense: Entry = { id: expenseId, sourceShoppingId: id, text: item.text, amount: item.amount, category: '購物', date, done: false }
  return { ...budget, entries: [expense, ...budget.entries] }
}
export function summarizeExpenses(entries: Entry[], month: string) {
  const monthly = entries.filter(e => e.date.startsWith(`${month}-`))
  return budgetCategories.map(category => ({ category, amount: monthly.filter(e => (e.category ?? '其他') === category).reduce((n,e) => n + Math.round(e.amount*100),0)/100 }))
}
export function selectTasks(entries: Entry[], filter: string, today: string) {
  const weights = { high: 0, normal: 1, low: 2 }
  return entries.filter(e => filter === '全部' || (filter === '已完成' ? e.done : filter === '今天到期' ? !e.done && e.dueDate === today : filter === '已逾期' ? !e.done && !!e.dueDate && e.dueDate < today : !e.done))
    .sort((a,b) => Number(a.done)-Number(b.done) || (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31') || weights[a.priority ?? 'normal']-weights[b.priority ?? 'normal'])
}
export function appendSupplies(existing: Supply[], names: string[]) {
  const all = new Set(existing.map(s => s.name))
  const result = [...existing]
  for (const name of names) if (name.trim() && !all.has(name)) { all.add(name); result.push({ name, done: false }) }
  return result
}
export function expenseCsv(entries: Entry[]) {
  const cell = (value: string) => '"' + (/^[\s]*[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""') + '"'
  const rows = [['日期', '項目', '分類', '金額'], ...entries.map(e => [e.date, e.text, e.category ?? '其他', String(e.amount)])]
  return '\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n')
}
export function normalizeIngredient(name: string) {
  const aliases: Record<string, string> = { 雞蛋: '蛋', 蕃茄: '番茄', 西紅柿: '番茄', 白飯: '飯', 冷飯: '飯', 香菇: '菇', 金針菇: '菇', 鴻喜菇: '菇', 蒜頭: '蒜', 麵條: '麵', 菠菜: '青菜', 小白菜: '青菜' }
  return aliases[name.trim()] ?? name.trim()
}
export function matchRecipes<T extends { ingredients: string[]; minutes: number }>(recipes: T[], pantry: string, maxMinutes: string, readyOnly: boolean) {
  const tokens = pantry.split(/[、,，\s]+/).map(normalizeIngredient).filter(Boolean)
  return recipes.map(r => ({ ...r, hits: r.ingredients.filter(i => tokens.includes(i)) }))
    .filter(r => !tokens.length || r.hits.length > 0)
    .filter(r => maxMinutes === '不限' || r.minutes <= Number(maxMinutes))
    .filter(r => !readyOnly || r.hits.length === r.ingredients.length)
    .sort((a,b) => b.hits.length - a.hits.length)
}
export function shiftDate(date: string, offset: number) {
  if(!validDate(date)) throw new Error('日期不正確。')
  const d=new Date(`${date}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate()+offset)
  return d.toISOString().slice(0,10)
}
export function weekBounds(date: string) {
  if(!validDate(date)) throw new Error('日期不正確。')
  const weekday=new Date(`${date}T00:00:00.000Z`).getUTCDay()
  const start=shiftDate(date,-((weekday+6)%7))
  return {start,end:shiftDate(start,6)}
}
export function weeklyReview(books: Partial<Record<string,Book>>, date: string) {
  const {start,end}=weekBounds(date)
  const inWeek=(d?:string)=>!!d && d >= start && d <= end
  const entries=(id:string)=>books[id]?.entries ?? []
  const avoidedItems=entries('shopping').filter(e=>(e.status === 'skipped' || e.done) && e.status !== 'bought' && inWeek(e.decidedOn))
  return {
    start,end,
    spent:entries('budget').filter(e=>inWeek(e.date)).reduce((n,e)=>n+Math.round(e.amount*100),0)/100,
    avoided:avoidedItems.reduce((n,e)=>n+Math.round(e.amount*100),0)/100,
    avoidedItems,
    completed:entries('tasks').filter(e=>e.done && inWeek(e.completedOn)).length,
    petNotes:entries('dog').filter(e=>inWeek(e.date)).length,
    dates:entries('date').filter(e=>e.done && inWeek(e.completedOn)).length,
    foodsUsed:books.cooking?.foods?.filter(f=>f.state === 'used' && inWeek(f.closedOn)).length ?? 0,
  }
}
export function foodExpiry(food: Food, date: string) {
  if(food.state !== 'available') return food.state
  if(!food.expiresOn) return 'unknown'
  if(food.expiresOn < date) return 'expired'
  return food.expiresOn <= shiftDate(date,3) ? 'soon' : 'fresh'
}
export function rankPantryRecipes<T extends {ingredients:string[];minutes:number}>(recipes:T[], pantry:string, foods:Food[], date:string,maxMinutes:string,readyOnly:boolean) {
  const available=foods.filter(f=>f.state === 'available' && (!f.expiresOn || f.expiresOn >= date))
  const urgent=new Set(available.filter(f=>foodExpiry(f,date)==='soon').map(f=>normalizeIngredient(f.name)))
  return matchRecipes(recipes,[pantry,...available.map(f=>f.name)].join('、'),maxMinutes,readyOnly)
    .map(r=>({...r,urgent:r.ingredients.filter(i=>urgent.has(i))}))
    .sort((a,b)=>b.urgent.length-a.urgent.length || b.hits.length-a.hits.length)
}
export function dashboard(books: Partial<Record<string, Book>>, date: string, now: number) {
  const entries = (id: string) => books[id]?.entries ?? []
  const tasks = entries('tasks').filter(e => !e.done)
  const spent = entries('budget').filter(e => e.date === date).reduce((sum,e) => sum + Math.round(e.amount * 100), 0)/100
  const pets = normalizePetBook(books.dog ?? { entries: [], limit: 500 })
  const activePets = new Set(pets.pets.filter(p => !p.archived).map(p => p.id))
  return {
    spent, remaining: (books.budget?.limit ?? 500) - spent,
    due: tasks.filter(e => e.dueDate === date).length,
    overdue: tasks.filter(e => e.dueDate && e.dueDate < date).length,
    pending: tasks.length,
    ready: entries('shopping').filter(e => !e.done && e.status !== 'bought' && e.status !== 'cancelled' && e.status !== 'skipped' && now-Date.parse(e.date) >= (e.coolingDays ?? 1)*86400000).length,
    petNotes: pets.entries.filter(e => e.date === date && activePets.has(e.petId!)).length,
    pets: activePets.size,
    supplies: books.cooking?.supplies?.filter(s => !s.done).length ?? 0,
    dates: entries('date').filter(e => !e.done && e.plannedFor === date).length,
    dueTasks: selectTasks(tasks.filter(e => e.dueDate && e.dueDate <= date), '全部', date).slice(0,3),
    upcomingDates: entries('date').filter(e => !e.done && e.plannedFor && e.plannedFor >= date).sort((a,b) => a.plannedFor!.localeCompare(b.plannedFor!)).slice(0,3),
  }
}
