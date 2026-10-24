import {exportText} from '../native'
import { useEffect, useState } from 'react'
import { createSafetyCopy, listSafetyCopies, safetyStatus, validateSafetyCopy, type SafetyCopy } from '../data/safety-backups'
import { collectBackup, mergeBackup, writeBackup } from '../data/storage'
export default function SafetyBackups({onRestored}:{onRestored:()=>void}) {
  const [copies,setCopies]=useState<SafetyCopy[]>([]),[status,setStatus]=useState(safetyStatus)
  const [selected,setSelected]=useState<SafetyCopy|null>(null),[busy,setBusy]=useState(false)
  async function refresh(){try{setCopies(await listSafetyCopies());setStatus(safetyStatus())}catch(e){setStatus(e instanceof Error ? e.message : '自動復原點暫時無法讀取。')}}
  useEffect(()=>{void refresh();const update=()=>void refresh();window.addEventListener('little-daily-safety',update);return()=>window.removeEventListener('little-daily-safety',update)},[])
  async function capture(){setBusy(true);try{await createSafetyCopy();await refresh()}catch(e){setStatus(e instanceof Error ? e.message : '無法建立復原點。')}finally{setBusy(false)}}
  async function download(copy:SafetyCopy){try{const backup=validateSafetyCopy(copy);await exportText(JSON.stringify(backup,null,2),'little-daily-recovery-'+copy.id+'.json')}catch{setStatus('無法匯出這份復原點，請檢查檔案權限或選另一份。')}}
  async function recover(){if(!selected)return;setBusy(true);try{const saved=validateSafetyCopy(selected);await createSafetyCopy().catch(()=>{});const merged=mergeBackup(collectBackup(localStorage),saved);writeBackup(localStorage,merged);onRestored();setSelected(null);setStatus('已合併找回缺少的紀錄，目前內容與設定保留。');setCopies(await listSafetyCopies())}catch(e){setStatus(e instanceof Error ? e.message : '找回紀錄未完成。')}finally{setBusy(false)}}
  return <details className="backup-panel pixel-panel safety-panel"><summary>自動復原點</summary><p>儲存紀錄後，另外保留最近 5 次不同資料。這仍是同一瀏覽器內的副本，換機或清除網站資料前，請下載檔案備份。</p><button className="secondary-button" disabled={busy} onClick={()=>void capture()}>{busy ? '處理中…' : '現在建立復原點'}</button><p role="status">{status}</p><ul className="safety-list">{copies.map(copy=><li key={copy.id}><span>{new Date(copy.createdAt).toLocaleString('zh-TW')}</span><div><button className="secondary-button" onClick={()=>download(copy)}>下載這份備份</button><button className="secondary-button" disabled={busy} onClick={()=>setSelected(copy)}>預覽找回紀錄</button></div></li>)}</ul>{selected && <div className="import-preview"><h3>從 {new Date(selected.createdAt).toLocaleString('zh-TW')} 的復原點找回紀錄</h3><p>只補回目前缺少的紀錄；不覆寫現有內容，也不會把已編輯的內容退回舊版本。</p><div className="backup-actions"><button className="primary-button" disabled={busy} onClick={()=>void recover()}>確認合併找回</button><button className="secondary-button" disabled={busy} onClick={()=>setSelected(null)}>取消</button></div></div>}</details>
}
