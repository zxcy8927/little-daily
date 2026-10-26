import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import PixelRoom from '../../src/components/PixelRoom'
import RoomPet, { canWander, wanderTarget } from '../../src/components/RoomPet'
import { roomTime } from '../../src/ui/room-time'
import { collectBackup } from '../../src/data/storage'
afterEach(() => vi.useRealTimers())
it('本地時段包含清晨、午後、傍晚及夜晚的邊界', () => {
  expect([0, 5, 6, 10, 11, 16, 17, 19, 20, 23].map(roomTime)).toEqual([
    'night',
    'night',
    'morning',
    'morning',
    'afternoon',
    'afternoon',
    'evening',
    'evening',
    'night',
    'night',
  ])
})
it('光線隨時鐘與返回視窗更新，卸載會清掉時鐘；縮圖不啟動時鐘', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 26, 10, 59, 59))
  const view = render(<PixelRoom />)
  expect(
    view.container.querySelector('.room-art')?.getAttribute('data-time'),
  ).toBe('morning')
  act(() => vi.advanceTimersByTime(60000))
  expect(
    view.container.querySelector('.room-art')?.getAttribute('data-time'),
  ).toBe('afternoon')
  act(() => {
    vi.setSystemTime(new Date(2026, 9, 26, 20))
    window.dispatchEvent(new Event('focus'))
  })
  expect(
    view.container.querySelector('.room-art')?.getAttribute('data-time'),
  ).toBe('night')
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
  const mini = render(<PixelRoom mini />)
  expect(vi.getTimerCount()).toBe(0)
  expect(mini.container.querySelector('.room-pet-walk')).toBeNull()
})
it('暖心燈與盆栽可用點擊、Enter、空白操作，互動不改備份', () => {
  const before = collectBackup(localStorage).data
  const view = render(<PixelRoom coins={120} />)
  fireEvent.click(screen.getByRole('button', { name: '關閉暖心燈' }))
  expect(
    screen
      .getByRole('button', { name: '開啟暖心燈' })
      .getAttribute('aria-pressed'),
  ).toBe('false')
  expect(
    view.container.querySelector('.room-lamp-glow')?.getAttribute('opacity'),
  ).toBe('0')
  fireEvent.keyDown(screen.getByRole('button', { name: '開啟暖心燈' }), {
    key: 'Enter',
  })
  expect(
    screen
      .getByRole('button', { name: '關閉暖心燈' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  fireEvent.keyDown(screen.getByRole('button', { name: '摸摸小盆栽' }), {
    key: ' ',
  })
  expect(view.container.querySelector('.room-leaves-touch')).not.toBeNull()
  expect(collectBackup(localStorage).data).toEqual(before)
})
it('咖啡主題與試擺推車皆可開關蒸氣，縮圖不嵌套互動按鈕', () => {
  const view = render(
    <PixelRoom theme="cafe" preview={{ id: 'coffee-cart', x: 620, y: 350 }} />,
  )
  fireEvent.click(screen.getByRole('button', { name: '啟動咖啡機' }))
  expect(view.container.querySelectorAll('.room-coffee-steam')).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: '停止咖啡機' }))
  expect(view.container.querySelectorAll('.room-coffee-steam')).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: '啟動奶油咖啡推車' }))
  expect(view.container.querySelectorAll('.room-coffee-steam')).toHaveLength(1)
  view.rerender(<PixelRoom theme="cafe" mini />)
  expect(screen.queryByRole('button')).toBeNull()
})
it('移動路線避開家具；沒有空位就留在原地，新擺家具會立刻取消路線', () => {
  expect(wanderTarget([], () => 0)).toBe(-150)
  expect(wanderTarget([], () => 0.99)).toBe(-110)
  const obstacle = [{ id: 'leaf-plant' as const, x: 180, y: 350 }]
  expect(wanderTarget(obstacle, () => 0)).toBe(0)
  vi.spyOn(Math, 'random').mockReturnValue(0)
  const view = render(
    <svg>
      <RoomPet mini={false} layout={[]} />
    </svg>,
  )
  expect(
    view.container.querySelector('.room-pet-walk')?.getAttribute('style'),
  ).toContain('--pet-step-x: -150px')
  view.rerender(
    <svg>
      <RoomPet mini={false} layout={obstacle} />
    </svg>,
  )
  expect(
    view.container.querySelector('.room-pet-walk')?.getAttribute('style'),
  ).toContain('--pet-step-x: 0px')
})

it('散步檢查沿途障礙，地毯可走、牆上的掛畫不擋路', () => {
  expect(canWander([], -150)).toBe(true)
  expect(canWander([], -200)).toBe(false)
  expect(canWander([{ id: 'leaf-plant', x: 100, y: 365 }], -150)).toBe(false)
  expect(canWander([{ id: 'woven-rug', x: 100, y: 365 }], -150)).toBe(true)
  expect(canWander([{ id: 'hill-print', x: 100, y: 160 }], -150)).toBe(true)
})
