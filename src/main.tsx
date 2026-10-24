import { initializeReminders } from './reminders'
import NativeStatus from './components/NativeStatus'
import { initializeNative } from './native'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import PageBoundary from './components/PageBoundary'
import './index.css'
import { registerOffline } from './platform'
import { startSafetyBackups } from './data/safety-backups'
async function boot() {
  await initializeNative()
  await initializeReminders().catch(() => {})
  registerOffline()
  startSafetyBackups()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <NativeStatus />
      <PageBoundary>
        <App />
      </PageBoundary>
    </React.StrictMode>,
  )
}
void boot()
