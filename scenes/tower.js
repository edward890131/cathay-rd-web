// 場景：代表產業的商業大樓
// 園區的地標：一棟玻璃外觀的長方形辦公大樓（室內功能空間已拆成各個場景，這裡只呈現外觀）
// 物件：白色角柱與橫樑、藍色玻璃帷幕（窗櫺 + 樓板帶 + 反光）、一樓玻璃大門、懸吊式玻璃雨遮、屋頂女兒牆
import * as THREE from 'three';
import { M } from '../shared/materials.js';
import { box, roundRect, extrude, makeAdder } from '../shared/kit.js';
import { rod } from './parts.js';

export const meta = {
  id: 'tower',
  name: '代表產業的商業大樓',
  footprint: 'M',          // 10 × 10，見 SPEC.md
  status: 'done',
};

// 玻璃上的斜向反光帶（平行四邊形），畫在本地 xy 平面、z 為玻璃前方
function glints(parent, x0, x1, y0, y1, z, bands = [[0.02, 0.14], [0.22, 0.05], [0.55, 0.1]]) {
  const w = x1 - x0, h = y1 - y0, slant = Math.min(w * 0.45, h * 0.5);
  bands.forEach(([u, bw]) => {
    const a = x0 + w * u, b = a + w * bw;
    if (b + slant > x1) return;                         // 超出玻璃範圍就不畫
    const sh = new THREE.Shape();
    sh.moveTo(a, y0); sh.lineTo(b, y0); sh.lineTo(b + slant, y1); sh.lineTo(a + slant, y1); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.glassGlint);
    m.position.z = z;
    m.renderOrder = 3;
    m.raycast = () => {};                               // 反光不參與滑鼠偵測
    parent.add(m);
  });
}
// 透明玻璃板：不投影子、不擋滑鼠
function glassPane(w, h, d, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.glassPane);
  m.position.set(x, y, z);
  m.renderOrder = 2;
  m.raycast = () => {};
  return m;
}

