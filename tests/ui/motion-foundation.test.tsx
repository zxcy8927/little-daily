import { afterEach, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import postcss from 'postcss'
import { motionDuration, motionScrollBehavior } from '../../src/ui/motion'
afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.style.removeProperty('--motion-slow')
})
it('動畫時間讀取 token，支援秒單位；減少動態效果時不平滑捲動', () => {
  document.documentElement.style.setProperty('--motion-slow', '.8s')
  expect(motionDuration('slow', 2)).toBe(1600)
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
  expect(motionDuration('slow')).toBe(0)
  expect(motionScrollBehavior()).toBe('auto')
})
it('現有 keyframes 只改 transform 與 opacity；不對顏色、大小或陰影做過場', () => {
  const root = resolve('src')
  let count = 0
  for (const file of readdirSync(root, { recursive: true }).filter((file) =>
    String(file).endsWith('.css'),
  )) {
    const css = postcss.parse(readFileSync(resolve(root, String(file)), 'utf8'))
    css.walkAtRules('keyframes', (frames) => {
      frames.walkDecls((decl) => {
        expect(['transform', 'opacity'], `${file}: ${decl.prop}`).toContain(
          decl.prop,
        )
        count++
      })
    })
    css.walkDecls('transition', (decl) => {
      expect(decl.value, String(file)).not.toMatch(
        /\b(background|border-color|box-shadow|width|height|filter|all)\b/,
      )
    })
  }
  expect(count).toBeGreaterThan(0)
})
