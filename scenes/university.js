// 場景：代表學界的大學建築
// 依 Yuu 決定：照參考圖做成古典大學建築的可愛小物件比例（不還原園區真實建物）
// 物件：主樓 + 四柱門廊 + 三角山牆與時鐘 + 大階梯、左右兩座側翼、藍色平屋頂、橘框窗戶（夜晚會亮）
import * as THREE from 'three';
import { M } from '../shared/materials.js';
import { box, cyl, roundRect, extrude, makeAdder } from '../shared/kit.js';

export const meta = {
  id: 'university',
  name: '代表學界的大學建築',
  footprint: 'M',          // 10 × 10，見 SPEC.md
  status: 'done',
};

// ---------- 場景專用小工具 ----------

// 古典量體：底座 + 牆身 + 頂部簷口 + 女兒牆 + 藍色平屋頂；(x, z) 為中心
function block(g, w, d, h, x, z) {
  g.add(box(w + 0.1, 0.45, d + 0.1, M.univStone, x, 0.225, z, 0.06));          // 底座
  g.add(box(w, h, d, M.univStone, x, h / 2, z, 0.08));                           // 牆身
  g.add(box(w + 0.18, 0.22, d + 0.18, M.univStone, x, h + 0.11, z, 0.06));      // 簷口
  const rim = roundRect(w + 0.08, d + 0.08, 0.1);
  rim.holes.push(roundRect(w - 0.42, d - 0.42, 0.05));
  const parapet = extrude(rim, 0.26, M.univStone, 0.03);                        // 女兒牆
  parapet.rotation.x = -Math.PI / 2;
  parapet.position.set(x, h + 0.37, z);
  g.add(parapet);
  g.add(box(w - 0.38, 0.05, d - 0.38, M.univRoof, x, h + 0.245, z, 0.02));     // 藍色平屋頂
}

// 窗戶：橘色外框 + 亮燈玻璃 + 十字窗櫺 + 奶油色窗台；本地 +z 朝外
function windowAt(g, x, y, z, rotY = 0, w = 0.62, h = 1.9) {
  const win = new THREE.Group();
  win.add(box(w, h, 0.1, M.apricot, 0, 0, 0, 0.03));                           // 外框
  win.add(box(w - 0.14, h - 0.14, 0.06, M.univLit, 0, 0, 0.04, 0.02));         // 玻璃（夜晚會亮）
  win.add(box(0.05, h - 0.14, 0.08, M.apricot, 0, 0, 0.06, 0.02));             // 直窗櫺
  win.add(box(w - 0.14, 0.05, 0.08, M.apricot, 0, h * 0.18, 0.06, 0.02));      // 橫窗櫺
  win.add(box(w + 0.2, 0.1, 0.22, M.univStone, 0, -h / 2 - 0.05, 0.08, 0.03)); // 窗台
  win.position.set(x, y, z);
  win.rotation.y = rotY;
  g.add(win);
}

