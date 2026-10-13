// 場景：綠地公共廣場（圓形廣場）
// 「台階往下延伸的圓形下沉廣場，大家可以隨意坐下來交流」
// 物件：兩棵大樹、下沉圓形廣場（兩層台階 + 中心地面）、木頭弧形座椅、四角花圃（幾何化的灌木、葉片、花、草）
import * as THREE from 'three';
import { M } from '../shared/materials.js';
import { ball, cyl, roundRect, makeAdder } from '../shared/kit.js';
import { seeded, batcher, coneShrub, leafClump, grassTuft, bloomCluster } from './parts.js';

export const meta = {
  id: 'plaza-a',
  name: '綠地公共廣場（圓形廣場）',
  footprint: 'M',          // 10 × 10，見 SPEC.md
  status: 'done',
};

// ---------- 場景專用小工具 ----------

// 平放的擠出量體：把平面形狀往上長成厚度 h，底部在 y0；邊緣倒圓角
// 平面座標 (x, y) 對應世界 (x, -z)；圓形需要較多分段才不會看起來有稜角，所以不用 kit 的 extrude
function slab(shape, y0, h, mat, bevel = 0.04) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 40,
  });
  geo.rotateX(-Math.PI / 2);                             // 擠出方向改成往上
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y0 + bevel;
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
// 圓形的洞（給形狀挖洞用）
function holePath(r) {
  const p = new THREE.Path();
  p.absarc(0, 0, r, 0, Math.PI * 2, true);
  return p;
}
// 圓形（可挖洞）
function circle(r, hole = 0) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  if (hole > 0) s.holes.push(holePath(hole));
  return s;
}
// 環形的一段（弧形座椅用）：內外半徑、中心角度、張開角度
function sector(rOut, rIn, mid, span) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, mid - span / 2, mid + span / 2, false);
  s.absarc(0, 0, rIn, mid + span / 2, mid - span / 2, true);
  return s;
}
// 角落花圃的平面形狀：方角 [w, E] 減掉半徑 R 的圓（留出圓形步道），在 +x、+y 象限
function cornerShape(w, E, R) {
  const s = new THREE.Shape();
  const c = Math.sqrt(R * R - w * w);
  s.moveTo(w, c);
  s.lineTo(w, E);
  s.lineTo(E, E);
  s.lineTo(E, w);
  s.lineTo(c, w);
  s.absarc(0, 0, R, Math.atan2(w, c), Math.atan2(c, w), false);
  return s;
}
// 大樹：樹幹 + 一顆亮綠大球 + 四顆深綠球，組成蓬鬆的樹冠（頂端約 3.6）
function bigTree() {
  const g = new THREE.Group();
  g.add(cyl(0.15, 0.2, 1.9, M.trunk, 0, 0.95, 0, 16));
  [[0.7, 2.05, 0.3, 0.68], [-0.6, 2.15, -0.3, 0.66], [0.2, 2.0, -0.7, 0.6], [-0.3, 1.95, 0.65, 0.6]]
    .forEach(([x, y, z, r]) => g.add(ball(r, M.treeTop, x, y, z)));
  g.add(ball(0.88, M.plazaLeaf, 0.05, 2.65, 0.05));
  return g;
}

