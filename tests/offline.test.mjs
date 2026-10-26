import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import ts from 'typescript'
const code=ts.transpileModule(readFileSync(new URL('../src/data/offline.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {serviceWorkerSource}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
function worker(){
 const listeners={},stored=new Map(),deleted=[],matches=[];let activated=false
 const scope='http://localhost:4173/'
 const cache={async addAll(paths){for(const path of paths)stored.set(new URL(path,scope).href,'cached:'+path)},async match(request,options){matches.push(options);if(typeof request!=='string' && request.crossOrigin && !options?.ignoreVary)return undefined;return stored.get(new URL(typeof request==='string' ? request : request.url,scope).href)}}
 const self={location:{origin:'http://localhost:4173'},registration:{scope},clients:{claim:async()=>{}},skipWaiting(){activated=true},addEventListener:(type,fn)=>listeners[type]=fn}
 runInNewContext(serviceWorkerSource(['assets/app.js','assets/app.css','privacy.html','little-daily-round.woff2'],'test'),{self,URL,Set,Promise,caches:{open:async()=>cache,keys:async()=>['little-daily-old','unrelated-cache'],delete:async key=>deleted.push(key)},fetch:async()=>{throw new Error('offline')}})
 return{listeners,stored,deleted,matches,get activated(){return activated}}
}
async function install(w){let promise;w.listeners.install({waitUntil:p=>promise=p});await promise}
async function fetch(w,request){let response;w.listeners.fetch({request,respondWith:p=>response=p});return response===undefined ? undefined : await response}

test('離線安裝快取程式、字體與說明頁，第一次安裝不強制切換版本',async()=>{
 const w=worker();await install(w)
 assert.ok(w.stored.has('http://localhost:4173/assets/app.js'))
 assert.ok(w.stored.has('http://localhost:4173/little-daily-round.woff2'))
 assert.equal(w.activated,false)
})
test('無網路時首頁與隱私說明仍可讀取',async()=>{
 const w=worker();await install(w)
 assert.equal(await fetch(w,{method:'GET',mode:'navigate',url:'http://localhost:4173/'}),'cached:./')
 assert.equal(await fetch(w,{method:'GET',mode:'navigate',url:'http://localhost:4173/privacy.html'}),'cached:./privacy.html')
})
test('跨來源屬性的程式檔忽略伺服器 Vary 差異，避免離線白畫面',async()=>{
 const w=worker();await install(w)
 assert.equal(await fetch(w,{method:'GET',mode:'cors',url:'http://localhost:4173/assets/app.js',crossOrigin:true}),'cached:./assets/app.js')
 assert.ok(w.matches.some(options=>options?.ignoreVary===true))
})
test('不攔截外部來源、POST 或未預先列出的資料請求',async()=>{
 const w=worker();await install(w)
 assert.equal(await fetch(w,{method:'POST',url:'http://localhost:4173/private'}),undefined)
 assert.equal(await fetch(w,{method:'GET',url:'https://external.example/resource'}),undefined)
 assert.equal(await fetch(w,{method:'GET',url:'http://localhost:4173/private-data'}),undefined)
})
test('只清理此產品的舊快取，更新需收到明確啟用訊息',async()=>{
 const w=worker();let done;w.listeners.activate({waitUntil:p=>done=p});await done
 assert.deepEqual(w.deleted,['little-daily-old'])
 w.listeners.message({data:'ignored'});assert.equal(w.activated,false)
 w.listeners.message({data:'ACTIVATE_UPDATE'});assert.equal(w.activated,true)
})
