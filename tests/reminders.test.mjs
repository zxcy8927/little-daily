import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const source=ts.transpileModule(readFileSync(new URL('../src/data/reminders.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const {reminderPlan}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const now=Date.parse('2026-10-19T00:00:00Z')
const item=(id,extra={})=>({id,text:'私人購物名稱',amount:1500,date:new Date(now).toISOString(),done:false,coolingDays:7,...extra})
test('預設不排通知；只排未決定且未到期物品，不含金額或名稱',()=>{
 const entries=[item('a'),item('old',{date:'2026-10-01T00:00:00Z'}),item('skip',{done:true,status:'skipped'}),item('bought',{status:'bought'}),item('cancelled',{status:'cancelled'})]
 assert.deepEqual(reminderPlan({entries,limit:500},now),[])
 const plan=reminderPlan({entries,limit:500,remindersEnabled:true},now)
 assert.deepEqual(plan,[{id:410000,at:now+7*86400000}])
 assert.equal(JSON.stringify(plan).includes('私人'),false)
})
test('通知依最近到期排序，最多 32 則，與其他通知使用不同編號範圍',()=>{
 const entries=Array.from({length:40},(_,i)=>item(String(i),{date:new Date(now+i*1000).toISOString()})).reverse()
 const plan=reminderPlan({entries,limit:500,remindersEnabled:true},now)
 assert.equal(plan.length,32)
 assert.equal(new Set(plan.map(n=>n.id)).size,32)
 assert.equal(plan[0].at,now+7*86400000)
 assert.equal(plan.at(-1).at,now+7*86400000+31000)
})
