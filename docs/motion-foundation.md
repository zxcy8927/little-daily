# 第零組：動畫與觸覺基礎

## 完成範圍

- 動畫集中使用 `--motion-fast: 150ms`、`--motion-medium: 300ms`、`--motion-slow: 600ms` 與 `--motion-ease`。
- 按鈕、工具卡、經驗條、記帳回饋、購物金幣與小屋特效改用上述時間；較慢的循環使用倍數。
- 經驗條改用 transform，移除背景色、邊框與陰影的過場。現有 keyframes 僅使用 transform 與 opacity。
- JavaScript 動畫收尾讀取 CSS token，支援瀏覽器壓縮後的 `.6s` 格式；減少動態效果時不等待動畫，捲動也不使用平滑效果。
- 保留既有 MotionToggle 與 prefers-reduced-motion 行為。
- 加入 MIT 授權的 @capacitor/haptics 8.0.2，保留產生的第三方授權聲明，並同步 Android／iOS 插件設定。
- `src/haptics.ts` 提供輕、中、成功回饋；網頁、不支援的裝置、關閉設定及插件失敗時安靜略過。
- 「更多 → 互動設定」提供觸覺開關，預設關閉。獨立裝置偏好不加入紀錄備份，不改動既有資料格式。

這組只建立基礎。分類、送出與其他操作的觸覺接線，以及小兔狀態，留待後續各組。

## 驗證

- `npm test`：64 個單元測試、54 個介面測試通過，共 118 個。
- `npm run build`：通過。
- Capacitor sync、`npm run mobile:check` 與 `npm run check:release`：通過。
- 瀏覽器確認設定可保存、網頁不震動、小屋暫停後動畫保持暫停。
- 尚未在實體手機驗證震動，也未產出 Android／iOS 安裝包；同步檢查不代表原生編譯成功。

## 本機預覽

執行 `npm run dev`，開啟終端顯示的網址；目前使用中的網址為 http://localhost:5173/。

1. 開啟 `#/more`，展開「互動設定」，切換後重新整理確認保留。
2. 開啟 `#/house`，使用小屋右上角暫停圖示，確認動畫停止且可恢復。
3. 在系統開啟「減少動態效果」，確認動畫與平滑捲動停用。
4. 網頁版切換觸覺設定不會震動；實際震動需在支援的原生手機 App 驗證。
