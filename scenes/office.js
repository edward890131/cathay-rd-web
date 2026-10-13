// 場景：辦公研發空間（已完成，作為全專案的品質與比例基準）
// 「提供企業、人才專注工作與研究的場所」
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M } from '../shared/materials.js';
import { box, cyl, ball, roundRect, extrude, placeBinder, makeAdder } from '../shared/kit.js';

export const meta = {
  id: 'office',
  name: '辦公研發空間',
  footprint: 'M',          // 10 × 10，見 SPEC.md
  status: 'done',
};

export default function build() {
  const root = new THREE.Group();
  const items = [];
  const add = makeAdder(root, items);

  // ---------- 1. 地基平台 ----------
  const platform = new THREE.Group();
  platform.add(box(10, 1, 10, M.base, 0, -0.5, 0, 0.3));
  platform.add(box(6.6, 0.06, 6.2, M.rug, 0.6, 0.03, 0.4, 0.03));   // 藍色地毯
  root.add(platform);

  // ---------- 2. 牆面（L 型轉角） ----------
  const walls = new THREE.Group();
  walls.add(box(0.3, 4.4, 9.6, M.wall, -4.75, 2.2, 0, 0.1));   // 左牆
  walls.add(box(9.3, 4.4, 0.3, M.wall, 0.15, 2.2, -4.75, 0.1)); // 後牆
  add(walls, 0, 0, 0.05, 0, { hoverable: false });   // 牆面不浮起

  // ---------- 3. 白板（掛在後牆） ----------
  const board = new THREE.Group();
  board.add(box(3.8, 2.5, 0.16, M.white, 0, 2.7, 0, 0.08));
  board.add(box(3.1, 0.14, 0.22, M.dark, 0, 4.02, 0.04, 0.05));         // 上方軌道
  board.add(box(2.8, 0.06, 0.03, M.lampGlow, 0, 4.02, 0.165, 0.015));   // 軌道正面的燈條（夜晚會亮）
  board.add(box(0.18, 0.3, 0.12, M.dark, -1.1, 3.88, 0.12, 0.03));      // 夾子
  board.add(box(0.18, 0.3, 0.12, M.dark, 1.1, 3.88, 0.12, 0.03));
  [-1.1, 1.1].forEach(x => board.add(box(0.12, 0.1, 0.02, M.lampGlow, x, 3.84, 0.19, 0.01)));   // 夾子正面的小燈（夜晚會亮）
  board.add(box(0.55, 0.55, 0.04, M.yellow, 0.6, 3.1, 0.1, 0.02));      // 便利貼
  board.add(box(0.5, 0.5, 0.04, M.blue, 1.15, 2.55, 0.1, 0.02));
  board.add(box(0.5, 0.5, 0.04, M.line, -1.15, 3.1, 0.1, 0.02));
  for (let i = 0; i < 3; i++) board.add(box(1.1 - i * 0.2, 0.06, 0.03, M.line, -1.0, 2.5 - i * 0.25, 0.1, 0.02)); // 文字線條
  add(board, -1.6, -4.5, 0.25);

  // ---------- 4. 書櫃（後牆右側） ----------
  const shelf = new THREE.Group();
  shelf.add(box(0.14, 3.7, 1.2, M.shelfWood, -1.1, 1.85, 0));
  shelf.add(box(0.14, 3.7, 1.2, M.shelfWood, 1.1, 1.85, 0));
  [0.08, 1.35, 2.5, 3.64].forEach(y => shelf.add(box(2.34, 0.14, 1.2, M.shelfWood, 0, y, 0, 0.04)));
  shelf.add(box(2.06, 1.1, 0.1, M.white, 0, 0.72, 0.52, 0.04));         // 下方白色門片
  shelf.add(box(0.5, 0.06, 0.06, M.line, 0, 0.72, 0.6, 0.02));           // 把手
  // 資料夾：書背朝前（+z），沿 x 排列，間距大於厚度才不會互相穿插
  [[M.blue, -0.78], [M.white, -0.46], [M.yellow, -0.14]].forEach(([mat, x]) =>
    placeBinder(shelf, mat, x, 2.57, 0, -Math.PI / 2, 0.95));
  shelf.add(box(0.9, 0.6, 0.85, M.white, 0.45, 1.75, 0, 0.06));          // 收納盒
  add(shelf, 3.0, -3.85, 0.4);

  // ---------- 5. 矮櫃 + 植栽（左牆） ----------
  const cab = new THREE.Group();
  cab.add(box(1.3, 1.4, 2.8, M.white, 0, 0.7, 0, 0.08));
  cab.add(box(1.4, 0.12, 2.9, M.wood, 0, 1.46, 0, 0.04));
  cab.add(box(0.06, 1.1, 0.04, M.line, 0.66, 0.7, 0, 0.02));             // 門縫
  // 資料夾：書背朝外（+x），沿 z 排列；藍、白、橘黃，和參考圖一致
  [[M.yellow, -1.0], [M.white, -0.67], [M.blue, -0.34]].forEach(([mat, z]) =>
    placeBinder(cab, mat, 0, 1.52, z));
  const pot = cyl(0.32, 0.26, 0.5, M.white, 0, 1.77, 0.8);
  cab.add(pot);
  [[0, 2.3, 0.8, 0.32], [0.2, 2.55, 0.65, 0.26], [-0.18, 2.5, 0.95, 0.25], [0.05, 2.75, 0.85, 0.22]]
    .forEach(([x, y, z, r]) => cab.add(ball(r, M.green, x, y, z)));
  add(cab, -3.95, 0.4, 0.55);

  // ---------- 6. 辦公桌（含抽屜櫃、電腦、文具） ----------
  const desk = new THREE.Group();
  desk.add(box(4.4, 0.16, 2.1, M.wood, 0, 1.78, 0, 0.05));                // 桌面
  [[-2.0, -0.85], [-2.0, 0.85]].forEach(([x, z]) => desk.add(box(0.12, 1.7, 0.12, M.white, x, 0.85, z, 0.04))); // 桌腳
  desk.add(box(1.2, 1.66, 1.9, M.white, 1.5, 0.85, 0, 0.06));             // 抽屜櫃
  [0.5, 1.15].forEach(y => desk.add(box(1.0, 0.04, 0.04, M.line, 1.5, y, 0.97, 0.02)));
  // 螢幕
  desk.add(box(0.7, 0.06, 0.45, M.dark, 0, 1.89, -0.55, 0.03));
  desk.add(box(0.12, 0.6, 0.12, M.dark, 0, 2.15, -0.6, 0.04));
  desk.add(box(2.0, 1.2, 0.12, M.dark, 0, 2.85, -0.62, 0.06));
  desk.add(box(1.84, 1.04, 0.04, M.screen, 0, 2.85, -0.55, 0.03));
  // 鍵盤：淺灰底座 + 一顆顆圓角按鍵（4 排，最下排有長空白鍵）
  const kb = new THREE.Group();
  kb.add(box(1.3, 0.05, 0.44, M.keybase, 0, 0.025, 0, 0.025));            // 底座
  const KEY_W = 0.082, KEY_D = 0.068, PITCH_X = 0.1, PITCH_Z = 0.088;
  const keyGeo = new RoundedBoxGeometry(KEY_W, 0.03, KEY_D, 3, 0.012);    // 共用同一個幾何，省效能
  // 每排的按鍵寬度（以「一般鍵」為 1 單位），加總都是 12
  const rows = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [1.5, 1, 1, 5, 1, 1, 1.5],                                             // 中間 5 單位是空白鍵
  ];
  rows.forEach((row, ri) => {
    let cursor = -6;                                                       // 從最左邊開始排
    row.forEach(units => {
      const key = new THREE.Mesh(keyGeo, M.white);
      const cx = (cursor + units / 2) * PITCH_X;
      key.scale.x = (units * PITCH_X - (PITCH_X - KEY_W)) / KEY_W;          // 寬鍵依單位拉長
      key.position.set(cx, 0.062, (ri - 1.5) * PITCH_Z);
      key.castShadow = true; key.receiveShadow = true;
      kb.add(key);
      cursor += units;
    });
  });
  kb.position.set(-0.1, 1.86, 0.25);
  desk.add(kb);

  // 滑鼠：壓扁的半顆蛋形 + 中間按鍵分隔線 + 滾輪，前端朝螢幕（-z）
  const mouse = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.white);
  shell.scale.set(0.12, 0.08, 0.19);
  shell.castShadow = true; shell.receiveShadow = true;
  mouse.add(shell);
  mouse.add(box(0.008, 0.02, 0.085, M.line, 0, 0.055, -0.12, 0.003));     // 左右鍵分隔線
  const wheel = cyl(0.02, 0.02, 0.022, M.dark, 0, 0.068, -0.075, 20);     // 滾輪
  wheel.rotation.z = Math.PI / 2;
  mouse.add(wheel);
  mouse.position.set(0.85, 1.86, 0.3);
  mouse.rotation.y = -0.15;
  desk.add(mouse);

  // 筆筒：用旋轉成形（Lathe）做出中空杯子，杯緣圓潤、杯底有厚度
  const cup = new THREE.Group();
  const profile = [                                                         // 杯子剖面：(半徑, 高度)
    [0, 0], [0.17, 0], [0.19, 0.015], [0.196, 0.04], [0.2, 0.44],          // 杯底 → 外壁
    [0.197, 0.455], [0.188, 0.466], [0.177, 0.466], [0.169, 0.455],         // 圓潤杯緣
    [0.165, 0.44], [0.162, 0.075], [0.15, 0.06], [0, 0.06],                 // 內壁 → 杯底內側
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const cupMesh = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), M.blue);
  cupMesh.castShadow = true; cupMesh.receiveShadow = true;
  cup.add(cupMesh);
  // 筆：六角筆身 + 筆蓋 + 圓潤頂端
  function pencil(bodyMat, capMat, len) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 6), bodyMat);
    body.position.y = len / 2; body.castShadow = true;
    g.add(body);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.1, 12), capMat);
    cap.position.y = len + 0.04; cap.castShadow = true;
    g.add(cap);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.07, 12), capMat);
    tip.position.y = len + 0.11;
    g.add(tip);
    return g;
  }
  // 筆底靠近杯底中央、小角度往外散開：杯緣高度時筆身離杯壁仍有空隙，不會穿出也不會交叉
  [
    [M.yellow, M.blue,   -0.04,  0.03,  0.16, 0.74],   // 往左斜
    [M.blue,   M.accent,  0.0,  -0.05,  0.0,  0.84],   // 中間直立：最高
    [M.yellow, M.blue,    0.04,  0.03, -0.16, 0.74],   // 往右斜
  ].forEach(([body, cap, x, z, tilt, len]) => {
    const p = pencil(body, cap, len);
    p.position.set(x, 0.06, z);
    p.rotation.z = tilt;
    cup.add(p);
  });
  cup.position.set(-1.5, 1.86, -0.4);
  desk.add(cup);
  // 書本
  desk.add(box(0.75, 0.12, 0.55, M.blue, 1.6, 1.92, -0.25, 0.03));
  desk.add(box(0.68, 0.12, 0.5, M.yellow, 1.6, 2.04, -0.25, 0.03));
  add(desk, 0.7, -0.9, 0.7);

  // ---------- 7. 人體工學椅 ----------
  // 椅子朝向 -z（面對桌子），椅背在 +z 側（靠近觀看者）
  const chair = new THREE.Group();

  // 五爪椅腳：中心軸 + 微微下斜的爪 + 雙輪腳輪
  chair.add(cyl(0.16, 0.18, 0.14, M.dark, 0, 0.3, 0));                    // 中心軸座
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const arm = new THREE.Group();
    const spoke = box(0.78, 0.1, 0.15, M.dark, 0.42, 0, 0, 0.05);
    spoke.rotation.z = -0.1;                                               // 往外微微下斜
    arm.add(spoke);
    arm.add(box(0.12, 0.1, 0.12, M.dark, 0.8, -0.08, 0, 0.04));           // 腳輪支架
    const wheel = cyl(0.1, 0.1, 0.16, M.dark, 0.8, -0.18, 0, 24);          // 輪子（橫躺）
    wheel.rotation.x = Math.PI / 2;
    arm.add(wheel);
    arm.position.y = 0.3;
    arm.rotation.y = a;
    chair.add(arm);
  }
  chair.add(cyl(0.07, 0.07, 0.5, M.dark, 0, 0.6, 0));                     // 氣壓桿
  chair.add(cyl(0.11, 0.13, 0.2, M.white, 0, 0.78, 0));                    // 氣壓桿白色護蓋
  chair.add(box(0.6, 0.14, 0.6, M.white, 0, 0.9, 0, 0.06));                // 座椅底座機構

  // 座椅：白色外殼 + 厚實藍色坐墊
  chair.add(box(1.32, 0.16, 1.2, M.white, 0, 1.03, 0, 0.08));
  chair.add(box(1.2, 0.18, 1.08, M.blue, 0, 1.18, -0.02, 0.09));

  // 椅背：白色圓角外框 + 內嵌藍色網面，整片微微後仰
  const back = new THREE.Group();
  const frame = roundRect(1.22, 1.45, 0.42, 0.22);
  frame.holes.push(roundRect(1.06, 1.29, 0.35, 0.15));                      // 挖空中間
  back.add(extrude(frame, 0.08, M.white, 0.03));
  back.add(extrude(roundRect(1.08, 1.31, 0.36, 0.16), 0.04, M.blue, 0.015)); // 藍色網面
  back.position.set(0, 2.05, 0.62);
  back.rotation.x = 0.14;                                                   // 後仰
  chair.add(back);
  // 椅背支架：從座椅後方往上接椅背
  chair.add(box(0.26, 0.3, 0.08, M.white, 0, 1.26, 0.6, 0.035));

  // 扶手：白色，從椅背兩側延伸下來接座椅
  [-0.7, 0.7].forEach(x => {
    chair.add(box(0.1, 0.42, 0.12, M.white, x, 1.4, 0.0, 0.05));          // 立柱
    chair.add(box(0.14, 0.09, 0.72, M.white, x, 1.62, 0.12, 0.045));      // 扶手面
  });
  add(chair, 0.6, 1.3, 0.9, 0.12);

  return { root, items };
}
