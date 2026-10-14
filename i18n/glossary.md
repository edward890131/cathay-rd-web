# 中英專有名詞對照（請 Yuu 確認）

> 對應檔案：`i18n/en.json`（200 條）｜驗證腳本：`python3 i18n/extract_zh.py --check`
> 標 ⚠️ 的是沒有官方英文名稱、或需要客戶／法務確認的項目。

## 1. 品牌與機構

| 中文 | 英文 | 理由 |
|---|---|---|
| 國泰產研中心 | Cathay R&D Center | 簡稱用短版，放在 tag、地圖標題剛好。⚠️ 網路上查不到官方英文名，需客戶確認 |
| 國泰產業研發中心 | Cathay Industrial R&D Center | 全名。「產業研發中心」是 BOT 案的正式名稱，用 Industrial 跟一般企業研發部門做出區隔 |
| 國泰產業研發中心股份有限公司 | Cathay Industrial R&D Center Co., Ltd. | 台灣公司登記英文名常見寫法。⚠️ 要以經濟部登記的英文名為準 |
| CNRD | CNRD | 品牌字樣，不翻 |
| 臺北大學 | National Taipei University（NTPU） | 學校官方英文名；內文第二次以後用 NTPU |
| 臺北大學建國校區 | NTPU Jianguo Campus | 照網站用的「建國校區」直譯。⚠️ 臺北大學官方英文稱這裡為 **Taipei Campus**（公車站名也是「臺北大學(臺北校區)」），如果要跟學校一致可改成 NTPU Taipei Campus |
| 北大師生 | NTPU Community（標籤）／NTPU Faculty or a Student（標題句） | 「師生」直譯 Faculty & Students 太長，標籤用 Community 比較短；句子裡才完整講 |
| 研究發展處 | Office of R&D | 大學行政單位的常見英文；NTPU 官方是 Office of Research and Development，按鈕放不下所以縮寫 |

## 2. 空間與段落名稱

| 中文 | 英文 | 理由 |
|---|---|---|
| 園區介紹 | Campus | 導覽列要短；國際園區官網常用 |
| 產學合作 | Partnerships | ⚠️ 你給的範例是 Industry–Academia，但單獨當選單項目讀起來像半句話；Partnerships 在科技園區官網較常見。想保留產學語意可改 Industry Partnerships |
| 產研媒合平台 | R&D Matching Platform | 「產研」= 產業 × 研究，用 R&D 帶過；Header 按鈕用更短的 Matching Platform → |
| 辦公研發空間 | R&D Offices | 給企業租的辦公兼研發樓層，Offices 最直白 |
| 跨院系研發中心 | Interdisciplinary R&D Center | 「跨院系」= 跨學院、跨系所，Interdisciplinary 是學界慣用詞 |
| 產學合作空間 | Industry–Academia Space | 保留「產學」的關鍵字；全稱 Industry–Academia Collaboration Space 太長 |
| 商業生活空間 | Retail & Lifestyle | 商場常見寫法 |
| 綠地公共廣場 | Green Plaza | Public 是多餘的（廣場本來就公共） |
| 進駐企業 | Tenants | 頁面上原本就有英文小標 TENANTS，保持一致 |
| 計畫亮點 | Highlights | 「計畫」翻成 Project 會很像施工案，直接用 Highlights |
| 理念與使命 | Vision & Mission | 企業官網固定說法 |
| 活動消息 | Events & News | |
| 交通資訊 | Getting Here | 比 Transportation 親切，也是國際場館官網常見寫法 |
| 一起從這裡起步 | Start Here, Together | |
| 共創場域 | Co-Creation | |

## 3. 交通（台北捷運、公車官方英文）

