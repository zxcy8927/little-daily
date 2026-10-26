import { collectBackup } from '../../src/data/storage'
import { beforeEach, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import HomeOverview from '../../src/components/HomeOverview'
import { bookKey } from '../../src/data/storage'
import { onboardingKey } from '../../src/data/onboarding'

beforeEach(() => {
  localStorage.setItem(onboardingKey, 'seen')
  window.history.replaceState(null, '', '/#/')
})

it('空白首頁只有一個新增入口，小屋直接展示而且不寫入紀錄', async () => {
  const before = collectBackup(localStorage).data
  render(<App />)
  await screen.findByRole('heading', { name: '我的小屋', exact: true })
  expect(document.querySelector('.home-world')?.closest('details')).toBeNull()
  expect(screen.getAllByRole('button', { name: '新增想買物品' })).toHaveLength(
    1,
  )
  expect(screen.getByText('目前沒有東西在冷靜，錢包很安全。')).toBeTruthy()
  expect(document.querySelector('.overview-grid')).toBeNull()
  expect(document.querySelector('.home-notebook')).toBeNull()
  expect(collectBackup(localStorage).data).toEqual(before)
})

it('仍在冷靜的東西不會誤顯示為空清單', () => {
  localStorage.setItem(
    bookKey('shopping'),
    JSON.stringify({
      limit: 500,
      entries: [
        {
          id: 'future',
          text: '外套',
          amount: 1500,
          date: '2099-01-01T00:00:00.000Z',
          done: false,
          status: 'thinking',
          coolingDays: 7,
        },
      ],
    }),
  )
  render(<App />)
  expect(screen.getByText('有 1 件還在冷靜，過幾天再來看看。')).toBeTruthy()
  expect(screen.queryByText('目前沒有東西在冷靜，錢包很安全。')).toBeNull()
})

it('讀取失敗顯示錯誤且保留原值，不當成空清單', async () => {
  localStorage.setItem(bookKey('shopping'), 'broken')
  render(<App />)
  expect(
    screen.getByText('想買清單讀不到，先保留備份，別急著新增。'),
  ).toBeTruthy()
  await screen.findByRole('heading', { name: '我的小屋', exact: true })
  expect(localStorage.getItem(bookKey('shopping'))).toBe('broken')
  expect(screen.queryByText('目前沒有東西在冷靜，錢包很安全。')).toBeNull()
})

it('今日支出超過預算仍顯示負額，隱藏預算設定仍有效', () => {
  localStorage.setItem(
    bookKey('budget'),
    JSON.stringify({
      limit: 500,
      entries: [
        {
          id: 'expense',
          text: '晚餐',
          amount: 600,
          date: '2026-10-24',
          done: false,
        },
      ],
    }),
  )
  const props = { now: new Date(2026, 9, 24).getTime(), onOpen: () => {} }
  const view = render(<HomeOverview {...props} />)
  expect(screen.getByText('NT$-100').closest('strong')?.className).toBe(
    'over-budget',
  )
  view.rerender(<HomeOverview {...props} hidden={['budget']} />)
  expect(screen.queryByText('今天還能花')).toBeNull()
})

it('首頁房間保留已購家具與位置，預覽與暫停不扣金幣', async () => {
  const original = JSON.stringify({
    limit: 500,
    entries: [],
    furniture: {
      version: 1,
      owned: [{ id: 'sage-cushion', cost: 40 }],
      layout: [{ id: 'sage-cushion', x: 100, y: 350 }],
    },
  })
  localStorage.setItem(bookKey('shopping'), original)
  const user = userEvent.setup()
  render(<App />)
  const item = await screen.findByRole('img', { name: '鼠尾草抱枕（已擺放）' })
  expect(item.getAttribute('transform')).toContain('52 254')
  await user.click(screen.getByRole('button', { name: '暫停小屋動畫' }))
  expect(localStorage.getItem(bookKey('shopping'))).toBe(original)
})

it('次要工具集中到更多，主分頁保留首頁入口', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('link', { name: '更多', exact: true }))
  await screen.findByRole('heading', { name: '更多生活小事' })
  await user.click(screen.getByRole('button', { name: /^待辦小本/ }))
  await screen.findByRole('heading', { name: '待辦小本' })
  await user.click(screen.getByRole('link', { name: '首頁', exact: true }))
  await screen.findByRole('button', { name: '記一筆' })
})
