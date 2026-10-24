import { expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuickExpense from '../../src/components/QuickExpense'
import Budget from '../../src/components/tools/BudgetWorkspace'
import { bookKey } from '../../src/data/storage'
import { tools } from '../../src/data/tools'
import { dayKey } from '../../src/hooks/useToolBook'
const read = () => JSON.parse(localStorage.getItem(bookKey('budget'))!)

it('快速記帳可補記日期；撤回剛記的支出保留下一筆草稿，不留成功假象', async () => {
  const user = userEvent.setup()
  render(<QuickExpense onClose={() => {}} />)
  await user.click(screen.getByText('改日期', { selector: 'summary' }))
  await user.clear(screen.getByLabelText('記帳日期'))
  await user.type(screen.getByLabelText('記帳日期'), '2020-01-02')
  await user.type(screen.getByLabelText('金額（NT$）'), '100')
  await user.click(screen.getByRole('button', { name: '記下這筆' }))
  expect(read().entries[0].date).toBe('2020-01-02')
  await user.type(screen.getByLabelText('金額（NT$）'), '35')
  await user.type(screen.getByLabelText('備註（選填）'), '下一筆車票')
  await user.click(screen.getByRole('button', { name: '撤回剛剛這筆' }))
  expect(read().entries).toHaveLength(0)
  expect((screen.getByLabelText('金額（NT$）') as HTMLInputElement).value).toBe(
    '35',
  )
  expect(screen.queryByText(/已記下 NT\$100/)).toBeNull()
  expect(screen.getByRole('status').textContent).toContain('已撤回')
  await user.click(screen.getByRole('button', { name: '記下這筆' }))
  expect(read().entries).toHaveLength(1)
  expect(read().entries[0]).toMatchObject({
    text: '下一筆車票',
    amount: 35,
    date: '2020-01-02',
  })
})

it('新增、同表單修改日期與分類、刪除及復原，保留購物來源且金額同步', async () => {
  const source = {
    id: 'source',
    text: '衣服',
    amount: 100,
    date: dayKey(),
    category: '購物',
    sourceShoppingId: 'shopping-source',
    done: false,
  }
  localStorage.setItem(
    bookKey('budget'),
    JSON.stringify({ limit: 500, entries: [source] }),
  )
  const user = userEvent.setup()
  render(
    <Budget tool={tools.find((t) => t.id === 'budget')!} onBack={() => {}} />,
  )
  await user.click(screen.getByRole('button', { name: '編輯 衣服' }))
  const dialog = screen.getByRole('dialog', { name: '修改這筆支出' })
  await user.clear(within(dialog).getByLabelText('金額（NT$）'))
  await user.type(within(dialog).getByLabelText('金額（NT$）'), '75.5')
  await user.click(
    within(dialog).getByRole('button', { name: '居家', exact: true }),
  )
  await user.clear(within(dialog).getByLabelText('備註（選填）'))
  await user.click(within(dialog).getByRole('button', { name: '儲存修改' }))
  expect(read().entries[0]).toMatchObject({
    id: 'source',
    amount: 75.5,
    category: '居家',
    text: '居家',
    sourceShoppingId: 'shopping-source',
  })
  expect(
    screen.getByRole('region', { name: '每日預算' }).textContent,
  ).toContain('NT$424.5')
  await user.click(screen.getByRole('button', { name: '刪除 居家' }))
  expect(read().entries).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: '復原上一筆' }))
  expect(read().entries[0].sourceShoppingId).toBe('shopping-source')
  expect(read().entries[0].amount).toBe(75.5)
})

it('跨分頁更新時不覆寫新資料，快速記帳草稿保留', async () => {
  const user = userEvent.setup()
  render(<QuickExpense onClose={() => {}} />)
  await user.type(screen.getByLabelText('金額（NT$）'), '80')
  const external = JSON.stringify({
    limit: 700,
    entries: [
      {
        id: 'external',
        text: '另一頁',
        amount: 50,
        date: dayKey(),
        done: false,
      },
    ],
  })
  localStorage.setItem(bookKey('budget'), external)
  await user.click(screen.getByRole('button', { name: '記下這筆' }))
  expect(localStorage.getItem(bookKey('budget'))).toBe(external)
  expect((screen.getByLabelText('金額（NT$）') as HTMLInputElement).value).toBe(
    '80',
  )
  expect(screen.queryByRole('button', { name: '撤回剛剛這筆' })).toBeNull()
})
