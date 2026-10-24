import { afterEach, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShoppingJourney from '../../src/components/ShoppingJourney'
import ShoppingReceipt from '../../src/components/ShoppingReceipt'
import { bookKey, type Entry } from '../../src/data/storage'

afterEach(() => vi.useRealTimers())
const entry: Entry = {
  id: 'coat',
  text: '衣服',
  amount: 1500,
  date: '2020-01-01T00:00:00.000Z',
  done: true,
  status: 'skipped',
  rewardCoins: 50,
}

it('不買回饋短暫播放一次，重新 render 不重播，也不寫入金幣', () => {
  vi.useFakeTimers()
  const before = { ...localStorage }
  const view = render(<ShoppingReceipt entry={entry} onHome={() => {}} />)
  const receipt = screen.getByRole('status', { name: '這次的決定' })
  expect(receipt.classList.contains('is-celebrating')).toBe(true)
  expect(within(receipt).getByText('+50 金幣')).toBeTruthy()
  act(() => vi.advanceTimersByTime(1500))
  expect(receipt.classList.contains('is-celebrating')).toBe(false)
  view.rerender(<ShoppingReceipt entry={{ ...entry }} onHome={() => {}} />)
  expect(receipt.classList.contains('is-celebrating')).toBe(false)
  expect({ ...localStorage }).toEqual(before)
})

it('決定購買只留下確認，不顯示金幣或慶祝動畫', () => {
  render(
    <ShoppingReceipt
      entry={{
        ...entry,
        status: 'bought',
        done: false,
        rewardCoins: undefined,
      }}
      onHome={() => {}}
    />,
  )
  expect(
    screen.getByRole('heading', { name: '想清楚了，那就買吧。' }),
  ).toBeTruthy()
  expect(document.querySelector('.coin-burst')).toBeNull()
  expect(document.querySelector('.is-celebrating')).toBeNull()
  expect(screen.queryByText(/少花了/)).toBeNull()
})

it('寫入失敗不慶祝；原因保留，重試成功後才顯示實際獎勵', async () => {
  const original = JSON.stringify({
    limit: 500,
    entries: [
      {
        ...entry,
        done: false,
        status: 'thinking',
        rewardCoins: undefined,
        coolingDays: 7,
      },
    ],
  })
  localStorage.setItem(bookKey('shopping'), original)
  const user = userEvent.setup()
  render(<ShoppingJourney onBack={() => {}} />)
  await user.click(screen.getByRole('button', { name: '回顧並決定' }))
  await user.type(screen.getByLabelText('這次決定的原因'), '已經有差不多的')
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('空間不足')
    })
  await user.click(screen.getByRole('button', { name: '決定不買，留下這筆錢' }))
  expect(screen.queryByRole('status', { name: '這次的決定' })).toBeNull()
  expect(
    (screen.getByLabelText('這次決定的原因') as HTMLTextAreaElement).value,
  ).toBe('已經有差不多的')
  expect(localStorage.getItem(bookKey('shopping'))).toBe(original)
  write.mockRestore()
  await user.click(screen.getByRole('button', { name: '決定不買，留下這筆錢' }))
  expect(
    within(screen.getByRole('status', { name: '這次的決定' })).getByText(
      '+50 金幣',
    ),
  ).toBeTruthy()
  const saved = JSON.parse(localStorage.getItem(bookKey('shopping'))!)
  expect(saved.entries[0].rewardCoins).toBe(50)
  expect(saved.entries[0].savedAmount).toBe(0)
})

it('空清單不顯示零值成果，搜尋與分類無結果使用不同提示', async () => {
  const user = userEvent.setup()
  const view = render(<ShoppingJourney onBack={() => {}} />)
  expect(screen.queryByRole('region', { name: '省錢成果' })).toBeNull()
  expect(
    screen.getByText('清單空著也很好。遇到想買的，再放進來。'),
  ).toBeTruthy()
  view.unmount()
  localStorage.setItem(
    bookKey('shopping'),
    JSON.stringify({
      limit: 500,
      entries: [
        { ...entry, done: false, status: 'thinking', rewardCoins: undefined },
      ],
    }),
  )
  render(<ShoppingJourney onBack={() => {}} />)
  await user.click(
    screen.getByRole('button', { name: '不買紀錄', exact: true }),
  )
  expect(screen.getByText('還沒留下不買紀錄，慢慢來就好。')).toBeTruthy()
  await user.type(screen.getByLabelText('搜尋物品'), '不存在')
  expect(screen.getByText('沒找到這件，換個字找找？')).toBeTruthy()
})
