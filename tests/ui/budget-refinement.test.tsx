import { expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Budget from '../../src/components/tools/BudgetWorkspace'
import HomeOverview from '../../src/components/HomeOverview'
import { bookKey } from '../../src/data/storage'
import { tools } from '../../src/data/tools'
import { dayKey } from '../../src/hooks/useToolBook'

it.each([
  [0, 'comfortable'],
  [80, 'low'],
  [120, 'over'],
])('預算支出 %s 顯示文字、進度與對應狀態，不修改資料', (spent, status) => {
  const value = JSON.stringify({
    limit: 100,
    entries: spent
      ? [
          {
            id: 'e',
            text: '午餐',
            amount: spent,
            date: dayKey(),
            done: false,
            category: '餐飲',
          },
        ]
      : [],
  })
  localStorage.setItem(bookKey('budget'), value)
  const page = render(
    <HomeOverview now={Date.now()} onOpen={() => {}} mode="budget" />,
  )
  expect(
    document
      .querySelector('.home-budget')
      ?.classList.contains('budget-state-' + status),
  ).toBe(true)
  expect(
    screen
      .getByRole('progressbar', { name: '每日預算已使用' })
      .getAttribute('aria-valuenow'),
  ).toBe(String(Math.min(100, spent)))
  expect(localStorage.getItem(bookKey('budget'))).toBe(value)
  page.unmount()
})

it('空月份隱藏分類統計與篩選；預算設定必須展開且保留 0 元設定', async () => {
  const user = userEvent.setup()
  render(
    <Budget tool={tools.find((t) => t.id === 'budget')!} onBack={() => {}} />,
  )
  expect(screen.queryByRole('heading', { name: '這個月花去哪了' })).toBeNull()
  expect(screen.queryByLabelText('搜尋紀錄')).toBeNull()
  expect(
    (document.querySelector('.budget-settings') as HTMLDetailsElement).open,
  ).toBe(false)
  await user.click(screen.getByLabelText('設定每日預算'))
  await user.clear(screen.getByLabelText('每日預算（套用所有日期）'))
  await user.type(screen.getByLabelText('每日預算（套用所有日期）'), '0')
  await user.click(screen.getByRole('button', { name: '儲存預算' }))
  expect(JSON.parse(localStorage.getItem(bookKey('budget'))!).limit).toBe(0)
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
    '0',
  )
})

it('10 筆才顯示篩選，刪到 9 筆後不會留下隱形的篩選條件', async () => {
  const entries = Array.from({ length: 10 }, (_, i) => ({
    id: String(i),
    text: '支出' + i,
    amount: 1,
    category: i ? '其他' : '餐飲',
    date: dayKey(),
    done: false,
  }))
  localStorage.setItem(
    bookKey('budget'),
    JSON.stringify({ limit: 100, entries }),
  )
  const user = userEvent.setup()
  render(
    <Budget tool={tools.find((t) => t.id === 'budget')!} onBack={() => {}} />,
  )
  await user.selectOptions(screen.getByLabelText('明細分類'), '餐飲')
  expect(
    screen.queryByRole('heading', { name: '支出1', exact: true }),
  ).toBeNull()
  await user.click(
    screen.getByRole('button', { name: '刪除 支出0', exact: true }),
  )
  expect(screen.queryByLabelText('明細分類')).toBeNull()
  expect(
    screen.getByRole('heading', { name: '支出1', exact: true }),
  ).toBeTruthy()
  expect(
    within(screen.getByRole('region', { name: '每日預算' }))
      .getByRole('progressbar')
      .getAttribute('aria-valuenow'),
  ).toBe('9')
})
