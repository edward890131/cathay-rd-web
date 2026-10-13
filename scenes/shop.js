// 場景：商業生活空間
// 「園區裡喝咖啡、買東西、坐下來聊天的生活街角」
// 物件：簡化商店建築（大店面 + 小外帶亭）、條紋遮陽棚、戶外雙人桌椅、立式菜單牌、路燈
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M } from '../shared/materials.js';
import { box, cyl, ball, roundRect, extrude, makeAdder } from '../shared/kit.js';
import { roundDisc, rod } from './parts.js';

export const meta = {
  id: 'shop',
  name: '商業生活空間',
  footprint: 'M',          // 10 × 10，見 SPEC.md
  status: 'done',
};

// ---------- 場景專用小工具 ----------

// 簡化商店量體：圓角方盒 + 屋頂一圈女兒牆 + 內凹屋頂面；(x, z) 為中心、底部貼地
function building(g, w, d, h, x, z, mat = M.shopWall) {
  g.add(box(w, h, d, mat, x, h / 2, z, 0.1));
  const rim = roundRect(w + 0.2, d + 0.2, 0.12);
  rim.holes.push(roundRect(w - 0.4, d - 0.4, 0.06));
  const r = extrude(rim, 0.3, mat, 0.04);
  r.rotation.x = -Math.PI / 2;                           // 擠出方向改成往上
  r.position.set(x, h + 0.1, z);
  g.add(r);
  g.add(box(w - 0.36, 0.04, d - 0.36, M.sidewalk, x, h + 0.02, z, 0.02));   // 屋頂面（稍微不同色）
}

// 條紋遮陽棚：一條條色帶從牆面往前下斜，前緣掛圓滾滾的垂邊
// 以「貼在牆上、往本地 +z 伸出」建模；width：寬、depth：伸出長度、n：條數
function awning(width, depth, n, matA, matB, slope = 0.42) {
  const g = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.x = slope;                               // 往前下斜
  g.add(tilt);
  const sw = width / n;
  for (let i = 0; i < n; i++) {
    const mat = i % 2 === 0 ? matA : matB;
    const x = -width / 2 + sw * (i + 0.5);
    tilt.add(box(sw, 0.08, depth, mat, x, 0, depth / 2, 0.03));           // 色帶
    const v = cyl(0.15, 0.15, sw - 0.02, mat, x, -0.08, depth - 0.02, 24); // 垂邊（橫躺的圓柱）
    v.rotation.z = Math.PI / 2;
    tilt.add(v);
  }
  return g;
}

// 戶外小椅（矮版）：圓角坐面 + 上緣圓角的椅背 + 四支細木腳；面向本地 -z
function bistroChair(mat) {
  const g = new THREE.Group();
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) =>
    g.add(rod(new THREE.Vector3(sx * 0.3, 0.84, sz * 0.28), new THREE.Vector3(sx * 0.34, 0.02, sz * 0.33), 0.04, M.trunk)));
  g.add(box(0.8, 0.14, 0.76, mat, 0, 0.9, 0, 0.06));                      // 坐面（上緣約 0.97）
  const back = extrude(roundRect(0.78, 0.62, 0.26, 0.06), 0.06, mat, 0.04); // 椅背
  back.position.set(0, 1.33, 0.35);
  back.rotation.x = 0.1;
  g.add(back);
  return g;
}

// 戶外小圓桌：深色圓座 + 細桿 + 白色圓桌面（上緣約 1.55，配矮椅）
function bistroTable() {
  const g = new THREE.Group();
  g.add(roundDisc(0.42, 0.07, 0.03, M.dark));
  g.add(cyl(0.06, 0.06, 1.4, M.dark, 0, 0.76, 0, 16));
  const top = roundDisc(0.62, 0.1, 0.04, M.white, 48);
  top.position.y = 1.45;
  g.add(top);
  return g;
}

