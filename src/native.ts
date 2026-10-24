import {Capacitor} from '@capacitor/core'
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem'
import {Share} from '@capacitor/share'
import {App} from '@capacitor/app'
import {collectBackup,parseBackup,writeBackup} from './data/storage'
export const isNative=Capacitor.isNativePlatform()
let nativeStatus=isNative?'正在準備裝置副本…':''
export const getNativeStatus=()=>nativeStatus
function status(text:string){nativeStatus=text;window.dispatchEvent(new Event('little-daily-native-status'))}
let queue=Promise.resolve(),sequence=0
export const flushNativeStorage=()=>queue
const path=(slot:number)=>`little-daily-native-${slot}.json`
export async function initializeNative(){
 if(!isNative)return
 try{
  const listing=await Filesystem.readdir({path:'',directory:Directory.Data})
  const copies:{sequence:number;backup:ReturnType<typeof parseBackup>}[]=[]
  for(const file of listing.files.filter(f=>/^little-daily-native-[01]\.json$/.test(f.name))){
   try{const read=await Filesystem.readFile({path:file.name,directory:Directory.Data,encoding:Encoding.UTF8});const data=JSON.parse(String(read.data));if(!Number.isSafeInteger(data.sequence)||data.sequence<0)throw new Error();copies.push({sequence:data.sequence,backup:parseBackup(JSON.stringify(data.backup))})}catch{/* Another valid slot can recover a partial write. */}
  }
  const latest=copies.sort((a,b)=>b.sequence-a.sequence)[0]
  const current=collectBackup(localStorage)
  if(!latest&&listing.files.some(f=>/^little-daily-native-[01]\.json$/.test(f.name)))throw new Error('裝置副本無法驗證；已停止覆寫，請先匯出現有資料。')
  if(latest){sequence=latest.sequence;if(!Object.keys(current.data).length)writeBackup(localStorage,latest.backup)}
  const persist=()=>{
   let content:string
   try{const backup=collectBackup(localStorage);if(!Object.keys(backup.data).length)return;content=JSON.stringify(backup)}catch{status('資料驗證失敗，未更新裝置副本。請先保留備份。');return}
   status('正在儲存裝置副本…')
   queue=queue.then(async()=>{const next=sequence+1;await Filesystem.writeFile({path:path(next%2),directory:Directory.Data,encoding:Encoding.UTF8,data:JSON.stringify({sequence:next,backup:JSON.parse(content)})});sequence=next;status('裝置副本已儲存。卸載 App 前仍請匯出備份。')}).catch(()=>status('裝置副本寫入失敗，目前紀錄仍在本機；請匯出備份並檢查可用空間。'))
  }
  window.addEventListener('little-daily-saved',persist)
  await App.addListener('appStateChange',({isActive})=>{if(!isActive)persist()})
  await App.addListener('backButton',({canGoBack})=>{if(document.querySelector('dialog[open]')){document.querySelector('dialog[open]')?.dispatchEvent(new Event('cancel',{cancelable:true}));return}if(window.location.hash&&window.location.hash!=='#/'){window.location.hash='#/';return}if(canGoBack)window.history.back();else void App.minimizeApp()})
  persist();if(!Object.keys(collectBackup(localStorage).data).length)status('裝置副本已準備好，新增紀錄後會自動儲存。')
 }catch(e){status(e instanceof Error?e.message:'裝置儲存未能初始化；原資料仍保留，請先下載備份。')}
}
export async function exportText(text:string,filename:string,type='application/json'){
 if(isNative){
  const result=await Filesystem.writeFile({path:filename,data:text,directory:Directory.Cache,encoding:Encoding.UTF8})
  await Share.share({title:'Little Daily 匯出檔案',files:[result.uri],dialogTitle:'儲存或分享備份'})
  return
 }
 const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
