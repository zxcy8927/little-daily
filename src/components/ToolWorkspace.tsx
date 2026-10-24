import { lazy, Suspense } from 'react'
import type { DailyTool } from '../data/tools'
import './ToolWorkspace.css'
import PageBoundary from './PageBoundary'
const Cooking = lazy(() => import('./tools/CookingWorkspace'))
const Budget = lazy(() => import('./tools/BudgetWorkspace'))
const Tasks = lazy(() => import('./tools/TaskWorkspace'))
const Dates = lazy(() => import('./tools/DateWorkspace'))
const pages = { cooking: Cooking, budget: Budget, tasks: Tasks, date: Dates }
export default function ToolWorkspace({
  tool,
  onBack,
}: {
  tool: DailyTool
  onBack: () => void
}) {
  const Page = pages[tool.id as keyof typeof pages]
  return (
    <PageBoundary key={tool.id}>
      <Suspense fallback={<p role="status">小本子正在翻開…</p>}>
        {Page ? (
          <Page tool={tool} onBack={onBack} />
        ) : (
          <p role="alert">這個入口沒找到，回首頁再開一次看看。</p>
        )}
      </Suspense>
    </PageBoundary>
  )
}
