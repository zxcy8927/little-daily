import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const source=ts.transpileModule(readFileSync(new URL('../src/data/shopping.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const {settleShopping,shoppingProgress,recordSaved,coolingEnd}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const start=Date.parse('2026-10-19T00:00:00Z'),end=start+7*86400000
const item={id:'clothes',text:'衣服',amount:1500,date:new Date(start).toISOString(),done:false,status:'thinking',coolingDays:7}
const book={entries:[item],limit:500}
test('7 天到期邊界、原因必填與不買收據',()=>{
 assert.equal(coolingEnd(item),end)
 assert.throws(()=>settleShopping(book,item.id,'skipped',end-1,'已有類似'))
 assert.throws(()=>settleShopping(book,item.id,'bought',end-1,'需要'))
 assert.throws(()=>settleShopping(book,item.id,'skipped',end,' '))
 const result=settleShopping(book,item.id,'skipped',end,'已有類似')
 assert.deepEqual(shoppingProgress(result),{avoided:1500,saved:0,coins:50,count:1})
 assert.equal(result.entries[0].note,'已有類似')
 assert.equal(item.done,false)
 assert.throws(()=>settleShopping(result,item.id,'skipped',end,'重複'))
 assert.throws(()=>settleShopping(result,item.id,'bought',end,'改買'))
})
test('實際存款須自行確認，可分批調整，不增加獎勵',()=>{
 const result=settleShopping(book,item.id,'skipped',end,'不需要')
 const partial=recordSaved(result,item.id,500)
 assert.equal(shoppingProgress(partial).saved,500)
 assert.equal(shoppingProgress(recordSaved(partial,item.id,1500)).saved,1500)
 assert.equal(shoppingProgress(recordSaved(partial,item.id,0)).coins,50)
 for(const n of [-1,1501,NaN,Infinity])assert.throws(()=>recordSaved(result,item.id,n))
 assert.throws(()=>recordSaved(book,item.id,500))
})
test('購買沒有避免支出或金幣，舊紀錄保留一天冷靜期且不追發獎勵',()=>{
 const bought=settleShopping(book,item.id,'bought',end,'確實需要')
 assert.deepEqual(shoppingProgress(bought),{avoided:0,saved:0,coins:0,count:0})
 assert.equal(coolingEnd({...item,coolingDays:undefined}),start+86400000)
 assert.deepEqual(shoppingProgress({entries:[{...item,done:true,status:'skipped'}]}),{avoided:1500,saved:0,coins:0,count:1})
})
const storageCode=ts.transpileModule(readFileSync(new URL('../src/data/storage.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const {isBook,collectBackup,parseBackup,mergeBackup,bookKey,saveBookSnapshot}=await import('data:text/javascript;base64,'+Buffer.from(storageCode).toString('base64'))
test('獎勵、存款與擺放包含備份；拒絕錯誤金額與冷靜期',()=>{
 const result={...recordSaved(settleShopping(book,item.id,'skipped',end,'不需要'),item.id,500),supplies:[{name:'小盆栽',done:false}]}
 const key=bookKey('shopping'),map=new Map([[key,JSON.stringify(result)]]),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}
 const backup=parseBackup(JSON.stringify(collectBackup(storage)))
 assert.deepEqual(backup.data[key],result)
 assert.deepEqual(mergeBackup(backup,backup).data[key],result)
 for(const patch of [{coolingDays:0},{coolingDays:'7'},{rewardCoins:51},{rewardCoins:-1},{savedAmount:1501}])assert.equal(isBook({...result,entries:[{...result.entries[0],...patch}]},'shopping'),false)
 const raw=storage.getItem(key)
 saveBookSnapshot(storage,'shopping',raw,{...result,supplies:[{name:'小盆栽',done:true}]})
 assert.throws(()=>saveBookSnapshot(storage,'shopping',raw,result))
})
const {editShopping,cancelShopping,savingsCsv}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
test('修改保留原始到期日，撤回可復原且不產生避免支出或獎勵',()=>{
 const edited=editShopping(book,item.id,'外套',1200,{buyReason:'換季'})
 assert.equal(edited.entries[0].amount,1200)
 assert.equal(coolingEnd(edited.entries[0]),end)
 const cancelled=cancelShopping(edited,item.id)
 assert.equal(cancelled.entries[0].status,'cancelled')
 assert.deepEqual(shoppingProgress(cancelled),{avoided:0,saved:0,coins:0,count:0})
 assert.throws(()=>settleShopping(cancelled,item.id,'skipped',end,'不買'))
 assert.equal(coolingEnd(cancelShopping(cancelled,item.id,true).entries[0]),end)
 const settled=settleShopping(edited,item.id,'skipped',end,'不買')
 assert.throws(()=>cancelShopping(settled,item.id))
 assert.throws(()=>editShopping(settled,item.id,'洗掉獎勵',100,{}))
})
test('月份 CSV 分開避免支出與目前已存金額，保留引號並防止公式注入',()=>{
 const result=recordSaved(settleShopping({...book,entries:[{...item,text:'=SUM(1,2)'}]},item.id,'skipped',end,'已有"類似"'),item.id,500)
 const csv=savingsCsv(result,'2026-10')
 assert.match(csv,/已自行存下 NT\$/)
 assert.match(csv,/'=SUM\(1,2\)/)
 assert.match(csv,/"1500","500","50"/)
 assert.match(csv,/已有""類似""/)
 assert.equal(savingsCsv(result,'2026-11').split('\r\n').length,1)
 assert.throws(()=>settleShopping(book,item.id,'skipped',NaN,'不買'))
})
test('存錢目標與通知偏好可備份，拒絕跨工具或無效設定',()=>{
 const result={...book,savingsGoal:{name:'旅行',target:5000},remindersEnabled:true}
 assert.equal(isBook(result,'shopping'),true)
 assert.equal(isBook({...result,savingsGoal:{name:'旅行',target:0}},'shopping'),false)
 assert.equal(isBook({...result,remindersEnabled:'yes'},'shopping'),false)
 const key=bookKey('shopping'),map=new Map([[key,JSON.stringify(result)]])
 assert.deepEqual(parseBackup(JSON.stringify(collectBackup({getItem:k=>map.get(k)??null}))).data[key],result)
 assert.equal(isBook({...book,entries:[{...item,status:'bought',rewardCoins:50}]},'shopping'),false)
})
