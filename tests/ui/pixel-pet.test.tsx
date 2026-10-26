import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import PixelPet, { petState } from '../../src/components/PixelPet'
import { bookKey, type Book } from '../../src/data/storage'

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})
const day = new Date(2026, 9, 25, 12)
const book = (amount: number): Book => ({
  limit: 500,
  entries: amount
    ? [{ id: 'one', date: '2026-10-25', text: '午餐', amount, done: false }]
    : [],
})
it('依今日預算及本地時間選表情，不把其他日期計入', () => {
  expect(petState(day, book(100))).toBe('idle')
  expect(petState(day, book(400))).toBe('attentive')
  expect(petState(day, book(501))).toBe('worried')
  expect(petState(new Date(2026, 9, 25, 23), book(501))).toBe('worried')
  expect(petState(new Date(2026, 9, 26, 2), book(100))).toBe('asleep')
  expect(petState(new Date(2026, 9, 26, 12), book(501))).toBe('idle')
})
it('點擊與鍵盤都會回應；連點五次彩蛋，稍後回到指定表情，沒有儲存資料', () => {
  vi.useFakeTimers()
  const { container } = render(<PixelPet state="worried" interactive />)
  const pet = screen.getByRole('button', { name: '摸摸小兔' })
  fireEvent.keyDown(pet, { key: 'Enter' })
  expect(container.querySelector('[data-pet-state="happy"]')).not.toBeNull()
  expect(screen.getByRole('status').textContent).toBe('嗯，我在。')
  for (let i = 0; i < 4; i++) fireEvent.click(pet)
  expect(screen.getByRole('status').textContent).toBe('好啦，耳朵借你摸。')
  expect(localStorage.length).toBe(0)
  act(() => vi.advanceTimersByTime(2400))
  expect(container.querySelector('[data-pet-state="worried"]')).not.toBeNull()
  fireEvent.keyDown(pet, { key: ' ' })
  expect(screen.getByRole('status').textContent).toBe('嗯，我在。')
})
it('慢慢點不累積彩蛋；卸載清掉回應計時器', () => {
  vi.useFakeTimers()
  const { unmount } = render(<PixelPet state="idle" interactive />)
  const pet = screen.getByRole('button', { name: '摸摸小兔' })
  for (let i = 0; i < 5; i++) {
    act(() => vi.advanceTimersByTime(2100))
    fireEvent.click(pet)
  }
  expect(screen.getByRole('status').textContent).toBe('嗯，我在。')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
it('自動狀態隨記帳與跨日更新；壞資料不影響顯示', () => {
  vi.useFakeTimers()
  vi.setSystemTime(day)
  const { container, unmount } = render(<PixelPet interactive />)
  localStorage.setItem(bookKey('budget'), JSON.stringify(book(501)))
  act(() => window.dispatchEvent(new Event('little-daily-saved')))
  expect(container.querySelector('[data-pet-state="worried"]')).not.toBeNull()
  act(() => {
    vi.setSystemTime(new Date(2026, 9, 26, 2))
    vi.advanceTimersByTime(30000)
  })
  expect(container.querySelector('[data-pet-state="asleep"]')).not.toBeNull()
  localStorage.setItem(bookKey('budget'), 'broken')
  act(() => {
    vi.setSystemTime(day)
    window.dispatchEvent(new Event('storage'))
  })
  expect(container.querySelector('[data-pet-state="idle"]')).not.toBeNull()
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
it('展示用小兔不增加可聚焦按鈕，六種狀態皆有替代文字', () => {
  const { rerender } = render(<PixelPet state="idle" />)
  for (const state of [
    'idle',
    'attentive',
    'happy',
    'worried',
    'sleepy',
    'asleep',
  ] as const) {
    rerender(<PixelPet state={state} />)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('小兔')
    expect(screen.queryByRole('button')).toBeNull()
  }
})
import { announceExpense } from '../../src/ui/expense-events'
it('回話泡泡在小屋 HTML 層，保留即時朗讀', () => {
  const view = render(
    <div className="room-picture">
      <svg>
        <PixelPet room interactive state="idle" />
      </svg>
    </div>,
  )
  fireEvent.click(screen.getByRole('button', { name: '摸摸小兔' }))
  const bubble = screen.getByRole('status')
  expect(bubble.namespaceURI).toBe('http://www.w3.org/1999/xhtml')
  expect(bubble.parentElement).toBe(
    view.container.querySelector('.room-picture'),
  )
  expect(bubble.getAttribute('aria-live')).toBe('polite')
})
it('今日成功記帳且仍在預算內才短暫開心，超支即回到陪伴表情', () => {
  vi.useFakeTimers()
  vi.setSystemTime(day)
  localStorage.setItem(bookKey('budget'), JSON.stringify(book(400)))
  const view = render(<PixelPet interactive />)
  const entry = book(400).entries[0]
  act(() => announceExpense({ ...entry, date: '2026-10-24' }))
  expect(
    view.container.querySelector('[data-pet-state="attentive"]'),
  ).not.toBeNull()
  act(() => announceExpense(entry))
  expect(
    view.container.querySelector('[data-pet-state="happy"]'),
  ).not.toBeNull()
  act(() => vi.advanceTimersByTime(2400))
  expect(
    view.container.querySelector('[data-pet-state="attentive"]'),
  ).not.toBeNull()
  act(() => announceExpense(entry))
  localStorage.setItem(bookKey('budget'), JSON.stringify(book(501)))
  act(() => {
    window.dispatchEvent(new Event('little-daily-saved'))
    announceExpense(entry)
  })
  expect(
    view.container.querySelector('[data-pet-state="worried"]'),
  ).not.toBeNull()
  expect(screen.getByRole('status').textContent).toBe('')
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})
