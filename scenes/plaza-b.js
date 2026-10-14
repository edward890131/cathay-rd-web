// 場景：綠地公共廣場（大樹長椅）
// 「在大樹下坐一下、看看指示牌找方向的小公園」
// 物件：一棵大樹（圓形花台）、環繞樹木的弧形長椅、直長椅、地磚步道 + 踏腳石、指示牌、幾何化灌木與花草點綴
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M } from '../shared/materials.js';
import { box, cyl, ball, makeAdder } from '../shared/kit.js';
import { rod, seeded, batcher, leafClump, grassTuft, bloomCluster } from './parts.js';

export const meta = {
  id: 'plaza-b',
  name: '綠地公共廣場（大樹長椅）',
  footprint: 'M',          // 10 × 10，見 SPEC.md
  status: 'done',
};

// ---------- 場景專用小工具 ----------

// 平放的擠出量體：平面形狀往上長成厚度 h，底部在 y0（平面 (x, y) 對應世界 (x, -z)）
function slab(shape, y0, h, mat, bevel = 0.04) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 40,
  });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y0 + bevel;
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
// 圓形（可挖洞）
function circle(r, hole = 0) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  if (hole > 0) { const p = new THREE.Path(); p.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(p); }
  return s;
}
// 環形的一段：內外半徑、中心角度、張開角度
function sector(rOut, rIn, mid, span) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, mid - span / 2, mid + span / 2, false);
  s.absarc(0, 0, rIn, mid + span / 2, mid - span / 2, true);
  return s;
}

