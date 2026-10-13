# 國泰產研官網 · 3D 場景建模規格

這份規格是「園區地圖（hero-map）」和「場景建模」兩條工作線共用的規則。兩邊都照這份做，場景完成後才能直接放進地圖，不用返工。

## 0. 設計原則（客戶要求，最優先）

- **不還原實際建物。** 客戶明確表示不希望網站視覺寫實還原園區大樓，要用**抽象的方式**傳遞「共創聚落、交流」的概念。
- 建築照片只能當**氛圍參考**（例如金色直向線條、退台的屋頂綠化），**不可照著照片建模**。
- 「代表學界的大學建築」是**符號化的小物件**；「代表產業的商業大樓」依 Yuu 決定做成參考圖的玻璃外觀大樓。兩者都不是園區真實建築。
- 不要做成積木風（太童趣、太像參考網站）。目標質感是**霧面塑膠、圓角、有厚度、柔和光影**，以 `scenes/office.js` 為品質基準。

## 1. 檔案分工（避免兩個 session 改到同一個檔案）

| 路徑 | 負責 | 說明 |
|---|---|---|
| `shared/stage.js` | 地圖 session | 相機、燈光、進場動畫（**建模 session 不可修改**） |
| `shared/kit.js` | 地圖 session | 共用建模工具（建模 session 需要新工具時，寫在自己的場景檔內） |
| `shared/materials.js` | 兩邊 | 既有材質**不可修改**；建模 session 需要新顏色時，只能加在檔案最後的「場景新增」區塊。**新增前先搜尋整個檔案確認名稱沒被用過**（曾發生 `M.cream` 撞名，把動物的白毛蓋成橘色），名稱建議加場景前綴，例如 `shopWall` |
| `scenes/<id>.js` | 建模 session | 每個場景一個檔案 |
| `hero-map.html` | 地圖 session | 園區地圖構圖 |
| `scene-viewer.html` | 兩邊 | 單一場景檢視器；新增場景時把 id 加進 `SCENES` 清單 |

## 2. 座標與尺寸

- **單位**：1 單位 ≈ 30 cm（辦公椅座高約 1.2、桌面高約 1.8、牆高 4.4）
- **原點**：場景地基的**上表面中心**＝ `(0, 0, 0)`；地基本體在 `y = -1 ~ 0`
- **地基尺寸**：所有場景統一 **10 × 10**，厚度 1，圓角 0.3，材質 `M.base`（綠地類可改用 `M.grass`）
- **高度上限**：室內場景 ≤ 4.5；`tower` ≤ 14；`university` ≤ 8
- **朝向**：觀看者在 `+x +z` 方向。牆、櫃子等高的東西放在 `-x` 或 `-z` 側，才不會擋住畫面
- **細節程度**：首頁鳥瞰時一個場景只有約 120–150 px 寬，小於 0.15 單位的細節只在拉近時看得到。**先把大輪廓做對，再加小細節**

## 3. 視角與光源（不可修改）

- 正交相機、等角方向 `(20, 17, 20)`（定義在 `shared/stage.js` 的 `ISO_DIR`）
- 光源從左前上方 `(-6, 14, 9)`（`SUN_DIR`）
- 色調：ACES、曝光 0.82

## 4. 場景檔格式

```js
import * as THREE from 'three';
import { M } from '../shared/materials.js';
import { box, cyl, ball, roundRect, extrude, tree, lamp, makeAdder } from '../shared/kit.js';

export const meta = { id: 'cowork', name: '創新共創空間', footprint: 'M', status: 'wip' }; // 完成後改成 'done'

export default function build() {
  const root = new THREE.Group();
  const items = [];
  const add = makeAdder(root, items);   // add(group, x, z, 進場延遲秒數, rotY, { hoverable })

  const platform = new THREE.Group();   // 地基不參與掉落動畫，直接 root.add
  platform.add(box(10, 1, 10, M.base, 0, -0.5, 0, 0.3));
  root.add(platform);

  // 每一件家具／物件包成一個 Group，用 add() 加入 → 會依序掉落、滑過會浮起
  return { root, items };
}
```

- 程式碼要附**中文註解**
- 材質一律用 `M.xxx`，不要在場景檔內 `new` 材質（例外：一次性的小色塊可以，但要註明原因）
- 書櫃、櫃體一律用 `M.shelfWood`（比 `M.wood` 深、比大學外牆淺的咖啡色）；桌面等其他木頭仍用 `M.wood`
- 共用同一個幾何的大量小物件（例如鍵盤按鍵），重複使用同一個 geometry
- `status: 'done'` 後，地圖會自動把灰盒換成正式模型

## 5. 場景清單與參考圖

Figma 檔案：`yy3k2SSzB7rAaowISrpJgo`（國泰產研_前台視覺提案），頁面「場景概念」frame `167:4618`

| id | 名稱 | Figma 參考圖節點 | 物件組合（來自 Notion 描述） | 狀態 |
|---|---|---|---|---|
| `office` | 辦公研發空間 | `167:4621` | 辦公桌、人體工學椅、電腦、收納矮櫃 | ✅ done |
| `cowork` | 創新共創空間 | `167:4625` | 大型構想展示板、四人討論桌、簡單展示台、少量提案資料 | ⬜ |
| `exchange` | 產學交流共享空間 | `167:4624` | 模組化沙發、低矮圓桌、簡易咖啡吧台、共享長桌 | ⬜ |
| `plaza-a` | 綠地公共廣場（圓形廣場） | `167:4622` | 兩棵大樹、台階往下延伸的圓形廣場、花圃 | ⬜ |
| `plaza-b` | 綠地公共廣場（大樹長椅） | `167:4623` | 一棵大樹、環繞樹木的弧形長椅、步道、指示牌 | ⬜ |
| `shop` | 商業生活空間 | `167:4620` | 簡化商店建築、條紋遮陽棚、戶外雙人桌椅、立式招牌 | ⬜ |
| `tower` | 代表產業的商業大樓 | `167:4652` | 依 Yuu 決定：做成參考圖那種**玻璃外觀大樓**（仍是可愛小物件比例，不還原園區真實建物） | 🟡 |
| `university` | 代表學界的大學建築 | `173:4655` | **抽象符號**，不寫實 | ⬜ |

AI 參考圖只參考**物件組合與氛圍**；透視歪斜、比例不對的地方以本規格為準。

## 6. 本機預覽

```bash
python3 serve.py
```

- `serve.py` 會關掉瀏覽器快取，改了 `materials.js` 或場景檔後一般重新整理就看得到（`python -m http.server` 會快取 ES module，要強制重新整理）
- 要讓同一個網路的同事也能看：`python3 serve.py --lan`

- 單一場景：`http://localhost:5181/scene-viewer.html?scene=cowork`
- 園區地圖：`http://localhost:5181/hero-map.html`

## 7. 地圖的效能處理（建模時請配合）

- hero-map 會把場景內**同材質、不透明的一般網格**合併成一個網格再畫，所以場景裡不要有需要自己動的零件；如果有，先告訴 Yuu
- 以下物件**不會被合併**、保留原樣：`InstancedMesh`、透明材質（玻璃、反光帶，可保留 `renderOrder` 與自訂 `raycast`）、燈光
- `kit.js` 的 `box / ball / cyl` 會依尺寸自動降低小物件的面數；小零件請盡量用它們
