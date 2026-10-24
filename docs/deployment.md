# 網頁正式環境部署

此專案是 Vite 靜態網站。使用 Node.js 22，安裝指令 npm ci，建置指令 npm run build，發佈目錄 dist。路由使用網址的 #，預設部署於網域根目錄；子路徑部署需另行調整資源路徑。

## 推送前驗證

npm test → npm run build → npm run check:release。GitHub Actions 已設定在 main 推送與 pull request 時執行相同檢查並保存網站產物；目前未設定自動部署目的地。

## 正式環境設定

- 選定平台與 HTTPS 網域，將 dist 發佈於網站根目錄。瀏覽器離線與加入主畫面需要安全來源。
- index.html、sw.js 建議每次重新驗證快取；有雜湊的 assets 可長期快取。
- 不需應用程式伺服器或資料庫，也沒有需要放進前端的機密環境變數。不要放入付款密鑰或儲存庫存取憑證。
- 網站資料依裝置與網址分開保存。從本機網址切換至正式網域前，請匯出 JSON 備份，再於新網址手動匯入。切換網址不會自動搬移紀錄。
- 發佈後驗收首頁、購物三分區、家具試擺與收藏、備份還原、重新載入與離線模式。

目前付費物品仍僅供試擺，不含實際付款或商店權益驗證。正式網站部署不代表已完成 App Store／Google Play 上架；簽章、原生編譯、實機驗收與營運資訊仍待補齊。

## 回復舊版

保留每次部署對應的 Git commit。需要回復時，透過平台重新部署上一個已驗證的 commit 或對應網站產物；不要使用強制推送覆寫 main 歷史。程式回復不會自動還原使用者瀏覽器資料。

## 建議平台：Cloudflare Pages

公開原始碼儲存庫：https://github.com/zxcy8927/little-daily

使用 Cloudflare Pages 的 Git integration 連接上述單一儲存庫。正式分支 main；Framework preset 選 Vite；Build command 使用 npm run build；Build output directory 使用 dist；Node.js 版本設為 22。預設先使用平台提供的 pages.dev 網址；自訂網域待確認後再綁定。

public/_headers 已設定首頁與 Service Worker 重新驗證快取、雜湊資源長期快取，以及基本回應標頭。Cloudflare 登入與授權必須由帳號擁有者完成；請勿把 API token 放入前端或公開儲存庫。

GitHub Actions 負責測試與網站建置；Cloudflare Git integration 另行處理部署。設定正式環境時應確認部署對應的 commit 已通過 GitHub 驗證。

本文件只是部署設定，不代表雲端資源已建立或網站已上線；以平台回傳的實際成功部署與網址為準。
