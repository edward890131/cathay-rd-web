// 場景：創新共創空間
// 「讓團隊圍繞構想討論、提案、展示原型的開放空間」
// 物件：大型構想展示板、四人討論桌、簡單展示台（格櫃）、少量提案資料
import * as THREE from 'three';
import { M } from '../shared/materials.js';
import { box, cyl, ball, roundRect, extrude, placeBinder, makeAdder } from '../shared/kit.js';
import { roundDisc, rod, chairShell, leafPlant } from './parts.js';

export const meta = {
  id: 'cowork',
  name: '創新共創空間',
  footprint: 'M',          // 10 × 10，見 SPEC.md
  status: 'done',
};

// ---------- 場景專用小工具 ----------

// 展示板上的連接線（平面上兩點之間的細條）
function link(parent, x1, y1, x2, y2, z, mat = M.line) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const m = box(len, 0.05, 0.02, mat, (x1 + x2) / 2, (y1 + y2) / 2, z, 0.01);
  m.rotation.z = Math.atan2(y2 - y1, x2 - x1);
  parent.add(m);
}

// 軟墊討論單椅（參考圖的中世紀風扶手椅）：一體成型 U 形殼 + 厚坐墊 + 外張木腳
// 椅子面向本地 -z，椅背在 +z
function armChair(mat) {
  const g = new THREE.Group();
  // 四支往外微張的細木腳（從椅底四角往外斜）
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
    const top = new THREE.Vector3(sx * 0.36, 0.98, sz * 0.34);
    const bot = new THREE.Vector3(sx * 0.52, 0.02, sz * 0.5);
    g.add(rod(top, bot, 0.045, M.wood));
  });
  // 椅底座：和外殼同色、外緣與殼齊平，把殼和坐墊連成一體
  g.add(box(1.24, 0.24, 1.06, mat, 0, 1.02, 0.01, 0.1));
  // 外殼：底部稍微埋進椅底座
  const shell = chairShell(mat);
  shell.position.y = 0.98;
  g.add(shell);
  // 坐墊：塞在 U 形殼內側，前緣稍微突出
  g.add(box(0.96, 0.26, 0.98, mat, 0, 1.22, -0.04, 0.12));
  return g;
}

