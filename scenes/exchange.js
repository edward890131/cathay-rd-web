// 場景：產學交流共享空間
// 「產業與學界輕鬆碰面、喝杯咖啡、一起討論的共享客廳」
// 物件：模組化沙發、低矮圓桌、簡易咖啡吧台、共享長桌
import * as THREE from 'three';
import { M } from '../shared/materials.js';
import { box, cyl, ball, makeAdder } from '../shared/kit.js';
import { roundDisc, rod, seatShell, leafPlant } from './parts.js';

export const meta = {
  id: 'exchange',
  name: '產學交流共享空間',
  footprint: 'M',          // 10 × 10，見 SPEC.md
  status: 'done',
};

// ---------- 場景專用小工具 ----------

// 殼型餐椅：一體成型的薄殼（坐面彎上去就是椅背）+ 深色接座 + 外張木腳；面向本地 -z
function shellChair(mat) {
  const g = new THREE.Group();
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
    const top = new THREE.Vector3(sx * 0.2, 1.04, sz * 0.18);
    const bot = new THREE.Vector3(sx * 0.4, 0.02, sz * 0.38);
    g.add(rod(top, bot, 0.04, M.wood));
  });
  g.add(box(0.5, 0.05, 0.46, M.dark, 0, 1.04, 0, 0.02));                 // 椅腳接座
  const shell = seatShell(mat);
  shell.position.y = 1.1;
  g.add(shell);
  return g;
}

