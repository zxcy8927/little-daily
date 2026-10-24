import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const compile = name => ts.transpileModule(readFileSync(new URL(`../src/data/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const url = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
const storageUrl=url(compile('storage'))
const { isBook, mergeBackup, bookKey, parseBackup }=await import(storageUrl)
const {buildPurchase,summarizeExpenses,selectTasks,appendSupplies,expenseCsv,matchRecipes}=await import(url(compile('workflows').replace(/(['"])\.\/storage\1/,JSON.stringify(storageUrl))))
const entry=(id,extra={})=>({id,text:'測試',amount:120,date:'2026-10-19',done:false,...extra})
const book=entries=>({entries,limit:500})
const backup=data=>({format:'little-daily',version:1,exportedAt:'2026-10-19T00:00:00Z',data})

test('購物入帳保留金額、分類與來源，重複點擊不會再記一次',()=>{
  const shopping=book([entry('s',{status:'bought',date:'2026-10-17T00:00:00Z',amount:49.99})])
  const result=buildPurchase(shopping,book([]),'s','2026-10-19','expense')
  assert.equal(result.entries[0].amount,49.99)
  assert.equal(result.entries[0].category,'購物')
  assert.equal(result.entries[0].sourceShoppingId,'s')
  assert.equal(isBook(result,'budget'),true)
  assert.throws(()=>buildPurchase(shopping,result,'s','2026-10-19','again'))
  assert.equal(shopping.entries[0].status,'bought')
  assert.throws(()=>buildPurchase(book([entry('s')]),book([]),'s','2026-10-19'))
  assert.throws(()=>buildPurchase(shopping,book([]),'s','2026-02-30'))
})
test('合併備份也會略過同一來源的購物支出，保留目前編輯金額',()=>{
  const key=bookKey('budget')
  const current=backup({[key]:book([entry('a',{sourceShoppingId:'s',amount:100})])})
  const incoming=backup({[key]:book([entry('b',{sourceShoppingId:'s',amount:120})])})
  const result=mergeBackup(current,incoming).data[key]
  assert.equal(result.entries.length,1)
  assert.equal(result.entries[0].amount,100)
})
test('月份分類以分加總，舊版未分類支出歸在其他',()=>{
  const result=summarizeExpenses([entry('a',{amount:0.1,category:'餐飲'}),entry('b',{amount:0.2,category:'餐飲'}),entry('c',{amount:50}),entry('d',{date:'2026-09-30',amount:999,category:'餐飲'})],'2026-10')
  assert.equal(result.find(r=>r.category==='餐飲').amount,0.3)
  assert.equal(result.find(r=>r.category==='其他').amount,50)
})
test('待辦期限與優先排序不改動原陣列；已完成不列入逾期',()=>{
  const entries=[entry('later',{dueDate:'2026-10-20'}),entry('low',{dueDate:'2026-10-19',priority:'low'}),entry('high',{dueDate:'2026-10-19',priority:'high'}),entry('late',{dueDate:'2026-10-18'}),entry('done',{done:true,dueDate:'2026-10-17'}),entry('legacy')]
  assert.deepEqual(selectTasks(entries,'今天到期','2026-10-19').map(e=>e.id),['high','low'])
  assert.deepEqual(selectTasks(entries,'已逾期','2026-10-19').map(e=>e.id),['late'])
  assert.equal(selectTasks(entries,'全部','2026-10-19').at(-1).id,'done')
  assert.equal(entries[0].id,'later')
})
test('採買清單去重、保留勾選，備份合併也不重複',()=>{
  const list=appendSupplies([{name:'蛋',done:true}],['蛋','番茄','番茄'])
  assert.deepEqual(list,[{name:'蛋',done:true},{name:'番茄',done:false}])
  const key=bookKey('cooking')
  const current=backup({[key]:{...book([]),pantry:'蛋',supplies:list}})
  const incoming=backup({[key]:{...book([]),pantry:'豆腐',supplies:[{name:'蛋',done:false},{name:'豆腐',done:false}]}})
  const result=mergeBackup(current,incoming).data[key]
  assert.equal(result.pantry,'蛋')
  assert.equal(result.supplies.length,3)
  assert.equal(result.supplies[0].done,true)
})
test('料理時間、食材齊全篩選及常見食材名稱配對',()=>{
  const recipes=[{ingredients:['番茄','蛋'],minutes:10},{ingredients:['蛋','飯'],minutes:15}]
  assert.equal(matchRecipes(recipes,'蕃茄、雞蛋','10',true).length,1)
  assert.equal(matchRecipes(recipes,'蛋','不限',true).length,0)
  assert.equal(matchRecipes(recipes,'蛋糕','不限',false).length,0)
  assert.equal(matchRecipes(recipes,'','10',false).length,1)
})
test('CSV 保留換行與引號，避免項目被試算表當成公式',()=>{
  const csv=expenseCsv([entry('a',{text:'=1+1'}),entry('b',{text:'湯,"飯"\n飲料'})])
  assert.ok(csv.startsWith('\uFEFF'))
  assert.ok(csv.includes('"\'=1+1"'))
  assert.ok(csv.includes('"湯,""飯""\n飲料"'))
})
test('第三版欄位與約會心得可備份往返，拒絕錯誤日期和優先順序',()=>{
  const task=book([entry('t',{dueDate:'2026-10-20',priority:'high',completedOn:'2026-10-19'})])
  const date=book([entry('d',{plannedFor:'2026-10-25',note:'一起散步',done:true,completedOn:'2026-10-19'})])
  const data={[bookKey('tasks')]:task,[bookKey('date')]:date}
  assert.deepEqual(parseBackup(JSON.stringify(backup(data))).data,data)
  assert.equal(isBook(book([entry('x',{dueDate:'2026-02-30'})]),'tasks'),false)
  assert.equal(isBook(book([entry('x',{priority:'urgent'})]),'tasks'),false)
  assert.equal(isBook(book([entry('x',{note:'字'.repeat(501)})]),'date'),false)
})