export default function build() {
  const root = new THREE.Group();
  const items = [];
  const add = makeAdder(root, items);

  // 圓桌中心（四張椅子圍著它排）
  const TX = 0.8, TZ = 0.7;

  // ---------- 1. 地基平台 + 圓形地毯 ----------
  const platform = new THREE.Group();
  platform.add(box(10, 1, 10, M.base, 0, -0.5, 0, 0.3));
  const rug = roundDisc(2.75, 0.05, 0.02, M.rugSand, 64);
  rug.position.set(TX, 0, TZ);
  platform.add(rug);
  root.add(platform);

  // ---------- 2. 大型構想展示板（立在後方 -z 側，正面朝 +z 迎光） ----------
  const board = new THREE.Group();
  board.add(box(6.4, 0.35, 1.0, M.blue, 0, 0.175, 0, 0.12));            // 底座
  const frameShape = roundRect(6.2, 3.7, 0.22);
  frameShape.holes.push(roundRect(5.7, 3.2, 0.1));                       // 挖空中間放白板
  const frame = extrude(frameShape, 0.2, M.blue, 0.04);
  frame.position.y = 0.35 + 1.85;
  board.add(frame);
  board.add(box(5.8, 3.3, 0.12, M.white, 0, 2.2, 0, 0.04));             // 白色板面
  // 上方夾子（白色燈條晚上會亮，像展示板的小燈）
  [-1.7, 1.7].forEach(x => {
    board.add(box(0.32, 0.42, 0.34, M.dark, x, 4.1, 0, 0.06));
    board.add(box(0.2, 0.08, 0.38, M.white, x, 4.12, 0, 0.03));          // 夾子上的白色彈片
    board.add(box(0.22, 0.14, 0.04, M.lampGlow, x, 4.08, 0.18, 0.02));   // 夾子正面的小燈（夜晚會亮）
  });

  // 板面內容包成一組：整體往下移，讓內容在白板上下置中（夾子不受影響）
  const content = new THREE.Group();
  content.position.y = -0.41;
  board.add(content);
  const Z = 0.08;                                                        // 板面內容的基準深度
  // 左：構想圖卡（天空 + 兩座山丘 + 太陽）
  content.add(box(1.9, 1.3, 0.04, M.rug, -1.7, 2.85, Z, 0.03));
  const hillShape = (h1, h2) => {
    const s = new THREE.Shape();
    s.moveTo(-0.9, -0.6); s.lineTo(-0.9, h1);
    s.quadraticCurveTo(-0.3, h2, 0.2, -0.1);
    s.quadraticCurveTo(0.55, -0.35, 0.9, -0.05);
    s.lineTo(0.9, -0.6); s.closePath();
    return s;
  };
  const hillBack = extrude(hillShape(0.0, 0.55), 0.01, M.sage, 0.008);
  hillBack.position.set(-1.7, 2.85, Z + 0.03);
  hillBack.scale.x = -1;                                                 // 鏡像讓兩座山錯開
  content.add(hillBack);
  const hillFront = extrude(hillShape(-0.25, 0.25), 0.01, M.green, 0.008);
  hillFront.position.set(-1.7, 2.85, Z + 0.05);
  content.add(hillFront);
  const sun = cyl(0.15, 0.15, 0.02, M.yellow, -2.25, 3.2, Z + 0.035, 24);
  sun.rotation.x = Math.PI / 2;
  content.add(sun);
  // 圖卡下方說明文字
  [1.7, 1.35, 1.0].forEach((w, i) => content.add(box(w, 0.07, 0.03, M.line, -2.65 + w / 2, 1.95 - i * 0.24, Z, 0.02)));

  // 中：心智圖（中心節點 + 連線 + 便利貼）
  const cx = 0.35, cy = 2.6;
  const notes = [
    [-0.35, 3.3, M.yellow], [0.95, 3.35, M.blue], [1.05, 1.95, M.yellow],
    [-0.4, 1.9, M.rug], [0.35, 3.55, M.yellow],
  ];
  notes.forEach(([x, y]) => link(content, cx, cy, x, y, Z));
  notes.forEach(([x, y, mat]) => content.add(box(0.46, 0.46, 0.04, mat, x, y, Z + 0.02, 0.02)));
  const hub = cyl(0.22, 0.22, 0.04, M.accent, cx, cy, Z + 0.03, 32);     // 中心節點：品牌橘
  hub.rotation.x = Math.PI / 2;
  content.add(hub);

  // 右：提案條列（藍色標題列 + 文字 + 小勾選框）
  content.add(box(1.05, 0.22, 0.04, M.blue, 2.2, 3.45, Z, 0.03));
  for (let i = 0; i < 4; i++) {
    const y = 3.05 - i * 0.36;
    content.add(box(0.16, 0.16, 0.04, i < 2 ? M.accent : M.line, 1.78, y, Z, 0.03));
    content.add(box(0.7, 0.07, 0.03, M.line, 2.25, y, Z, 0.02));
  }
  add(board, -1.3, -4.35, 0.1);

  // ---------- 3. 展示格櫃（靠左側 -x，以「面向本地 +z」建模，加入時轉 90° 面向 +x） ----------
  const shelf = new THREE.Group();
  const W = 3.4, H = 3.6, D = 1.0, T = 0.12;
  const cellW = (W - 4 * T) / 3;
  const colX = [0, 1, 2].map(i => -W / 2 + T + cellW / 2 + i * (cellW + T));
  // 側板與隔板
  [-W / 2 + T / 2, colX[0] + cellW / 2 + T / 2, colX[1] + cellW / 2 + T / 2, W / 2 - T / 2]
    .forEach(x => shelf.add(box(T, H, D, M.shelfWood, x, H / 2, 0, 0.04)));
  const plateY = [0.06, 1.22, 2.38, 3.54];
  plateY.forEach(y => shelf.add(box(W, T, D, M.shelfWood, 0, y, 0, 0.04)));
  shelf.add(box(W - 0.1, H - 0.1, 0.06, M.shelfWood, 0, H / 2, -D / 2 + 0.04, 0.02)); // 背板
  const floorY = plateY.map(y => y + T / 2);                            // 每層的放置高度

  // 下層：白色收納盒（附把手孔）
  [colX[0], colX[2]].forEach(x => {
    shelf.add(box(0.85, 0.75, 0.8, M.white, x, floorY[0] + 0.375, 0.05, 0.06));
    shelf.add(box(0.3, 0.08, 0.04, M.dark, x, floorY[0] + 0.58, 0.46, 0.03));
  });
  shelf.add(box(0.75, 0.12, 0.6, M.yellow, colX[1], floorY[0] + 0.06, 0.05, 0.03));  // 平放的提案本
  shelf.add(box(0.7, 0.12, 0.55, M.white, colX[1], floorY[0] + 0.18, 0.05, 0.03));

  // 中層左：提案資料夾（書背朝前）
  [[M.blue, -0.32], [M.white, 0], [M.yellow, 0.32]].forEach(([mat, dx]) =>
    placeBinder(shelf, mat, colX[0] + dx, floorY[1], 0.02, -Math.PI / 2, 0.85));
  // 中層中：原型展示（白色小展台 + 藍色原型物件）
  shelf.add(box(0.6, 0.3, 0.6, M.white, colX[1], floorY[1] + 0.15, 0.05, 0.05));
  shelf.add(box(0.36, 0.36, 0.36, M.blue, colX[1], floorY[1] + 0.48, 0.05, 0.1));
  shelf.add(ball(0.13, M.accent, colX[1], floorY[1] + 0.79, 0.05));
  // 中層右：小葉片盆栽
  const shelfPlant = leafPlant({ potR: 0.22, potH: 0.36, leaves: 7, leafLen: 0.3, hMin: 0.08, hMax: 0.36, spread: 0.08 });
  shelfPlant.position.set(colX[2], floorY[1], 0.05);
  shelf.add(shelfPlant);

  // 上層左：直立的書
  [[M.blue, -0.3, 0.8], [M.blue, -0.16, 0.72], [M.white, -0.02, 0.78]].forEach(([mat, dx, h]) =>
    shelf.add(box(0.12, h, 0.6, mat, colX[0] + dx, floorY[2] + h / 2, 0.05, 0.03)));
  shelf.add(box(0.5, 0.1, 0.55, M.yellow, colX[0] + 0.22, floorY[2] + 0.05, 0.05, 0.03));
  // 上層中：立起來的獎狀／提案海報
  const poster = box(0.62, 0.78, 0.06, M.white, colX[1], floorY[2] + 0.42, -0.2, 0.03);
  poster.rotation.x = -0.12;
  shelf.add(poster);
  shelf.add(box(0.4, 0.3, 0.03, M.rug, colX[1], floorY[2] + 0.5, -0.15, 0.02));
  // 上層右：白色收納盒 + 一疊文件
  shelf.add(box(0.8, 0.55, 0.75, M.white, colX[2], floorY[2] + 0.275, 0.05, 0.05));
  shelf.add(box(0.2, 0.06, 0.04, M.dark, colX[2], floorY[2] + 0.4, 0.44, 0.03));
  add(shelf, -4.35, 1.5, 0.35, Math.PI / 2);

  // ---------- 4. 角落大盆栽（展示板右側的後方角落） ----------
  const plant = leafPlant({ potR: 0.42, potH: 0.8, leaves: 14, leafLen: 0.6, hMin: 0.25, hMax: 1.7, spread: 0.22 });
  add(plant, 3.6, -4.0, 0.45);

  // ---------- 5. 四人討論圓桌（含桌上提案資料） ----------
  const table = new THREE.Group();
  const base = roundDisc(0.6, 0.08, 0.035, M.dark);
  table.add(base);
  table.add(cyl(0.1, 0.1, 1.6, M.dark, 0, 0.88, 0));                   // 桌柱
  const hub2 = roundDisc(0.35, 0.08, 0.03, M.dark);
  hub2.position.y = 1.6;
  table.add(hub2);
  const top = roundDisc(1.35, 0.14, 0.06, M.wood, 64);                    // 木頭桌面，上緣在 1.82
  top.position.y = 1.68;
  table.add(top);
  const TOP = 1.82;

  // 筆電：斜放面向觀看者
  const laptop = new THREE.Group();
  laptop.add(box(0.9, 0.05, 0.62, M.white, 0, 0.025, 0, 0.025));
  laptop.add(box(0.7, 0.012, 0.32, M.keybase, 0, 0.055, -0.05, 0.005)); // 鍵盤區
  const lid = new THREE.Group();
  lid.add(box(0.9, 0.6, 0.04, M.white, 0, 0.3, 0, 0.025));
  lid.add(box(0.78, 0.48, 0.01, M.screen, 0, 0.31, 0.022, 0.005));
  lid.position.set(0, 0.05, -0.3);
  lid.rotation.x = -0.28;                                                // 螢幕往後仰
  laptop.add(lid);
  laptop.position.set(-0.45, TOP, -0.35);
  laptop.rotation.y = Math.PI / 4;
  table.add(laptop);

  // 散落的提案文件
  [[0.45, 0.35, 0.3, M.white], [0.2, 0.6, -0.25, M.white], [-0.5, 0.55, 0.5, M.white]].forEach(([x, z, r, mat], i) => {
    const paper = box(0.5, 0.02, 0.68, mat, x, TOP + 0.01 + i * 0.012, z, 0.008);
    paper.rotation.y = r;
    table.add(paper);
  });
  table.add(box(0.3, 0.03, 0.04, M.line, 0.45, TOP + 0.03, 0.25, 0.01)); // 文件上的文字線
  // 一疊書
  table.add(box(0.62, 0.11, 0.48, M.yellow, 0.55, TOP + 0.055, -0.45, 0.03));
  table.add(box(0.56, 0.1, 0.44, M.blue, 0.55, TOP + 0.16, -0.45, 0.03));
  // 便利貼本 + 馬克杯
  table.add(box(0.26, 0.06, 0.26, M.yellow, -0.85, TOP + 0.03, 0.3, 0.02));
  const mug = new THREE.Group();
  mug.add(cyl(0.11, 0.1, 0.24, M.white, 0, 0.12, 0, 24));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.02, 8, 20), M.white);
  handle.position.set(0.12, 0.12, 0);
  handle.castShadow = true;
  mug.add(handle);
  mug.position.set(0.95, TOP, 0.2);
  table.add(mug);
  add(table, TX, TZ, 0.55);

  // ---------- 6. 四張討論椅（環繞圓桌，顏色各異） ----------
  // 角度 a：椅子位在桌子的 (sin a, cos a) 方向；rotY = a 讓椅子正面朝向桌子
  const R = 1.85;
  [
    [Math.PI * 1.5 + 0.1, M.yellow, 0.7],   // -x 側（左後）
    [Math.PI + 0.12,      M.sage,   0.78],  // -z 側（右後）
    [0.08,                M.blue,   0.86],  // +z 側（前左）
    [Math.PI * 0.5 - 0.1, M.white,  0.94],  // +x 側（前右）
  ].forEach(([a, mat, delay]) => {
    add(armChair(mat), TX + Math.sin(a) * R, TZ + Math.cos(a) * R, delay, a);
  });

  return { root, items };
}
