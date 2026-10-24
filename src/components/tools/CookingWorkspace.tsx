import BudgetImpact from '../BudgetImpact'
import QuickExpense from '../QuickExpense'
import { useTodayBudget } from '../../hooks/useTodayBudget'
import { recipeCosts } from '../../ui/recipe-costs'
import { useState } from 'react'
import type { DailyTool } from '../../data/tools'
import type { CookingBook } from '../../data/books'
import type { Supply } from '../../data/storage'
import { recipes } from '../../data/suggestions'
import { appendSupplies, rankPantryRecipes } from '../../data/workflows'
import { dayKey, useToolBook } from '../../hooks/useToolBook'
import FoodInventory from '../FoodInventory'
import WorkspaceFrame from './WorkspaceFrame'
export default function CookingWorkspace({
  tool,
  onBack,
}: {
  tool: DailyTool
  onBack: () => void
}) {
  const state = useToolBook<CookingBook>('cooking'),
    { book, save } = state
  const [ingredient, setIngredient] = useState(book.pantry ?? ''),
    [maxMinutes, setMaxMinutes] = useState('不限'),
    [readyOnly, setReadyOnly] = useState(false),
    [searched, setSearched] = useState(false),
    [supplyText, setSupplyText] = useState(''),
    [cleared, setCleared] = useState<Supply[] | null>(null)
  const budget = useTodayBudget()
  const [meal, setMeal] = useState<{ name: string; cost: number } | null>(null)
  const ranked = rankPantryRecipes(
    recipes,
    ingredient,
    book.foods ?? [],
    dayKey(),
    maxMinutes,
    readyOnly,
  )
  const hasIngredients =
    !!ingredient.trim() ||
    (book.foods ?? []).some(
      (f) =>
        f.state === 'available' && (!f.expiresOn || f.expiresOn >= dayKey()),
    )
  function supplies(names: string[]) {
    if (save({ ...book, supplies: appendSupplies(book.supplies ?? [], names) }))
      setSupplyText('')
  }
  return (
    <WorkspaceFrame {...state} tool={tool} onBack={onBack} onUndo={state.undo}>
      <FoodInventory book={book} onSave={save} today={dayKey()} />
      <form
        className="tool-form pixel-panel"
        onSubmit={(e) => {
          e.preventDefault()
          if (save({ ...book, pantry: ingredient.trim() })) setSearched(true)
        }}
      >
        <label>
          另外還有哪些食材？
          <input
            maxLength={200}
            value={ingredient}
            onChange={(e) => {
              setIngredient(e.target.value)
              setSearched(false)
            }}
            placeholder="例如：蛋、番茄、豆腐"
          />
        </label>
        <div className="form-row">
          <label>
            料理時間
            <select
              value={maxMinutes}
              onChange={(e) => setMaxMinutes(e.target.value)}
            >
              <option>不限</option>
              {[10, 15, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n} 分鐘內
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="secondary-button"
            aria-pressed={readyOnly}
            onClick={() => setReadyOnly(!readyOnly)}
          >
            {readyOnly ? '顯示部分食材符合' : '只看食材齊全'}
          </button>
        </div>
        <p className="field-help">
          先用冰箱裡還沒到期的食材。其他食材用逗號或空格分開；這裡有 6
          道食譜，基本調味料另備。
        </p>
        <button className="primary-button">找找能煮什麼</button>
      </form>
      {searched && (
        <div className="recipe-list" aria-live="polite">
          {!ranked.length && (
            <p className="empty-state">
              手邊的食材還湊不成一道。放寬時間或食材條件，再找找。
            </p>
          )}
          {ranked.map((r) => (
            <article className="record recipe" key={r.name}>
              <div className="record-heading">
                <h2>{r.name}</h2>
                <span>約 {r.minutes} 分鐘</span>
              </div>
              <p className="recipe-estimate">
                一人份預估 <strong>NT${recipeCosts[r.name]}</strong>
              </p>
              <p className="field-help">
                試算用估值，含家裡已有的食材，非即時售價。
              </p>
              <BudgetImpact amount={recipeCosts[r.name]} budget={budget} />
              <p>食材：{r.ingredients.join('、')}</p>
              {r.urgent.length > 0 && (
                <p className="urgent-ingredients">
                  先用快到期食材：{r.urgent.join('、')}
                </p>
              )}
              {hasIngredients && (
                <p>
                  你有：{r.hits.join('、')} ／ 還缺：
                  {r.ingredients
                    .filter((i) => !r.hits.includes(i))
                    .join('、') || '主要食材都有了'}
                </p>
              )}
              <button
                className="primary-button"
                disabled={!!budget.error}
                onClick={() =>
                  setMeal({ name: r.name, cost: recipeCosts[r.name] })
                }
              >
                記這餐的花費
              </button>
              <button
                className="secondary-button"
                disabled={book.entries.some((e) => e.text === r.name)}
                onClick={() => state.favorite(r.name)}
              >
                {book.entries.some((e) => e.text === r.name)
                  ? '已收藏'
                  : '收藏食譜'}
              </button>
              <button
                className="secondary-button"
                disabled={r.hits.length === r.ingredients.length}
                onClick={() =>
                  supplies(r.ingredients.filter((i) => !r.hits.includes(i)))
                }
              >
                加到採買清單
              </button>
              <details className="recipe-steps">
                <summary>看看怎麼煮</summary>
                <ol>
                  {r.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </details>
            </article>
          ))}
        </div>
      )}
      <section className="supply-section">
        <h2>食材採買清單</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (supplyText.trim()) supplies([supplyText.trim()])
          }}
        >
          <label>
            補充食材
            <input
              required
              maxLength={100}
              value={supplyText}
              onChange={(e) => setSupplyText(e.target.value)}
            />
          </label>
          <button className="secondary-button">加入採買</button>
        </form>
        {book.supplies?.length ? (
          <>
            <ul className="supply-list">
              {book.supplies.map((item) => (
                <li key={item.name}>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        save({
                          ...book,
                          supplies: book.supplies!.map((s) =>
                            s.name === item.name ? { ...s, done: !s.done } : s,
                          ),
                        })
                      }
                    />
                    <span className={item.done ? 'crossed' : ''}>
                      {item.name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              className="secondary-button"
              disabled={!book.supplies.some((s) => s.done)}
              onClick={() => {
                const items = book.supplies!.filter((s) => s.done)
                if (
                  save({
                    ...book,
                    supplies: book.supplies!.filter((s) => !s.done),
                  })
                )
                  setCleared(items)
              }}
            >
              清除已買食材
            </button>
          </>
        ) : (
          <p className="empty-state">
            還沒有要補的食材。缺什麼再記，也能從食譜直接加入。
          </p>
        )}
      </section>
      {cleared && (
        <div className="undo-row">
          <span>已清除 {cleared.length} 項已買食材</span>
          <button
            className="secondary-button"
            onClick={() => {
              const names = new Set(book.supplies?.map((s) => s.name))
              if (
                save({
                  ...book,
                  supplies: [
                    ...(book.supplies ?? []),
                    ...cleared.filter((s) => !names.has(s.name)),
                  ],
                })
              )
                setCleared(null)
            }}
          >
            復原清除食材
          </button>
        </div>
      )}
      <section className="favorites">
        <h2>我的收藏</h2>
        {!book.entries.length && (
          <p className="empty-state">遇到想再煮一次的，就把食譜收在這裡。</p>
        )}
        {book.entries.map((entry) => (
          <article className="record" key={entry.id}>
            <div>
              <h3>{entry.text}</h3>
              <details className="recipe-steps">
                <summary>看看怎麼煮</summary>
                <ol>
                  {recipes
                    .find((r) => r.name === entry.text)
                    ?.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                </ol>
              </details>
            </div>
            <button
              className="delete-button"
              aria-label={'取消收藏 ' + entry.text}
              onClick={() => state.remove(entry)}
            >
              取消收藏
            </button>
          </article>
        ))}
      </section>
      {meal && (
        <QuickExpense
          initial={{ amount: meal.cost, note: meal.name, category: '餐飲' }}
          onClose={() => setMeal(null)}
        />
      )}
    </WorkspaceFrame>
  )
}
