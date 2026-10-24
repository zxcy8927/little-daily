import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Tasks from '../../src/components/tools/TaskWorkspace'
import BackupPanel from '../../src/components/BackupPanel'
import PetDiary from '../../src/components/PetDiary'
import { tools } from '../../src/data/tools'
import { bookKey } from '../../src/data/storage'
import { errorText } from '../../src/ui/copy'
import { formatDateTime, formatMonth } from '../../src/ui/format'

it('儲存空間不足時保留待辦草稿及原始紀錄，可修好後重試', async () => {
  const original = JSON.stringify({ entries: [], limit: 500 })
  localStorage.setItem(bookKey('tasks'), original)
  render(
    <Tasks tool={tools.find((t) => t.id === 'tasks')!} onBack={() => {}} />,
  )
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('要做的事'), '替小兔換水')
  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
  await user.click(screen.getByRole('button', { name: '新增紀錄' }))
  expect(screen.getByRole('alert').textContent).toContain('儲存空間不夠')
  expect((screen.getByLabelText('要做的事') as HTMLInputElement).value).toBe(
    '替小兔換水',
  )
  expect(localStorage.getItem(bookKey('tasks'))).toBe(original)
  write.mockRestore()
  await user.click(screen.getByRole('button', { name: '新增紀錄' }))
  expect(
    JSON.parse(localStorage.getItem(bookKey('tasks'))!).entries[0].text,
  ).toBe('替小兔換水')
})

it('選到損壞備份不修改目前資料，也不提供合併按鈕', async () => {
  const original = JSON.stringify({ entries: [], limit: 500 })
  localStorage.setItem(bookKey('budget'), original)
  const imported = vi.fn()
  render(<BackupPanel onImported={imported} />)
  const file = new File(['broken'], 'backup.json', { type: 'application/json' })
  Object.defineProperty(file, 'text', { value: async () => 'broken' })
  fireEvent.change(screen.getByLabelText('選擇備份檔'), {
    target: { files: [file] },
  })
  expect(await screen.findByText(/這份檔案讀不懂/)).toBeTruthy()
  expect(screen.queryByRole('button', { name: '確認合併匯入' })).toBeNull()
  expect(localStorage.getItem(bookKey('budget'))).toBe(original)
  expect(imported).not.toHaveBeenCalled()
})

it('既有寵物日記只轉換顯示日期，不更動生日與分類儲存值', () => {
  const original = JSON.stringify({
    limit: 500,
    pets: [
      {
        id: 'p',
        name: '麻糬',
        species: '狗',
        birthday: '2020-01-02',
        archived: false,
      },
    ],
    entries: [
      {
        id: 'e',
        petId: 'p',
        text: '吃飯｜吃光了',
        date: '2026-10-24',
        amount: 0,
        done: false,
      },
    ],
  })
  localStorage.setItem(bookKey('dog'), original)
  render(<PetDiary onBack={() => {}} />)
  expect(screen.getByText(/生日 2020 年 1 月 2 日/)).toBeTruthy()
  expect(localStorage.getItem(bookKey('dog'))).toBe(original)
})

it('日期時間使用裝置本地時間；未知錯誤不直接露出英文例外', () => {
  const local = new Date(2026, 9, 24, 9, 5).toISOString()
  expect(formatDateTime(local, new Date(2026, 9, 24))).toBe(
    '10 月 24 日（六） 09:05',
  )
  expect(formatDateTime('bad')).toBe('bad')
  expect(formatMonth('2026-10')).toBe('2026 年 10 月')
  expect(formatMonth('2026-13')).toBe('2026-13')
  expect(errorText(new Error('這不是支援的備份檔。'))).toBe(
    '這不是支援的備份檔。',
  )
  expect(errorText(new Error('database failure'))).not.toContain('database')
  expect(errorText(new DOMException('blocked', 'SecurityError'))).toContain(
    '隱私與儲存設定',
  )
})
