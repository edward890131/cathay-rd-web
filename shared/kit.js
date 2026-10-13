// 共用建模工具：所有場景都用這些積木組合，確保圓角、陰影、比例一致
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M } from './materials.js';

// 讓網格投射與接收陰影
function shade(m) { m.castShadow = true; m.receiveShadow = true; return m; }

// 效能：依尺寸決定精細度 —— 越小的東西用越少的面（在畫面上看不出差別，但能大幅減少三角形數量）
const roundSeg = r => (r <= 0.03 ? 1 : r < 0.1 ? 2 : 3);                       // 圓角的分段
const sphereSeg = r => (r < 0.12 ? [12, 8] : r < 0.35 ? [18, 12] : r < 0.8 ? [26, 18] : [32, 22]);
const cylSeg = r => (r < 0.08 ? 8 : r < 0.25 ? 14 : r < 0.8 ? 24 : 36);

// 圓角方塊：寬、高、深、材質、中心位置、圓角
export function box(w, h, d, mat, x = 0, y = 0, z = 0, r = 0.06) {
  const rr = Math.min(r, w / 2, h / 2, d / 2);
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, roundSeg(rr), rr), mat);
  m.position.set(x, y, z);
  return shade(m);
}
// 圓柱：上半徑、下半徑、高、材質、中心位置、分段數（沒指定就依半徑自動決定）
export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, Math.min(seg ?? 99, cylSeg(Math.max(rt, rb)))), mat);
  m.position.set(x, y, z);
  return shade(m);
}
// 球
export function ball(r, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, ...sphereSeg(r)), mat);
  m.position.set(x, y, z);
  return shade(m);
}
// 圓角矩形平面形狀（中心為原點），上下圓角可不同
export function roundRect(w, h, rTop, rBot = rTop) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + rBot, y);
  s.lineTo(x + w - rBot, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rBot);
  s.lineTo(x + w, y + h - rTop);
  s.quadraticCurveTo(x + w, y + h, x + w - rTop, y + h);
  s.lineTo(x + rTop, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - rTop);
  s.lineTo(x, y + rBot);
  s.quadraticCurveTo(x, y, x + rBot, y);
  return s;
}
// 把平面形狀擠出成有厚度、邊緣圓潤的立體（沿 z 軸，置中）
export function extrude(shape, depth, mat, bevel = 0.04) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 20,
  });
  geo.translate(0, 0, -depth / 2);
  return shade(new THREE.Mesh(geo, mat));
}
// 資料夾：書背朝本地 +x、底部貼齊 y=0、厚度沿 z；用 rotation.y 決定書背方向
export function binder(mat, h = 1.1, depth = 0.85, thick = 0.3) {
  const g = new THREE.Group();
  g.add(box(depth, h, thick, mat, 0, h / 2, 0, 0.05));                                       // 本體
  g.add(box(0.03, h * 0.36, thick * 0.62, M.white, depth / 2 + 0.005, h * 0.66, 0, 0.012));    // 書背標籤
  const ring = cyl(0.085, 0.085, 0.03, M.white, depth / 2 + 0.008, h * 0.24, 0, 24);          // 指洞外圈
  ring.rotation.z = Math.PI / 2;
  g.add(ring);
  const hole = cyl(0.055, 0.055, 0.03, M.dark, depth / 2 + 0.018, h * 0.24, 0, 24);           // 指洞內部
  hole.rotation.z = Math.PI / 2;
  g.add(hole);
  return g;
}
export function placeBinder(parent, mat, x, y, z, rotY = 0, h) {
  const b = binder(mat, h);
  b.position.set(x, y, z);
  b.rotation.y = rotY;
  parent.add(b);
  return b;
}
// 樹：樹幹 + 2~3 顆樹冠球；size 為整體縮放（1 = 約 2.2 高）
export function tree(size = 1, mat = M.treeTop) {
  const g = new THREE.Group();
  g.add(cyl(0.12, 0.16, 0.9, M.trunk, 0, 0.45, 0, 12));
  g.add(ball(0.75, mat, 0, 1.45, 0));
  g.add(ball(0.55, mat, 0.38, 1.2, 0.2));
  g.add(ball(0.5, mat, -0.3, 1.25, -0.25));
  g.scale.setScalar(size);
  return g;
}
// 路燈
export function lamp(h = 2.4) {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.07, h, M.dark, 0, h / 2, 0, 10));
  const bulb = ball(0.16, M.lampBulb, 0, h + 0.1, 0);   // 燈泡：夜晚模式會發光
  bulb.name = 'bulb';
  g.add(bulb);
  return g;
}

// 建立「會進場、可 hover」物件的加入器
// 用法：const add = makeAdder(root, items); add(group, x, z, delay, rotY)
export function makeAdder(root, items) {
  return (group, x, z, delay, rotY = 0, { hoverable = true } = {}) => {
    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    group.userData = { isItem: true, delay, lift: 0, baseY: 0, hoverable };
    items.push(group);
    root.add(group);
    return group;
  };
}
