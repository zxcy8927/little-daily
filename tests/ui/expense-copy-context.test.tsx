import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import ExpenseForm from '../../src/components/ExpenseForm'
import { expenseContext, expenseReplies } from '../../src/ui/expense-copy'
it('五種情境各八句，沒有客服語或責備字眼', () => {
  expect(Object.keys(expenseReplies)).toHaveLength(5)
  for (const group of Object.values(expenseReplies)) {
    expect(group.length).toBeGreaterThanOrEqual(8)
    expect(new Set(group).size).toBe(group.length)
    expect(group.join('')).not.toMatch(
      /很高興|為你服務|希望對你有幫助|讓我們一起|賦能|無縫|怎麼又|你應該|失敗|責怪/,
    )
  }
})
it('以儲存這筆後的預算決定語氣，超支及快用完優先於第一筆和連續', () => {
  expect(expenseContext({ limit: 500, spent: 0, entries: 0 }, 501, false)).toBe(
    'over',
  )
  expect(expenseContext({ limit: 500, spent: 350, entries: 1 }, 50, true)).toBe(
    'low',
  )
  expect(expenseContext({ limit: 500, spent: 0, entries: 0 }, 100, false)).toBe(
    'first',
  )
  expect(expenseContext({ limit: 500, spent: 100, entries: 1 }, 50, true)).toBe(
    'continuous',
  )
  expect(
    expenseContext({ limit: 500, spent: 100, entries: 1 }, 50, false),
  ).toBe('comfortable')
  expect(expenseContext({ limit: 0, spent: 0, entries: 0 }, 1, false)).toBe(
    'over',
  )
  expect(expenseContext({ limit: 1, spent: 0.7, entries: 1 }, 0.1, false)).toBe(
    'low',
  )
})
it('沿用既有排除上一句的邏輯，連記同情境不連續重複', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
  const save = vi.fn().mockReturnValue(true)
  const view = render(
    <ExpenseForm
      date="2026-10-26"
      onSave={save}
      budgetContext={{ limit: 500, spent: 450, entries: 1 }}
    />,
  )
  const enter = () => {
    fireEvent.change(screen.getByLabelText('金額（NT$）'), {
      target: { value: '100' },
    })
    fireEvent.submit(view.container.querySelector('form')!)
    return screen.getByRole('status').textContent
  }
  const first = enter(),
    second = enter()
  expect(first).toContain(expenseReplies.over[0])
  expect(second).toContain(expenseReplies.over[1])
  expect(first).not.toBe(second)
  expect(save).toHaveBeenCalledTimes(2)
})
it('第一筆後同日期連記切換連續情境，換日期不沿用連記狀態', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
  const props = {
    onSave: () => true,
    budgetContext: { limit: 500, spent: 0, entries: 0 },
  }
  const view = render(<ExpenseForm {...props} date="2026-10-26" />)
  const enter = () => {
    fireEvent.change(screen.getByLabelText('金額（NT$）'), {
      target: { value: '50' },
    })
    fireEvent.submit(view.container.querySelector('form')!)
  }
  enter()
  expect(screen.getByRole('status').textContent).toContain(
    expenseReplies.first[0],
  )
  enter()
  expect(screen.getByRole('status').textContent).toContain(
    expenseReplies.continuous[0],
  )
  view.rerender(<ExpenseForm {...props} date="2026-10-27" />)
  enter()
  expect(screen.getByRole('status').textContent).toContain(
    expenseReplies.first[0],
  )
})
it('儲存失敗不出現慶祝回話，編輯保留原本修改完成文案', () => {
  const props = {
    date: '2026-10-26',
    budgetContext: { limit: 500, spent: 0, entries: 0 },
  }
  const view = render(<ExpenseForm {...props} onSave={() => false} />)
  fireEvent.change(screen.getByLabelText('金額（NT$）'), {
    target: { value: '50' },
  })
  fireEvent.submit(view.container.querySelector('form')!)
  expect(screen.queryByRole('status')).toBeNull()
  const recorded = vi.fn()
  view.rerender(
    <ExpenseForm
      {...props}
      editing
      onSave={() => true}
      onRecorded={recorded}
    />,
  )
  fireEvent.submit(view.container.querySelector('form')!)
  expect(recorded).toHaveBeenCalledWith(expect.anything(), '已改好這筆。')
})
