import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingTour from '../../src/components/OnboardingTour'
import ShoppingJourney from '../../src/components/ShoppingJourney'
import PageBoundary from '../../src/components/PageBoundary'
import { bookKey } from '../../src/data/storage'
import Tasks from '../../src/components/tools/TaskWorkspace'
import { tools } from '../../src/data/tools'

it('待辦區分初次使用與搜尋無結果，清除篩選後可找回紀錄', async () => {
  const user = userEvent.setup()
  const app = render(
    <Tasks tool={tools.find((t) => t.id === 'tasks')!} onBack={() => {}} />,
  )
  expect(
    screen.getByText('還沒有待辦。先在上方記下一件要做的事。'),
  ).toBeTruthy()
  app.unmount()
  localStorage.setItem(
    bookKey('tasks'),
    JSON.stringify({
      entries: [
        {
          id: 't',
          text: '整理書桌',
          amount: 0,
          date: '2026-10-24',
          done: false,
        },
      ],
      limit: 500,
    }),
  )
  render(
    <Tasks tool={tools.find((t) => t.id === 'tasks')!} onBack={() => {}} />,
  )
  await user.type(screen.getByRole('searchbox'), '不存在')
  expect(screen.getByText('沒有符合條件的待辦。')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: '顯示全部待辦' }))
  expect(screen.getByRole('heading', { name: '整理書桌' })).toBeTruthy()
})

it('取消編輯後回到原按鈕且不更動原始紀錄', async () => {
  const original = JSON.stringify({
    entries: [
      { id: 't', text: '整理書桌', amount: 0, date: '2026-10-24', done: false },
    ],
    limit: 500,
  })
  localStorage.setItem(bookKey('tasks'), original)
  const user = userEvent.setup()
  render(
    <Tasks tool={tools.find((t) => t.id === 'tasks')!} onBack={() => {}} />,
  )
  const trigger = screen.getByRole('button', { name: '編輯 整理書桌' })
  await user.click(trigger)
  await user.type(screen.getByLabelText('內容'), ' 草稿')
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { bubbles: true, cancelable: true }),
  )
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
  expect(localStorage.getItem(bookKey('tasks'))).toBe(original)
})

it('導覽展開巢狀備份並在離開後還原原有收合狀態', async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  const user = userEvent.setup()
  const close = vi.fn()
  const app = render(
    <>
      <details data-testid="outer">
        <summary>備份</summary>
        <details className="backup-panel" data-testid="inner">
          <summary>匯出</summary>
        </details>
      </details>
      <OnboardingTour onClose={close} />
    </>,
  )
  await user.click(screen.getByRole('button', { name: '帶我逛逛 →' }))
  for (let i = 0; i < 4; i++)
    await user.click(screen.getByRole('button', { name: '下一步 →' }))
  const outer = screen.getByTestId('outer') as HTMLDetailsElement
  const inner = screen.getByTestId('inner') as HTMLDetailsElement
  expect(outer.open).toBe(true)
  expect(inner.open).toBe(true)
  await user.click(screen.getByRole('button', { name: '上一步' }))
  expect(outer.open).toBe(false)
  expect(inner.open).toBe(false)
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { bubbles: true, cancelable: true }),
  )
  expect(close).toHaveBeenCalledOnce()
  app.unmount()
  vi.unstubAllGlobals()
})

it('儲存失敗會在購物對話框提示並保留原因，重試只結算一次', async () => {
  const original = JSON.stringify({
    entries: [
      {
        id: 'coat',
        text: '衣服',
        amount: 1500,
        date: '2020-01-01T00:00:00.000Z',
        done: false,
        status: 'thinking',
        coolingDays: 7,
      },
    ],
    limit: 500,
  })
  localStorage.setItem(bookKey('shopping'), original)
  const user = userEvent.setup()
  render(<ShoppingJourney onBack={() => {}} />)
  await user.click(screen.getByRole('button', { name: '回顧並決定' }))
  await user.type(screen.getByLabelText('這次決定的原因'), '已有類似衣服')
  const failure = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('空間不足')
    })
  await user.click(screen.getByRole('button', { name: '決定不買，留下這筆錢' }))
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByRole('alert').textContent).toContain('空間不足')
  expect(
    (screen.getByLabelText('這次決定的原因') as HTMLTextAreaElement).value,
  ).toBe('已有類似衣服')
  expect(localStorage.getItem(bookKey('shopping'))).toBe(original)
  failure.mockRestore()
  await user.click(screen.getByRole('button', { name: '決定不買，留下這筆錢' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(
    JSON.parse(localStorage.getItem(bookKey('shopping'))!).entries[0]
      .rewardCoins,
  ).toBe(50)
  expect(document.activeElement?.textContent).toBe('清單')
})

it('畫面發生錯誤時提供重開入口且不移除既存紀錄', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  localStorage.setItem('keep', 'record')
  const retry = vi.fn()
  function Broken(): never {
    throw new Error('chunk unavailable')
  }
  render(
    <PageBoundary onRetry={retry}>
      <Broken />
    </PageBoundary>,
  )
  expect(screen.getByRole('alert').textContent).toContain('暫時無法開啟')
  await userEvent.click(screen.getByRole('button', { name: '重新開啟' }))
  expect(retry).toHaveBeenCalledOnce()
  expect(localStorage.getItem('keep')).toBe('record')
})
