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
        <h2>這個畫面暫時無法開啟</h2>
        <p>
          已儲存的紀錄仍留在這個瀏覽器。請確認網路後重新開啟；尚未儲存的輸入會消失。
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
