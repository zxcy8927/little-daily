export const petSpecies = ['狗', '貓', '兔子', '鳥', '倉鼠', '其他'] as const
export type Pet = { id: string; name: string; species: (typeof petSpecies)[number]; birthday: string; archived?: boolean }
export const budgetCategories = ['餐飲', '交通', '購物', '居家', '娛樂', '其他'] as const
export type Entry = { id: string; text: string; amount: number; date: string; done: boolean; status?: 'thinking' | 'skipped' | 'bought' | 'cancelled'; petId?: string; category?: (typeof budgetCategories)[number]; dueDate?: string; priority?: 'low' | 'normal' | 'high'; completedOn?: string; plannedFor?: string; note?: string; sourceShoppingId?: string; buyReason?: string; ownsSimilar?: 'yes' | 'no' | 'unsure'; useFrequency?: 'daily' | 'weekly' | 'monthly' | 'rarely'; decidedOn?: string; coolingDays?: number; rewardCoins?: number; savedAmount?: number }
export type Supply = { name: string; done: boolean }
export type Food = { id: string; name: string; quantity: string; expiresOn: string; state: 'available' | 'used' | 'discarded'; closedOn?: string }
export const furnitureCatalog = [
 {id:'sage-cushion',name:'鼠尾草抱枕',kind:'cushion',color:'#9caf8c',payment:'coins',price:40,category:'布織',description:'把沙發換成柔柔的綠。'},
 {id:'peach-cushion',name:'蜜桃格紋抱枕',kind:'cushion',color:'#d5a28e',payment:'coins',price:55,category:'布織',description:'一點暖色，剛剛好的溫柔。'},
 {id:'woven-rug',name:'奶油編織地毯',kind:'rug',color:'#d9c59a',payment:'coins',price:80,category:'布織',description:'替小兔留一塊舒服的地板。'},
 {id:'book-stack',name:'週末閱讀小堆',kind:'books',color:'#95a9a1',payment:'coins',price:35,category:'擺飾',description:'慢慢讀，不用趕著翻完。'},
 {id:'leaf-plant',name:'龜背葉盆栽',kind:'plant',color:'#76916a',payment:'coins',price:75,category:'植栽',description:'讓房間多一點森林的味道。'},
 {id:'wood-cabinet',name:'橡木小邊櫃',kind:'cabinet',color:'#af8b64',payment:'coins',price:95,category:'家具',description:'收起日常，也收好喜歡。'},
 {id:'hill-print',name:'遠山掛畫',kind:'picture',color:'#9dad9a',payment:'coins',price:60,category:'擺飾',description:'牆上的一小段旅行。'},
 {id:'watering-can',name:'薄荷澆水壺',kind:'watering',color:'#8eb7a7',payment:'coins',price:30,category:'植栽',description:'替每一天澆一點期待。'},
 {id:'pet-bed',name:'雲朵小兔窩',kind:'bed',color:'#d6bac7',payment:'coins',price:110,category:'家具',description:'今天就待在最舒服的角落。'},
 {id:'round-clock',name:'午後圓時鐘',kind:'clock',color:'#b39b72',payment:'coins',price:85,category:'擺飾',description:'時間可以走得慢一點。'},
 {id:'moon-chair',name:'月牙閱讀椅',kind:'chair',color:'#a9a1c4',payment:'paid',price:0,category:'家具',description:'月光系列的專屬閱讀角落。'},
 {id:'crystal-lamp',name:'星砂玻璃燈',kind:'lamp',color:'#dacda3',payment:'paid',price:0,category:'燈飾',description:'為自己的夜晚留一盞星光。'},
 {id:'little-telescope',name:'追星望遠鏡',kind:'telescope',color:'#b5b3d0',payment:'paid',price:0,category:'家具',description:'把遙遠的夢想，拉近一點。'},
 {id:'coffee-cart',name:'奶油咖啡推車',kind:'coffee',color:'#bc9870',payment:'paid',price:0,category:'家具',description:'一整個慢下來的午後。'},
 {id:'record-player',name:'復古唱片機',kind:'record',color:'#b28b72',payment:'paid',price:0,category:'擺飾',description:'用喜歡的旋律，收藏今天。'},
 {id:'flower-arch',name:'春日花拱門',kind:'arch',color:'#cba6b1',payment:'paid',price:0,category:'植栽',description:'像走進只屬於自己的小花園。'},
] as const
export type FurnitureId = (typeof furnitureCatalog)[number]['id']
export type FurniturePlacement = {id:FurnitureId;x:number;y:number}
export type FurnitureState = {owned:{id:FurnitureId;cost:number}[];layout:FurniturePlacement[]}
export function isFurniture(value:unknown):value is FurnitureState {
 if(!object(value)||!Array.isArray(value.owned)||!Array.isArray(value.layout)||value.owned.length>furnitureCatalog.length||value.layout.length>furnitureCatalog.length)return false
 const ids=new Set<string>(),placed=new Set<string>()
 for(const purchase of value.owned){if(!object(purchase))return false;const item=furnitureCatalog.find(i=>i.id===purchase.id);if(!item||item.payment!=='coins'||purchase.cost!==item.price||ids.has(item.id))return false;ids.add(item.id)}
 for(const entry of value.layout){if(!object(entry)||typeof entry.id!=='string'||!ids.has(entry.id)||placed.has(entry.id)||!number(entry.x,675)||entry.x<45||!number(entry.y,365)||entry.y<120)return false;placed.add(entry.id)}
 return true
}
export type Book = { entries: Entry[]; limit: number; petName?: string; pets?: Pet[]; pantry?: string; supplies?: Supply[]; foods?: Food[]; savingsGoal?: {name: string; target: number}; remindersEnabled?: boolean; furniture?:FurnitureState }
export type PetBook = Book & { pets: Pet[] }
export const toolIds = ['cooking', 'shopping', 'budget', 'dog', 'tasks', 'date'] as const
export const gameKey = 'little-daily-game-v1'
export const settingsKey = 'little-daily-home-v1'
export const bookKey = (id: string) => `little-daily-tool-${id}-v1`
export const keys = [gameKey, settingsKey, ...toolIds.map(bookKey)]
export type HomePreferences = { order: string[]; hidden: string[] }
export const defaultPreferences: HomePreferences = { order: [...toolIds], hidden: [] }
export type GameState = { coins: number; xp: number; lastCheckIn: string | null }
export const initialGame: GameState = { coins: 120, xp: 35, lastCheckIn: null }
export function notifySaved(){if(typeof window !== 'undefined') window.dispatchEvent(new Event('little-daily-saved'))}
type ObjectValue = Record<string, unknown>
const object = (v: unknown): v is ObjectValue => typeof v === 'object' && v !== null && !Array.isArray(v)
const number = (v: unknown, max = 1e12): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}
export function isBook(value: unknown, id: string): value is Book {
  if (!object(value) || !number(value.limit, 1e9) || !Array.isArray(value.entries) || value.entries.length > 10000) return false
  if(value.furniture !== undefined && (id !== 'shopping' || !isFurniture(value.furniture)))return false
  if(value.savingsGoal !== undefined && (id !== 'shopping' || !object(value.savingsGoal) || typeof value.savingsGoal.name !== 'string' || !value.savingsGoal.name.trim() || value.savingsGoal.name.length > 60 || !number(value.savingsGoal.target,1e9) || value.savingsGoal.target === 0)) return false
  if(value.remindersEnabled !== undefined && (id !== 'shopping' || typeof value.remindersEnabled !== 'boolean')) return false
  if (value.petName !== undefined && (typeof value.petName !== 'string' || !value.petName.trim() || value.petName.length > 40)) return false
  if (value.pantry !== undefined && (typeof value.pantry !== 'string' || value.pantry.length > 200)) return false
  if (value.foods !== undefined) {
    if (id !== 'cooking' || !Array.isArray(value.foods) || value.foods.length > 500) return false
    const foodIds = new Set<string>()
    for (const food of value.foods) {
      if (!object(food) || typeof food.id !== 'string' || !food.id || food.id.length > 100 || foodIds.has(food.id)
        || typeof food.name !== 'string' || !food.name.trim() || food.name.length > 100
        || typeof food.quantity !== 'string' || food.quantity.length > 40
        || typeof food.expiresOn !== 'string' || (food.expiresOn !== '' && !validDate(food.expiresOn))
        || !['available','used','discarded'].includes(String(food.state))
        || (food.closedOn !== undefined && (typeof food.closedOn !== 'string' || !validDate(food.closedOn)))) return false
      foodIds.add(food.id)
    }
  }
  if (value.supplies !== undefined) {
    if (!Array.isArray(value.supplies) || value.supplies.length > 500) return false
    const names = new Set<string>()
    for (const s of value.supplies) {
      if (!object(s) || typeof s.name !== 'string' || !s.name.trim() || s.name.length > 100 || typeof s.done !== 'boolean' || names.has(s.name)) return false
      names.add(s.name)
    }
  }
  const petIds = new Set<string>()
  if (value.pets !== undefined) {
    if (id !== 'dog' || !Array.isArray(value.pets) || value.pets.length > 50) return false
    for (const pet of value.pets) {
      if (!object(pet) || typeof pet.id !== 'string' || !pet.id || pet.id.length > 100 || petIds.has(pet.id)
        || typeof pet.name !== 'string' || !pet.name.trim() || pet.name.length > 40
        || !petSpecies.includes(pet.species as Pet['species']) || typeof pet.birthday !== 'string'
        || (pet.birthday !== '' && !validDate(pet.birthday)) || (pet.archived !== undefined && typeof pet.archived !== 'boolean')) return false
      petIds.add(pet.id)
    }
  }
  const ids = new Set<string>()
  const sources = new Set<string>()
  return value.entries.every((e: unknown) => {
    if (!object(e) || typeof e.id !== 'string' || !e.id || e.id.length > 100 || ids.has(e.id)) return false
    ids.add(e.id)
    if (e.sourceShoppingId !== undefined) {
      if (id !== 'budget' || typeof e.sourceShoppingId !== 'string' || !e.sourceShoppingId || e.sourceShoppingId.length > 100 || sources.has(e.sourceShoppingId)) return false
      sources.add(e.sourceShoppingId)
    }
    return typeof e.text === 'string' && e.text.trim().length > 0 && e.text.length <= 500 && number(e.amount, 1e9) && typeof e.done === 'boolean' && typeof e.date === 'string'
      && (id === 'shopping' ? /^\d{4}-\d{2}-\d{2}T/.test(e.date) && Number.isFinite(Date.parse(e.date)) : validDate(e.date))
      && (e.status === undefined || ['thinking', 'skipped', 'bought', 'cancelled'].includes(String(e.status)))
      && (e.petId === undefined ? value.pets === undefined : id === 'dog' && typeof e.petId === 'string' && petIds.has(e.petId))
      && (e.category === undefined || budgetCategories.includes(e.category as Entry['category'] & string))
      && (e.priority === undefined || ['low', 'normal', 'high'].includes(String(e.priority)))
      && (e.dueDate === undefined || typeof e.dueDate === 'string' && (e.dueDate === '' || validDate(e.dueDate)))
      && (e.plannedFor === undefined || typeof e.plannedFor === 'string' && (e.plannedFor === '' || validDate(e.plannedFor)))
      && (e.completedOn === undefined || typeof e.completedOn === 'string' && validDate(e.completedOn))
      && (e.note === undefined || typeof e.note === 'string' && e.note.length <= 500)
      && (e.buyReason === undefined || typeof e.buyReason === 'string' && e.buyReason.length <= 300)
      && (e.ownsSimilar === undefined || ['yes','no','unsure'].includes(String(e.ownsSimilar)))
      && (e.useFrequency === undefined || ['daily','weekly','monthly','rarely'].includes(String(e.useFrequency)))
      && (e.coolingDays === undefined || id === 'shopping' && typeof e.coolingDays === 'number' && [1,3,7].includes(e.coolingDays))
      && (e.rewardCoins === undefined || id === 'shopping' && e.status === 'skipped' && e.done === true && Number.isInteger(e.rewardCoins) && number(e.rewardCoins,50))
      && (e.savedAmount === undefined || id === 'shopping' && number(e.savedAmount,Number(e.amount)) && e.status !== 'bought' && e.status !== 'cancelled' && (e.status === 'skipped' || e.done === true))
      && (e.status !== 'cancelled' || id === 'shopping' && e.done === false)
      && (e.decidedOn === undefined || typeof e.decidedOn === 'string' && validDate(e.decidedOn))
  })
}
// Keep legacy records attached to one stable profile; migration does not write to storage.
export function normalizePetBook(book: Book): PetBook {
  if (book.pets !== undefined) return { ...book, pets: book.pets }
  const pets: Pet[] = book.petName || book.entries.length ? [{ id: 'legacy-pet', name: book.petName || '我的寵物', species: '其他', birthday: '' }] : []
  return { ...book, pets, entries: book.entries.map(e => ({ ...e, petId: 'legacy-pet' })) }
}
export function isGame(value: unknown): value is GameState {
  return object(value) && number(value.coins) && number(value.xp) && (value.lastCheckIn === null || typeof value.lastCheckIn === 'string' && validDate(value.lastCheckIn))
}
export function readGame(storage: Pick<Storage, 'getItem'>): GameState {
  const raw = storage.getItem(gameKey)
  if (raw === null) return initialGame
  const value: unknown = JSON.parse(raw)
  if (!isGame(value)) throw new Error('簽到資料暫時無法讀取，原資料仍保留。')
  return value
}
export function nextCheckIn(game: GameState, date: string): GameState {
  if (!validDate(date)) throw new Error('簽到日期不正確。')
  if (game.lastCheckIn === date) return game
  const next = { coins: game.coins + 10, xp: game.xp + 10, lastCheckIn: date }
  if (!isGame(next)) throw new Error('簽到進度已達上限。')
  return next
}
export function readBookSnapshot(storage: Pick<Storage, 'getItem'>, id: string) {
  const raw = storage.getItem(bookKey(id))
  if (raw === null) return { book: { entries: [], limit: 500 } as Book, raw }
  const value: unknown = JSON.parse(raw)
  if (!isBook(value, id)) throw new Error('紀錄暫時無法讀取，原資料仍保留。')
  return { book: value, raw }
}
export function saveBookSnapshot(storage: Pick<Storage, 'getItem' | 'setItem'>, id: string, raw: string | null, next: Book) {
  if (storage.getItem(bookKey(id)) !== raw) throw new Error('這份紀錄已在另一個頁面更新。請先載入最新紀錄，再繼續修改。')
  if (!isBook(next, id)) throw new Error('資料不完整，或已達儲存上限，請先整理紀錄。')
  const serialized = JSON.stringify(next)
  storage.setItem(bookKey(id), serialized)
  notifySaved()
  return serialized
}
export function isPreferences(value: unknown): value is HomePreferences {
  if (!object(value) || !Array.isArray(value.order) || !Array.isArray(value.hidden)) return false
  return value.order.length === toolIds.length && new Set(value.order).size === toolIds.length
    && value.order.every(id => toolIds.includes(id as (typeof toolIds)[number]))
    && value.hidden.length < toolIds.length && new Set(value.hidden).size === value.hidden.length
    && value.hidden.every(id => toolIds.includes(id as (typeof toolIds)[number]))
}
export function readPreferences(storage: Pick<Storage,'getItem'>) {
  const raw=storage.getItem(settingsKey)
  if(raw === null) return {preferences:defaultPreferences,raw}
  const value: unknown=JSON.parse(raw)
  if(!isPreferences(value)) throw new Error('首頁設定暫時無法讀取，原設定仍保留。')
  return {preferences:value,raw}
}
export function savePreferences(storage: Pick<Storage,'getItem'|'setItem'>, raw: string | null, value: HomePreferences) {
  if(storage.getItem(settingsKey) !== raw) throw new Error('首頁設定已在另一個頁面更新，請重新整理後再修改。')
  if(!isPreferences(value)) throw new Error('請至少保留一個首頁工具，且不要重複排序。')
  const next=JSON.stringify(value)
  storage.setItem(settingsKey,next)
  notifySaved()
  return next
}
function validValue(key: string, value: unknown) {
  if (key === gameKey) return isGame(value)
  if (key === settingsKey) return isPreferences(value)
  const id = toolIds.find(id => bookKey(id) === key)
  return !!id && isBook(value, id)
}
export type Backup = { format: 'little-daily'; version: 1; exportedAt: string; data: Record<string, unknown> }
export function parseBackup(text: string): Backup {
  const v: unknown = JSON.parse(text)
  if (!object(v) || v.format !== 'little-daily' || v.version !== 1 || typeof v.exportedAt !== 'string' || !object(v.data)) throw new Error('這不是支援的 Little Daily 備份檔。')
  for (const [key, value] of Object.entries(v.data)) if (!keys.includes(key) || !validValue(key, value)) throw new Error('備份格式或紀錄內容不完整，尚未匯入任何資料。')
  return v as Backup
}
export function collectBackup(storage: Pick<Storage, 'getItem'>): Backup {
  const data: Record<string, unknown> = {}
  for (const key of keys) {
    const raw = storage.getItem(key)
    if (raw === null) continue
    const value: unknown = JSON.parse(raw)
    if (!validValue(key, value)) throw new Error('目前有資料無法讀取，請先保留原始資料，暫時不要匯入。')
    data[key] = value
  }
  return { format: 'little-daily', version: 1, exportedAt: new Date().toISOString(), data }
}
// Existing records and settings win when an imported backup contains the same ID.
export function mergeBackup(current: Backup, incoming: Backup): Backup {
  const data = { ...current.data }
  for (const [key, value] of Object.entries(incoming.data)) {
    if (!(key in data)) { data[key] = value; continue }
    if (key === gameKey || key === settingsKey) continue
    const existing = key === bookKey('dog') ? normalizePetBook(data[key] as Book) : data[key] as Book
    const imported = key === bookKey('dog') ? normalizePetBook(value as Book) : value as Book
    const ids = new Set(existing.entries.map(e => e.id))
    const sources = new Set(existing.entries.flatMap(e => e.sourceShoppingId ? [e.sourceShoppingId] : []))
    data[key] = { ...existing, ...(key === bookKey('dog') && !existing.petName && imported.petName ? { petName: imported.petName } : {}), entries: [...existing.entries, ...imported.entries.filter(e => !ids.has(e.id) && (!e.sourceShoppingId || !sources.has(e.sourceShoppingId)))] }
    if(key === bookKey('shopping') && existing.furniture === undefined && imported.furniture !== undefined) data[key]={...data[key] as Book,furniture:imported.furniture}
    if (key === bookKey('cooking')) {
      const names = new Set(existing.supplies?.map(s => s.name))
      const supplies = [...existing.supplies ?? [], ...imported.supplies?.filter(s => !names.has(s.name)) ?? []]
      if (supplies.length > 500) throw new Error('合併後採買清單超過 500 項，請先整理紀錄。')
      const foodIds = new Set(existing.foods?.map(f => f.id))
      const foods = [...existing.foods ?? [], ...imported.foods?.filter(f => !foodIds.has(f.id)) ?? []]
      if (foods.length > 500) throw new Error('合併後冰箱食材超過 500 項，請先整理紀錄。')
      data[key] = { ...data[key] as Book, pantry: existing.pantry ?? imported.pantry ?? '', supplies, ...(existing.foods || imported.foods ? {foods} : {}) }
    }
    if (key === bookKey('dog')) {
      const petIds = new Set(existing.pets!.map(p => p.id))
      const pets = [...existing.pets!, ...imported.pets!.filter(p => !petIds.has(p.id))]
      if (pets.length > 50) throw new Error('合併後寵物超過 50 隻，請先整理備份。')
      data[key] = { ...data[key] as Book, pets }
    }
    if ((data[key] as Book).entries.length > 10000) throw new Error('合併後單一工具超過一萬筆，請先整理紀錄。')
  }
  return { ...current, data }
}
export function writeBackup(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, backup: Backup) {
  const previous = Object.keys(backup.data).map(key => [key, storage.getItem(key)] as const)
  try { for (const [key, value] of Object.entries(backup.data)) storage.setItem(key, JSON.stringify(value)) }
  catch (error) {
    for (const [key, value] of previous) {
      if (storage.getItem(key) === value) continue
      if (value === null) storage.removeItem(key)
      else storage.setItem(key, value)
    }
    throw error
  }
  notifySaved()
}
