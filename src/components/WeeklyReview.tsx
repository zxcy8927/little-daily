import { useMemo, useState } from 'react'
import { readBookSnapshot, toolIds, type Book } from '../data/storage'
import { shiftDate, weeklyReview } from '../data/workflows'
export default function WeeklyReview({now}:{now:number}) {
  const d=new Date(now)
  const today=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const [offset,setOffset]=useState(0)
  const result=useMemo(()=>{
    const books:Partial<Record<string,Book>>={};const errors:string[]=[]
    for(const id of toolIds) {try{books[id]=readBookSnapshot(localStorage,id).book}catch{errors.push(id)}}
    return {...weeklyReview(books,shiftDate(today,offset*7)),errors}
  },[today,offset,now])
  const money=(n:number)=>new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(n)
  const failed=(id:string)=>result.errors.includes(id)
  return <section className="weekly-review pixel-panel" aria-labelledby="weekly-title"><div className="section-heading"><h2 id="weekly-title">這週，生活留了些什麼</h2><span>{result.start} ～ {result.end}</span></div><div className="week-controls"><button className="secondary-button" onClick={()=>setOffset(n=>n-1)}>← 上一週</button><button className="secondary-button" disabled={offset===0} onClick={()=>setOffset(n=>n+1)}>下一週 →</button>{offset!==0 && <button className="secondary-button" onClick={()=>setOffset(0)}>回到本週</button>}</div>
    <div className="review-grid"><div><span>實際支出</span><strong>{failed('budget') ? '暫時無法讀取' : `${money(result.spent)} 元`}</strong></div><div><span>避免的預計支出</span><strong>{failed('shopping') ? '暫時無法讀取' : `${money(result.avoided)} 元`}</strong><small>不是實際存款，不會加入預算餘額</small></div><div><span>完成待辦</span><strong>{failed('tasks') ? '暫時無法讀取' : `${result.completed} 件`}</strong></div><div><span>用完冰箱食材</span><strong>{failed('cooking') ? '暫時無法讀取' : `${result.foodsUsed} 項`}</strong></div></div>
    <p className="field-help">{failed('dog') ? '寵物日記暫時無法讀取' : `${result.petNotes} 筆寵物日記`} · {failed('date') ? '約會紀錄暫時無法讀取' : `${result.dates} 次約會完成紀錄`}</p>
    {result.avoidedItems.length>0 && <details className="avoided-details"><summary>看看這週決定不買的 {result.avoidedItems.length} 件東西</summary><ul>{result.avoidedItems.map(e=><li key={e.id}><span>{e.text}</span><span>{money(e.amount)} 元 · {e.decidedOn}</span></li>)}</ul></details>}
    <p className="field-help">每週一至週日統計；尚未結束的本週會持續更新。依目前完成／不買狀態與日期統計；改回未完成或考慮會更新回顧。沒有日期的舊紀錄不回填。</p>{result.errors.length>0 && <p role="status" className="form-error">部分紀錄無法讀取，對應項目暫不統計。</p>}
  </section>
}
