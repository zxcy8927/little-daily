import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const compile=n=>ts.transpileModule(readFileSync(new URL('../src/data/'+n+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64')
const storageUrl=url(compile('storage'))
const {furnitureCatalog,readBookSnapshot,isBook,bookKey,collectBackup,parseBackup,mergeBackup,saveBookSnapshot}=await import(storageUrl)
const {buyFurniture,furnitureBalance,placeFurniture,storeFurniture,positionItem}=await import(url(compile('furniture').replace(/(['"])\.\/storage\1/,JSON.stringify(storageUrl))))
const empty=()=>({entries:[],limit:500})
test('簽到與購物獎勵共用錢包，購買扣一次，收藏與擺放一次寫入',()=>{
 const book=empty(),next=buyFurniture(book,'sage-cushion',120)
 assert.equal(furnitureBalance(next,120),80)
 assert.equal(next.furniture.owned.length,1)
 assert.equal(next.furniture.layout[0].id,'sage-cushion')
 assert.equal(book.furniture,undefined)
 assert.throws(()=>buyFurniture(next,'sage-cushion',120))
 const reward={id:'skip',text:'衣服',date:'2026-10-23T00:00:00Z',done:true,status:'skipped',amount:1500,rewardCoins:50}
 assert.equal(furnitureBalance({...next,entries:[reward]},120),130)
 assert.equal(isBook(next,'shopping'),true)
})
test('金幣不足與付費物品都不建立購買紀錄，不能用金幣冒充付費解鎖',()=>{
 const book=empty()
 assert.throws(()=>buyFurniture(book,'pet-bed',100))
 assert.throws(()=>buyFurniture(book,'moon-chair',99999))
 assert.throws(()=>buyFurniture(book,'invalid',99999))
 assert.equal(book.furniture,undefined)
 assert.equal(furnitureBalance(buyFurniture(book,'sage-cushion',40),40),0)
 for(const base of [NaN,Infinity,-1])assert.throws(()=>buyFurniture(book,'sage-cushion',base))
})
test('擺放、微調與收起不扣金幣；位置限於房間，未購物品不可儲存',()=>{
 const bought=buyFurniture(empty(),'sage-cushion',120)
 const moved=placeFurniture(bought,positionItem('sage-cushion',9999,-999))
 assert.deepEqual(moved.furniture.layout[0],{id:'sage-cushion',x:675,y:120})
 assert.equal(furnitureBalance(moved,120),80)
 const stored=storeFurniture(moved,'sage-cushion')
 assert.equal(stored.furniture.owned.length,1)
 assert.equal(stored.furniture.layout.length,0)
 assert.equal(furnitureBalance(placeFurniture(stored,positionItem('sage-cushion')),120),80)
 assert.throws(()=>placeFurniture(stored,positionItem('coffee-cart')))
 assert.throws(()=>placeFurniture(stored,{id:'sage-cushion',x:NaN,y:200}))
})
test('拒絕無效價格、重複購買與付費授權偽造；JSON 備份往返保存所有收藏',()=>{
 const bought=buyFurniture(empty(),'sage-cushion',120)
 for(const furniture of [
  {owned:[{id:'sage-cushion',cost:0}],layout:[]},
  {owned:[{id:'moon-chair',cost:0}],layout:[]},
  {owned:[{id:'sage-cushion',cost:40},{id:'sage-cushion',cost:40}],layout:[]},
  {owned:[],layout:[{id:'sage-cushion',x:100,y:300}]},
  {...bought.furniture,layout:[{id:'sage-cushion',x:800,y:300}]},
 ])assert.equal(isBook({...bought,furniture},'shopping'),false)
 const key=bookKey('shopping'),memory=new Map([[key,JSON.stringify(bought)]])
 const backup=parseBackup(JSON.stringify(collectBackup({getItem:k=>memory.get(k)??null})))
 assert.deepEqual(backup.data[key],bought)
 const current={format:'little-daily',version:1,exportedAt:backup.exportedAt,data:{[key]:empty()}}
 assert.deepEqual(mergeBackup(current,backup).data[key].furniture,bought.furniture)
 assert.deepEqual(mergeBackup(backup,current).data[key].furniture,bought.furniture)
})
test('兩頁同時購買拒絕舊快照，不能覆寫掉第一筆扣款',()=>{
 const key=bookKey('shopping'),memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)}
 const first=buyFurniture(empty(),'sage-cushion',120)
 saveBookSnapshot(storage,'shopping',null,first)
 assert.throws(()=>saveBookSnapshot(storage,'shopping',null,buyFurniture(empty(),'book-stack',120)))
 assert.equal(furnitureBalance(JSON.parse(memory.get(key)),120),80)
})

test('調價後仍保留歷史購買成本；無版本資料升級時不覆寫原始快照',()=>{
 const item=furnitureCatalog.find(i=>i.id==='sage-cushion'),original=item.price
 const legacy={...buyFurniture(empty(),'sage-cushion',120)}
 delete legacy.furniture.version
 const raw=JSON.stringify(legacy),storage={getItem:key=>key===bookKey('shopping')?raw:null}
 try{
  item.price=55
  const loaded=readBookSnapshot(storage,'shopping')
  assert.equal(loaded.raw,raw)
  assert.equal(loaded.book.furniture.version,1)
  assert.equal(loaded.book.furniture.owned[0].cost,40)
  assert.equal(furnitureBalance(loaded.book,120),80)
  assert.equal(buyFurniture(empty(),'sage-cushion',120).furniture.owned[0].cost,55)
  assert.equal(isBook(parseBackup(JSON.stringify(collectBackup(storage))).data[bookKey('shopping')],'shopping'),true)
 }finally{item.price=original}
})
test('歷史價格必須為正整數，未知家具版本不會被當成目前版本讀取',()=>{
 for(const cost of [-1,0,0.5,NaN,Infinity,1e9+1])assert.equal(isBook({...empty(),furniture:{version:1,owned:[{id:'sage-cushion',cost}],layout:[]}},'shopping'),false)
 assert.equal(isBook({...empty(),furniture:{version:99,owned:[],layout:[]}},'shopping'),false)
})
