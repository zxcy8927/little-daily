import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import ExpenseForm from '../../src/components/ExpenseForm'
import RollingAmount from '../../src/components/RollingAmount'
import YesterdayReview from '../../src/components/YesterdayReview'
import ExpenseFlight from '../../src/components/ExpenseFlight'
import { bookKey, collectBackup } from '../../src/data/storage'
const mocks = vi.hoisted(() => ({ haptic: vi.fn() }))
vi.mock('../../src/haptics', () => ({ haptic: mocks.haptic }))
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  mocks.haptic.mockReset()
})
const now = new Date(2026, 9, 25, 10).getTime()
const yesterdayBook = (amount: number) => ({
  limit: 500,
  entries: [
    { id: 'lunch', text: '午餐', amount, date: '2026-10-24', done: false },
  ],
})
it('分類切換才輕觸，記帳儲存成功才給成功觸覺，失敗留住輸入', () => {
  const save = vi.fn().mockReturnValue(false)
  const { container } = render(<ExpenseForm date="2026-10-25" onSave={save} />)
  fireEvent.click(screen.getByRole('button', { name: '餐飲' }))
  fireEvent.click(screen.getByRole('button', { name: '餐飲' }))
  expect(mocks.haptic.mock.calls).toEqual([['light']])
  fireEvent.change(screen.getByLabelText('金額（NT$）'), {
    target: { value: '80' },
  })
  fireEvent.submit(container.querySelector('form')!)
  expect(mocks.haptic.mock.calls).toEqual([['light']])
  expect((screen.getByLabelText('金額（NT$）') as HTMLInputElement).value).toBe(
    '80',
  )
  save.mockReturnValue(true)
  fireEvent.submit(container.querySelector('form')!)
  expect(mocks.haptic.mock.calls).toEqual([['light'], ['success']])
  expect((screen.getByLabelText('金額（NT$）') as HTMLInputElement).value).toBe(
    '',
  )
})
it('數字滾動保留正確可讀金額，負數、小數與快速更新都能到達新值', () => {
  const { container, rerender } = render(<RollingAmount value={500} />)
  rerender(<RollingAmount value={-12.5} />)
  expect(container.querySelector('.sr-only')?.textContent).toBe('NT$-12.5')
  expect(
    container.querySelectorAll('.rolling-digit-track').length,
  ).toBeGreaterThan(0)
  rerender(<RollingAmount value={1234} />)
  expect(container.querySelector('.sr-only')?.textContent).toBe('NT$1,234')
  expect(
    container
      .querySelector('.rolling-amount-digits')
      ?.getAttribute('aria-hidden'),
  ).toBe('true')
})
it('昨日守住預算只顯示一次，備份及金幣不變，下一天會再回顧', () => {
  localStorage.setItem(bookKey('budget'), JSON.stringify(yesterdayBook(300)))
  const before = collectBackup(localStorage).data
  const view = render(<YesterdayReview now={now} />)
  expect(screen.getByText('昨天的帳，收好了')).toBeTruthy()
  expect(screen.getByText(/昨天留在額度裡/)).toBeTruthy()
  expect(view.container.querySelector('.yesterday-coin')).not.toBeNull()
  expect(collectBackup(localStorage).data).toEqual(before)
  fireEvent.click(screen.getByRole('button', { name: '好，過今天了' }))
  expect(view.container.textContent).toBe('')
  view.unmount()
  const reopened = render(<YesterdayReview now={now} />)
  expect(reopened.container.textContent).toBe('')
  localStorage.setItem(
    bookKey('budget'),
    JSON.stringify({
      ...yesterdayBook(200),
      entries: [{ ...yesterdayBook(200).entries[0], date: '2026-10-25' }],
    }),
  )
  reopened.rerender(
    <YesterdayReview now={new Date(2026, 9, 26, 10).getTime()} />,
  )
  expect(screen.getByText('昨天的帳，收好了')).toBeTruthy()
})
it('超支只陪伴，沒有扣金幣；空白與壞紀錄不出現結算', () => {
  localStorage.setItem(bookKey('budget'), JSON.stringify(yesterdayBook(600)))
  const before = collectBackup(localStorage).data
  const view = render(<YesterdayReview now={now} />)
  expect(screen.getByText(/今天我也在/)).toBeTruthy()
  expect(view.container.querySelector('.yesterday-coin')).toBeNull()
  expect(collectBackup(localStorage).data).toEqual(before)
  view.unmount()
  localStorage.clear()
  const empty = render(<YesterdayReview now={now} />)
  expect(empty.container.textContent).toBe('')
  expect(localStorage.length).toBe(0)
  empty.unmount()
  localStorage.setItem(bookKey('budget'), 'broken')
  expect(render(<YesterdayReview now={now} />).container.textContent).toBe('')
})
it('飛行金幣使用可見預算卡座標，收尾或卸載清掉計時器，減少動態效果時略過', () => {
  vi.useFakeTimers()
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 10,
    y: 20,
    left: 10,
    top: 20,
    right: 210,
    bottom: 60,
    width: 200,
    height: 40,
    toJSON: () => ({}),
  })
  const scene = (
    <>
      <div data-budget-target />
      <form>
        <button type="submit">記下這筆</button>
        <ExpenseFlight amount={80} />
      </form>
    </>
  )
  const view = render(scene)
  expect(view.container.querySelector('.expense-flight')).not.toBeNull()
  act(() => vi.advanceTimersByTime(900))
  expect(view.container.querySelector('.expense-flight')).toBeNull()
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
  expect(render(scene).container.querySelector('.expense-flight')).toBeNull()
})
