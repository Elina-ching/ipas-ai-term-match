# 維運筆記

給日後接手的人。這份記錄的是「怎麼改、怎麼查、出事怎麼辦」，不重複 README 已寫的功能說明。

## 部署

正式網址與 API 是同一個 Worker，因此沒有 CORS 問題，也沒有公開金鑰。

```
npm install
node build.mjs
npx wrangler deploy
```

`node build.mjs` 一定要在 `deploy` 之前跑。它做三件事：

1. 把根目錄的 `.html/.css/.js` 複製到 `public/`（Worker 的靜態資源目錄，已列入 `.gitignore`）。
2. 從題庫產生 `server/answers.mjs`，這是後端的答案白名單。
3. 從 `_headers` 產生 `server/headers.mjs`，這是 Worker 套用的資安標頭。

`server/answers.mjs` 與 `server/headers.mjs` 是**產生檔但有進版控**，因為 Worker 直接 import 它們。改完題庫或 `_headers` 卻忘記重跑 build，部署出去的就會是舊的。

## 改題庫的流程

題庫分散在四個檔案，都掛在 `window` 上：

| 檔案 | 變數 | 內容 |
| --- | --- | --- |
| `data.js` | `TERM_BANK` | 中級名詞 |
| `levels.js` | `BEGINNER_BANK` | 初級名詞 |
| `curriculum.js` | 追加到上面兩個 | 已核對官方科目與勘誤頁碼的知識點 |
| `python-data.js` | `PYTHON_BANK` | Python 選擇題 |

改完之後：

```
node build.mjs
node --test tests.mjs server-tests.mjs
npx wrangler deploy
```

**注意**：知識點的 `id` 一旦上線就不要改。世界榜的星星是用 `id` 記在 `mastery` 表裡的，改 id 等於讓玩家已經拿到的星星對不上，舊 id 會變成孤兒資料。要淘汰某個知識點，寧可讓它留在資料庫裡。

## 免費額度與監看

在 Cloudflare 後台看兩個地方：

- **Workers → ipas-ai-term-match → 指標**：每日請求數，免費上限 100,000 次／日。
- **儲存和資料庫 → D1 → ipas-adventure**：讀取列數（上限 5,000,000／日）、寫入列數（上限 100,000／日）、儲存空間（單一免費 DB 上限 500 MB）。

寫入是最容易先撞牆的一項。目前的設計已經盡量省：前端對已計星的知識點不再送出請求，所以正常情況下**每位玩家每個知識點一輩子只寫一次**，初級 36 + 中級 136 + Python 18 = 190 次為上限。

超額時會怎樣：Worker 回錯誤，前端顯示同步失敗並把知識點留在本機佇列，**遊戲本身照常可玩**，額度恢復後會自動補送。不要為了衝額度去開付費方案，這是刻意的設計取捨。

真的需要擴容時的順序：先看是不是被灌帳號（查 `players` 筆數），再考慮調 `wrangler.jsonc` 裡的限流數字，最後才談付費。

## 濫用與容量

- `JOIN_LIMIT`：每個 IP 每分鐘只能建立 3 個身分。
- `API_LIMIT`：每個 IP 每分鐘 60 次請求。
- 硬上限 2,000 個匿名身分，寫在 `worker.mjs` 的 join SQL 裡（`WHERE (SELECT COUNT(*) FROM players)<2000`）。額滿回 503「Community capacity reached」。

限流鍵用的是 `CF-Connecting-IP`，只交給平台限流器，**不寫進資料庫也不寫進日誌**。

## 資料庫結構

- `players`：隨機 id、憑證的 SHA-256、隨機代號。
- `mastery`：每個玩家在每個等級答對過的知識點，主鍵去重。
- `scores`：由觸發器維護的星數彙總，排名只查這張表，不必每次掃 `mastery`。
- `activity`：每個玩家最後一次動作的時間戳。

`schema.sql` 可以重複執行（全部 `IF NOT EXISTS`），而且結尾會用 `mastery` 重新對帳 `scores`，所以**懷疑星數對不上時，重跑一次 schema 就會修正**：

```
npx wrangler d1 execute ipas-adventure --remote --file=server/schema.sql
```

刪除玩家時靠外鍵 `ON DELETE CASCADE` 連帶清掉 `mastery`、`scores`、`activity`。

## 驗收

改動後端後，除了 Node 測試，建議對正式站再跑一次雲端驗收：

```
node smoke.mjs https://ipas-ai-term-match.<你的子網域>.workers.dev
```

它會建立 2 個測試身分、寫幾筆資料、驗證去重與隔離，**最後在 `finally` 區塊把自己建立的身分刪掉**。憑證不落地。跑之前要知道：它確實會動到正式資料庫，只是可逆。

注意 `JOIN_LIMIT` 是每分鐘 3 個，連續跑兩次驗收可能撞到限流而拿到 429，等一分鐘再跑。

## 已知限制

- **瀏覽器自動化工具無法通過原生 `confirm()` 視窗**。首頁的「刪除我的雲端紀錄」用的是瀏覽器原生確認框，自動化測試會卡在那裡。這不是後端問題，刪除功能本身已由 `smoke.mjs` 與 `server-tests.mjs` 驗證。要用瀏覽器驗這個按鈕，得由真人點擊。
- `_headers` 這個檔在目前的 Workers 靜態資源部署方式下**不會被自動套用**，所以標頭改由 Worker 補上。若日後改用 Cloudflare Pages，`_headers` 會自己生效，屆時 Worker 那段可以再評估。
- 本機同步佇列上限 400 筆。長期不加入世界榜又一直答題的話，最舊的會被丟掉。
- 清除瀏覽器資料等於永久失去該匿名身分，雲端那筆資料將沒有人能刪除（沒有憑證就無法證明身分）。介面上已提醒使用者先刪雲端身分再清瀏覽器。

## 這個專案刻意不做的事

- 不放廣告、分析追蹤、外部字型或任何第三方請求（CSP 的 `default-src 'self'` 就是在守這件事）。
- 不要求任何個人資料，連暱稱都是系統隨機給的。
- 不做正式競賽用的防作弊。題庫與答案本來就是公開的靜態檔，任何人都能直接呼叫 API 回報已知答案。這是休閒學習榜，不要拿來發獎金。