export default function build() {
  const root = new THREE.Group();
  const items = [];
  const add = makeAdder(root, items);

  // 下沉廣場的半徑與高度
  const R = 3.6;                       // 挖洞半徑（地面層）
  const L1 = -0.28, L2 = -0.56, L3 = -0.84;   // 第一層台階、第二層台階、中心地面的高度

  // ---------- 1. 地基：中間挖圓洞的方板（薄荷綠底 + 奶油色石材面） ----------
  const platform = new THREE.Group();
  const baseShape = roundRect(10, 10, 0.3);
  baseShape.holes.push(holePath(R + 0.1));                               // 洞比石材面大一點，藏在台階後面
  platform.add(slab(baseShape, -1, 0.8, M.plazaMint, 0.08));
  const deckShape = roundRect(9.7, 9.7, 0.25);
  deckShape.holes.push(holePath(R));
  platform.add(slab(deckShape, -0.24, 0.24, M.plazaStone, 0.04));
  // 往下的兩層環形台階 + 中心圓形地面（都從 y = -1 長上來，外緣稍微埋進地基）
  platform.add(slab(circle(R + 0.02, 3.0), -1, L1 + 1, M.plazaStone));
  platform.add(slab(circle(3.04, 2.4), -1, L2 + 1, M.plazaStone));
  platform.add(slab(circle(2.44), -1, L3 + 1, M.plazaFloor));
  root.add(platform);

  // ---------- 2. 木頭弧形座椅（第一層台階上，面向中心） ----------
  // 平面角度 θ 對應世界方向 (cos θ, -sin θ)：135° = 後方（-x -z）、225° = 左（-x +z）、45° = 右（+x -z）
  const DEG = Math.PI / 180;
  [[135, 58, 0.5], [225, 34, 0.58], [45, 34, 0.66]].forEach(([mid, span, delay]) => {
    const bench = new THREE.Group();
    bench.add(slab(sector(3.45, 3.08, mid * DEG, span * DEG), L1, 0.16, M.wood, 0.04));
    add(bench, 0, 0, delay);
  });

  // ---------- 3. 四角花圃（幾何化植物：圓錐灌木、胖葉片叢、棒棒糖花、草）+ 兩棵大樹 ----------
  // 每個花圃先在「+x −z」象限建模（平面 +y = 世界 −z），再依 k 轉 90° 的倍數放到其他角
  const W = 0.9, E = 4.65, RP = 4.1, RIM = 0.16, PH = 0.55, SOIL = 0.45;
  const outer = () => cornerShape(W, E, RP);
  const inner = () => cornerShape(W + RIM, E - RIM, RP + RIM);
  [
    [0, true, 0.2],    // 右角（+x −z）：有大樹
    [1, false, 0.28],  // 後角（−x −z）
    [2, true, 0.36],   // 左角（−x +z）：有大樹
    [3, false, 0.44],  // 前角（+x +z）
  ].forEach(([k, hasTree, delay]) => {
    const g = new THREE.Group();
    const rimShape = outer();
    rimShape.holes.push(inner());
    g.add(slab(rimShape, 0, PH, M.plazaStone, 0.05));                    // 石砌花台
    g.add(slab(inner(), 0, SOIL, M.plazaLawn, 0.03));                         // 草地
    // 花圃植物：在花台內側區域隨機長出（平面座標 (x, y) → 世界 (x, -y)）
    const rand = seeded(17 + k * 101);
    const lo = W + RIM, hi = E - RIM, rIn = RP + RIM;
    const inside = (x, y, m) => x >= lo + m && y >= lo + m && x <= hi - m && y <= hi - m && Math.hypot(x, y) >= rIn + m;
    const pick = m => { for (;;) { const x = lo + rand() * (hi - lo), y = lo + rand() * (hi - lo); if (inside(x, y, m)) return [x, y]; } };
    const b = batcher();
    // 圓錐灌木：沿外側兩邊排（平面座標 → 世界 (x, -y)）
    const cones = hasTree ? [[4.2, 2.1, 1.1], [2.1, 4.2, 1.1], [4.2, 2.9, 0.8]] : [[4.2, 2.1, 1.1], [2.1, 4.2, 1.1], [3.6, 3.6, 1.3], [4.2, 2.9, 0.8], [2.9, 4.2, 0.8]];
    cones.forEach(([x, y, sz], i) => coneShrub(b, x, SOIL, -y, sz, i % 2 ? M.plazaLeaf : M.green));
    // 胖葉片叢 + 棒棒糖花（顏色依花圃輪流）
    const blooms = [M.white, M.yellow, M.plazaPink, M.accent];
    const [lx, ly] = pick(0.35);
    leafClump(b, rand, lx, SOIL, -ly, 1);
    for (let c = 0; c < 2; c++) {
      const [fx, fy] = pick(0.3);
      bloomCluster(b, rand, fx, SOIL, -fy, blooms[(k + c * 2) % blooms.length]);
    }
    // 草：少量點綴
    for (let i = 0; i < 12; i++) { const [x, y] = pick(0.12); grassTuft(b, rand, x, SOIL, -y); }
    b.build(g);
    if (hasTree) {
      const t = bigTree();
      t.position.set(3.55, SOIL, -3.55);
      g.add(t);
    }
    add(g, 0, 0, delay, (k * Math.PI) / 2);
  });

  return { root, items };
}
