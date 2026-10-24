import type { Entry } from '../data/storage'
import { formatDate } from '../ui/format'
export type Reflection = Pick<
  Entry,
  'buyReason' | 'ownsSimilar' | 'useFrequency'
>
export function ShoppingQuestions({
  value,
  onChange,
}: {
  value: Reflection
  onChange: (value: Reflection) => void
}) {
  return (
    <fieldset className="shopping-questions">
      <legend>留給明天的自己（選填）</legend>
      <label>
        為什麼想買？
        <textarea
          value={value.buyReason ?? ''}
          onChange={(e) => onChange({ ...value, buyReason: e.target.value })}
          maxLength={300}
          rows={2}
          placeholder="是現在需要，還是剛好看到喜歡的？"
        />
      </label>
      <div className="form-row">
        <label>
          已經有類似的物品嗎？
          <select
            value={value.ownsSimilar ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                ownsSimilar: (e.target.value ||
                  undefined) as Reflection['ownsSimilar'],
              })
            }
          >
            <option value="">還沒想過</option>
            <option value="yes">有類似的</option>
            <option value="no">目前沒有</option>
            <option value="unsure">不確定</option>
          </select>
        </label>
        <label>
          預計多久會用一次？
          <select
            value={value.useFrequency ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                useFrequency: (e.target.value ||
                  undefined) as Reflection['useFrequency'],
              })
            }
          >
            <option value="">還沒想過</option>
            <option value="daily">幾乎每天</option>
            <option value="weekly">每週幾次</option>
            <option value="monthly">每月幾次</option>
            <option value="rarely">偶爾才用</option>
          </select>
        </label>
      </div>
    </fieldset>
  )
}
export function ShoppingAnswers({ entry }: { entry: Entry }) {
  const similar = {
    yes: '有類似物品',
    no: '目前沒有類似物品',
    unsure: '還不確定是否有類似物品',
  }
  const frequency = {
    daily: '幾乎每天用',
    weekly: '每週幾次',
    monthly: '每月幾次',
    rarely: '偶爾才用',
  }
  return (
    <div className="shopping-answers">
      <p>
        <strong>當時想買的原因</strong>
        <br />
        {entry.buyReason || '當時沒有填寫原因。'}
      </p>
      <p>
        {entry.ownsSimilar ? similar[entry.ownsSimilar] : '尚未評估類似物品'} ·{' '}
        {entry.useFrequency
          ? frequency[entry.useFrequency]
          : '尚未評估使用頻率'}
      </p>
      {entry.decidedOn && (
        <small>決定日期：{formatDate(entry.decidedOn)}</small>
      )}
    </div>
  )
}
