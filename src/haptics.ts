import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
const settingKey = 'little-daily-haptics-enabled-v1'
export const hapticsSettingEvent = 'little-daily-haptics-setting'
export function hapticsEnabled() {
  try {
    const preference = localStorage.getItem(settingKey)
    return preference === null
      ? Capacitor.isNativePlatform()
      : preference === 'true'
  } catch {
    return false
  }
}
export function setHapticsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(settingKey, String(enabled))
    window.dispatchEvent(new Event(hapticsSettingEvent))
    return true
  } catch {
    return false
  }
}
export async function haptic(kind: 'light' | 'medium' | 'success') {
  try {
    if (!hapticsEnabled()) return
    if (!Capacitor.isNativePlatform()) {
      if (
        /Android/i.test(navigator.userAgent) &&
        typeof navigator.vibrate === 'function'
      ) {
        const patterns = { light: 10, medium: 20, success: [15, 40, 15] }
        navigator.vibrate(patterns[kind])
      }
      return
    }
    if (!Capacitor.isPluginAvailable('Haptics')) return
    if (kind === 'success')
      await Haptics.notification({ type: NotificationType.Success })
    else
      await Haptics.impact({
        style: kind === 'light' ? ImpactStyle.Light : ImpactStyle.Medium,
      })
  } catch {
    /* Optional feedback must never interrupt an action. */
  }
}
