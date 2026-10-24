import { Component, type ReactNode } from 'react'

export default class PageBoundary extends Component<
  { children: ReactNode; onRetry?: () => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="pixel-panel" role="alert">
        <h2>畫面卡住了，重新開一次試試</h2>
        <p>
          重新開啟不會主動清除已儲存的紀錄，但還沒存的輸入會消失。先複製留下，再確認網路、重新開啟。
        </p>
        <button
          className="primary-button"
          onClick={this.props.onRetry ?? (() => window.location.reload())}
        >
          重新開啟
        </button>
      </section>
    )
  }
}
