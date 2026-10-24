import type { Book, Entry } from './storage'
export const coolingEnd = (entry: Entry) =>
  Date.parse(entry.date) + (entry.coolingDays ?? 1) * 86400000
export function settleShopping(
  book: Book,
  id: string,
  status: 'skipped' | 'bought',
  now: number,
  note: string,
) {
  const item = book.entries.find((e) => e.id === id)
  if (
    !item ||
    item.done ||
    item.status === 'skipped' ||
    item.status === 'bought' ||
    item.status === 'cancelled'
  )
    throw new Error('這筆已完成決定或已撤回，請勿重複領取。')
  if (!Number.isFinite(now)) throw new Error('時間不正確，請重新整理後再試。')
  if (now < coolingEnd(item))
    throw new Error('冷靜期還沒結束，先留一點時間給自己。')
  if (!note.trim()) throw new Error('請寫一句這次決定的原因。')
  const d = new Date(now),
    decidedOn = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    ...book,
    entries: book.entries.map((e) =>
      e.id === id
        ? {
            ...e,
            status,
            done: status === 'skipped',
            decidedOn,
            note: note.trim(),
            ...(status === 'skipped'
              ? { rewardCoins: e.rewardCoins ?? 50, savedAmount: 0 }
              : {}),
          }
        : e,
    ),
  }
}
export function editShopping(
  book: Book,
  id: string,
  text: string,
  amount: number,
  reflection: Pick<Entry, 'buyReason' | 'ownsSimilar' | 'useFrequency'>,
) {
  const entry = book.entries.find((e) => e.id === id)
  if (
    !entry ||
    entry.done ||
    entry.status === 'skipped' ||
    entry.status === 'bought' ||
    entry.status === 'cancelled'
  )
    throw new Error('只能編輯考慮中的物品。')
  if (
    !text.trim() ||
    text.trim().length > 200 ||
    !Number.isFinite(amount) ||
    amount < 0.01 ||
    amount > 1e9
  )
    throw new Error('請填名稱與有效的正數金額。')
  return {
    ...book,
    entries: book.entries.map((e) =>
      e.id === id
        ? {
            ...e,
            text: text.trim(),
            amount: Math.round(amount * 100) / 100,
            ...reflection,
          }
        : e,
    ),
  }
}
export function cancelShopping(book: Book, id: string, restore = false) {
  const entry = book.entries.find((e) => e.id === id)
  if (
    !entry ||
    entry.done ||
    entry.status === 'skipped' ||
    entry.status === 'bought' ||
    (restore && entry.status !== 'cancelled')
  )
    throw new Error('這筆紀錄無法撤回或復原。')
  return {
    ...book,
    entries: book.entries.map((e) =>
      e.id === id
        ? {
            ...e,
            status: restore ? ('thinking' as const) : ('cancelled' as const),
          }
        : e,
    ),
  }
}
export function savingsCsv(book: Book, month: string) {
  const cell = (s: string) =>
    '"' +
    (/^[\s]*[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') +
    '"'
  const rows = [
    [
      '決定日期',
      '物品',
      '避免支出 NT$',
      '已自行存下 NT$（目前回報）',
      '金幣',
      '決定原因',
    ],
    ...book.entries
      .filter(
        (e) =>
          (e.status === 'skipped' || (e.done && e.status !== 'bought')) &&
          e.decidedOn?.startsWith(month + '-'),
      )
      .map((e) => [
        e.decidedOn!,
        e.text,
        String(e.amount),
        String(e.savedAmount ?? 0),
        String(e.rewardCoins ?? 0),
        e.note ?? '',
      ]),
  ]
  return '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')
}
export function shoppingProgress(book: Book) {
  const skipped = book.entries.filter(
    (e) => e.status === 'skipped' || (e.done && e.status !== 'bought'),
  )
  return {
    avoided: skipped.reduce((n, e) => n + Math.round(e.amount * 100), 0) / 100,
    saved:
      skipped.reduce((n, e) => n + Math.round((e.savedAmount ?? 0) * 100), 0) /
      100,
    coins: book.entries.reduce((n, e) => n + (e.rewardCoins ?? 0), 0),
    count: skipped.length,
  }
}
export function recordSaved(book: Book, id: string, amount: number) {
  const item = book.entries.find((e) => e.id === id)
  if (
    !item ||
    !(item.status === 'skipped' || (item.done && item.status !== 'bought')) ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > item.amount
  )
    throw new Error('已存金額需介於 0 與這筆避免支出之間。')
  return {
    ...book,
    entries: book.entries.map((e) =>
      e.id === id ? { ...e, savedAmount: Math.round(amount * 100) / 100 } : e,
    ),
  }
}
