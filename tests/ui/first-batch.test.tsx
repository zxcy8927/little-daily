import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import ShoppingJourney from '../../src/components/ShoppingJourney'
import { bookKey } from '../../src/data/storage'
import { onboardingKey } from '../../src/data/onboarding'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(onboardingKey, 'seen')
  window.history.replaceState(null, '', '/#/')
})
const expired = {
  id: 'coat',
  text: '衣服',
  amount: 1500,
  date: '2020-01-01T00:00:00.000Z',
  done: false,
  status: 'thinking',
  coolingDays: 7,
}

describe('第一批介面流程', () => {
  it('首頁先提供新增與到期入口，點選可進入冷靜清單', async () => {
    localStorage.setItem(
      bookKey('shopping'),
      JSON.stringify({ entries: [expired], limit: 500 }),
    )
    const user = userEvent.setup()
    render(<App />)
    expect(
      screen.getByRole('button', {
        name: '有 1 件想買的東西，現在可以決定了 →',
      }),
    ).toBeTruthy()
    await user.click(
      within(screen.getByRole('group', { name: '首頁快速操作' })).getByRole(
        'button',
        { name: '新增想買物品' },
      ),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: '購物冷靜清單' }),
      ).toBeTruthy(),
    )
  })
  it('週回顧與備份不再重複收合，展開後可找到下載入口', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('生活小本子', { selector: 'summary' }))
    for (const label of ['查看本週生活回顧', '資料備份、還原與安裝']) {
      const summary = screen.getByText(label, { selector: 'summary' })
      await user.click(summary)
      expect((summary.parentElement as HTMLDetailsElement).open).toBe(true)
    }
    expect(
      screen.getByRole('heading', { name: '這週，生活留了些什麼' }),
    ).toBeTruthy()
    await user.click(
      screen.getByText('資料備份與匯入', { selector: 'summary' }),
    )
    expect(screen.getByRole('button', { name: '下載備份' })).toBeTruthy()
  })
  it('首頁直接展示小屋且只留一個新增入口，可前往佈置', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: '我的小屋' }),
    ).toBeTruthy()
    expect(
      await screen.findAllByRole('button', { name: '新增想買物品' }),
    ).toHaveLength(1)
    expect(document.querySelector('.home-world')?.closest('details')).toBeNull()
    await user.click(screen.getByRole('button', { name: '佈置小屋' }))
    expect(
      await screen.findByRole('region', { name: '小屋選物店' }),
    ).toBeTruthy()
  })
  it('切換回顧與小屋後仍保留清單草稿', async () => {
    const user = userEvent.setup()
    render(<ShoppingJourney onBack={() => {}} />)
    await user.type(screen.getByLabelText('想買的東西'), '外套')
    await user.click(
      screen.getByRole('button', { name: '省錢回顧', exact: true }),
    )
    expect(screen.getByRole('heading', { name: '每月省錢回顧' })).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: '想買的東西' })).toBeNull()
    await user.click(
      screen.getByRole('button', { name: '小屋與商店', exact: true }),
    )
    expect(
      await screen.findByRole('heading', { name: '我的小屋' }),
    ).toBeTruthy()
    await user.click(screen.getByRole('button', { name: '清單', exact: true }))
    expect(
      (screen.getByLabelText('想買的東西') as HTMLInputElement).value,
    ).toBe('外套')
  })
  it('不買完成提示可直接前往小屋，購買扣一次且重新載入保留', async () => {
    localStorage.setItem(
      bookKey('shopping'),
      JSON.stringify({ entries: [expired], limit: 500 }),
    )
    const user = userEvent.setup()
    const app = render(<ShoppingJourney onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: '回顧並決定' }))
    await user.type(screen.getByLabelText('這次決定的原因'), '已有類似的衣服')
    await user.click(
      screen.getByRole('button', { name: '決定不買，留下這筆錢' }),
    )
    expect(
      screen.getByRole('heading', { name: '衣服，這次先不買。' }),
    ).toBeTruthy()
    expect(screen.queryByText(/上方小世界/)).toBeNull()
    await user.click(screen.getByRole('button', { name: '前往小屋' }))
    await user.click(
      await screen.findByRole('button', { name: '選物店', exact: true }),
    )
    const shop = await screen.findByRole('region', { name: '小屋選物店' })
    expect(within(shop).getByText('170 金幣')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: '試擺 鼠尾草抱枕' }))
    await user.click(
      screen.getByRole('button', { name: '確認購買 40 金幣 並擺放' }),
    )
    expect(within(shop).getByText('130 金幣')).toBeTruthy()
    expect(
      screen.getByText('靠不買累積 50 金幣 · 家具花了 40 金幣'),
    ).toBeTruthy()
    expect(
      JSON.parse(localStorage.getItem(bookKey('shopping'))!).furniture.owned,
    ).toEqual([{ id: 'sage-cushion', cost: 40 }])
    app.unmount()
    render(<App />)
    expect(screen.getByLabelText('可用金幣 130')).toBeTruthy()
    await user.click(
      within(screen.getByRole('group', { name: '首頁快速操作' })).getByRole(
        'button',
        { name: '新增想買物品' },
      ),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: '購物冷靜清單' }),
      ).toBeTruthy(),
    )
    await user.click(
      screen.getByRole('button', { name: '小屋與商店', exact: true }),
    )
    await user.click(
      await screen.findByRole('button', { name: '選物店', exact: true }),
    )
    expect(screen.getByText('130 金幣')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: '試擺 鼠尾草抱枕' }))
    await user.click(screen.getByRole('button', { name: '儲存擺放' }))
    expect(screen.getByText('130 金幣')).toBeTruthy()
  })
})
