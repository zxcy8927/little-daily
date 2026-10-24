import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const compile=name=>ts.transpileModule(readFileSync(new URL('../src/'+name,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const url=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64')
const storageUrl=url(compile('data/storage.ts'))
const key='little-daily-tool-shopping-v1'
const book={entries:[],limit:500,savingsGoal:{name:'旅行',target:5000}}
const backup=data=>({format:'little-daily',version:1,exportedAt:'2026-10-19T00:00:00Z',data})
async function harness(files={},values={}){
 const nativeFiles=new Map(Object.entries(files)),memory=new Map(Object.entries(values)),writes=[]
 globalThis.window=new EventTarget();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)}
 globalThis.__nativeMock={Capacitor:{isNativePlatform:()=>true},Directory:{Data:'data',Cache:'cache'},Encoding:{UTF8:'utf8'},Share:{share:async()=>{}},App:{addListener:async()=>{}},Filesystem:{readdir:async()=>({files:[...nativeFiles.keys()].map(name=>({name}))}),readFile:async({path})=>({data:nativeFiles.get(path)}),writeFile:async args=>{writes.push(args);nativeFiles.set(args.path,args.data);return {uri:args.path}}}}
 let code=compile('native.ts').replace(/import .*? from ['"]@capacitor\/.*?['"];?\n/g,'').replace(/from ['"]\.\/data\/storage['"]/,`from '${storageUrl}'`)
 code='const {Capacitor,Filesystem,Directory,Encoding,Share,App}=globalThis.__nativeMock;\n'+code+'\n//'+Math.random()
 const module=await import(url(code));await module.initializeNative();await module.flushNativeStorage()
 return {module,nativeFiles,memory,writes}
}
test('網站資料空白時以最新可驗證裝置副本復原；單槽毀損仍可恢復',async()=>{
 const h=await harness({'little-daily-native-0.json':JSON.stringify({sequence:2,backup:backup({[key]:book})}),'little-daily-native-1.json':'broken'})
 assert.deepEqual(JSON.parse(h.memory.get(key)),book)
 assert.equal(h.writes.length,1)
 assert.equal(JSON.parse(h.writes[0].data).sequence,3)
})
test('現有網站紀錄優先，裝置副本交替寫入且只保留專案資料',async()=>{
 const h=await harness({'little-daily-native-0.json':JSON.stringify({sequence:2,backup:backup({[key]:book})})},{[key]:JSON.stringify({...book,limit:800}),unrelated:'secret'})
 assert.equal(JSON.parse(h.memory.get(key)).limit,800)
 window.dispatchEvent(new Event('little-daily-saved'));await h.module.flushNativeStorage()
 assert.deepEqual(h.writes.map(w=>w.path),['little-daily-native-1.json','little-daily-native-0.json'])
 assert.equal(JSON.parse(h.writes.at(-1).data).backup.data.unrelated,undefined)
})
test('所有副本無效時停止覆寫，保留原檔並顯示可處理的錯誤',async()=>{
 const h=await harness({'little-daily-native-0.json':'bad','little-daily-native-1.json':'bad'})
 assert.equal(h.writes.length,0)
 assert.match(h.module.getNativeStatus(),/停止覆寫/)
})
test('裝置寫入失敗保留目前紀錄與舊副本，後續可重試',async()=>{
 const h=await harness({}, {[key]:JSON.stringify(book)})
 const previous=[...h.nativeFiles.entries()]
 const original=globalThis.__nativeMock.Filesystem.writeFile
 globalThis.__nativeMock.Filesystem.writeFile=async()=>{throw new Error('disk full')}
 h.memory.set(key,JSON.stringify({...book,limit:900}));window.dispatchEvent(new Event('little-daily-saved'));await h.module.flushNativeStorage()
 assert.equal(JSON.parse(h.memory.get(key)).limit,900)
 assert.deepEqual([...h.nativeFiles.entries()],previous)
 assert.match(h.module.getNativeStatus(),/寫入失敗/)
 globalThis.__nativeMock.Filesystem.writeFile=original
 window.dispatchEvent(new Event('little-daily-saved'));await h.module.flushNativeStorage()
 assert.match(h.module.getNativeStatus(),/已儲存/)
})
