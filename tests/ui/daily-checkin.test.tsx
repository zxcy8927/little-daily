import { StrictMode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../../src/App'
import { gameKey, collectBackup } from '../../src/data/storage'
import { onboardingKey } from '../../src/data/onboarding'
import {
  useDailyGreeting,
  greetingSeenKey,
} from '../../src/hooks/useDailyGreeting'
import { checkInGreeting } from '../../src/ui/checkin-copy'
const mocks = vi.hoisted(() => ({ haptic: vi.fn() }))
vi.mock('../../src/haptics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/haptics')>()
  return { ...actual, haptic: mocks.haptic }
})
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 26, 12))
  localStorage.setItem(onboardingKey, 'seen')
  window.history.replaceState(null, '', '/#/')
})
afterEach(() => {
  vi.useRealTimers()
  mocks.haptic.mockReset()
})
const stored = () => JSON.parse(localStorage.getItem(gameKey)!)
const pet = () =>
  within(screen.getByRole('complementary', { name: '小兔的招呼' })).getByRole(
    'button',
    { name: '摸摸小兔，記下今天' },
  )
it('招呼不自動領獎，點小兔才依原規則拿十金幣與十經驗', () => {
  const before = collectBackup(localStorage).data
  render(<App />)
  expect(pet()).toBeTruthy()
  expect(collectBackup(localStorage).data).toEqual(before)
  fireEvent.click(pet())
  expect(stored()).toEqual({ coins: 130, xp: 45, lastCheckIn: '2026-10-26' })
  expect(screen.queryByRole('complementary', { name: '小兔的招呼' })).toBeNull()
  expect(
    screen.getByRole('complementary', { name: '簽到回應' }).textContent,
  ).toContain('10 金幣')
  expect(mocks.haptic).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('dialog', { name: '新的成長卡' })).toBeNull()
})
it('招呼只顯示一次，收起或重開後仍可在更多找到簽到', () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '先收起小兔的招呼' }))
  view.unmount()
  window.history.replaceState(null, '', '/#/more')
  render(<App />)
  expect(screen.queryByRole('complementary', { name: '小兔的招呼' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '摸摸小兔，記下今天' }))
  expect(stored().coins).toBe(130)
  expect(
    (screen.getByRole('button', { name: '今天已記下' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: '今天已記下' }))
  expect(stored().coins).toBe(130)
})
it('跨等級時解鎖成長卡，內容是實際獎勵，不額外更動家具資料', () => {
  localStorage.setItem(
    gameKey,
    JSON.stringify({ coins: 200, xp: 90, lastCheckIn: '2026-10-24' }),
  )
  render(<App />)
  expect(screen.getByText(/回來啦，位置一直替你留著/)).toBeTruthy()
  fireEvent.click(pet())
  const card = screen.getByRole('dialog', { name: '新的成長卡' })
  expect(card.textContent).toContain('LV. 2')
  expect(card.textContent).toContain('10 金幣')
  expect(stored()).toEqual({ coins: 210, xp: 100, lastCheckIn: '2026-10-26' })
  expect(Object.keys(collectBackup(localStorage).data)).toEqual([gameKey])
  fireEvent.click(within(card).getByRole('button', { name: '好，收下今天' }))
  expect(screen.queryByRole('dialog', { name: '新的成長卡' })).toBeNull()
})
it('簽到寫入失敗不假領獎或顯示成長卡，關閉回應後可重試', () => {
  localStorage.setItem(
    gameKey,
    JSON.stringify({ coins: 200, xp: 90, lastCheckIn: '2026-10-24' }),
  )
  render(<App />)
  const before = localStorage.getItem(gameKey)
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('full')
    })
  fireEvent.click(pet())
  expect(localStorage.getItem(gameKey)).toBe(before)
  expect(screen.getByRole('alert').textContent).toContain('無法儲存簽到')
  expect(mocks.haptic).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog', { name: '新的成長卡' })).toBeNull()
  write.mockRestore()
  fireEvent.click(screen.getByRole('button', { name: '收起簽到回應' }))
  fireEvent.click(pet())
  expect(stored().coins).toBe(210)
})
it('按下前其他分頁已簽到時讀最新資料，不重複獎勵', () => {
  render(<App />)
  localStorage.setItem(
    gameKey,
    JSON.stringify({ coins: 130, xp: 45, lastCheckIn: '2026-10-26' }),
  )
  fireEvent.click(pet())
  expect(stored()).toEqual({ coins: 130, xp: 45, lastCheckIn: '2026-10-26' })
  expect(mocks.haptic).not.toHaveBeenCalled()
  expect(screen.getByText('今天的小記號已經收好了，放心。')).toBeTruthy()
})
function GreetingHarness({
  day,
  enabled = true,
}: {
  day: string
  enabled?: boolean
}) {
  const greeting = useDailyGreeting(day, enabled)
  return greeting.visible ? (
    <button onClick={greeting.dismiss}>招呼</button>
  ) : (
    <p>先安靜陪著</p>
  )
}
it('導覽時不搶招呼，跨日可再出現，StrictMode 不重複記錄', () => {
  const view = render(
    <StrictMode>
      <GreetingHarness day="2026-10-26" enabled={false} />
    </StrictMode>,
  )
  expect(localStorage.getItem(greetingSeenKey)).toBeNull()
  view.rerender(
    <StrictMode>
      <GreetingHarness day="2026-10-26" />
    </StrictMode>,
  )
  expect(screen.getByRole('button', { name: '招呼' })).toBeTruthy()
  expect(localStorage.getItem(greetingSeenKey)).toBe('2026-10-26')
  fireEvent.click(screen.getByRole('button', { name: '招呼' }))
  view.rerender(
    <StrictMode>
      <GreetingHarness day="2026-10-27" />
    </StrictMode>,
  )
  expect(screen.getByRole('button', { name: '招呼' })).toBeTruthy()
  expect(localStorage.getItem(greetingSeenKey)).toBe('2026-10-27')
})
it('裝置無法記住招呼時仍可顯示；隔幾天回來不提損失', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  render(<GreetingHarness day="2026-10-26" />)
  expect(screen.getByRole('button', { name: '招呼' })).toBeTruthy()
  const copy = checkInGreeting(
    { coins: 120, xp: 35, lastCheckIn: '2026-10-01' },
    '2026-10-26',
  )
  expect(copy).toContain('回來啦')
  expect(copy).not.toMatch(/中斷|失去|漏簽|連續|補簽/)
})