export default function build() {
  const root = new THREE.Group();
  const items = [];
  const add = makeAdder(root, items);

  // ---------- 1. 地基 ----------
  const platform = new THREE.Group();
  platform.add(box(10, 1, 10, M.base, 0, -0.5, 0, 0.3));
  root.add(platform);

  // ---------- 2. 大樓本體（長方形：寬 WX × 深 WZ） ----------
  const CX = -0.2, CZ = -0.7;                            // 大樓中心（稍微往後，前方留給雨遮）
  const WX = 6.6, WZ = 4.6;                              // 寬（x）、深（z）
  const H = 12.4, TOP = 13.0;                            // 玻璃頂、女兒牆頂
  const LOBBY = 2.6, BELT = 0.5;                         // 一樓大廳高度、大廳上方橫樑厚度
  const UP0 = LOBBY + BELT;                              // 樓上玻璃起點
  const PIL = 0.62;                                      // 角柱粗細
  const tower = new THREE.Group();

  tower.add(box(WX - 0.4, H, WZ - 0.4, M.towerGlass, 0, H / 2, 0, 0.05));     // 玻璃核心
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) =>
    tower.add(box(PIL, TOP, PIL, M.white, sx * (WX / 2 - PIL / 2), TOP / 2, sz * (WZ / 2 - PIL / 2), 0.12)));   // 四根白色角柱
  tower.add(box(WX, BELT, WZ, M.white, 0, LOBBY + BELT / 2, 0, 0.1));       // 大廳上方橫樑（與角柱切齊）
  // 屋頂女兒牆：外緣與角柱切齊，四邊從地面到屋頂一直線
  const rim = roundRect(WX - 0.08, WZ - 0.08, 0.16);
  rim.holes.push(roundRect(WX - 0.9, WZ - 0.9, 0.08));
  const parapet = extrude(rim, 0.52, M.white, 0.04);
  parapet.rotation.x = -Math.PI / 2;
  parapet.position.y = (H + TOP) / 2 - 0.02;
  tower.add(parapet);

  // 四個立面：每面一個群組，本地 +z 朝外（rotY：0 = +z、π/2 = +x、π = −z、−π/2 = −x）
  const floors = 6, floorH = (H - UP0) / floors;
  [
    [0, WX - 0.4, WZ - 0.4, 7],                // 正面（+z，長邊）
    [Math.PI / 2, WZ - 0.4, WX - 0.4, 5],      // 右側（+x，短邊）
    [Math.PI, WX - 0.4, WZ - 0.4, 7],
    [-Math.PI / 2, WZ - 0.4, WX - 0.4, 5],
  ].forEach(([r, fw, fd, cols], fi) => {
    const f = new THREE.Group();
    f.rotation.y = r;
    const half = fw / 2, zf = fd / 2 + 0.03;
    // 夜晚會亮的窗格：每層 × 每欄一片，約 85% 亮燈（白天與玻璃同色，看不出來）
    const zl = fd / 2 + 0.012, bw = fw / cols;
    for (let k = 0; k < floors; k++) {
      for (let i = 0; i < cols; i++) {
        const lit = ((fi * 31 + i * 17 + k * 13 + 7) * 2654435761 >>> 0) % 100 < 85;   // 固定的「亂數」，每次都一樣
        if (lit) f.add(box(bw - 0.1, floorH - 0.14, 0.02, M.towerLit, -half + bw * (i + 0.5), UP0 + floorH * (k + 0.5), zl, 0.01));
      }
    }
    // 一樓大廳整面亮燈（正面避開大門）
    if (fi === 0) f.add(box(half - 0.05 + 0.3, LOBBY - 0.1, 0.02, M.towerLit, (half - 0.05 - 0.3) / 2, LOBBY / 2, zl, 0.01));
    else f.add(box(fw - 0.1, LOBBY - 0.1, 0.02, M.towerLit, 0, LOBBY / 2, zl, 0.01));
    // 樓上：直向窗櫺 + 每層樓板帶
    for (let i = 1; i < cols; i++)
      f.add(box(0.08, H - UP0, 0.08, M.towerMullion, -half + (fw / cols) * i, UP0 + (H - UP0) / 2, zf, 0.03));
    for (let k = 1; k < floors; k++) f.add(box(fw - 0.6, 0.12, 0.08, M.towerBand, 0, UP0 + floorH * k, zf + 0.01, 0.04));
    // 一樓大廳：較疏的窗櫺（正面留出大門位置）
    const lob = fi === 0 ? [0.4, 1.8] : [-fw / 4, 0, fw / 4];
    lob.forEach(x => f.add(box(0.08, LOBBY, 0.08, M.towerMullion, x, LOBBY / 2, zf, 0.03)));
    // 看得到的兩面（+z、+x）加斜向反光
    if (fi < 2) glints(f, -half + 0.35, half - 0.35, UP0 + 0.1, H - 0.1, zf + 0.06);
    tower.add(f);
  });

  // ---------- 3. 正面（+z）玻璃大門 ----------
  const DX = -1.5, FZ = (WZ - 0.4) / 2 + 0.03;          // 門中心 x、正面玻璃的 z
  const DW = 2.0, DH = 2.25;                             // 門洞寬、高
  // 白色門框（凸出牆面）
  tower.add(box(DW + 0.3, 0.16, 0.22, M.white, DX, DH + 0.08, FZ + 0.08, 0.05));
  [-1, 1].forEach(s => tower.add(box(0.15, DH + 0.16, 0.22, M.white, DX + s * (DW / 2 + 0.075), (DH + 0.16) / 2, FZ + 0.08, 0.05)));
  // 玻璃後方亮燈的大廳（夜晚會亮）
  tower.add(box(DW, DH, 0.03, M.shopGlow, DX, DH / 2, FZ + 0.0, 0.01));
  // 兩扇玻璃門：金屬細框 + 透明玻璃 + 長條把手 + 反光
  const leafW = DW / 2;
  [-1, 1].forEach(s => {
    const cx = DX + s * leafW / 2;
    const frame = roundRect(leafW - 0.03, DH - 0.03, 0.02);
    frame.holes.push(roundRect(leafW - 0.15, DH - 0.15, 0.01));
    const fr = extrude(frame, 0.03, M.metal, 0.012);
    fr.position.set(cx, DH / 2, FZ + 0.06);
    tower.add(fr);
    tower.add(glassPane(leafW - 0.14, DH - 0.14, 0.02, cx, DH / 2, FZ + 0.06));
    tower.add(rod(new THREE.Vector3(cx - s * (leafW / 2 - 0.14), 0.75, FZ + 0.14),
                  new THREE.Vector3(cx - s * (leafW / 2 - 0.14), 1.55, FZ + 0.14), 0.022, M.metal));   // 長條把手（靠門縫）
    glints(tower, cx - (leafW - 0.16) / 2, cx + (leafW - 0.16) / 2, 0.1, DH - 0.1, FZ + 0.08, [[0.05, 0.22], [0.45, 0.08]]);
  });

  // ---------- 4. 懸吊式玻璃雨遮（白色細框 + 透明玻璃 + 兩根金屬斜拉桿） ----------
  const CW = 3.0, CD = 1.6, CY = LOBBY - 0.04;          // 雨遮寬、伸出長度、高度
  const CZc = WZ / 2 + CD / 2 - 0.15;                    // 雨遮中心 z（相對大樓中心）
  const cfr = roundRect(CW, CD, 0.06);
  cfr.holes.push(roundRect(CW - 0.24, CD - 0.24, 0.03));
  const canopyFrame = extrude(cfr, 0.06, M.white, 0.025);
  canopyFrame.rotation.x = -Math.PI / 2;
  canopyFrame.position.set(DX, CY, CZc);
  tower.add(canopyFrame);
  tower.add(glassPane(CW - 0.22, 0.03, CD - 0.22, DX, CY, CZc));
  // 雨遮玻璃上的反光（平放），讓它看得出是一片玻璃而不是空框
  const canopyGlint = new THREE.Group();
  glints(canopyGlint, -(CW - 0.3) / 2, (CW - 0.3) / 2, -(CD - 0.3) / 2, (CD - 0.3) / 2, 0, [[0.05, 0.16], [0.3, 0.06], [0.55, 0.12]]);
  canopyGlint.rotation.x = -Math.PI / 2;
  canopyGlint.position.set(DX, CY + 0.03, CZc);
  tower.add(canopyGlint);
  [-1, 1].forEach(s => tower.add(rod(
    new THREE.Vector3(DX + s * (CW / 2 - 0.15), CY + 0.04, CZc + CD / 2 - 0.12),     // 雨遮前緣
    new THREE.Vector3(DX + s * (CW / 2 - 0.15), UP0 - 0.06, WZ / 2 + 0.02),          // 橫樑上的固定點
    0.03, M.metal)));
  add(tower, CX, CZ, 0.1);

  return { root, items };
}