| 中文 | 英文 |
|---|---|
| 中和新蘆線／文湖線／松山新店線 | Zhonghe–Xinlu Line／Wenhu Line／Songshan–Xindian Line |
| 行天宮／松江南京／南京復興／中山國中 | Xingtian Temple／Songjiang Nanjing／Nanjing Fuxing／Zhongshan Junior High School |
| 紅57／民生幹線 | R57／Minsheng Main Line |
| 臺北大學(臺北校區)（公車站） | National Taipei University (Taipei Campus) |
| 合江街口（公車站） | Hejiang St. Entrance ⚠️ 依台北市公車「街口 = St. Entrance」慣例，建議上線前到 5284 / 台北等公車核對 |
| 興安合江路口（YouBike 站） | Xing'an & Hejiang Intersection ⚠️ 同上，以 YouBike 官網英文站名為準 |
| 地址 | No. 69, Sec. 2, Jianguo N. Rd., Zhongshan Dist., Taipei City 104382 |

## 4. 集團聲明（法律文字）⚠️

> 原文：註：國泰金控暨旗下子公司國泰人壽、國泰世華銀行、國泰產險、國泰證券、國泰投信等，在台灣及世界各國提供全面性且多元化的金融服務與解決方案，與國泰航空集團互不隷屬亦非關係企業。

> 譯文：Note: Cathay Financial Holdings and its subsidiaries, including Cathay Life Insurance, Cathay United Bank, Cathay Century Insurance, Cathay Securities, and Cathay Securities Investment Trust, provide comprehensive and diversified financial services and solutions in Taiwan and around the world. They are neither subsidiaries nor affiliates of the Cathay Pacific Airways group.

- 公司名稱都採各公司官方英文名（國泰產險 = Cathay Century Insurance，不是 Cathay Property）。
- 「互不隸屬亦非關係企業」→ neither subsidiaries nor affiliates，對應公司法「關係企業」的概念。
- 這是法律聲明，**建議請客戶提供國泰集團既有的官方英文版本直接沿用**，不要用我們自己翻的。

## 5. 其他需要確認的譯法

| 中文 | 英文 | 說明 |
|---|---|---|
| 產學共生，驅動創新未來 | Industry and Academia, Growing Together | 意譯，呼應 Hero 的 Grow Beyond；直譯「驅動創新未來」英文會很空泛 |
| 第六屆厝客松聯展 | 6th Tsu-Hackathon Showcase | ⚠️「厝客松」是台語「厝（家）」+ Hackathon 的雙關，英文無法保留，需要活動方確認是否有官方英文名 |
| 國泰世華商業銀行北二區徵才說明會 | Cathay United Bank North Region 2 Recruiting Session | 假資料，上線時會換 |
| 回到總覽（右下按鈕） | Back to Top | 「Back to Overview」比較準，但按鈕會變很寬；aria-label 有完整說明 |
| 繼續觀看／繼續瀏覽／繼續體驗／開始體驗 | Resume／Next／Continue／Start | 四種狀態用不同的字區分；操作說明裡提到的「繼續觀看」也同步翻成 “Resume” |
| ［待客戶提供］ | [To be provided] | 佔位字 |
| 國泰產業研發中心（3D 立體字） | CATHAY INDUSTRIAL R&D CENTER | CNRD 下方的字是畫在貼圖上的 3D 文字，英文用全大寫才有招牌感 |

## 6. 給實作 session 的注意事項

1. **頭尾空白是故意的**：交通資訊被 `<a>` 切開的句子，例如 `"至「": "Get off at "`、`"」站下車。": " stop."`，英文值有前後空格，換字時不要 trim。
2. **3D 立體字會放不下**：`textTexture()` 的畫布是 1024×128、字級 84px、字距 18px，中文 8 個字剛好；英文 28 個字元大約要 2,000px 寬。需要把英文版字級縮小（約 40px、字距 4px）或加寬畫布。`document.fonts.load()` 第二個參數也要換成英文字串。
3. **Google 地圖網址不要換**：`hero-map.html` 第 2726 行、第 924 行的地圖查詢用的是中文地址，換成英文地址會讓地圖定位變不準；只換畫面上的文字就好。
4. **`・灰盒`** 是開發中標籤的後綴，值是 `" · Gray box"`（前面有空格）。
5. **scenes/*.js 的 `name`** 只會出現在 `scene-viewer.html`（開發用場景檢視器），首頁不會顯示；`scene-viewer.html` 本身的「場景檢視器」不在這次範圍。
6. **開發工具列**（RWD 預覽、材質、人物風格）也翻了，如果上線會隱藏可以不套。
