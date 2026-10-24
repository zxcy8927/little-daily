import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const compile=name=>ts.transpileModule(readFileSync(new URL(`../src/data/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const url=code=>`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
const storageUrl=url(compile('storage'))
const {isBook,bookKey,parseBackup,mergeBackup,collectBackup,settingsKey,readPreferences,savePreferences,isPreferences,defaultPreferences}=await import(storageUrl)
const {weekBounds,shiftDate,weeklyReview,foodExpiry,rankPantryRecipes}=await import(url(compile('workflows').replace(/(['"])\.\/storage\1/,JSON.stringify(storageUrl))))
const book=entries=>({entries,limit:500})
const entry=(id,extra={})=>({id,text:'想買的東西',amount:100,date:'2026-10-19',done:false,...extra})
const backup=data=>({format:'little-daily',version:1,exportedAt:'2026-10-19T00:00:00Z',data})
const food=(id,extra={})=>({id,name:'雞蛋',quantity:'2 顆',expiresOn:'2026-10-21',state:'available',...extra})
function memory(data={}){const values=new Map(Object.entries(data));return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}}

test('購物冷靜卡保留反思與決定日期，備份往返不遺失',()=>{
  const value=book([entry('s',{date:'2026-10-18T00:00:00Z',buyReason:'通勤需要',ownsSimilar:'yes',useFrequency:'daily',status:'skipped',done:true,decidedOn:'2026-10-19'})])
  assert.equal(isBook(value,'shopping'),true)
  assert.deepEqual(parseBackup(JSON.stringify(backup({[bookKey('shopping')]:value}))).data[bookKey('shopping')],value)
  assert.equal(isBook(book([entry('s',{date:'2026-10-18T00:00:00Z',useFrequency:'unknown'})]),'shopping'),false)
})
test('每週一至週日，跨年與週日邊界正確',()=>{
  assert.deepEqual(weekBounds('2026-10-25'),{start:'2026-10-19',end:'2026-10-25'})
  assert.deepEqual(weekBounds('2026-01-01'),{start:'2025-12-29',end:'2026-01-04'})
  assert.equal(shiftDate('2024-02-28',1),'2024-02-29')
  assert.throws(()=>weekBounds('2026-02-30'))
})
test('週回顧按決定日與完成日統計，不把避免支出當成實際存款',()=>{
  const result=weeklyReview({budget:book([entry('expense',{amount:0.1}),entry('expense2',{amount:0.2}),entry('past-expense',{amount:999,date:'2026-10-18'})]),shopping:book([entry('skip',{status:'skipped',done:true,amount:200,decidedOn:'2026-10-19'}),entry('old-skip',{done:true,amount:900}),entry('old-decision',{done:true,decidedOn:'2026-10-18'}),entry('bought',{done:true,status:'bought',decidedOn:'2026-10-19',amount:800})]),tasks:book([entry('t',{done:true,completedOn:'2026-10-20'}),entry('legacy',{done:true}),entry('undone',{done:false,completedOn:'2026-10-19'})]),cooking:{...book([]),foods:[food('used',{state:'used',closedOn:'2026-10-19'}),food('discarded',{state:'discarded',closedOn:'2026-10-19'})]}},'2026-10-22')
  assert.equal(result.spent,0.3)
  assert.equal(result.avoided,200)
  assert.equal(result.completed,1)
  assert.equal(result.foodsUsed,1)
  assert.deepEqual(result.avoidedItems.map(e=>e.id),['skip'])
})
test('到期日提示含今天和三天內，過期與用完食材不自動配對',()=>{
  const today='2026-10-19'
  assert.equal(foodExpiry(food('x',{expiresOn:today}),today),'soon')
  assert.equal(foodExpiry(food('x',{expiresOn:'2026-10-22'}),today),'soon')
  assert.equal(foodExpiry(food('x',{expiresOn:'2026-10-23'}),today),'fresh')
  assert.equal(foodExpiry(food('x',{expiresOn:'2026-10-18'}),today),'expired')
  const recipes=[{ingredients:['蛋'],minutes:10},{ingredients:['豆腐'],minutes:15}]
  const items=[food('old',{expiresOn:'2026-10-18'}),food('used',{state:'used'}),food('fresh',{name:'豆腐',expiresOn:'2026-10-20'})]
  const result=rankPantryRecipes(recipes,'',items,today,'不限',false)
  assert.equal(result.length,1)
  assert.deepEqual(result[0].urgent,['豆腐'])
})
test('快到期食材的料理優先，仍遵守時間與食材齊全篩選',()=>{
  const recipes=[{ingredients:['蛋'],minutes:10},{ingredients:['豆腐'],minutes:15}]
  const items=[food('egg',{expiresOn:'2026-10-30'}),food('tofu',{name:'豆腐',expiresOn:'2026-10-20'})]
  const all=rankPantryRecipes(recipes,'',items,'2026-10-19','不限',true)
  assert.deepEqual(all[0].ingredients,['豆腐'])
  assert.deepEqual(rankPantryRecipes(recipes,'',items,'2026-10-19','10',true)[0].ingredients,['蛋'])
})
test('冰箱食材驗證與合併保留現況，不重複帶回已用完食材',()=>{
  const key=bookKey('cooking'),current={...book([]),foods:[food('a',{state:'used',closedOn:'2026-10-19'})]}
  const incoming={...book([]),foods:[food('a'),food('b',{name:'豆腐'})]}
  const merged=mergeBackup(backup({[key]:current}),backup({[key]:incoming})).data[key]
  assert.equal(merged.foods.length,2)
  assert.equal(merged.foods[0].state,'used')
  assert.equal(isBook(merged,'cooking'),true)
  assert.equal(isBook({...book([]),foods:[food('a',{expiresOn:'2026-02-30'})]},'cooking'),false)
  assert.equal(isBook({...book([]),foods:[food('a'),food('a')]},'cooking'),false)
})
test('首頁顯示與排序驗證，至少保留一個工具且不重複',()=>{
  assert.equal(isPreferences(defaultPreferences),true)
  assert.equal(isPreferences({order:[...defaultPreferences.order].reverse(),hidden:['dog']}),true)
  assert.equal(isPreferences({order:['tasks','tasks'],hidden:[]}),false)
  assert.equal(isPreferences({...defaultPreferences,hidden:[...defaultPreferences.order]}),false)
  assert.equal(isPreferences({...defaultPreferences,hidden:['unknown']}),false)
})
test('首頁設定儲存具衝突保護，備份保留目前設定並支援舊檔',()=>{
  const s=memory(),snapshot=readPreferences(s),custom={order:[...defaultPreferences.order].reverse(),hidden:['dog']}
  savePreferences(s,snapshot.raw,custom)
  assert.deepEqual(readPreferences(s).preferences,custom)
  assert.throws(()=>savePreferences(s,snapshot.raw,defaultPreferences))
  const exported=collectBackup(s),parsed=parseBackup(JSON.stringify(exported))
  assert.deepEqual(parsed.data[settingsKey],custom)
  assert.deepEqual(mergeBackup(parsed,backup({[settingsKey]:defaultPreferences})).data[settingsKey],custom)
  assert.deepEqual(mergeBackup(backup({}),parsed).data[settingsKey],custom)
  assert.deepEqual(parseBackup(JSON.stringify(backup({[bookKey('tasks')]:book([])}))).data[bookKey('tasks')],book([]))
})
