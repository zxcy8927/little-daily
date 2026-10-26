import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import DrawReveal from '../../src/components/DrawReveal'
import TaskWorkspace from '../../src/components/tools/TaskWorkspace'
import TaskMotionRow from '../../src/components/TaskMotionRow'
import CookingSteps from '../../src/components/CookingSteps'
import ShoppingReceipt from '../../src/components/ShoppingReceipt'
import ShoppingJourney from '../../src/components/ShoppingJourney'
import { tools } from '../../src/data/tools'
import { bookKey } from '../../src/data/storage'
import { reviewReply } from '../../src/ui/review-copy'
import { weeklyReview } from '../../src/data/workflows'
const mocks = vi.hoisted(() => ({ haptic: vi.fn() }))
vi.mock('../../src/haptics', () => ({ haptic: mocks.haptic }))
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  mocks.haptic.mockClear()
})
it('抽卡 1.5 秒後揭曉，可立即略過，減少動態效果時直接顯示', () => {
  vi.useFakeTimers()
  const view = render(
    <DrawReveal>
      <h2>散步</h2>
    </DrawReveal>,
  )
  expect(screen.queryByRole('heading', { name: '散步' })).toBeNull()
  act(() => vi.advanceTimersByTime(1499))
  expect(screen.queryByRole('heading', { name: '散步' })).toBeNull()
  act(() => vi.advanceTimersByTime(1))
  expect(screen.getByRole('heading', { name: '散步' })).toBeTruthy()
  view.unmount()
  const skip = render(
    <DrawReveal>
      <h2>喝茶</h2>
    </DrawReveal>,
  )
  fireEvent.click(screen.getByRole('button', { name: '直接看點子' }))
  expect(screen.getByRole('heading', { name: '喝茶' })).toBeTruthy()
  skip.unmount()
  expect(vi.getTimerCount()).toBe(0)
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
  render(
    <DrawReveal>
      <h2>看看書</h2>
    </DrawReveal>,
  )
  expect(screen.queryByRole('button', { name: '直接看點子' })).toBeNull()
})
it('水平右滑才完成，垂直捲動與點按鈕不誤觸', () => {
  class Pointer extends MouseEvent {
    pointerId = 1
  }
  vi.stubGlobal('PointerEvent', Pointer)
  const complete = vi.fn(),
    entry = {
      id: 'one',
      text: '買菜',
      amount: 0,
      date: '2026-10-26',
      done: false,
    }
  const view = render(
    <TaskMotionRow entry={entry} onComplete={complete}>
      <h2>買菜</h2>
      <button>編輯</button>
    </TaskMotionRow>,
  )
  const row = view.container.querySelector('article')!
  fireEvent.pointerDown(row, { clientX: 10, clientY: 10 })
  fireEvent.pointerUp(row, { clientX: 100, clientY: 15 })
  expect(complete).toHaveBeenCalledTimes(1)
  fireEvent.pointerDown(row, { clientX: 10, clientY: 10 })
  fireEvent.pointerMove(row, { clientX: 20, clientY: 80 })
  fireEvent.pointerUp(row, { clientX: 120, clientY: 80 })
  expect(complete).toHaveBeenCalledTimes(1)
  fireEvent.pointerDown(screen.getByRole('button', { name: '編輯' }), {
    clientX: 10,
    clientY: 10,
  })
  fireEvent.pointerUp(row, { clientX: 120, clientY: 10 })
  expect(complete).toHaveBeenCalledTimes(1)
})
it('完成待辦沿用原紀錄欄位且成功才觸覺；寫入失敗不假裝完成', () => {
  localStorage.setItem(
    bookKey('tasks'),
    JSON.stringify({
      limit: 500,
      entries: [
        { id: 'one', text: '買菜', amount: 0, date: '2026-10-26', done: false },
      ],
    }),
  )
  render(
    <TaskWorkspace
      tool={tools.find((tool) => tool.id === 'tasks')!}
      onBack={() => {}}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: '完成', exact: true }))
  expect(
    JSON.parse(localStorage.getItem(bookKey('tasks'))!).entries[0].done,
  ).toBe(true)
  expect(screen.getByRole('heading', { name: '已完成的事' })).toBeTruthy()
  expect(mocks.haptic).toHaveBeenCalledWith('success')
  mocks.haptic.mockClear()
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  fireEvent.click(screen.getByRole('button', { name: '改為未完成' }))
  expect(screen.getByRole('button', { name: '改為未完成' })).toBeTruthy()
  expect(mocks.haptic).not.toHaveBeenCalled()
})
it('料理一次一步、計時可暫停恢復，到時提醒，換步驟清理計時', () => {
  vi.useFakeTimers()
  vi.stubGlobal('navigator', {})
  const close = vi.fn(),
    view = render(
      <CookingSteps
        recipe={{ name: '湯', steps: ['加水', '煮好'] }}
        onClose={close}
      />,
    )
  expect(screen.getByText('加水')).toBeTruthy()
  expect(screen.queryByText('煮好')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '1 分鐘' }))
  act(() => vi.advanceTimersByTime(10000))
  expect(screen.getByRole('timer').textContent).toBe('00:50')
  fireEvent.click(screen.getByRole('button', { name: '暫停計時' }))
  act(() => vi.advanceTimersByTime(10000))
  expect(screen.getByRole('timer').textContent).toBe('00:50')
  fireEvent.click(screen.getByRole('button', { name: '繼續計時' }))
  act(() => vi.advanceTimersByTime(50000))
  expect(screen.getByText('時間到了，看看鍋裡的狀況。')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '下一步' }))
  expect(screen.getByText('煮好')).toBeTruthy()
  expect(screen.queryByText('時間到了，看看鍋裡的狀況。')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '煮好了，收起步驟' }))
  expect(close).toHaveBeenCalledOnce()
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})
it('亮屏成功會於關閉釋放，拒絕時仍顯示步驟', async () => {
  const release = vi.fn().mockResolvedValue(undefined),
    lock = {
      released: false,
      release,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
  vi.stubGlobal('navigator', {
    wakeLock: { request: vi.fn().mockResolvedValue(lock) },
  })
  const view = render(
    <CookingSteps
      recipe={{ name: '湯', steps: ['加水'] }}
      onClose={() => {}}
    />,
  )
  await act(async () => {})
  expect(screen.getByText('步驟模式開著時，螢幕會保持亮著。')).toBeTruthy()
  view.unmount()
  expect(release).toHaveBeenCalledOnce()
  vi.stubGlobal('navigator', {
    wakeLock: { request: vi.fn().mockRejectedValue(new Error('denied')) },
  })
  render(
    <CookingSteps
      recipe={{ name: '湯', steps: ['加水'] }}
      onClose={() => {}}
    />,
  )
  await act(async () => {})
  expect(screen.getByText('這次沒能保持亮屏，步驟照常可以看。')).toBeTruthy()
  expect(screen.getByText('加水')).toBeTruthy()
})
it('不買收據有存錢罐動畫但不改紀錄，買了不顯示存錢罐', () => {
  const before = { ...localStorage },
    entry = {
      id: 'one',
      text: '衣服',
      amount: 1500,
      date: '2026-10-26',
      done: true,
      status: 'skipped' as const,
    }
  const view = render(<ShoppingReceipt entry={entry} onHome={() => {}} />)
  expect(view.container.querySelector('.piggy-coin')).not.toBeNull()
  expect({ ...localStorage }).toEqual(before)
  view.rerender(
    <ShoppingReceipt
      entry={{ ...entry, status: 'bought' }}
      onHome={() => {}}
    />,
  )
  expect(view.container.querySelector('.piggy-coin')).toBeNull()
})
it('小兔回顧依實際資料改變，空白週也不責備', () => {
  const empty = weeklyReview({}, '2026-10-26')
  expect(reviewReply(empty, empty)).toContain('沒關係')
  expect(reviewReply({ ...empty, completed: 2 }, empty)).toContain(
    '照自己的步調',
  )
  expect(reviewReply({ ...empty, spent: 500 }, empty)).toContain('我陪你')
})

it('冷靜中的物品顯示剩餘天數，只有已到期且未決定的列有微光', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 26, 12))
  localStorage.setItem(
    bookKey('shopping'),
    JSON.stringify({
      limit: 500,
      entries: [
        {
          id: 'new',
          text: '衣服',
          amount: 1500,
          date: new Date(2026, 9, 26, 12).toISOString(),
          done: false,
          status: 'thinking',
          coolingDays: 7,
        },
        {
          id: 'old',
          text: '鞋子',
          amount: 1000,
          date: '2026-10-01T00:00:00.000Z',
          done: false,
          status: 'thinking',
          coolingDays: 1,
        },
      ],
    }),
  )
  const view = render(<ShoppingJourney onBack={() => {}} />)
  expect(screen.getByText(/冷靜中 · 還有 7 天/)).toBeTruthy()
  expect(view.container.querySelectorAll('.shopping-ready')).toHaveLength(1)
  expect(
    view.container.querySelector('.shopping-ready')?.textContent,
  ).toContain('鞋子')
})
