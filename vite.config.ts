import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { serviceWorkerSource } from './src/data/offline'
export default defineConfig({ plugins: [react(),{
  name:'little-daily-offline',enforce:'post',apply:'build',
  generateBundle(_,bundle){
    const files=[...Object.keys(bundle),'huninn.ttf','favicon.svg','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','privacy.html','support.html','huninn-LICENSE.txt','third-party-notices.txt']
    this.emitFile({type:'asset',fileName:'sw.js',source:serviceWorkerSource(files,Date.now().toString(36))})
  }
}] })
