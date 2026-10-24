import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const compile=name=>ts.transpileModule(readFileSync(new URL(`../src/data/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const url=code=>`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
const storageUrl=url(compile('storage'))
const {readBookSnapshot,saveBookSnapshot,bookKey,readGame,nextCheckIn,gameKey,normalizePetBook}=await import(storageUrl)
const {dashboard}=await import(url(compile('workflows').replace(/(['"])\.\/storage\1/,JSON.stringify(storageUrl))))
const {toolFromHash,hashForTool}=await import(url(compile('routes')))
const book=entries=>({entries,limit:500})
const entry=(id,extra={})=>({id,text:'小事',amount:0,date:'2026-10-19',done:false,...extra})
function memory(values={}){const map=new Map(Object.entries(values));return{getItem:key=>map.get(key)??null,setItem:(key,v)=>map.set(key,v),removeItem:key=>map.delete(key)}}

test('另一個頁面先儲存時，拒絕舊快照並保留新資料',()=>{
  const s=memory();const a=readBookSnapshot(s,'tasks'),b=readBookSnapshot(s,'tasks')
  const raw=saveBookSnapshot(s,'tasks',a.raw,book([entry('a')]))
  assert.throws(()=>saveBookSnapshot(s,'tasks',b.raw,book([entry('b')])) , /另一個頁面更新/)
  assert.equal(s.getItem(bookKey('tasks')),raw)
  const latest=readBookSnapshot(s,'tasks')
  saveBookSnapshot(s,'tasks',latest.raw,{...latest.book,entries:[...latest.book.entries,entry('b')]})
  assert.equal(readBookSnapshot(s,'tasks').book.entries.length,2)
})

test('無效紀錄不被覆寫，寫入失敗保留原值',()=>{
  const key=bookKey('tasks'),s=memory({[key]:'{invalid'})
  assert.throws(()=>readBookSnapshot(s,'tasks'))
  assert.equal(s.getItem(key),'{invalid')
  const clean=memory({[key]:JSON.stringify(book([]))}),snapshot=readBookSnapshot(clean,'tasks')
  clean.setItem=()=>{throw new Error('QuotaExceededError')}
  assert.throws(()=>saveBookSnapshot(clean,'tasks',snapshot.raw,book([entry('x')])))
  assert.equal(clean.getItem(key),snapshot.raw)
})

test('舊版寵物轉換後仍能以原快照儲存，不會誤判為衝突',()=>{
  const s=memory({[bookKey('dog')]:JSON.stringify({...book([entry('old')]),petName:'麻糬'})})
  const snapshot=readBookSnapshot(s,'dog'),converted=normalizePetBook(snapshot.book)
  saveBookSnapshot(s,'dog',snapshot.raw,converted)
  assert.equal(readBookSnapshot(s,'dog').book.entries[0].petId,'legacy-pet')
})

test('每日簽到重讀進度，重複簽到不加獎勵，隔日正常累加',()=>{
  const s=memory({[gameKey]:JSON.stringify({coins:120,xp:95,lastCheckIn:null})})
  const first=nextCheckIn(readGame(s),'2026-10-19')
  s.setItem(gameKey,JSON.stringify(first))
  assert.equal(first.coins,130);assert.equal(first.xp,105)
  const again=readGame(s),same=nextCheckIn(again,'2026-10-19')
  assert.equal(same,again)
  const tomorrow=nextCheckIn(readGame(s),'2026-10-20')
  assert.equal(tomorrow.coins,140)
  assert.throws(()=>nextCheckIn(first,'2026-02-30'))
  assert.throws(()=>readGame(memory({[gameKey]:JSON.stringify({coins:1,xp:2,lastCheckIn:'2026-02-30'})})))
})

test('首頁整合六個工具，排除已完成、已買與收起寵物，金額加總準確',()=>{
  const books={
    budget:{...book([entry('one',{amount:0.1}),entry('two',{amount:0.2}),entry('yesterday',{amount:999,date:'2026-10-18'})]),limit:100},
    tasks:book([entry('due',{dueDate:'2026-10-19'}),entry('late',{dueDate:'2026-10-18'}),entry('done',{dueDate:'2026-10-19',done:true})]),
    shopping:book([entry('ready',{date:'2026-10-18T00:00:00Z'}),entry('waiting',{date:'2026-10-18T23:00:00Z'}),entry('bought',{date:'2026-10-17T00:00:00Z',status:'bought'}),entry('skipped',{date:'2026-10-17T00:00:00Z',done:true})]),
    dog:{...book([entry('note',{petId:'cat'}),entry('archived-note',{petId:'dog'}),entry('old-note',{petId:'cat',date:'2026-10-18'})]),pets:[{id:'cat',name:'布丁',species:'貓',birthday:''},{id:'dog',name:'麻糬',species:'狗',birthday:'',archived:true}]},
    cooking:{...book([]),supplies:[{name:'蛋',done:false},{name:'飯',done:true}]},
    date:book([entry('today',{plannedFor:'2026-10-19'}),entry('future',{plannedFor:'2026-10-21'}),entry('past',{plannedFor:'2026-10-18'}),entry('went',{plannedFor:'2026-10-19',done:true})])
  }
  const result=dashboard(books,'2026-10-19',Date.parse('2026-10-19T00:00:00Z'))
  assert.equal(result.spent,0.3);assert.equal(result.remaining,99.7)
  assert.equal(result.due,1);assert.equal(result.overdue,1);assert.equal(result.pending,2)
  assert.equal(result.ready,1);assert.equal(result.petNotes,1);assert.equal(result.pets,1)
  assert.equal(result.supplies,1);assert.equal(result.dates,1)
  assert.deepEqual(result.dueTasks.map(e=>e.id),['late','due'])
  assert.deepEqual(result.upcomingDates.map(e=>e.id),['today','future'])
})

test('新使用者首頁有合理空白狀態，舊版寵物日記也可統計',()=>{
  const blank=dashboard({},'2026-10-19',0)
  assert.equal(blank.remaining,500);assert.equal(blank.pending,0);assert.equal(blank.pets,0)
  const old=dashboard({dog:{...book([entry('old')]),petName:'麻糬'}},'2026-10-19',0)
  assert.equal(old.pets,1);assert.equal(old.petNotes,1)
})

test('工具網址可往返解析，寵物有易讀網址，未知路徑回首頁',()=>{
  for(const id of ['cooking','shopping','budget','dog','tasks','date']) assert.equal(toolFromHash(hashForTool(id)),id)
  assert.equal(hashForTool('dog'),'#/pets')
  assert.equal(toolFromHash('#/dog'),'dog')
  assert.equal(toolFromHash('#/unknown'),null)
  assert.equal(toolFromHash(''),null)
  assert.equal(toolFromHash(hashForTool(null)),null)
})
