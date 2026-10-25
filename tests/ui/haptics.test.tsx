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
it('觸覺預設關閉，網頁或缺少原生外掛時完全不觸發', async () => {
  expect(hapticsEnabled()).toBe(false)
  await haptic('light')
  setHapticsEnabled(true)
  mocks.native.mockReturnValue(false)
  await haptic('medium')
  mocks.native.mockReturnValue(true)
  mocks.available.mockReturnValue(false)
  await haptic('success')
  expect(mocks.impact).not.toHaveBeenCalled()
  expect(mocks.notification).not.toHaveBeenCalled()
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
