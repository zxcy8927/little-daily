import ToolIcon from './ToolIcon'
import { defaultPreferences, type HomePreferences } from '../data/storage'
import { tools } from '../data/tools'
export default function HomeCustomization({
  value,
  onChange,
  error,
}: {
  value: HomePreferences
  onChange: (next: HomePreferences) => void
  error: string
}) {
  function move(index: number, step: number) {
    const order = [...value.order]
    ;[order[index], order[index + step]] = [order[index + step], order[index]]
    onChange({ ...value, order })
  }
  return (
    <details className="tool-customizer">
      <summary>整理我的首頁工具</summary>
      <p>
        常用的往前放，暫時用不到的先收起。取消勾選只會隱藏入口，紀錄和每週回顧都會留著。
      </p>
      <ul className="customizer-list">
        {value.order.map((id, index) => {
          const tool = tools.find((t) => t.id === id)!
          const checked = !value.hidden.includes(id)
          return (
            <li key={id}>
              <label>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={checked && value.hidden.length === tools.length - 1}
                  onChange={() =>
                    onChange({
                      ...value,
                      hidden: checked
                        ? [...value.hidden, id]
                        : value.hidden.filter((t) => t !== id),
                    })
                  }
                />
                <ToolIcon id={tool.id} /> {tool.title}
              </label>
              <div className="customizer-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  aria-label={`上移 ${tool.title}`}
                  onClick={() => move(index, -1)}
                >
                  上移
                </button>
                <button
                  type="button"
                  disabled={index === value.order.length - 1}
                  aria-label={`下移 ${tool.title}`}
                  onClick={() => move(index, 1)}
                >
                  下移
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <button
        className="secondary-button"
        onClick={() =>
          onChange({
            ...defaultPreferences,
            order: [...defaultPreferences.order],
            hidden: [],
          })
        }
      >
        恢復預設順序與顯示
      </button>
      <p role="alert" className="form-error">
        {error}
      </p>
      <p className="field-help">
        至少保留一個工具；設定會自動儲存，也會包含在備份中。
      </p>
    </details>
  )
}
