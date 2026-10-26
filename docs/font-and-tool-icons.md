# 第四組：字型與工具圖示（2026-10-26）

## 字型

- 原始 `public/huninn.ttf`：4,911,464 bytes。
- 替換為 `public/little-daily-round.woff2`：1,165,576 bytes，減少約 76.3%。保留 5,871 個字碼。
- 保留 Big5 第一字集常用繁體字、現有 src/public 介面用字、拉丁字母、數字、常用標點、全形符號與注音；以原字型原有字碼為限。罕用字會使用 Microsoft JhengHei / PingFang TC / sans-serif 備用字型。
- 字型仍為原有圓潤字形，400 字重；沒有調細。沿用 `font-display: swap`。
- 原 `public/huninn-LICENSE.txt` 完整保留，字型內著作權與授權欄位亦保留。依 SIL OFL 1.1，修改版本改名為 **Little Daily Round**，不沿用保留名稱。參考：https://openfontlicense.org/how-to-modify-ofl-fonts/ 。
- 離線快取清單與測試同步換為 WOFF2，避免離線遺漏字型。

## 重新產製

產製腳本為 `scripts/subset-font.py`，工具為 FontTools 4.67.0、Brotli 1.2.1。工具只供開發產製，不加入 App 套件依賴。

提供原始字型路徑後執行 `python scripts/subset-font.py <原始字型路徑>`。原始版本可從此次提交的上一個版本取得（`56509ee:public/huninn.ttf`）。腳本會收集目前介面字元並驗證輸出保留必要字碼。未來大量增加新文案時可重新產製。

## 圖示

- 使用使用者提供的 ToolIcon.tsx 中六款 16 × 16 像素圖案：平底鍋、購物袋、錢袋、狗狗、記事本、愛心。
- 多色 SVG，保留 crispEdges；合併同列同色像素減少節點。
- 所有圖示配色集中於 design-tokens.css，以工具專屬 CSS 變數引用，不依賴舊 tools.ts 色碼；記事本採藍灰，沒有新增紫色。
- 圖示保留 aria-hidden / focusable=false，工具名稱由鄰近文字提供。未知 id 使用記事本。

## 驗證與本機預覽

`npm test` 通過（64 個單元測試、100 個介面測試）；`npm run build` 通過。字型重新讀取驗證 5,871 個必要字碼、授權與更名資訊。手機 390 × 844 檢查六款圖示、色票解析與無水平溢位；瀏覽器無字型解碼錯誤。

執行 `npm run dev -- --host 127.0.0.1 --port 5173`，開啟 http://localhost:5173/#/more ，捲到「日常工具」。各工具頁標題也共用同一組圖示。
