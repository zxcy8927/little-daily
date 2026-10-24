import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Budget from '../../src/components/tools/BudgetWorkspace'
import Tasks from '../../src/components/tools/TaskWorkspace'
import Cooking from '../../src/components/tools/CookingWorkspace'
import Dates from '../../src/components/tools/DateWorkspace'
import ShoppingJourney from '../../src/components/ShoppingJourney'
import { bookKey } from '../../src/data/storage'
import { tools } from '../../src/data/tools'
vi.mock('../../src/native', () => ({
  isNative: false,
  exportText: vi.fn().mockResolvedValue(undefined),
}))
beforeEach(() => localStorage.clear())
const tool = (id: string) => tools.find((t) => t.id === id)!
const read = (id: string) => JSON.parse(localStorage.getItem(bookKey(id))!)

describe('獨立工具與小屋回歸流程', () => {
  it('預算可讀取舊支出、編輯、篩選、匯出及復原刪除，保留購物來源', async () => {
    localStorage.setItem(
      bookKey('budget'),
      JSON.stringify({
        limit: 500,
        entries: [
          {
            id: 'expense',
            text: '外套',
            amount: 90,
            date: new Date().toLocaleDateString('sv-SE'),
            done: false,
            category: '購物',
            sourceShoppingId: 'old-shopping',
          },
        ],
      }),
    )
    const user = userEvent.setup()
    render(<Budget tool={tool('budget')} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: '編輯 外套' }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByLabelText('金額（元）'))
    await user.type(within(dialog).getByLabelText('金額（元）'), '75')
    await user.click(within(dialog).getByRole('button', { name: '儲存修改' }))
    expect(read('budget').entries[0].amount).toBe(75)
    expect(read('budget').entries[0].sourceShoppingId).toBe('old-shopping')
    await user.selectOptions(screen.getByLabelText('明細分類'), '餐飲')
    expect(screen.queryByRole('heading', { name: '外套' })).toBeNull()
    await user.selectOptions(screen.getByLabelText('明細分類'), '購物')
    await user.click(screen.getByRole('button', { name: '匯出目前清單 CSV' }))
    const { exportText } = await import('../../src/native')
    expect(exportText).toHaveBeenCalledWith(
      expect.stringContaining('外套'),
      expect.stringContaining('expenses'),
      expect.any(String),
    )
    await user.click(screen.getByRole('button', { name: '刪除 外套' }))
    expect(read('budget').entries).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: '復原上一筆' }))
    expect(read('budget').entries[0].amount).toBe(75)
  })
  it('待辦可新增、修改期限、完成及復原刪除', async () => {
    const user = userEvent.setup()
    render(<Tasks tool={tool('tasks')} onBack={() => {}} />)
    await user.type(screen.getByLabelText('要做的事'), '整理書桌')
    await user.click(screen.getByRole('button', { name: '新增紀錄' }))
    await user.click(screen.getByRole('button', { name: '編輯 整理書桌' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('期限（選填）'), '2020-01-01')
    await user.selectOptions(within(dialog).getByLabelText('優先順序'), 'high')
    await user.click(within(dialog).getByRole('button', { name: '儲存修改' }))
    await user.click(
      screen.getByRole('button', { name: '已逾期', exact: true }),
    )
    expect(screen.getByRole('heading', { name: '整理書桌' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: '完成', exact: true }))
    expect(read('tasks').entries[0].completedOn).toBeTruthy()
    await user.click(
      screen.getByRole('button', { name: '已完成', exact: true }),
    )
    await user.click(screen.getByRole('button', { name: '刪除 整理書桌' }))
    await user.click(screen.getByRole('button', { name: '復原上一筆' }))
    expect(read('tasks').entries[0].done).toBe(true)
  })
  it('料理保留冰箱資料，缺少食材加入採買不重複，收藏可復原', async () => {
    const food = {
      id: 'egg',
      name: '蛋',
      quantity: '2 顆',
      expiresOn: '2099-01-01',
      state: 'available',
    }
    localStorage.setItem(
      bookKey('cooking'),
      JSON.stringify({ limit: 500, entries: [], foods: [food] }),
    )
    const user = userEvent.setup()
    render(<Cooking tool={tool('cooking')} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: '找找能煮什麼' }))
    const recipe = screen
      .getByRole('heading', { name: '番茄炒蛋' })
      .closest('article')!
    await user.click(
      within(recipe).getByRole('button', { name: '缺少食材加入採買' }),
    )
    await user.click(
      within(recipe).getByRole('button', { name: '缺少食材加入採買' }),
    )
    expect(
      read('cooking').supplies.filter(
        (s: { name: string }) => s.name === '番茄',
      ),
    ).toHaveLength(1)
    expect(read('cooking').foods).toEqual([food])
    await user.click(within(recipe).getByRole('button', { name: '收藏食譜' }))
    await user.click(screen.getByRole('button', { name: '取消收藏 番茄炒蛋' }))
    await user.click(screen.getByRole('button', { name: '復原上一筆' }))
    expect(read('cooking').entries[0].text).toBe('番茄炒蛋')
  })
  it('約會舊收藏可安排日期、保留心得，並可抽取免費點子', async () => {
    localStorage.setItem(
      bookKey('date'),
      JSON.stringify({
        limit: 500,
        entries: [
          {
            id: 'date',
            text: '舊收藏',
            amount: 400,
            date: '2026-10-19',
            done: false,
            note: '原心得',
          },
        ],
      }),
    )
    const user = userEvent.setup()
    render(<Dates tool={tool('date')} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: '安排與心得' }))
    const dialog = screen.getByRole('dialog')
    await user.type(
      within(dialog).getByLabelText('安排日期（選填）'),
      '2026-11-01',
    )
    await user.click(within(dialog).getByRole('button', { name: '儲存修改' }))
    expect(read('date').entries[0].note).toBe('原心得')
    await user.click(screen.getByRole('button', { name: '記下去過了' }))
    expect(read('date').entries[0].done).toBe(true)
    await user.type(screen.getByLabelText('兩人預算（元）'), '0')
    await user.click(screen.getByRole('button', { name: '抽個約會點子' }))
    await user.click(screen.getByRole('button', { name: '收藏這個點子' }))
    expect(read('date').entries[0].amount).toBe(0)
  })
  it('付費預覽集中到房間風格，房間定位點可直接調整試擺且不扣款', async () => {
    const user = userEvent.setup()
    render(<ShoppingJourney onBack={() => {}} />)
    await user.click(
      screen.getByRole('button', { name: '小屋與商店', exact: true }),
    )
    await screen.findByRole('heading', { name: '小屋選物店' })
    expect(screen.queryByRole('button', { name: '試擺 月牙閱讀椅' })).toBeNull()
    await user.click(screen.getByRole('button', { name: '試擺 鼠尾草抱枕' }))
    await user.click(screen.getByRole('button', { name: '擺在窗邊' }))
    expect(localStorage.getItem(bookKey('shopping'))).toBeNull()
    await user.click(
      screen.getByRole('button', { name: '確認購買 40 金幣 並擺放' }),
    )
    expect(read('shopping').furniture.layout[0]).toMatchObject({
      x: 100,
      y: 350,
    })
    await user.click(
      screen.getByRole('button', { name: '房間風格', exact: true }),
    )
    await user.click(screen.getByRole('button', { name: '試擺 月牙閱讀椅' }))
    expect(
      (
        screen.getByRole('button', {
          name: '尚未開放購買',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
    expect(read('shopping').furniture.owned).toHaveLength(1)
  })
})