// 玻璃上的斜向反光帶（兩條一寬一細），畫在 xy 平面、z 為玻璃前方
function glint(parent, x0, x1, y0, y1, z) {
  const w = x1 - x0, h = y1 - y0, slant = h * 0.35;
  [[0.12, 0.16], [0.36, 0.06]].forEach(([u, bw]) => {
    const a = x0 + w * u, b = a + w * bw;
    if (b + slant > x1) return;                         // 超出玻璃範圍就不畫
    const sh = new THREE.Shape();
    sh.moveTo(a, y0); sh.lineTo(b, y0); sh.lineTo(b + slant, y1); sh.lineTo(a + slant, y1); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.glassGlint);
    m.position.z = z;
    m.renderOrder = 3;
    parent.add(m);
  });
}

export default function build() {
  const root = new THREE.Group();
  const items = [];
  const add = makeAdder(root, items);

  // ---------- 1. 地基平台 + 粉色地磚 ----------
  const platform = new THREE.Group();
  platform.add(box(10, 1, 10, M.base, 0, -0.5, 0, 0.3));
  const tileGeo = new RoundedBoxGeometry(1.17, 0.06, 1.17, 2, 0.02);      // 所有地磚共用同一個幾何
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const t = new THREE.Mesh(tileGeo, M.paving);
      t.position.set(-4.2 + i * 1.2, 0.03, -4.2 + j * 1.2);
      t.receiveShadow = true;
      platform.add(t);
    }
  }
  root.add(platform);

  // ---------- 2. 大店面（左後方，店面朝 +z） ----------
  const shopA = new THREE.Group();
  const AX = -1.8, AZ = -2.7, AW = 5.4, AD = 3.6, AH = 3.2;              // 中心、寬、深、高
  building(shopA, AW, AD, AH, AX, AZ);
  const FZ = AZ + AD / 2;                                                 // 正面牆的 z（-0.9）
  // 店面：粗橘框把玻璃框起來（框條凸出牆面、玻璃往內凹），中間是雙開玻璃門
  const L = -4.3, R = 0.82, TOPY = 2.95;                                 // 店面左右端、頂端
  const DL = -2.35, DR = -0.55;                                          // 門洞左右（直框中心）
  const FD = 0.26, FZc = FZ + 0.08;                                      // 框深、框的中心 z（前緣凸出約 0.2）
  const fr = (w, h, x, y) => shopA.add(box(w, h, FD, M.apricot, x, y, FZc, 0.05));
  fr(R - L + 0.18, 0.26, (L + R) / 2, TOPY - 0.13);                     // 頂部橫樑
  fr(DL - L, 0.38, (L + DL) / 2, 0.19);                                  // 左櫥窗踢腳
  fr(R - DR, 0.38, (DR + R) / 2, 0.19);                                  // 右櫥窗踢腳
  [L, DL, DR, R].forEach(x => fr(0.18, TOPY, x, TOPY / 2));             // 直框
  fr(DR - DL, 0.12, (DL + DR) / 2, 2.38);                                // 門上方橫框
  fr(DL - L, 0.1, (L + DL) / 2, 2.2);                                    // 櫥窗上段橫框
  fr(R - DR, 0.1, (DR + R) / 2, 2.2);
  // 凹進去的亮燈玻璃
  const pane = (x0, x1, y0, y1) => {
    shopA.add(box(x1 - x0, y1 - y0, 0.05, M.shopGlow, (x0 + x1) / 2, (y0 + y1) / 2, FZ + 0.0, 0.02));
    glint(shopA, x0, x1, y0, y1, FZ + 0.035);
  };
  pane(L + 0.09, DL - 0.09, 0.38, 2.15);                                 // 左櫥窗
  pane(L + 0.09, DL - 0.09, 2.25, TOPY - 0.26);
  pane(DR + 0.09, R - 0.09, 0.38, 2.15);                                 // 右櫥窗
  pane(DR + 0.09, R - 0.09, 2.25, TOPY - 0.26);
  pane(DL + 0.09, DR - 0.09, 2.44, TOPY - 0.26);                         // 門上方氣窗
  // 雙開門：每扇有自己的橘色細框 + 玻璃 + 直向把手
  const leafW = (DR - DL - 0.18) / 2;
  [-1, 1].forEach(sd => {
    const cx = (DL + DR) / 2 + sd * (leafW / 2 + 0.005);
    const doorShape = roundRect(leafW - 0.02, 2.28, 0.04);
    doorShape.holes.push(roundRect(leafW - 0.22, 2.06, 0.02));
    const door = extrude(doorShape, 0.07, M.apricot, 0.025);
    door.position.set(cx, 1.16, FZ + 0.04);
    shopA.add(door);
    shopA.add(box(leafW - 0.2, 2.06, 0.03, M.shopGlow, cx, 1.16, FZ + 0.02, 0.01));
    glint(shopA, cx - (leafW - 0.22) / 2, cx + (leafW - 0.22) / 2, 0.14, 2.18, FZ + 0.04);
    shopA.add(box(0.06, 0.55, 0.07, M.dark, cx - sd * (leafW / 2 - 0.16), 1.15, FZ + 0.13, 0.03));  // 把手（靠門縫）
  });
  // 側面（+x）：整面橘色牆
  const SXA = AX + AW / 2;
  shopA.add(box(0.12, AH - 0.1, AD - 0.16, M.apricot, SXA + 0.02, (AH - 0.1) / 2, AZ, 0.06));
  // 橘白條紋遮陽棚（蓋住左櫥窗與門）
  const awA = awning(3.8, 1.25, 7, M.accent, M.white);
  awA.position.set(-2.55, 3.05, FZ + 0.12);
  shopA.add(awA);
  // 屋頂膠囊招牌：橘框 + 白底 + 兩支深色立柱
  [-0.7, 0.7].forEach(dx => shopA.add(box(0.1, 0.45, 0.1, M.dark, -2.4 + dx, AH + 0.3, FZ - 0.35, 0.03)));
  const capsule = roundRect(2.6, 0.82, 0.41);
  capsule.holes.push(roundRect(2.3, 0.54, 0.27));
  const signFrame = extrude(capsule, 0.12, M.accent, 0.04);
  signFrame.position.set(-2.4, AH + 0.95, FZ - 0.35);
  shopA.add(signFrame);
  const signFace = extrude(roundRect(2.32, 0.56, 0.28), 0.04, M.white, 0.02);
  signFace.position.set(-2.4, AH + 0.95, FZ - 0.35);
  shopA.add(signFace);
  add(shopA, 0, 0, 0.1);

  // ---------- 3. 小外帶亭（大店右側並排，窗口朝 +z） ----------
  const shopB = new THREE.Group();
  const BX = 2.85, BZ = -2.0, BW = 3.0, BD = 3.2, BH = 2.7;
  building(shopB, BW, BD, BH, BX, BZ);
  const BF = BZ + BD / 2;                                                 // 正面牆的 z（-0.4）
  shopB.add(box(2.5, 0.75, 0.1, M.dark, BX, 0.4, BF + 0.02, 0.04));        // 深色牆腳
  shopB.add(box(2.3, 1.15, 0.08, M.shopGlow, BX, 1.45, BF + 0.03, 0.04));  // 外帶窗口
  shopB.add(box(2.5, 0.1, 0.4, M.wood, BX, 0.86, BF + 0.18, 0.03));        // 窗口檯面
  shopB.add(cyl(0.1, 0.09, 0.2, M.white, BX - 0.6, 1.01, BF + 0.2, 16));   // 外帶杯
  shopB.add(cyl(0.1, 0.09, 0.2, M.white, BX - 0.3, 1.01, BF + 0.22, 16));
  // 藍白條紋遮陽棚
  const awB = awning(2.7, 0.95, 6, M.blue, M.white);
  awB.position.set(BX, 2.3, BF + 0.06);
  shopB.add(awB);
  // 側邊吊牌：藍色支架 + 圓角方牌（牌面朝 ±z，從正面看得到）
  const SX = BX + BW / 2;
  shopB.add(box(0.7, 0.08, 0.08, M.blue, SX + 0.3, 2.3, BF - 0.4, 0.03));
  [-0.15, 0.15].forEach(dx => shopB.add(cyl(0.012, 0.012, 0.16, M.dark, SX + 0.38 + dx, 2.18, BF - 0.4, 8)));
  const bladeShape = roundRect(0.66, 0.66, 0.16);
  bladeShape.holes.push(roundRect(0.48, 0.48, 0.1));                       // 中空藍框，白底從中間露出來
  const blade = extrude(bladeShape, 0.08, M.blue, 0.03);
  blade.position.set(SX + 0.38, 1.78, BF - 0.4);
  shopB.add(blade);
  shopB.add(box(0.52, 0.52, 0.06, M.white, SX + 0.38, 1.78, BF - 0.4, 0.06));
  add(shopB, 0, 0, 0.25);

  // ---------- 4. 路燈（左前角，彎頸燈頭轉向店家） ----------
  const lampG = new THREE.Group();
  lampG.add(roundDisc(0.3, 0.12, 0.05, M.dark));
  lampG.add(cyl(0.07, 0.09, 3.5, M.dark, 0, 1.8, 0, 16));
  // 彎頸：四分之一圓環，從燈桿頂端往上彎、再往 +z 方向水平伸出
  const neckGeo = new THREE.TorusGeometry(0.35, 0.06, 12, 24, Math.PI / 2);
  neckGeo.rotateZ(Math.PI / 2);                                           // 圓弧改成從左側（桿頂）到正上方
  const neck = new THREE.Mesh(neckGeo, M.dark);
  neck.position.set(0, 3.55, 0.35);
  neck.rotation.y = -Math.PI / 2;                                         // 讓圓弧所在平面朝 +z
  neck.castShadow = true;
  lampG.add(neck);
  lampG.add(cyl(0.14, 0.2, 0.14, M.dark, 0, 3.8, 0.42, 20));               // 燈帽
  lampG.add(ball(0.22, M.lampGlow, 0, 3.6, 0.42));                         // 燈泡
  add(lampG, -4.25, 3.4, 0.4, Math.PI * 0.75);                          // 燈頭朝 +x −z（店家方向）

  // ---------- 5. A 字菜單立牌（大店門口） ----------
  // 兩片板子共用頂端的鉸鍊，往前後張開成 A 字；每片＝木框（中空）+ 黑板 + 粉筆字
  const aSign = new THREE.Group();
  const SH = 1.3;
  aSign.add(box(0.84, 0.08, 0.14, M.wood, 0, SH, 0, 0.03));             // 頂端鉸鍊
  [-1, 1].forEach(sd => {
    const hinge = new THREE.Group();
    hinge.position.y = SH;
    hinge.rotation.x = -sd * 0.24;                                       // sd = 1 往 +z 張開
    const frameShape = roundRect(0.8, SH, 0.06);
    frameShape.holes.push(roundRect(0.6, SH - 0.24, 0.03));
    const fr = extrude(frameShape, 0.05, M.wood, 0.02);
    fr.position.y = -SH / 2;
    hinge.add(fr);
    hinge.add(box(0.66, SH - 0.18, 0.03, M.dark, 0, -SH / 2, 0, 0.01));  // 黑板
    [0.42, 0.3, 0.36].forEach((w, i) =>
      hinge.add(box(w, 0.04, 0.02, M.white, 0, -0.38 - i * 0.18, sd * 0.03, 0.01)));   // 粉筆字（畫在外側）
    aSign.add(hinge);
  });
  add(aSign, -3.3, 0.05, 0.5, 0.25);

  // ---------- 6. 戶外雙人桌椅（一組，藍色） ----------
  // 角度 a：椅子位在桌子的 (sin a, cos a) 方向；rotY = a 讓椅子面向桌子
  const TX = -0.4, TZ = 2.6, A0 = -Math.PI / 2 - 0.5;
  add(bistroTable(), TX, TZ, 0.6);
  [A0, A0 + Math.PI].forEach((a, i) =>
    add(bistroChair(M.blue), TX + Math.sin(a) * 0.95, TZ + Math.cos(a) * 0.95, 0.68 + 0.08 * i, a));

  return { root, items };
}