// 幾何化灌木：膠囊（直立的圓頭藥丸）與圓球，延續 plaza-a 的抽象植物語言
// 用旋轉成形自己做膠囊（內建 CapsuleGeometry 兩端有面積為 0 的三角形，會讓滑鼠偵測出錯）
const CAPSULE = (() => {
  const R = 0.2, L = 0.3, pts = [];
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(Math.cos(a) * R, 0.001), R + Math.sin(a) * R)); }
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(Math.cos(a) * R, 0.001), R + L + Math.sin(a) * R)); }
  return new THREE.LatheGeometry(pts, 24);                // 底部貼齊 y = 0，總高 0.7
})();
function capsule(x, y, z, s, mat) {
  const m = new THREE.Mesh(CAPSULE, mat);
  m.position.set(x, y, z);
  m.scale.setScalar(s);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
// 一叢灌木：一顆圓球 + 兩三根膠囊，高低錯落
function shrubCluster(spec, y = 0) {
  const g = new THREE.Group();
  spec.forEach(([type, x, z, s, mat]) =>
    g.add(type === 'ball' ? ball(0.42 * s, mat, x, y + 0.36 * s, z) : capsule(x, y, z, s, mat)));
  return g;
}

export default function build() {
  const root = new THREE.Group();
  const items = [];
  const add = makeAdder(root, items);

  // ---------- 1. 地基 + 地磚 + 草坪 ----------
  const platform = new THREE.Group();
  platform.add(box(10, 1, 10, M.plazaStone, 0, -0.5, 0, 0.3));
  // 草坪（稍微凸起）：[x0, x1, z0, z1]
  const lawns = [
    [-4.85, -0.5, 2.0, 4.85],    // 左前（有踏腳石與灌木）
    [0.5, 4.85, 2.6, 4.85],      // 前方（有指示牌）
    [3.4, 4.85, -2.6, 1.6],      // 右側
    [0.4, 3.0, -4.85, -3.5],     // 右後（大樹後方）
  ];
  // 左前、右側兩塊用深綠，跟另外兩塊萊姆綠交錯
  lawns.forEach(([x0, x1, z0, z1], i) =>
    platform.add(box(x1 - x0, 0.14, z1 - z0, i % 2 ? M.plazaBLawn : M.plazaBLawnDk, (x0 + x1) / 2, 0.07, (z0 + z1) / 2, 0.05)));
  // 地磚：所有地磚共用同一個幾何；草坪裡面的不鋪
  const tileGeo = new RoundedBoxGeometry(0.92, 0.06, 0.92, 2, 0.02);
  const inLawn = (x, z) => lawns.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1);
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const x = -4.32 + i * 0.96, z = -4.32 + j * 0.96;
      if (inLawn(x, z)) continue;
      const t = new THREE.Mesh(tileGeo, M.plazaFloor);
      t.position.set(x, 0.03, z);
      t.receiveShadow = true;
      platform.add(t);
    }
  }
  // 草坪上的點綴：少量棒棒糖花、胖葉片叢、草（幾何化，和 plaza-a 同一套）
  const LT = 0.14;                                          // 草坪上緣
  const fl = batcher(), fr = seeded(41);
  bloomCluster(fl, fr, -3.6, LT, 3.95, M.yellow);           // 左前草坪
  [[-4.3, 4.3], [-1.0, 2.4], [-2.9, 4.45]].forEach(([x, z]) => grassTuft(fl, fr, x, LT, z));
  bloomCluster(fl, fr, 3.75, LT, 4.15, M.white);            // 前方草坪
  [[1.0, 3.0], [4.3, 3.1]].forEach(([x, z]) => grassTuft(fl, fr, x, LT, z));
  leafClump(fl, fr, 4.1, LT, 0.6, 0.9);                     // 右側草坪
  bloomCluster(fl, fr, 4.2, LT, -1.3, M.accent);
  [[3.8, -0.3], [4.4, 1.25]].forEach(([x, z]) => grassTuft(fl, fr, x, LT, z));
  bloomCluster(fl, fr, 1.7, LT, -4.25, M.plazaPink);        // 右後草坪
  [[0.9, -4.2], [2.55, -4.0]].forEach(([x, z]) => grassTuft(fl, fr, x, LT, z));
  fl.build(platform);
  root.add(platform);

  // ---------- 2. 圓形花台 + 大樹 + 灌木 ----------
  const TX = -1.8, TZ = -1.3, PR = 1.75;                    // 花台中心、外半徑
  const planter = new THREE.Group();
  planter.add(slab(circle(PR, PR - 0.2), 0, 0.62, M.white, 0.05));        // 白色花台牆
  planter.add(slab(circle(PR - 0.18), 0, 0.5, M.plazaBLawn, 0.03));       // 草地
  // 大樹：樹幹 + 兩根分枝 + 蓬鬆樹冠（一顆大球 + 三顆小球）
  const SOIL = 0.5;
  planter.add(cyl(0.2, 0.28, 1.7, M.trunk, 0, SOIL + 0.85, 0, 16));
  planter.add(rod(new THREE.Vector3(0, SOIL + 1.3, 0), new THREE.Vector3(-0.7, SOIL + 2.1, 0.2), 0.1, M.trunk));
  planter.add(rod(new THREE.Vector3(0, SOIL + 1.4, 0), new THREE.Vector3(0.6, SOIL + 2.2, 0.3), 0.1, M.trunk));
  [[-1.0, 2.55, 0.35, 0.78, M.treeTop], [0.95, 2.5, 0.55, 0.82, M.plazaLeaf], [0.35, 2.75, -0.95, 0.72, M.treeTop]]
    .forEach(([x, y, z, r, mat]) => planter.add(ball(r, mat, x, SOIL + y, z)));
  planter.add(ball(1.3, M.green, 0, SOIL + 3.25, 0));
  // 花台裡的灌木
  planter.add(shrubCluster([
    ['capsule', -0.9, 0.7, 1.0, M.green], ['capsule', -0.5, 1.05, 0.75, M.plazaLeaf],
    ['ball', 0.75, -0.75, 0.8, M.green], ['capsule', 0.35, 0.95, 0.8, M.plazaLeaf], ['capsule', 0.75, 0.6, 0.6, M.green],
  ], SOIL));
  // 花台裡的點綴：粉色棒棒糖花 + 胖葉片叢 + 兩撮草
  const rand = seeded(29);
  const pf = batcher();
  bloomCluster(pf, rand, -0.95, SOIL, -0.5, M.plazaPink);
  leafClump(pf, rand, 0.15, SOIL, -1.05, 0.9);
  grassTuft(pf, rand, 1.1, SOIL, 0.05);
  grassTuft(pf, rand, -0.35, SOIL, -1.0);
  pf.build(planter);
  add(planter, TX, TZ, 0.15);

  // ---------- 3. 環繞大樹的弧形長椅（貼著花台外側，面向外） ----------
  // 平面角度 θ 對應世界方向 (cos θ, -sin θ)：-25° ≈ 朝 +x 偏 +z（觀看者右前方）
  const DEG = Math.PI / 180, MID = -30 * DEG, SPAN = 80 * DEG;
  const arcBench = new THREE.Group();
  arcBench.add(slab(sector(PR + 0.55, PR - 0.02, MID, SPAN), 0, 0.92, M.white, 0.05));    // 白色底座
  // 木條坐面：四條同心弧木條，中間留細縫
  [[PR + 0.02, PR + 0.14], [PR + 0.17, PR + 0.29], [PR + 0.32, PR + 0.44], [PR + 0.47, PR + 0.58]]
    .forEach(([r0, r1]) => arcBench.add(slab(sector(r1, r0, MID, SPAN - 4 * DEG), 0.92, 0.14, M.wood, 0.03)));
  add(arcBench, TX, TZ, 0.4);

  // ---------- 4. 直長椅（右後方，木條坐面 + 白色端座） ----------
  const bench = new THREE.Group();
  [-1.2, 1.2].forEach(x => bench.add(box(0.32, 0.95, 1.0, M.white, x, 0.475, 0, 0.1)));      // 白色端座
  [-0.33, -0.11, 0.11, 0.33].forEach(z => bench.add(box(2.9, 0.12, 0.18, M.wood, 0, 1.01, z, 0.04)));   // 木條
  add(bench, 1.8, -2.35, 0.5);

  // ---------- 5. 左前草坪：踏腳石 + 灌木 ----------
  const stones = new THREE.Group();
  [2.6, 3.3, 4.0].forEach((z, i) => stones.add(box(1.0, 0.07, 0.46, M.white, -2.0 + i * 0.12, 0.17, z, 0.03)));
  add(stones, 0, 0, 0.55, 0, { hoverable: false });
  add(shrubCluster([
    ['ball', 0, 0, 1.2, M.green], ['capsule', 0.65, 0.25, 1.0, M.plazaLeaf], ['capsule', 1.05, 0.5, 0.75, M.green],
  ], 0.14), -3.9, 2.75, 0.6);

  // ---------- 6. 指示牌（前方草坪） ----------
  const sign = new THREE.Group();
  sign.add(cyl(0.1, 0.12, 2.3, M.white, 0, 1.29, 0, 20));                        // 白色立柱
  sign.add(ball(0.12, M.white, 0, 2.44, 0));                                      // 圓頂
  // 黃色箭頭牌：長方形 + 三角箭頭，指向 -x（廣場方向）；牌面朝 ±z
  const arrow = new THREE.Shape();
  arrow.moveTo(0.1, -0.16); arrow.lineTo(-0.55, -0.16); arrow.lineTo(-0.55, -0.26);
  arrow.lineTo(-0.85, 0); arrow.lineTo(-0.55, 0.26); arrow.lineTo(-0.55, 0.16); arrow.lineTo(0.1, 0.16);
  arrow.closePath();
  const arrowGeo = new THREE.ExtrudeGeometry(arrow, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3 });
  arrowGeo.translate(0, 0, -0.03);
  const arrowMesh = new THREE.Mesh(arrowGeo, M.yellow);
  arrowMesh.position.set(0, 2.0, 0);
  arrowMesh.castShadow = true; arrowMesh.receiveShadow = true;
  sign.add(arrowMesh);
  sign.add(shrubCluster([['capsule', -0.45, 0.3, 0.9, M.green], ['ball', -0.15, 0.55, 0.55, M.plazaLeaf]], 0.14));
  add(sign, 2.4, 3.6, 0.7);

  return { root, items };
}
