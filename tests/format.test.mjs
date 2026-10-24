import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const code = ts.transpileModule(
  readFileSync(new URL('../src/ui/format.ts', import.meta.url), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText
const { formatDate } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
)
test('日期顯示本地星期，跨年加年份且不改動無效原值', () => {
  const now = new Date(2026, 9, 24)
  assert.equal(formatDate('2026-10-24', now), '10 月 24 日（六）')
  assert.equal(formatDate('2025-12-31', now), '2025 年 12 月 31 日（三）')
  assert.equal(formatDate('2026-02-31', now), '2026-02-31')
  assert.equal(formatDate('日期不明', now), '日期不明')
})
