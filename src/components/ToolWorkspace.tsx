import { lazy, Suspense } from 'react'
import type { DailyTool } from '../data/tools'
import './ToolWorkspace.css'
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
    <Suspense fallback={<p role="status">正在開啟工具…</p>}>
      {Page ? (
        <Page tool={tool} onBack={onBack} />
      ) : (
        <p role="alert">找不到這項工具，請回首頁重試。</p>
      )}
    </Suspense>
  )
}
