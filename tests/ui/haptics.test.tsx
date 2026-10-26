import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { collectBackup, bookKey } from '../../src/data/storage'
const mocks = vi.hoisted(() => ({
  native: vi.fn(),
  available: vi.fn(),
  impact: vi.fn(),
  notification: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: mocks.native,
    isPluginAvailable: mocks.available,
  },
}))
vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: mocks.impact, notification: mocks.notification },
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM' },
  NotificationType: { Success: 'SUCCESS' },
}))
import { haptic, hapticsEnabled, setHapticsEnabled } from '../../src/haptics'
import InteractionSettings from '../../src/components/InteractionSettings'
beforeEach(() => {
  vi.clearAllMocks()
  mocks.native.mockReturnValue(true)
  mocks.available.mockReturnValue(true)
  mocks.impact.mockResolvedValue(undefined)
  mocks.notification.mockResolvedValue(undefined)
})
it('原生預設開啟但不寫入偏好，網頁預設關閉；既有選擇優先', async () => {
  expect(hapticsEnabled()).toBe(true)
  expect(localStorage.length).toBe(0)
  await haptic('light')
  expect(mocks.impact).toHaveBeenCalledTimes(1)
  setHapticsEnabled(false)
  expect(hapticsEnabled()).toBe(false)
  await haptic('light')
  expect(mocks.impact).toHaveBeenCalledTimes(1)
  mocks.native.mockReturnValue(false)
  localStorage.clear()
  expect(hapticsEnabled()).toBe(false)
  setHapticsEnabled(true)
  expect(hapticsEnabled()).toBe(true)
})
it('原生缺少外掛時安靜略過', async () => {
  mocks.available.mockReturnValue(false)
  await haptic('success')
  expect(mocks.notification).not.toHaveBeenCalled()
})
it('Android 網頁開啟偏好後使用震動備援，關閉後立即停止', async () => {
  mocks.native.mockReturnValue(false)
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
    'Mozilla/5.0 (Linux; Android 14)',
  )
  const vibrate = vi.fn().mockReturnValue(true)
  Object.defineProperty(navigator, 'vibrate', {
    configurable: true,
    value: vibrate,
  })
  await haptic('light')
  expect(vibrate).not.toHaveBeenCalled()
  setHapticsEnabled(true)
  await haptic('light')
  await haptic('medium')
  await haptic('success')
  expect(vibrate.mock.calls).toEqual([[10], [20], [[15, 40, 15]]])
  setHapticsEnabled(false)
  await haptic('light')
  expect(vibrate).toHaveBeenCalledTimes(3)
  expect(mocks.impact).not.toHaveBeenCalled()
})
it('使用者開啟後分別提供輕、中與成功回饋；關閉後立即停用', async () => {
  setHapticsEnabled(true)
  await haptic('light')
  await haptic('medium')
  await haptic('success')
  expect(mocks.impact.mock.calls).toEqual([
    [{ style: 'LIGHT' }],
    [{ style: 'MEDIUM' }],
  ])
  expect(mocks.notification).toHaveBeenCalledWith({ type: 'SUCCESS' })
  setHapticsEnabled(false)
  await haptic('success')
  expect(mocks.notification).toHaveBeenCalledTimes(1)
})
it('原生回饋或儲存存取失敗時安靜略過，不影響動作', async () => {
  setHapticsEnabled(true)
  mocks.impact.mockRejectedValue(new Error('unsupported'))
  await expect(haptic('light')).resolves.toBeUndefined()
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('denied', 'SecurityError')
  })
  expect(hapticsEnabled()).toBe(false)
  await expect(haptic('success')).resolves.toBeUndefined()
  expect(mocks.notification).not.toHaveBeenCalled()
})
it('互動設定可保存偏好、同步重開，且不改記帳資料或備份格式', async () => {
  localStorage.setItem(
    bookKey('budget'),
    JSON.stringify({ limit: 500, entries: [] }),
  )
  setHapticsEnabled(false)
  const before = collectBackup(localStorage).data
  const user = userEvent.setup()
  const view = render(<InteractionSettings />)
  await user.click(screen.getByText('互動設定', { selector: 'summary' }))
  await user.click(screen.getByRole('switch', { name: '開啟觸覺回饋' }))
  expect(hapticsEnabled()).toBe(true)
  expect(collectBackup(localStorage).data).toEqual(before)
  expect(mocks.impact).not.toHaveBeenCalled()
  view.unmount()
  render(<InteractionSettings />)
  await user.click(screen.getByText('互動設定', { selector: 'summary' }))
  expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  await user.click(screen.getByRole('switch'))
  expect(screen.getByRole('alert').textContent).toContain('還沒存好')
  expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true)
})

it('不支援、拒絕或震動拋錯都不影響操作，非 Android 網頁不震動', async () => {
  mocks.native.mockReturnValue(false)
  setHapticsEnabled(true)
  const agent = vi
    .spyOn(navigator, 'userAgent', 'get')
    .mockReturnValue('iPhone')
  const vibrate = vi.fn(() => {
    throw new Error('denied')
  })
  Object.defineProperty(navigator, 'vibrate', {
    configurable: true,
    value: vibrate,
  })
  await haptic('light')
  expect(vibrate).not.toHaveBeenCalled()
  agent.mockReturnValue('Android')
  await expect(haptic('light')).resolves.toBeUndefined()
  Object.defineProperty(navigator, 'vibrate', {
    configurable: true,
    value: undefined,
  })
  await expect(haptic('success')).resolves.toBeUndefined()
})
