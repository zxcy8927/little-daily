import { beforeEach, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import Cooking from '../../src/components/tools/CookingWorkspace'
import Shopping from '../../src/components/ShoppingJourney'
import { bookKey, collectBackup } from '../../src/data/storage'
import { tools } from '../../src/data/tools'
import { dayKey } from '../../src/hooks/useToolBook'
import { onboardingKey } from '../../src/data/onboarding'
import { exportText } from '../../src/native'
vi.mock('../../src/native', () => ({
  isNative: false,
  exportText: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  window.history.replaceState(null, '', '/#/')
  localStorage.setItem(onboardingKey, 'seen')
})

it('食譜步驟預設收合，一張卡只留一顆主要按鈕；估值可改為實際花費才入帳', async () => {
  const original = JSON.stringify({ limit: 500, entries: [] })
  localStorage.setItem(bookKey('budget'), original)
  const user = userEvent.setup()
  render(
    <Cooking tool={tools.find((t) => t.id === 'cooking')!} onBack={() => {}} />,
  )
  await user.click(screen.getByRole('button', { name: '找找能煮什麼' }))
  const card = screen
    .getByRole('heading', { name: '番茄炒蛋' })
    .closest('article')!
  expect((card.querySelector('.recipe-steps') as HTMLDetailsElement).open).toBe(
    false,
  )
  expect(card.querySelectorAll(':scope > .primary-button')).toHaveLength(1)
  expect(
    within(card).getByRole('button', { name: '加到採買清單' }),
  ).toBeTruthy()
  expect(card.textContent).toContain('還剩 NT$455')
  await user.click(within(card).getByRole('button', { name: '記這餐的花費' }))
  let dialog = screen.getByRole('dialog')
  expect(
    (within(dialog).getByLabelText('金額（NT$）') as HTMLInputElement).value,
  ).toBe('45')
  expect(localStorage.getItem(bookKey('budget'))).toBe(original)
  await user.click(within(dialog).getByRole('button', { name: '關閉記帳面板' }))
  expect(localStorage.getItem(bookKey('budget'))).toBe(original)
  await user.click(within(card).getByRole('button', { name: '記這餐的花費' }))
  dialog = screen.getByRole('dialog')
  await user.clear(within(dialog).getByLabelText('金額（NT$）'))
  await user.type(within(dialog).getByLabelText('金額（NT$）'), '80')
  await user.click(within(dialog).getByRole('button', { name: '記下這筆' }))
  const saved = JSON.parse(localStorage.getItem(bookKey('budget'))!)
  expect(saved.entries).toHaveLength(1)
  expect(saved.entries[0]).toMatchObject({
    amount: 80,
    text: '番茄炒蛋',
    category: '餐飲',
    date: dayKey(),
  })
  expect(card.textContent).toContain('今天預算還剩 NT$420')
})

it('冷靜表單只試算今天買下的影響，不寫入預算，反思標題只顯示一次', async () => {
  const original = JSON.stringify({ limit: 500, entries: [] })
  localStorage.setItem(bookKey('budget'), original)
  const user = userEvent.setup()
  render(<Shopping onBack={() => {}} />)
  await user.type(screen.getByLabelText('預計金額（NT$）'), '1500')
  expect(screen.getByPlaceholderText('例如 1500')).toBeTruthy()
  expect(
    document.getElementById('shopping-budget-impact')?.textContent,
  ).toContain('會超出 NT$1,000')
  expect(
    document.getElementById('shopping-budget-impact')?.textContent,
  ).toContain('不會扣預算')
  await user.click(
    screen.getByText('留一句給之後的自己（選填）', { selector: 'summary' }),
  )
  expect(screen.getAllByText(/留一句給之後的自己/)).toHaveLength(1)
  expect(localStorage.getItem(bookKey('budget'))).toBe(original)
})

it('預算損壞時只顯示讀取提示，不捏造零元餘額', () => {
  localStorage.setItem(bookKey('budget'), 'broken')
  render(<Shopping onBack={() => {}} />)
  expect(
    document.getElementById('shopping-budget-impact')?.textContent,
  ).toContain('預算暫時讀不到')
  expect(localStorage.getItem(bookKey('budget'))).toBe('broken')
})

it('更多頁可直接匯出完整備份並預覽合併匯入，既有紀錄不被覆寫', async () => {
  const original = {
    id: 'old',
    text: '原本午餐',
    amount: 100,
    category: '餐飲',
    date: dayKey(),
    done: false,
  }
  localStorage.setItem(
    bookKey('budget'),
    JSON.stringify({ limit: 500, entries: [original] }),
  )
  const incoming = collectBackup(localStorage)
  const incomingBook = incoming.data[bookKey('budget')] as {
    entries: (typeof original)[]
    limit: number
  }
  incomingBook.entries = [
    { ...original, text: '舊版名字' },
    { ...original, id: 'new', text: '車票', category: '交通', amount: 25 },
  ]
  incomingBook.limit = 200
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('link', { name: '更多', exact: true }))
  await screen.findByRole('heading', { name: '更多生活小事' })
  const summary = screen.getByText('匯出備份 / 匯入', { selector: 'summary' })
  expect(summary.parentElement?.parentElement?.tagName).toBe('MAIN')
  await user.click(summary)
  await user.click(screen.getByRole('button', { name: '匯出備份' }))
  expect(exportText).toHaveBeenCalled()
  const exported = JSON.parse(vi.mocked(exportText).mock.calls.at(-1)![0])
  expect(exported.data[bookKey('budget')].entries[0]).toEqual(original)
  const file = new File(['json'], 'backup.json', { type: 'application/json' })
  Object.defineProperty(file, 'text', {
    value: async () => JSON.stringify(incoming),
  })
  fireEvent.change(screen.getByLabelText('選擇備份檔'), {
    target: { files: [file] },
  })
  await screen.findByRole('heading', { name: '先看看這份備份' })
  await user.click(screen.getByRole('button', { name: '確認合併匯入' }))
  await waitFor(() =>
    expect(
      JSON.parse(localStorage.getItem(bookKey('budget'))!).entries,
    ).toHaveLength(2),
  )
  const merged = JSON.parse(localStorage.getItem(bookKey('budget'))!)
  expect(merged.limit).toBe(500)
  expect(
    merged.entries.find((entry: { id: string }) => entry.id === 'old'),
  ).toEqual(original)
})
