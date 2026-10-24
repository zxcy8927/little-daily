import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/data/storage.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { parseBackup, collectBackup, mergeBackup, writeBackup, isBook, bookKey, gameKey, normalizePetBook } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const entry = (id, text = '原始紀錄') => ({id,text,amount:120,date:'2026-10-19',done:false})
const book = entries => ({entries,limit:500})
const backup = data => ({format:'little-daily',version:1,exportedAt:'2026-10-19T00:00:00.000Z',data})
const storage = data => {
  const values = new Map(Object.entries(data))
  return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}
}
test('舊版工具紀錄仍能讀取；拒絕無效日期、金額和重複 ID', () => {
  assert.equal(isBook(book([entry('a')]), 'tasks'), true)
  assert.equal(isBook(book([{...entry('a'),date:'2026-02-30'}]), 'budget'), false)
  assert.equal(isBook(book([{...entry('a'),amount:-1}]), 'budget'), false)
  assert.equal(isBook(book([entry('a'),entry('a')]), 'tasks'), false)
  assert.equal(isBook(book([{...entry('a'),date:'2026-10-19T00:00:00.000Z',status:'bought'}]), 'shopping'), true)
})
test('備份往返保留收藏、購物狀態與簽到，略過非專案資料', () => {
  const s = storage({[bookKey('date')]:JSON.stringify(book([entry('fav')])),[bookKey('shopping')]:JSON.stringify(book([{...entry('shop'),date:'2026-10-19T00:00:00.000Z',status:'bought'}])),[gameKey]:JSON.stringify({coins:130,xp:45,lastCheckIn:'2026-10-19'}),unrelated:'private'})
  const result = parseBackup(JSON.stringify(collectBackup(s)))
  assert.equal(result.data.unrelated,undefined)
  assert.equal(result.data[bookKey('shopping')].entries[0].status,'bought')
  const target=storage({});writeBackup(target,result)
  assert.deepEqual(collectBackup(target).data,result.data)
})
test('空白網站可匯出及匯入空備份', () => {
  assert.deepEqual(parseBackup(JSON.stringify(collectBackup(storage({})))).data,{})
})
test('合併不重複加入紀錄，保留目前內容、預算與簽到', () => {
  const current=backup({[bookKey('tasks')]:book([entry('a')]),[gameKey]:{coins:130,xp:45,lastCheckIn:'2026-10-19'}})
  const incoming=backup({[bookKey('tasks')]:{entries:[entry('a','舊內容'),entry('b')],limit:999},[gameKey]:{coins:120,xp:35,lastCheckIn:null},[bookKey('dog')]:book([entry('dog')])})
  const result=mergeBackup(current,incoming)
  assert.equal(result.data[bookKey('tasks')].entries.length,2)
  assert.equal(result.data[bookKey('tasks')].entries[0].text,'原始紀錄')
  assert.equal(result.data[bookKey('tasks')].limit,500)
  assert.deepEqual(result.data[gameKey],current.data[gameKey])
  assert.equal(result.data[bookKey('dog')].entries.length,1)
})
test('拒絕未知版本、未知儲存鍵與錯誤內容', () => {
  assert.throws(()=>parseBackup(JSON.stringify({...backup({}),version:2})))
  assert.throws(()=>parseBackup(JSON.stringify(backup({unrelated:{}}))))
  assert.throws(()=>parseBackup(JSON.stringify(backup({[bookKey('budget')]:book([{...entry('x'),amount:'120'}])}))))
  assert.throws(()=>parseBackup('{bad'))
})
test('第二個寫入失敗時恢復第一筆原始資料', () => {
  const first=bookKey('tasks'), second=bookKey('dog')
  const s=storage({[first]:'original'})
  const normalSet=s.setItem
  s.setItem=(key,value)=>{if(key===second)throw new Error('QuotaExceededError');normalSet(key,value)}
  assert.throws(()=>writeBackup(s,backup({[first]:book([entry('a')]),[second]:book([entry('b')])})))
  assert.equal(s.getItem(first),'original')
  assert.equal(s.getItem(second),null)
})

