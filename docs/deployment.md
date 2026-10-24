# 網站部署與回復

## 目前實際環境

- 正式網站：https://little-daily.pages.dev/
- 原始碼：https://github.com/zxcy8927/little-daily
- 平台：Cloudflare Pages，Direct Upload，正式分支 main。
- GitHub Actions 自動執行測試、建置及資源檢查，保存 dist 產物；沒有自動部署。
- 第一批與第二批審查修正需重新部署才會出現在正式站。本次沒有登入 Cloudflare 或更新正式站。

## 本機驗證

使用 Node.js 22（依 .node-version）。安裝 npm ci，再執行 npm run build:verified。此指令包含資料邏輯測試、jsdom 元件操作測試、TypeScript 與正式建置、離線資源檢查。jsdom 測試不代表手機實機驗收。

## 手動部署

1. 確認 main 已推送，GitHub 驗證通過，工作目錄沒有尚未提交的程式變更。
2. 執行 npm run build:verified，產生該 commit 的 dist。
3. 由帳號擁有者完成 Cloudflare 官方工具授權。
4. 執行 npx wrangler@4.152.0 pages deploy dist --project-name little-daily --branch main。
5. 記錄平台回傳的部署 ID、網址和 Git commit，確認為 Production。
6. 開啟正式入口，檢查首頁、工具操作、家具試擺、備份及版本更新。
7. 不需保留工具權限時，執行 wrangler logout。

Wrangler 4.152.0 的 OAuth 實作會自動附加 offline_access，即使 --scopes 未列出；授權前需告知並由使用者確認。不要在公開儲存庫或前端保存 API token。若不接受該權限，可由帳號擁有者在 Cloudflare 控制台手動上傳 dist。

## 快取與資料

public/_headers 設定首頁與 sw.js 重新驗證快取，雜湊 assets 長期快取。Service Worker 快取正式產物，使用者可先儲存輸入再按更新版本。網站使用 # 路由並部署於網域根目錄。

工具資料保存在各裝置及網址的瀏覽器內。從本機網址換到正式網域前，先下載 JSON 備份，再於正式站匯入；程式更新不會自動搬移跨網址紀錄。

## 回復舊版

從 Cloudflare 選擇前一個成功的 Production 部署回復，或取得已驗證 commit 重新建置上傳。不要強制推送覆寫 main。回復程式不會回復瀏覽器資料，資料還原需使用者的備份。

## 未啟用項目

自訂網域、GitHub 自動部署、付款與付費權益驗證、雲端同步及原生商店上架均未啟用。若之後要自動部署，應使用受限權限、GitHub Environment secrets 與正式環境審核，不提交憑證。本專案以 Direct Upload 建立，沒有 Git integration 連線。
