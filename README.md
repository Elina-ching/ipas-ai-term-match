# AI 群島冒險｜iPAS 學習派對

保留貨運快手、翻牌對對碰、名詞高射炮，新增初級獨立題庫、冒險地圖與中級 Python 研究島。

- 初級 24 個知識點；中級保留既有題庫。
- Python 18 題：輸出雷達、程式修復、流程拼圖。自編讀碼練習，不執行任意 Python。
- 初／中級本機紀錄分開；舊版紀錄在中級繼續讀取。
- 貨運預設學習模式，每題停留看解釋；可取消切回節奏挑戰。
- 錯題再練、逐題詳解、Python 每局正確率、減少動畫、鍵盤可操作。
- 隨機匿名身分，世界榜依每個等級答對的不同知識點計星；同題不重複累積。
- 世界榜為休閒性學習紀錄。題庫與答案公開，不能防止使用者自行呼叫 API 回報已知答案，不適合獎金或正式競賽。

## 本機或 GitHub Pages

根目錄 `index.html` 為入口，無 npm 套件、付費 API、外部字型或追蹤碼。GitHub Pages 可直接服務所有遊戲；未設定 Worker 後端時，世界榜會明確顯示尚未啟用，不顯示假排名。

## 免費匿名世界榜部署

需要擁有者的 Cloudflare Free 帳戶和部署授權。此提交未啟用任何付費服務。不能在缺少帳戶連線時代為建立後端。

1. 在 Cloudflare Free 帳戶建立 D1 資料庫 `ipas-adventure`，將資料庫 ID 填入 `wrangler.jsonc`。
2. 本機執行 `node build.mjs`，生成 `public/` 與後端答案白名單。
3. 用免費 Wrangler CLI 執行 `npx wrangler d1 execute ipas-adventure --remote --file=server/schema.sql`。
4. 執行 `npx wrangler deploy`。遊戲與 API 同一個 Worker 網址，無須 CORS 或公開金鑰。
5. 在兩個獨立瀏覽器加入，答對不同知識點、更新榜單，再驗證刪除身分。

**部署尚待完成：** `database_id` 是清楚標示的待設定值，不能原樣部署；GitHub Pages 單獨無法提供多人共用資料庫。完整多人版應分享 Worker 網址。

2026-09-06 查核官方免費方案：Workers 動態請求 100,000 次／日；D1 每日讀取 5,000,000 rows、寫入 100,000 rows、帳戶總儲存 5 GB（單一免費 DB 最大 500 MB）。实际承載量還受到使用方式、排名查詢與其他帳戶用量影響，不能保證無限多人。維持 Free 計畫，超額同步失敗但本機遊戲仍可繼續；不開通付費計畫或自動升級。

- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/

## 隱私

不要求姓名、Email、電話、自由文字暱稱或社群登入。伺服器只保存隨機 ID、雜湊登入憑證、系統隨機代號、答對知識點。原始憑證只在加入時回傳並存在該瀏覽器。使用者可刪除自己的雲端紀錄；刪除操作須出示憑證。清除瀏覽器會失去登入憑證，無法恢復身分。主機供應商仍可能處理必要連線資訊，不能宣稱完全不存在 IP 等個人資料處理。應用不記錄 IP，Worker observability 預設關閉。

## 學習來源與範圍

對照官方學習資源中初級科目 1 人工智慧基礎概論、科目 2 生成式 AI 應用與規劃；中級科目 1 人工智慧技術應用與規劃、科目 2 大數據處理分析與應用、科目 3 機器學習技術與應用。並提供官方勘誤入口。

https://ipd.nat.gov.tw/ipas/certification/AIAP/learning-resources

題目為自編練習，並非官方題庫全文重製。Python 基礎語法是支援資料處理的延伸練習，不宣稱逐題皆為官方考點。既有延伸工具名詞完整保留，尚未逐條對應官方頁碼。此版非全考綱覆蓋，不保證考試通過或每位玩家的學習效果。

| 島嶼 | 學習行為 | 回饋 |
| --- | --- | --- |
| 貨運港口 | 名詞對應定義 | 每題解釋，預設等待讀完 |
| 記憶森林 | 主動回想名詞與定義 | 配對與錯配提供概念解釋 |
| 名詞火山 | 中英名詞辨識 | 命中與失誤都顯示定義 |
| Python 研究島 | 預測、修復、步驟排序選擇 | 每題詳解、錯題再練、回合正確率 |

## 驗證

`node build.mjs`、`node --test tests.mjs`。未進行瀏覽器視覺或真實雲端多人測試；上線前需要在已連線的免費帳戶完成部署驗證。
