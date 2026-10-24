import { collectBackup, parseBackup, type Backup } from './storage'
export type SafetyCopy={id:number;createdAt:string;backup:Backup}
let opening:Promise<IDBDatabase>|null=null
let queue:Promise<unknown>=Promise.resolve()
let status='自動復原點尚未建立。'
function database() {
  if(!('indexedDB' in window)) return Promise.reject(new Error('此瀏覽器不支援自動復原點。'))
  if(!opening) opening=new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open('little-daily-safety',1)
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('copies')) request.result.createObjectStore('copies',{keyPath:'id',autoIncrement:true})}
    request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();opening=null};resolve(request.result)}
    request.onerror=()=>{opening=null;reject(new Error('無法開啟自動復原點，請檢查瀏覽器儲存設定。'))}
    request.onblocked=()=>{opening=null;reject(new Error('請關閉其他舊版頁面後再建立復原點。'))}
  })
  return opening
}
function announce(message:string){status=message;window.dispatchEvent(new Event('little-daily-safety'))}
export function safetyStatus(){return status}
export async function listSafetyCopies():Promise<SafetyCopy[]> {
  const db=await database()
  return new Promise((resolve,reject)=>{
    const request=db.transaction('copies','readonly').objectStore('copies').getAll()
    request.onsuccess=()=>resolve((request.result as SafetyCopy[]).sort((a,b)=>b.id-a.id))
    request.onerror=()=>reject(new Error('無法讀取自動復原點。'))
  })
}
export function createSafetyCopy():Promise<void> {
  const job=queue.catch(()=>{}).then(async()=>{
    const backup=collectBackup(localStorage)
    if(!Object.keys(backup.data).length){announce('開始留下紀錄後，會自動保留最近 5 個復原點。');return}
    const previous=await listSafetyCopies()
    if(previous[0] && JSON.stringify(previous[0].backup.data)===JSON.stringify(backup.data)){announce('目前資料已有自動復原點。');return}
    const db=await database()
    await new Promise<void>((resolve,reject)=>{
      const transaction=db.transaction('copies','readwrite'),store=transaction.objectStore('copies')
      store.add({createdAt:new Date().toISOString(),backup})
      const keys=store.getAllKeys()
      keys.onsuccess=()=>{for(const key of keys.result.slice(0,-5))store.delete(key)}
      transaction.oncomplete=()=>resolve()
      transaction.onerror=()=>reject(new Error('無法儲存復原點，請先下載備份並檢查可用空間。'))
      transaction.onabort=()=>reject(new Error('復原點儲存中斷，請先下載備份。'))
    })
    announce('自動復原點已更新，保留最近 5 次不同的資料。')
  })
  queue=job
  return job.catch(error=>{announce(error instanceof Error ? error.message : '無法建立自動復原點。');throw error})
}
export function validateSafetyCopy(copy:SafetyCopy){return parseBackup(JSON.stringify(copy.backup))}
export function startSafetyBackups(){
  const save=()=>{void createSafetyCopy().catch(()=>{})}
  save();window.addEventListener('little-daily-saved',save)
  return ()=>window.removeEventListener('little-daily-saved',save)
}
