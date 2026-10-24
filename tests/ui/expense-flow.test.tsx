import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import BudgetWorkspace from '../../src/components/tools/BudgetWorkspace'
import { bookKey, budgetCategories } from '../../src/data/storage'
import { onboardingKey } from '../../src/data/onboarding'
import { tools } from '../../src/data/tools'

beforeEach(() => {
  localStorage.setItem(onboardingKey, 'seen')
  window.history.replaceState(null, '', '/#/')
})
const budget = () => JSON.parse(localStorage.getItem(bookKey('budget'))!)

it('首頁順序為預算、記一筆、明細、小屋、想買；底部只有四個分頁', async () => {
  render(<App />)
  await screen.findByRole('heading', { name: '我的小屋' })
  const selectors = [
    '.home-budget',
    '.home-record-button',
    '.home-today-expenses',
    '.home-world',
    '.home-purchase',
  ]
  const elements = selectors.map((selector) =>
    document.querySelector(selector)!,
  )
  for (let i = 1; i < elements.length; i++)
    expect(
      elements[i - 1].compareDocumentPosition(elements[i]) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  expect(screen.getByRole('button', { name: '新增想買物品' }).className).toBe(
    'secondary-button',
  )
  const nav = screen.getByRole('navigation', { name: '主要分頁' })
  expect(
    within(nav)
      .getAllByRole('link')
      .map((a) => a.textContent?.replace(/^[⌂▤◇·]+/, '')),
  ).toEqual(['首頁', '記帳', '想買', '更多'])
  expect(document.querySelector('.tool-nav')).toBeNull()
})

it('首頁快速記帳可連續記錄，保留分類、清空選填備註並更新預算及明細', async () => {
  localStorage.setItem(
    bookKey('budget'),
    JSON.stringify({
      limit: 500,
      entries: [
        {
          id: 'old',
          text: '舊紀錄',
          amount: 20,
          date: '2020-01-01',
          category: '交通',
          done: false,
        },
      ],
    }),
  )
  const user = userEvent.setup()
  render(<App />)
  const opener = screen.getByRole('button', { name: '記一筆' })
  await user.click(opener)
  const dialog = screen.getByRole('dialog', { name: '記一筆' })
  const amount = within(dialog).getByLabelText(
    '金額（NT$）',
  ) as HTMLInputElement
  await waitFor(() => expect(document.activeElement).toBe(amount))
  expect(amount.inputMode).toBe('decimal')
  expect(
    within(dialog)
      .getByRole('button', { name: '交通' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  await user.type(amount, '100')
  await user.click(within(dialog).getByRole('button', { name: '餐飲' }))
  await user.type(within(dialog).getByLabelText('備註（選填）'), '午餐')
  await user.click(within(dialog).getByRole('button', { name: '記下這筆' }))
  expect(amount.value).toBe('')
  expect(document.activeElement).toBe(amount)
  expect(
    (within(dialog).getByLabelText('備註（選填）') as HTMLInputElement).value,
  ).toBe('')
  expect(budget().entries[0]).toMatchObject({
    amount: 100,
    category: '餐飲',
    text: '午餐',
  })
  const firstReply = within(dialog).getByRole('status').textContent
  await user.type(amount, '50')
  await user.click(within(dialog).getByRole('button', { name: '記下這筆' }))
  expect(budget().entries[0]).toMatchObject({
    amount: 50,
    category: '餐飲',
    text: '餐飲',
  })
  expect(within(dialog).getByRole('status').textContent).not.toBe(firstReply)
  await user.click(within(dialog).getByRole('button', { name: '關閉記帳面板' }))
  expect(document.activeElement).toBe(opener)
  expect(document.querySelector('.home-budget')?.textContent).toContain(
    'NT$350',
  )
  expect(document.querySelector('.home-today-expenses')?.textContent).toContain(
    '午餐',
  )
  await user.click(opener)
  expect(
    within(screen.getByRole('dialog'))
      .getByRole('button', { name: '餐飲' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
})

it('快速記帳失敗保留金額與備註，重試只記一筆', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: '記一筆' }))
  const dialog = screen.getByRole('dialog')
  await user.type(within(dialog).getByLabelText('金額（NT$）'), '35')
  await user.type(within(dialog).getByLabelText('備註（選填）'), '車票')
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError')
  })
  await user.click(within(dialog).getByRole('button', { name: '記下這筆' }))
  expect(
    (within(dialog).getByLabelText('金額（NT$）') as HTMLInputElement).value,
  ).toBe('35')
  expect(
    (within(dialog).getByLabelText('備註（選填）') as HTMLInputElement).value,
  ).toBe('車票')
  expect(localStorage.getItem(bookKey('budget'))).toBeNull()
  expect(within(dialog).queryByRole('status')).toBeNull()
  spy.mockRestore()
  await user.click(within(dialog).getByRole('button', { name: '記下這筆' }))
  expect(budget().entries).toHaveLength(1)
})

it('日常預算頁最上方使用同一份金額、分類、選填備註表單', async () => {
  const user = userEvent.setup()
  render(
    <BudgetWorkspace
      tool={tools.find((t) => t.id === 'budget')!}
      onBack={() => {}}
    />,
  )
  const form = screen.getByRole('form', { name: '記一筆支出' })
  expect(
    form.compareDocumentPosition(document.querySelector('.budget-summary')!) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(within(form).getAllByRole('button', { pressed: false })).toHaveLength(
    budgetCategories.length - 1,
  )
  await user.type(within(form).getByLabelText('金額（NT$）'), '80')
  await user.click(within(form).getByRole('button', { name: '記下這筆' }))
  expect(budget().entries[0]).toMatchObject({
    text: '其他',
    category: '其他',
    amount: 80,
  })
})

it('小屋使用獨立網址，冷靜清單只保留清單及回顧，其他工具在更多', async () => {
  const user = userEvent.setup()
  const app = render(<App />)
  await user.click(await screen.findByRole('button', { name: '佈置小屋' }))
  await screen.findByRole('region', { name: '小屋選物店' })
  expect(window.location.hash).toBe('#/house')
  app.unmount()
  render(<App />)
  await screen.findByRole('region', { name: '小屋選物店' })
  await user.click(screen.getByRole('link', { name: '想買', exact: true }))
  await screen.findByRole('heading', { name: '購物冷靜清單' })
  expect(
    within(screen.getByRole('navigation', { name: '購物功能' }))
      .getAllByRole('button')
      .map((b) => b.textContent),
  ).toEqual(['清單', '省錢回顧'])
  expect(screen.queryByRole('region', { name: '小屋選物店' })).toBeNull()
  await user.click(screen.getByRole('link', { name: '更多', exact: true }))
  await screen.findByRole('heading', { name: '更多生活小事' })
  expect(screen.getByRole('button', { name: /^今天煮什麼/ })).toBeTruthy()
  expect(
    screen.getByText('資料備份、還原與安裝', { selector: 'summary' }),
  ).toBeTruthy()
})
