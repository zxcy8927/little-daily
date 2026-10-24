import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  configurable: true,
})
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  value: function () {
    this.setAttribute('open', '')
  },
  configurable: true,
})
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  value: function () {
    this.removeAttribute('open')
  },
  configurable: true,
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  configurable: true,
})