export default function build() {
  const root = new THREE.Group();
  const items = [];
  const add = makeAdder(root, items);

  // ---------- 1. 地基平台 + 暖色地板 + 沙發區地毯 ----------
  const platform = new THREE.Group();
  platform.add(box(10, 1, 10, M.base, 0, -0.5, 0, 0.3));
  platform.add(box(9.3, 0.04, 9.3, M.sidewalk, 0.15, 0.02, 0.15, 0.02));   // 室內暖色地板
  platform.add(box(4.8, 0.05, 4.4, M.rugBlue, -2.0, 0.065, 1.9, 0.03));    // 藍色地毯
  root.add(platform);

  // ---------- 2. 牆面（L 型轉角）+ 木格柵 + 木牆板 ----------
  const walls = new THREE.Group();
  walls.add(box(0.3, 4.4, 9.6, M.wall, -4.75, 2.2, 0, 0.1));   // 左牆
  walls.add(box(9.3, 4.4, 0.3, M.wall, 0.15, 2.2, -4.75, 0.1)); // 後牆
  // 後牆轉角的直向木格柵
  for (let i = 0; i < 6; i++) walls.add(box(0.22, 4.2, 0.2, M.wood, -4.35 + i * 0.36, 2.14, -4.5, 0.05));
  // 投影幕後方的木牆板
  walls.add(box(6.4, 3.96, 0.1, M.wood, 1.2, 2.02, -4.55, 0.04));
  add(walls, 0, 0, 0.05, 0, { hoverable: false });   // 牆面不浮起

  // ---------- 3. 投影幕（文氏圖：產業 × 學界的交集） ----------
  const screen = new THREE.Group();
  const sc = new THREE.Group();                                          // 幕面內容，中心高度 2.4
  sc.position.y = 2.4;
  screen.add(sc);
  sc.add(box(4.5, 0.18, 0.24, M.dark, 0, 1.38, 0, 0.06));          // 上方捲軸盒
  sc.add(box(4.2, 2.5, 0.06, M.white, 0, 0.05, 0, 0.03));           // 幕面
  sc.add(box(4.2, 0.08, 0.1, M.line, 0, -1.22, 0, 0.03));           // 下緣配重條
  const venn = (mat, x, z) => {
    const c = cyl(0.62, 0.62, 0.02, mat, x, 0.12, z, 40);
    c.rotation.x = Math.PI / 2;
    sc.add(c);
  };
  venn(M.rug, -0.95, 0.04);                                              // 產業
  venn(M.yellow, -0.2, 0.06);                                            // 學界（疊在前面）
  [0.9, 0.7, 0.8].forEach((w, i) => sc.add(box(w, 0.07, 0.02, M.line, 1.05 + w / 2, 0.42 - i * 0.24, 0.04, 0.02)));
  sc.add(box(0.5, 0.16, 0.02, M.accent, 1.3, -0.45, 0.04, 0.03));   // 重點標籤：品牌橘
  add(screen, 1.4, -4.42, 0.2);

  // ---------- 4. 咖啡吧台（靠左牆，以「面向本地 +z」建模，加入時轉 90° 面向 +x） ----------
  const bar = new THREE.Group();
  bar.add(box(3.2, 1.5, 1.1, M.wood, 0, 0.8, 0, 0.06));                 // 櫃體
  [-1.05, 0, 1.05].forEach(x => {
    bar.add(box(0.98, 1.24, 0.06, M.white, x, 0.8, 0.54, 0.03));        // 白色門片
    bar.add(box(0.05, 0.36, 0.05, M.line, x + 0.36, 1.0, 0.6, 0.02));    // 把手
  });
  bar.add(box(3.32, 0.1, 1.18, M.wood, 0, 1.6, 0, 0.04));               // 檯面
  const TOP = 1.65;
  // 咖啡機：黑色機身 + 上方出水頭 + 銀色水盤 + 白色杯子
  const cm = new THREE.Group();
  cm.add(box(0.62, 0.08, 0.6, M.dark, 0, 0.04, 0, 0.03));              // 底座
  cm.add(box(0.62, 1.0, 0.3, M.dark, 0, 0.5, -0.15, 0.06));            // 後方機身
  cm.add(box(0.62, 0.24, 0.6, M.dark, 0, 0.88, 0, 0.06));              // 上方出水頭
  cm.add(cyl(0.05, 0.05, 0.1, M.line, 0, 0.72, 0.12, 16));              // 出水口
  cm.add(box(0.44, 0.03, 0.3, M.line, 0, 0.095, 0.12, 0.01));           // 水盤
  cm.add(box(0.24, 0.04, 0.03, M.screen, 0, 0.9, 0.31, 0.01));          // 小螢幕
  cm.add(cyl(0.09, 0.08, 0.16, M.white, 0, 0.19, 0.12, 20));            // 咖啡杯
  cm.position.set(-0.95, TOP, -0.05);
  bar.add(cm);
  // 疊起來的杯子 + 托盤
  bar.add(box(0.7, 0.04, 0.46, M.white, -0.1, TOP + 0.02, 0.1, 0.02));
  [[-0.3, 0.1], [-0.05, 0.1], [0.12, 0.08]].forEach(([x, z], i) =>
    bar.add(cyl(0.085, 0.075, 0.16 + (i === 2 ? 0.14 : 0), M.white, x, TOP + 0.04 + (i === 2 ? 0.15 : 0.08), z, 20)));
  // 葉片盆栽
  const barPlant = leafPlant({ potR: 0.22, potH: 0.4, leaves: 9, leafLen: 0.38, hMin: 0.1, hMax: 0.55 });
  barPlant.position.set(0.95, TOP, 0);
  bar.add(barPlant);
  add(bar, -4.0, -2.3, 0.35, Math.PI / 2);

  // ---------- 5. 模組化 L 型沙發（照參考圖：靠前緣 +z、面朝室內；貴妃椅在左牆端往後延伸） ----------
  // 直接用世界座標建模；淺藍布面的底座、椅背、扶手 + 白色坐墊
  const sofa = new THREE.Group();
  const X0 = -4.45, X1 = -1.2;                                          // 沙發左右端
  sofa.add(box(X1 - X0, 0.55, 1.6, M.rug, (X0 + X1) / 2, 0.3, 2.8, 0.14));      // 主體底座（z 2.0 ~ 3.6）
  sofa.add(box(1.6, 0.55, 1.58, M.rug, X0 + 0.8, 0.3, 1.2, 0.14));               // 貴妃椅底座（z 0.4 ~ 2.0）
  sofa.add(box(X1 - X0, 1.0, 0.42, M.rug, (X0 + X1) / 2, 1.05, 3.39, 0.18));    // 後方椅背（靠前緣）
  sofa.add(box(0.42, 1.0, 3.2, M.rug, X0 + 0.21, 1.05, 2.0, 0.18));             // 左側椅背（靠左牆）
  sofa.add(box(0.42, 0.6, 1.6, M.rug, X1 - 0.21, 0.85, 2.8, 0.16));             // 右端扶手
  // 白色坐墊：主體兩塊 + 貴妃椅一塊，之間留細縫
  [[-3.43, 2.6, 1.2, 1.16], [-2.23, 2.6, 1.18, 1.16]].forEach(([x, z, w, d]) =>
    sofa.add(box(w, 0.3, d, M.white, x, 0.72, z, 0.12)));
  sofa.add(box(1.16, 0.3, 1.5, M.white, -3.43, 0.72, 1.22, 0.12));
  add(sofa, 0, 0, 0.5);

  // ---------- 6. 低矮圓桌（沙發前方，桌面淨空） ----------
  const coffee = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    coffee.add(rod(new THREE.Vector3(Math.cos(a) * 0.4, 0.86, Math.sin(a) * 0.4),
                   new THREE.Vector3(Math.cos(a) * 0.55, 0.02, Math.sin(a) * 0.55), 0.045, M.wood));
  }
  const ctop = roundDisc(0.78, 0.12, 0.05, M.white, 56);
  ctop.position.y = 0.84;
  coffee.add(ctop);
  add(coffee, -1.75, 0.95, 0.6);

  // ---------- 7. 共享長桌（桌上散放幾張紙） ----------
  const table = new THREE.Group();
  table.add(box(4.2, 0.14, 1.9, M.wood, 0, 1.75, 0, 0.05));            // 桌面，上緣 1.82
  [[-1.85, -0.72], [1.85, -0.72], [-1.85, 0.72], [1.85, 0.72]].forEach(([x, z]) =>
    table.add(box(0.16, 1.68, 0.16, M.wood, x, 0.84, z, 0.04)));        // 方形木腳
  table.add(box(3.7, 0.14, 0.08, M.wood, 0, 1.6, -0.72, 0.03));        // 桌下橫檔
  table.add(box(3.7, 0.14, 0.08, M.wood, 0, 1.6, 0.72, 0.03));
  const T2 = 1.82;
  // 散放的幾張紙
  [[-1.1, 0.3, 0.15], [-0.35, -0.35, -0.3], [0.6, 0.4, 0.4], [1.3, -0.3, -0.1]].forEach(([x, z, r], i) => {
    const paper = box(0.5, 0.02, 0.68, M.white, x, T2 + 0.01 + (i % 2) * 0.004, z, 0.008);
    paper.rotation.y = r;
    table.add(paper);
  });
  add(table, 2.3, -0.9, 0.7);

  // ---------- 8. 長桌單椅（藍白交錯，兩側各兩張） ----------
  [
    [1.3, -2.3, Math.PI, M.blue, 0.8],    // 後排面向 +z
    [3.3, -2.3, Math.PI, M.white, 0.85],
    [1.3, 0.5, 0, M.white, 0.9],          // 前排面向 -z
    [3.3, 0.5, 0, M.blue, 0.95],
  ].forEach(([x, z, r, mat, delay]) => add(shellChair(mat), x, z, delay, r));

  // ---------- 9. 玻璃屋：金屬框 + 前方兩面玻璃 ----------
  // 玻璃與框不投影子、也不參與滑鼠偵測，才不會擋住室內光線和家具的 hover
  const glass = new THREE.Group();
  const E = 4.85, GH = 4.45, F = 0.1;                                    // 框外緣、框高、框料粗細
  const frame = (w, h, d, x, y, z) => { const m = box(w, h, d, M.metal, x, y, z, 0.03); m.castShadow = false; glass.add(m); };
  [[-E, -E], [E, -E], [E, E], [-E, E]].forEach(([x, z]) => frame(F, GH, F, x, GH / 2, z));   // 四根角柱
  frame(2 * E, F, F, 0, GH, -E); frame(2 * E, F, F, 0, GH, E);           // 頂框
  frame(F, F, 2 * E, -E, GH, 0); frame(F, F, 2 * E, E, GH, 0);
  frame(2 * E, F, F, 0, F / 2, E); frame(F, F, 2 * E, E, F / 2, 0);     // 前方兩側底框
  const pane = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, GH - F, d), M.glassPane);
    m.position.set(x, GH / 2, z);
    m.renderOrder = 2;                                                   // 透明物件最後畫
    glass.add(m);
  };
  pane(2 * E - F, 0.03, 0, E);                                           // 前左玻璃（+z 側）
  pane(0.03, 2 * E - F, E, 0);                                           // 前右玻璃（+x 側）
  // 斜向反光帶：平行四邊形，下緣在 x0、往上斜移 slant；全部落在玻璃範圍內
  // bands：[下緣起點, 寬度]，以玻璃寬度 0~1 的比例表示
  const glints = (len, place) => {
    const H = GH - F * 2, slant = 1.6;
    [[0.1, 0.07], [0.19, 0.02], [0.58, 0.04], [0.65, 0.015]].forEach(([u, w]) => {
      const x0 = -len / 2 + u * len, bw = w * len;
      const s = new THREE.Shape();
      s.moveTo(x0, 0); s.lineTo(x0 + bw, 0); s.lineTo(x0 + bw + slant, H); s.lineTo(x0 + slant, H); s.closePath();
      const m = new THREE.Mesh(new THREE.ShapeGeometry(s), M.glassGlint);
      m.renderOrder = 3;
      place(m, F);
      glass.add(m);
    });
  };
  glints(2 * E - F, (m, y) => { m.position.set(0, y, E + 0.03); });                           // 前左玻璃外側
  glints(2 * E - F, (m, y) => { m.position.set(E + 0.03, y, 0); m.rotation.y = Math.PI / 2; }); // 前右玻璃外側
  glass.traverse(o => { if (o.isMesh) o.raycast = () => {}; });
  add(glass, 0, 0, 1.05, 0, { hoverable: false });

  return { root, items };
}
