import type { DailyTool } from '../data/tools'
type Props = { tool: DailyTool; onSelect: (tool: DailyTool) => void }
export default function ToolCard({ tool, onSelect }: Props) {
  return <button className="tool-card" data-tool-id={tool.id} type="button" onClick={() => onSelect(tool)}>
    <span className="tool-emoji" aria-hidden="true">{tool.emoji}</span>
    <span className="tool-title">{tool.title}</span>
    <span className="tool-subtitle">{tool.subtitle}</span>
    <span className="tool-arrow" aria-hidden="true">開啟 →</span>
  </button>
}