export default function build() {
  const root = new THREE.Group();
  const items = [];
  const add = makeAdder(root, items);

  // ---------- 1. 地基 ----------
  const platform = new THREE.Group();
  platform.add(box(10, 1, 10, M.plazaFloor, 0, -0.5, 0, 0.3));
  root.add(platform);

  // ---------- 2. 建築本體：主樓 + 左右側翼 ----------
  const bld = new THREE.Group();
  const WH = 3.6, CH = 4.8;                              // 側翼高、主樓高
  const WZ0 = -2.6, WZ1 = 0.4;                           // 側翼前後
  block(bld, 2.7, WZ1 - WZ0, WH, -3.25, (WZ0 + WZ1) / 2); // 左翼
  block(bld, 2.7, WZ1 - WZ0, WH, 3.25, (WZ0 + WZ1) / 2);  // 右翼
  block(bld, 3.8, 4.4, CH, 0, -1.2);                      // 主樓（z −3.4 ~ 1.0）
  // 側翼正面窗戶（+z）
  [-4.1, -3.25, -2.4, 2.4, 3.25, 4.1].forEach(x => windowAt(bld, x, 2.05, WZ1 + 0.03));
  // 右翼側面窗戶（+x）
  [-2.0, -1.1, -0.2].forEach(z => windowAt(bld, 4.6 + 0.03, 2.05, z, Math.PI / 2));
  // 主樓側面上方的小窗（高於側翼的部分）
  [-2.6, -1.2, 0.2].forEach(z => windowAt(bld, 1.9 + 0.03, 4.15, z, Math.PI / 2, 0.5, 0.8));
  add(bld, 0, 0, 0.1);

  // ---------- 3. 門廊：平台 + 四根柱子 + 橫樑 + 三角山牆 + 時鐘 ----------
  const portico = new THREE.Group();
  const PZ = 1.0;                                        // 主樓正面的 z
  portico.add(box(4.0, 0.5, 1.3, M.univStone, 0, 0.25, PZ + 0.65, 0.06));      // 門廊平台
  // 大門（亮燈，夜晚會亮）+ 兩側窗
  portico.add(box(1.0, 2.55, 0.1, M.apricot, 0, 0.5 + 1.27, PZ + 0.03, 0.04));
  portico.add(box(0.84, 2.4, 0.06, M.shopGlow, 0, 0.5 + 1.22, PZ + 0.07, 0.02));
  portico.add(box(0.05, 2.4, 0.08, M.apricot, 0, 0.5 + 1.22, PZ + 0.09, 0.02));
  [-1.1, 1.1].forEach(x => windowAt(portico, x, 2.1, PZ + 0.03, 0, 0.5, 1.7));
  // 四根圓柱：柱礎 + 柱身 + 柱頭
  [-1.6, -0.6, 0.6, 1.6].forEach(x => {
    portico.add(box(0.44, 0.12, 0.44, M.univStone, x, 0.56, PZ + 0.85, 0.04));
    portico.add(cyl(0.16, 0.18, 2.84, M.univStone, x, 0.5 + 1.48, PZ + 0.85, 20));
    portico.add(box(0.46, 0.14, 0.46, M.univStone, x, 3.39, PZ + 0.85, 0.04));
  });
  portico.add(box(4.1, 0.4, 1.4, M.univStone, 0, 3.66, PZ + 0.6, 0.06));      // 橫樑（上緣 3.86）
  // 三角山牆
  const tri = new THREE.Shape();
  tri.moveTo(-2.05, 0); tri.lineTo(2.05, 0); tri.lineTo(0, 1.0); tri.closePath();
  const pediment = extrude(tri, 1.3, M.univStone, 0.04);
  pediment.position.set(0, 3.86, PZ + 0.6);
  portico.add(pediment);
  // 時鐘：奶油色外圈 + 白色鐘面（夜晚會亮）+ 時針分針
  const CZ = PZ + 0.6 + 0.65 + 0.04;
  const ring = cyl(0.27, 0.27, 0.08, M.univStone, 0, 4.24, CZ + 0.02, 32);
  ring.rotation.x = Math.PI / 2;
  portico.add(ring);
  const face = cyl(0.21, 0.21, 0.04, M.lampGlow, 0, 4.24, CZ + 0.06, 32);
  face.rotation.x = Math.PI / 2;
  portico.add(face);
  const hourHand = box(0.035, 0.12, 0.02, M.dark, 0.03, 4.28, CZ + 0.09, 0.01);
  hourHand.rotation.z = -0.5;
  portico.add(hourHand);
  portico.add(box(0.03, 0.17, 0.02, M.dark, 0, 4.32, CZ + 0.1, 0.01));
  // 大階梯：五階往前下降 + 兩側擋牆
  for (let i = 0; i < 5; i++) {
    const h = 0.5 - i * 0.1;
    portico.add(box(3.2, h, 0.24, M.univStone, 0, h / 2, PZ + 1.3 + 0.12 + i * 0.22, 0.03));
  }
  [-1.78, 1.78].forEach(x => {
    portico.add(box(0.32, 0.6, 1.2, M.univStone, x, 0.3, PZ + 1.9, 0.06));
    portico.add(box(0.38, 0.08, 1.26, M.univStone, x, 0.64, PZ + 1.9, 0.03));
  });
  add(portico, 0, 0, 0.3);

  return { root, items };
}
