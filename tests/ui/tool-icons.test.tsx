import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import ToolIcon from '../../src/components/ToolIcon'
it('六個工具使用參考圖的像素 SVG 與集中色票，保持裝飾圖示不搶朗讀', () => {
  const view = render(<ToolIcon id="cooking" />)
  const patterns = new Set<string>()
  for (const id of ['cooking', 'shopping', 'budget', 'dog', 'tasks', 'date']) {
    view.rerender(<ToolIcon id={id} />)
    const svg = view.container.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 16 16')
    expect(svg.getAttribute('shape-rendering')).toBe('crispEdges')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('focusable')).toBe('false')
    expect(svg.classList.contains(`tool-icon-${id}`)).toBe(true)
    const rects = [...svg.querySelectorAll('rect')]
    expect(rects.length).toBeGreaterThan(15)
    expect(
      rects.every((rect) =>
        rect.getAttribute('fill')?.startsWith('var(--tool-'),
      ),
    ).toBe(true)
    patterns.add(svg.innerHTML)
  }
  expect(patterns.size).toBe(6)
  view.rerender(<ToolIcon id="unknown" />)
  expect(view.container.querySelector('.tool-icon-tasks')).not.toBeNull()
})