test('寵物名字可備份還原，舊版無名字紀錄仍相容', () => {
  const key=bookKey('dog')
  const petBook={...book([entry('pet')]),petName:'麻糬'}
  assert.equal(isBook(petBook,'dog'),true)
  assert.equal(isBook({...petBook,petName:'   '},'dog'),false)
  assert.equal(isBook({...petBook,petName:'名'.repeat(41)},'dog'),false)
  const imported=parseBackup(JSON.stringify(backup({[key]:petBook})))
  assert.equal(imported.data[key].petName,'麻糬')
  assert.equal(mergeBackup(backup({[key]:book([])}),imported).data[key].petName,'麻糬')
  assert.equal(mergeBackup(backup({[key]:{...book([]),petName:'布丁'}}),imported).data[key].petName,'布丁')
  assert.equal(mergeBackup(backup({[key]:petBook}),backup({[key]:book([entry('old')])})).data[key].petName,'麻糬')
})


test('舊寵物名字和日記轉為同一隻寵物，重複轉換不會改變歸屬', () => {
  const original={...book([entry('old')]),petName:'麻糬'}
  const migrated=normalizePetBook(original)
  assert.equal(migrated.pets.length,1)
  assert.equal(migrated.pets[0].name,'麻糬')
  assert.equal(migrated.entries[0].petId,migrated.pets[0].id)
  assert.deepEqual(normalizePetBook(migrated),migrated)
  assert.equal(original.entries[0].petId,undefined)
  assert.deepEqual(normalizePetBook(book([])).pets,[])
  assert.equal(normalizePetBook(book([entry('unnamed')])).pets[0].name,'我的寵物')
})

test('多寵物備份合併保留各自紀錄，既有名字與封存狀態優先', () => {
  const key=bookKey('dog')
  const current=normalizePetBook({...book([entry('old')]),petName:'麻糬'})
  current.pets[0].archived=true
  const incoming={...book([{...entry('new'),petId:'cat'}]),pets:[{id:'cat',name:'布丁',species:'貓',birthday:'2024-02-29'}]}
  const merged=mergeBackup(backup({[key]:current}),backup({[key]:incoming})).data[key]
  assert.equal(merged.pets.length,2)
  assert.equal(merged.entries.find(e=>e.id==='old').petId,'legacy-pet')
  assert.equal(merged.entries.find(e=>e.id==='new').petId,'cat')
  assert.equal(merged.pets[0].archived,true)
  assert.equal(isBook(merged,'dog'),true)
  const roundtrip=parseBackup(JSON.stringify(backup({[key]:merged}))).data[key]
  assert.deepEqual(roundtrip,merged)
  assert.deepEqual(mergeBackup(backup({[key]:merged}),backup({[key]:incoming})).data[key],merged)
})

test('新版日記合併舊版備份，舊紀錄仍連到原本寵物', () => {
  const key=bookKey('dog')
  const current=normalizePetBook({...book([entry('old')]),petName:'麻糬'})
  current.pets[0].name='麻糬改名'
  current.pets.push({id:'cat',name:'布丁',species:'貓',birthday:''})
  const merged=mergeBackup(backup({[key]:current}),backup({[key]:{...book([entry('old'),entry('another-old')]),petName:'麻糬'}})).data[key]
  assert.equal(merged.pets.length,2)
  assert.equal(merged.entries.length,2)
  assert.equal(merged.entries.find(e=>e.id==='another-old').petId,'legacy-pet')
  assert.equal(merged.pets[0].name,'麻糬改名')
  assert.equal(isBook(merged,'dog'),true)
})

test('拒絕不存在的寵物歸屬、重複寵物 ID 與錯誤生日', () => {
  const pet={id:'a',name:'麻糬',species:'狗',birthday:''}
  const good={...book([{...entry('x'),petId:'a'}]),pets:[pet]}
  assert.equal(isBook(good,'dog'),true)
  assert.equal(isBook({...good,entries:[{...entry('x'),petId:'missing'}]},'dog'),false)
  assert.equal(isBook({...good,entries:[entry('x')]},'dog'),false)
  assert.equal(isBook({...good,pets:[pet,pet]},'dog'),false)
  assert.equal(isBook({...good,pets:[{...pet,birthday:'2025-02-29'}]},'dog'),false)
  assert.equal(isBook({...good,pets:[{...pet,species:'invalid'}]},'dog'),false)
})
