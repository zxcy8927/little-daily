import {LocalNotifications} from '@capacitor/local-notifications'
import type {Book} from './data/storage'
import {readBookSnapshot} from './data/storage'
import {reminderPlan} from './data/reminders'
import {isNative} from './native'
let queue=Promise.resolve()
let reminderStatus=''
export const getReminderStatus=()=>reminderStatus
function announce(text:string){reminderStatus=text;window.dispatchEvent(new Event('little-daily-reminder-status'))}
export async function requestReminders(){if(!isNative)throw new Error('到期提醒需安裝手機 App 測試版；網頁仍可查看到期清單。');const permission=await LocalNotifications.requestPermissions();if(permission.display!=='granted')throw new Error('尚未允許通知。可以到手機設定開啟，或直接回到工具查看。')}
export function syncReminders(book:Book){
 if(!isNative)return Promise.resolve('網頁版不排程背景通知。')
 const perform=async()=>{
  const current=await LocalNotifications.getPending()
  const ours=current.notifications.filter(n=>n.id>=410000&&n.id<410032)
  if(ours.length)await LocalNotifications.cancel({notifications:ours.map(n=>({id:n.id}))})
  if(!book.remindersEnabled)return '已關閉到期提醒。'
  const permission=await LocalNotifications.checkPermissions()
  if(permission.display!=='granted')return '通知未獲允許，請到手機設定開啟；仍可直接查看到期清單。'
  const plan=reminderPlan(book,Date.now())
  if(plan.length)await LocalNotifications.schedule({notifications:plan.map(n=>({id:n.id,title:'Little Daily · 留一點時間給自己',body:'有一件物品完成冷靜期，回來看看現在還需要嗎？',schedule:{at:new Date(n.at)},extra:{route:'shopping'}}))})
  return `已安排 ${plan.length} 則到期提醒（最多最近 32 筆）。系統省電可能影響送達時間。`
 }
 const next=queue.then(perform);queue=next.then(message=>announce(message),()=>announce('提醒排程未完成，請重新開啟提醒或直接查看到期清單。'));return next
}
export async function initializeReminders(){if(!isNative)return;await LocalNotifications.addListener('localNotificationActionPerformed',event=>{if(event.notification.extra?.route==='shopping')window.location.hash='#/shopping'});const refresh=()=>{try{void syncReminders(readBookSnapshot(localStorage,'shopping').book).catch(()=>{})}catch{/* Preserve unreadable records. */}};window.addEventListener('little-daily-saved',refresh);refresh()}
