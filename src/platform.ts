import {Capacitor} from '@capacitor/core'
export function registerOffline() {
  if(Capacitor.isNativePlatform() || !import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load',()=>{
    void navigator.serviceWorker.register('./sw.js').catch(()=>{
      window.dispatchEvent(new CustomEvent('little-daily-offline-error'))
    })
  },{once:true})
}
