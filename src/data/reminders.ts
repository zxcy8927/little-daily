import type {Book} from './storage'
export function reminderPlan(book:Book,now:number){
 if(!book.remindersEnabled)return []
 const pending=book.entries.filter(e=>!e.done&&e.status!=='skipped'&&e.status!=='bought'&&e.status!=='cancelled').map(e=>({id:e.id,at:Date.parse(e.date)+(e.coolingDays??1)*86400000})).filter(e=>e.at>now).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id)).slice(0,32)
 return pending.map((e,i)=>({id:410000+i,at:e.at}))
}
