import { formatDate } from '../ui/format'
import { useState } from 'react'
import { foodExpiry } from '../data/workflows'
import { type Book, type Food } from '../data/storage'
export default function FoodInventory({
  book,
  onSave,
  today,
}: {
  book: Book
  onSave: (next: Book) => boolean
  today: string
}) {
  const [name, setName] = useState(''),
    [quantity, setQuantity] = useState(''),
    [expiry, setExpiry] = useState('')
  const [editing, setEditing] = useState<string | null>(null),
    [filter, setFilter] = useState('現有食材')
  const foods = book.foods ?? []
  function reset() {
    setName('')
    setQuantity('')
    setExpiry('')
    setEditing(null)
  }
  function submit() {
    if (!name.trim()) return
    const current = foods.find((f) => f.id === editing)
    const item: Food = {
      ...current,
      id: editing ?? crypto.randomUUID(),
      name: name.trim(),
      quantity: quantity.trim(),
      expiresOn: expiry,
      state: current?.state ?? 'available',
    }
    if (
      onSave({
        ...book,
        foods: editing
          ? foods.map((f) => (f.id === editing ? item : f))
          : [item, ...foods],
      })
    )
      reset()
  }
  function state(food: Food, value: Food['state']) {
    if (
      onSave({
        ...book,
        foods: foods.map((f) =>
          f.id === food.id
            ? {
                ...f,
                state: value,
                closedOn: value === 'available' ? undefined : today,
              }
            : f,
        ),
      }) &&
      editing === food.id
    )
      reset()
  }
  const visible = foods
    .filter(
      (f) =>
        filter === '全部' ||
        (filter === '現有食材'
          ? f.state === 'available'
          : filter === '已用完'
            ? f.state === 'used'
            : f.state === 'discarded'),
    )
    .sort((a, b) =>
      (a.expiresOn || '9999-12-31').localeCompare(b.expiresOn || '9999-12-31'),
    )
  return (
    <section
      className="pantry-inventory pixel-panel"
      aria-labelledby="inventory-title"
    >
      <h2 id="inventory-title">冰箱裡的食材</h2>
      <p className="field-help">
        冰箱有什麼，先記一下。未到期的現有食材會拿來找食譜；到期提醒依你填的日期，能不能吃仍要自行確認。
      </p>
      <form
        className="tool-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="form-row">
          <label>
            食材名稱
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="例如：雞蛋"
              required
            />
          </label>
          <label>
            數量（選填）
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              maxLength={40}
              placeholder="例如：3 顆"
            />
          </label>
        </div>
        <label>
          到期日（選填）
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </label>
        <div className="inventory-actions">
          <button className="primary-button">
            {editing ? '儲存食材修改' : '加入冰箱'}
          </button>
          {editing && (
            <button className="secondary-button" type="button" onClick={reset}>
              取消編輯
            </button>
          )}
        </div>
      </form>
      <div className="list-tabs">
        {['現有食材', '已用完', '已丟棄', '全部'].map((f) => (
          <button
            key={f}
            className="secondary-button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="records">
        {visible.length ? (
          visible.map((food) => {
            const status = foodExpiry(food, today)
            return (
              <article className="record" key={food.id}>
                <div className="record-body">
                  <h3>{food.name}</h3>
                  <p className="inventory-quantity">
                    {food.quantity || '未填數量'} ·{' '}
                    {food.expiresOn
                      ? `到期 ${formatDate(food.expiresOn)}`
                      : '未填到期日'}
                  </p>
                  <span
                    className={
                      status === 'soon'
                        ? 'expiry-soon'
                        : status === 'expired'
                          ? 'expiry-expired'
                          : 'expiry-label'
                    }
                  >
                    {status === 'expired'
                      ? '已過你填的到期日，先不拿來找食譜'
                      : status === 'soon'
                        ? '3 天內到期，先用這個'
                        : status === 'used'
                          ? `已用完 · ${food.closedOn ? formatDate(food.closedOn) : ''}`
                          : status === 'discarded'
                            ? `已丟棄 · ${food.closedOn ? formatDate(food.closedOn) : ''}`
                            : '現有食材'}
                  </span>
                </div>
                <div className="record-actions">
                  <button
                    className="secondary-button"
                    aria-label={`編輯食材 ${food.name}`}
                    onClick={() => {
                      setEditing(food.id)
                      setName(food.name)
                      setQuantity(food.quantity)
                      setExpiry(food.expiresOn)
                    }}
                  >
                    編輯
                  </button>
                  {food.state === 'available' ? (
                    <>
                      <button
                        className="secondary-button"
                        onClick={() => state(food, 'used')}
                      >
                        已用完
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => state(food, 'discarded')}
                      >
                        已丟棄
                      </button>
                    </>
                  ) : (
                    <button
                      className="secondary-button"
                      onClick={() => state(food, 'available')}
                    >
                      放回現有食材
                    </button>
                  )}
                </div>
              </article>
            )
          })
        ) : (
          <p className="empty-state">這一格還空著。有食材再記，不用硬湊。</p>
        )}
      </div>
    </section>
  )
}
