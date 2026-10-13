// 場景共用零件（建模 session 專用）：多個場景會用到、但 shared/kit.js 沒有的工具
// 注意：這個檔不是場景，地圖只依場景 id 載入 scenes/<id>.js，不會載入這裡
import * as THREE from 'three';
import { M } from '../shared/materials.js';
import { cyl } from '../shared/kit.js';

// 讓網格投射與接收陰影
function shade(m) { m.castShadow = true; m.receiveShadow = true; return m; }

// 圓角圓盤：用旋轉成形做出「邊緣圓潤」的圓桌面／椅座（kit 的 cyl 邊緣是銳角）
// r：半徑、h：厚度、e：邊緣圓角；底部貼齊 y = 0
export function roundDisc(r, h, e, mat, seg = 48) {
  // 圓心用 0.001 而不是 0：避免面積為 0 的三角形讓滑鼠偵測（raycast）出錯
  const pts = [new THREE.Vector2(0.001, 0), new THREE.Vector2(r - e, 0)];
  for (let i = 1; i <= 6; i++) {                       // 下緣四分之一圓弧
    const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - e + Math.cos(a) * e, e + Math.sin(a) * e));
  }
  for (let i = 0; i <= 6; i++) {                       // 上緣四分之一圓弧
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - e + Math.cos(a) * e, h - e + Math.sin(a) * e));
  }
  pts.push(new THREE.Vector2(0.001, h));
  return shade(new THREE.Mesh(new THREE.LatheGeometry(pts, seg), mat));
}

// 兩點之間的圓棍（斜撐的椅腳用）
export function rod(a, b, r, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = cyl(r, r, dir.length(), mat, 0, 0, 0, 12);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

// 單椅外殼：沿著俯視 U 形的中心線「掃」出一條截面像膠囊的管子（像擠牙膏）
// 上緣天生是圓的；高度後高前低，從椅背平滑降成扶手；扶手前端收成圓潤的鼻頭
// 座標：本地 -z 為椅子正面，+z 為椅背；殼底部在 y = 0
// 預設值 = cowork 的軟墊扶手椅；其他場景可傳入參數做出不同比例（例如無扶手餐椅）
export function chairShell(mat, {
  width = 1.24,        // 外寬
  back = 0.54,         // 椅背外緣的 z
  front = -0.42,       // 扶手前端的 z
  corner = 0.42,       // 後方轉角半徑（外緣）
  thick = 0.2,         // 殼厚
  hBack = 1.2,         // 椅背高
  hArm = 0.62,         // 扶手高
  nose = 0.22,         // 扶手前端往下圓收的長度
  backFrom = -0.15,    // 從這個 z 開始由扶手升高成椅背
  backTo = 0.42,       // 到這個 z 達到椅背高度
  cornerDrop = 0.22,   // 椅背上角壓低的量
} = {}) {
  const T = thick, A = T / 2;               // 殼厚、半厚
  const W = width - T, ZB = back - A;       // 中心線的寬度與背側位置
  const ZF = front, R = corner - A;         // 扶手前端、後方轉角半徑
  const H_BACK = hBack, H_ARM = hArm;       // 椅背高、扶手高
  const NOSE = nose;                        // 扶手前端往下圓收的長度
  const STEP = 0.04;            // 取樣間距：鳥瞰下 0.04 已足夠圓順

  // 1. 沿 U 形中心線取樣：左前 → 左後轉角 → 右後轉角 → 右前
  const path = [];
  const line = (x0, z0, x1, z1) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / STEP));
    for (let i = 0; i < n; i++) path.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n]);
  };
  const arc = (cx, cz, a0, a1) => {
    const n = Math.ceil(Math.abs(a1 - a0) * R / STEP);
    for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n; path.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R]); }
  };
  line(-W / 2, ZF, -W / 2, ZB - R);
  arc(-W / 2 + R, ZB - R, Math.PI, Math.PI / 2);
  line(-W / 2 + R, ZB, W / 2 - R, ZB);
  arc(W / 2 - R, ZB - R, Math.PI / 2, 0);
  line(W / 2, ZB - R, W / 2, ZF);
  path.push([W / 2, ZF]);

  // 每個取樣點的長度位置（算鼻頭用）
  const dist = [0];
  for (let i = 1; i < path.length; i++) dist.push(dist[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = dist[dist.length - 1];

  // 2. 每個位置的上緣高度
  const smooth = (e0, e1, v) => { const t = Math.min(Math.max((v - e0) / (e1 - e0), 0), 1); return t * t * (3 - 2 * t); };
  const NOSE_BASE = 2 * A + 0.06;           // 鼻頭最前端的高度
  const heightAt = (x, z, d) => {
    const back = smooth(backFrom, backTo, z);                                   // 0 = 扶手段、1 = 椅背段
    let h = H_ARM + (H_BACK - H_ARM) * back;
    h -= back * cornerDrop * Math.pow(Math.abs(x) / (W / 2), 2.4);               // 椅背上角壓低，頂緣成圓弧
    const e = Math.min(d, total - d);                                      // 離兩端的距離
    if (e < NOSE) {                                                        // 扶手前端以四分之一圓往下收
      const u = 1 - e / NOSE;
      h = NOSE_BASE + (h - NOSE_BASE) * Math.sqrt(1 - u * u);
    }
    return h;
  };

  // 3. 膠囊截面（n = 往外的水平方向、y = 高度）：平底小圓角 + 兩側直壁 + 半圓頂
  const RB = 0.03;
  const section = (h, k = 1) => {           // k：兩端收鼻頭時的縮放
    const pts = [];
    const c = h / 2;
    const sc = (n, y) => pts.push([n * k, c + (y - c) * k]);
    for (let i = 0; i <= 3; i++) { const t = -Math.PI / 2 + (i / 3) * (Math.PI / 2); sc(A - RB + Math.cos(t) * RB, RB + Math.sin(t) * RB); }
    for (let i = 0; i <= 8; i++) { const t = (i / 8) * Math.PI; sc(Math.cos(t) * A, h - A + Math.sin(t) * A); }
    for (let i = 0; i <= 3; i++) { const t = Math.PI + (i / 3) * (Math.PI / 2); sc(-A + RB + Math.cos(t) * RB, RB + Math.sin(t) * RB); }
    return pts;
  };
  const M_ = section(1).length;

  // 4. 組合頂點：主體 + 兩端各加幾圈逐漸縮小的截面，最後收成一點
  const rings = [];                          // 每圈：{ cx, cz, nx, nz, pts }
  const tangent = i => {
    const p0 = path[Math.max(i - 1, 0)], p1 = path[Math.min(i + 1, path.length - 1)];
    const l = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    return [(p1[0] - p0[0]) / l, (p1[1] - p0[1]) / l];
  };
  const CAP = 5;
  const capRings = (i, dir) => {             // dir = -1：起點往外延伸；+1：終點往外延伸
    const [tx, tz] = tangent(i);
    const h = heightAt(path[i][0], path[i][1], dist[i]);
    const out = [];
    for (let j = 1; j <= CAP; j++) {
      const u = j / (CAP + 1);
      const k = Math.sqrt(1 - u * u);
      out.push({ cx: path[i][0] + tx * dir * A * u, cz: path[i][1] + tz * dir * A * u, nx: -tz, nz: tx, pts: section(h, k) });
    }
    return out;
  };
  rings.push(...capRings(0, -1).reverse());
  path.forEach(([x, z], i) => {
    const [tx, tz] = tangent(i);
    rings.push({ cx: x, cz: z, nx: -tz, nz: tx, pts: section(heightAt(x, z, dist[i])) });   // (-tz, tx) = 往 U 外側
  });
  rings.push(...capRings(path.length - 1, 1));

  const verts = [];
  rings.forEach(r => r.pts.forEach(([n, y]) => verts.push(r.cx + r.nx * n, y, r.cz + r.nz * n)));
  const idx = [];
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < M_; j++) {
      const a = i * M_ + j, b = i * M_ + (j + 1) % M_, c = (i + 1) * M_ + j, d = (i + 1) * M_ + (j + 1) % M_;
      idx.push(a, c, b, b, c, d);   // 三角形繞向決定正面朝外
    }
  }
  // 兩端收口：各加一個中心點，用扇形三角形封起來
  const capCenter = (ringI, flip) => {
    const r = rings[ringI];
    let sx = 0, sy = 0;
    r.pts.forEach(([n, y]) => { sx += n; sy += y; });
    const ci = verts.length / 3;
    verts.push(r.cx + r.nx * sx / M_, sy / M_, r.cz + r.nz * sx / M_);
    for (let j = 0; j < M_; j++) {
      const a = ringI * M_ + j, b = ringI * M_ + (j + 1) % M_;
      flip ? idx.push(ci, b, a) : idx.push(ci, a, b);
    }
  };
  capCenter(0, false);
  capCenter(rings.length - 1, true);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();               // 共用頂點 → 法線自動平滑
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}


// 殼型餐椅外殼（經典一體成型的塑膠殼）：坐面往後以大圓弧彎成椅背，是同一片薄板
// 做法：沿著「側面看是 L 形」的脊線，掃出一條薄薄、兩側微微上翹的板子
// 座標：本地 -z 為椅子正面，+z 為椅背；坐面底部約在 y = 0
export function seatShell(mat, {
  thick = 0.07,        // 板厚
  seatW = 0.88,        // 坐面前緣寬
  waistW = 0.8,        // 彎折處（腰）寬
  topW = 0.98,         // 椅背頂寬
  backH = 1.0,         // 椅背頂端高度
} = {}) {
  const A = thick / 2, STEP = 0.04;   // 取樣間距：鳥瞰下 0.04 已足夠圓順
  // 1. 側面脊線（z, y）：坐面（前高後低微傾）→ 圓弧彎折 → 椅背（微後仰）
  const spine = [];
  const line = (z0, y0, z1, y1) => {
    const n = Math.max(1, Math.ceil(Math.hypot(z1 - z0, y1 - y0) / STEP));
    for (let i = 0; i < n; i++) spine.push([z0 + (z1 - z0) * i / n, y0 + (y1 - y0) * i / n]);
  };
  const RB = 0.3, CZ = 0.12, CY = 0.3;                     // 彎折圓弧
  line(-0.42, 0.05, CZ, 0);
  const aEnd = -0.14;
  const nArc = Math.ceil((aEnd + Math.PI / 2) * RB / STEP);
  for (let i = 0; i < nArc; i++) {
    const a = -Math.PI / 2 + (aEnd + Math.PI / 2) * i / nArc;
    spine.push([CZ + Math.cos(a) * RB, CY + Math.sin(a) * RB]);
  }
  const ez = CZ + Math.cos(aEnd) * RB, ey = CY + Math.sin(aEnd) * RB;
  const tz = -Math.sin(aEnd), ty = Math.cos(aEnd);          // 弧末端切線
  const len = (backH - ey) / ty;
  line(ez, ey, ez + tz * len, backH);
  spine.push([ez + tz * len, backH]);

  const dist = [0];
  for (let i = 1; i < spine.length; i++) dist.push(dist[i - 1] + Math.hypot(spine[i][0] - spine[i - 1][0], spine[i][1] - spine[i - 1][1]));
  const total = dist[dist.length - 1];
  const bend = dist[spine.findIndex(p => p[0] >= CZ - 1e-6)] / total;  // 彎折開始的位置（佔全長比例）

  const smooth = (e0, e1, v) => { const t = Math.min(Math.max((v - e0) / (e1 - e0), 0), 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  // 2. 每個位置的寬度與「兩側上翹量」
  const widthAt = (d) => {
    const f = d / total;
    let w = f < bend + 0.1 ? lerp(seatW, waistW, smooth(0.1, bend + 0.1, f)) : lerp(waistW, topW, smooth(bend + 0.1, 1, f));
    const rTop = 0.17, rFront = 0.09;                        // 椅背上角、坐面前角的圓角
    const eTop = total - d, eFront = d;
    if (eTop < rTop) { const u = 1 - eTop / rTop; w -= 2 * rTop * (1 - Math.sqrt(1 - u * u)); }
    if (eFront < rFront) { const u = 1 - eFront / rFront; w -= 2 * rFront * (1 - Math.sqrt(1 - u * u)); }
    return Math.max(w, 0.05);
  };
  const dishAt = d => lerp(0.05, 0.13, smooth(bend - 0.05, 1, d / total));

  // 3. 截面：一片兩側上翹的薄板（u = 左右、v = 朝坐的人那一側），兩端半圓收邊
  const NU = 10, NE = 3;
  const section = (w, dish, k = 1) => {
    const pts = [], a = A * k;
    const vc = u => dish * Math.pow((2 * u) / w, 2);
    for (let i = 0; i <= NU; i++) { const u = -w / 2 + (w * i) / NU; pts.push([u, vc(u) + a]); }
    for (let i = 1; i < NE; i++) { const t = Math.PI / 2 - (i / NE) * Math.PI; pts.push([w / 2 + Math.cos(t) * a, vc(w / 2) + Math.sin(t) * a]); }
    for (let i = 0; i <= NU; i++) { const u = w / 2 - (w * i) / NU; pts.push([u, vc(u) - a]); }
    for (let i = 1; i < NE; i++) { const t = -Math.PI / 2 - (i / NE) * Math.PI; pts.push([-w / 2 + Math.cos(t) * a, vc(-w / 2) + Math.sin(t) * a]); }
    return pts;
  };
  const MS = section(1, 0).length;

  // 4. 每一圈的位置與朝向；兩端再加幾圈逐漸變薄的截面，收成圓潤的邊
  const tangent = i => {
    const p0 = spine[Math.max(i - 1, 0)], p1 = spine[Math.min(i + 1, spine.length - 1)];
    const l = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    return [(p1[0] - p0[0]) / l, (p1[1] - p0[1]) / l];
  };
  const rings = [];
  const ringAt = (z, y, tz, ty, pts) => ({ z, y, nz: -ty, ny: tz, pts });     // 法線 (-ty, tz) = 朝坐的人
  const cap = (i, dir) => {
    const [tz, ty] = tangent(i);
    const out = [];
    for (let j = 1; j <= 4; j++) {
      const u = j / 5, k = Math.max(Math.sqrt(1 - u * u), 0.15);
      out.push(ringAt(spine[i][0] + tz * dir * A * u, spine[i][1] + ty * dir * A * u, tz, ty,
        section(widthAt(dist[i]), dishAt(dist[i]), k)));
    }
    return out;
  };
  rings.push(...cap(0, -1).reverse());
  spine.forEach(([z, y], i) => { const [tz, ty] = tangent(i); rings.push(ringAt(z, y, tz, ty, section(widthAt(dist[i]), dishAt(dist[i])))); });
  rings.push(...cap(spine.length - 1, 1));

  const verts = [];
  rings.forEach(r => r.pts.forEach(([u, v]) => verts.push(u, r.y + r.ny * v, r.z + r.nz * v)));
  const idx = [];
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < MS; j++) {
      const a = i * MS + j, b = i * MS + (j + 1) % MS, c = (i + 1) * MS + j, d = (i + 1) * MS + (j + 1) % MS;
      idx.push(a, b, c, b, d, c);
    }
  }
  const capCenter = (ri, flip) => {
    const r = rings[ri];
    let su = 0, sv = 0;
    r.pts.forEach(([u, v]) => { su += u; sv += v; });
    const ci = verts.length / 3;
    verts.push(su / MS, r.y + r.ny * sv / MS, r.z + r.nz * sv / MS);
    for (let j = 0; j < MS; j++) {
      const a = ri * MS + j, b = ri * MS + (j + 1) % MS;
      flip ? idx.push(ci, b, a) : idx.push(ci, a, b);
    }
  };
  capCenter(0, false);
  capCenter(rings.length - 1, true);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return shade(new THREE.Mesh(geo, mat));
}

// 葉片盆栽：白色花盆 + 一片片尖橢圓的葉子（每片葉子有自己的細莖，往外散開）
// leaves：葉片數、leafLen：葉長、hMin / hMax：葉子長出的高度範圍（從盆口算起）
export function leafPlant({ potR = 0.22, potH = 0.4, leaves = 8, leafLen = 0.36, hMin = 0.12, hMax = 0.5, spread = 0.12 } = {}) {
  const g = new THREE.Group();
  g.add(cyl(potR, potR * 0.78, potH, M.white, 0, potH / 2, 0));               // 花盆
  g.add(cyl(potR * 0.9, potR * 0.9, 0.03, M.trunk, 0, potH - 0.02, 0, 24));   // 土
  // 葉片形狀：兩條貝茲曲線圍成尖橢圓，薄薄擠出（所有葉子共用同一個幾何）
  const L = leafLen, W = leafLen * 0.24;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(W * 1.25, L * 0.22, W * 0.8, L * 0.78, 0, L);
  s.bezierCurveTo(-W * 0.8, L * 0.78, -W * 1.25, L * 0.22, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 10 });
  const GOLD = 2.39996;                                                       // 黃金角：葉子平均散開不重疊
  for (let i = 0; i < leaves; i++) {
    const f = leaves === 1 ? 0 : i / (leaves - 1);
    const yaw = i * GOLD;
    const h = potH + hMin + (hMax - hMin) * (1 - f);                          // 先長的葉子比較高
    const r = spread * (0.4 + f * 0.6);
    const base = new THREE.Vector3(Math.sin(yaw) * r, h, Math.cos(yaw) * r);
    g.add(rod(new THREE.Vector3(0, potH, 0), base, 0.012, M.green));          // 細莖
    const leaf = new THREE.Group();
    const m = new THREE.Mesh(leafGeo, M.green);
    m.castShadow = true; m.receiveShadow = true;
    m.rotation.y = 0.25 * Math.sin(i * 1.7);                                  // 每片葉子微微扭轉
    leaf.add(m);
    leaf.position.copy(base);
    leaf.rotation.order = 'YXZ';
    leaf.rotation.y = yaw;
    leaf.rotation.x = 0.45 + f * 0.75;                                        // 越下面的葉子越往外攤
    g.add(leaf);
  }
  return g;
}

// ---------- 幾何化植物（plaza-a、plaza-b 共用）：圓錐灌木、胖葉片叢、棒棒糖花、草 ----------
// 植物數量很多，用「實例化」：同一個形狀只建一次，再複製到很多位置（像蓋印章），效能不會被拖垮

// 固定種子的亂數：每次載入長出來的位置都一樣
export function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 共用形狀（所有花圃共用）：刻意簡化成幾何體，和家具、樹的霧面塑膠質感一致
export const PLANT_GEO = (() => {
  // 圓錐灌木：旋轉成形的圓角圓錐（倒水滴形）
  const cone = new THREE.LatheGeometry(
    new THREE.SplineCurve([
      new THREE.Vector2(0.001, 0), new THREE.Vector2(0.26, 0.05), new THREE.Vector2(0.3, 0.2),
      new THREE.Vector2(0.2, 0.5), new THREE.Vector2(0.07, 0.72), new THREE.Vector2(0.001, 0.76),
    ]).getPoints(12), 16);
  // 葉片形狀：兩條貝茲曲線圍成的尖橢圓，厚厚的圓邊（像塑膠玩具葉子）
  const leafShape = (L, W) => {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.bezierCurveTo(W * 1.3, L * 0.25, W * 0.9, L * 0.8, 0, L);
    sh.bezierCurveTo(-W * 0.9, L * 0.8, -W * 1.3, L * 0.25, 0, 0);
    return sh;
  };
  const leaf = new THREE.ExtrudeGeometry(leafShape(0.48, 0.13), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 6 });
  leaf.translate(0, 0, -0.01);
  const blade = new THREE.ExtrudeGeometry(leafShape(0.36, 0.045), { depth: 0.01, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1, curveSegments: 4 });
  blade.translate(0, 0, -0.005);
  // 棒棒糖花：一根莖 + 一顆壓扁的圓球
  const stem = new THREE.CylinderGeometry(0.018, 0.022, 1, 6);   // 高度 1，用縮放調整長短
  stem.translate(0, 0.5, 0);
  const bloom = new THREE.SphereGeometry(0.085, 12, 8);
  bloom.scale(1, 0.7, 1);
  return { cone, leaf, blade, stem, bloom };
})();

// 收集「形狀 + 材質 + 位置矩陣」，最後一次建成 InstancedMesh
export function batcher() {
  const map = new Map();
  return {
    push(geo, mat, m4) {
      const k = geo.uuid + mat.uuid;
      if (!map.has(k)) map.set(k, { geo, mat, list: [] });
      map.get(k).list.push(m4.clone());
    },
    build(group) {
      map.forEach(({ geo, mat, list }) => {
        const im = new THREE.InstancedMesh(geo, mat, list.length);
        list.forEach((m, i) => im.setMatrixAt(i, m));
        im.castShadow = true; im.receiveShadow = true;
        group.add(im);
      });
    },
  };
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ');
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

// 圓錐灌木
export function coneShrub(b, x, y, z, size, mat) {
  _q.identity(); _p.set(x, y, z); _s.set(size, size, size);
  b.push(PLANT_GEO.cone, mat, _m.compose(_p, _q, _s));
}

// 胖葉片叢：5 片大葉子圍成一圈往上張開
export function leafClump(b, rand, x, y, z, size = 1) {
  const yaw0 = rand() * Math.PI * 2;
  for (let i = 0; i < 5; i++) {
    _e.set(0.5 + rand() * 0.25, yaw0 + (i / 5) * Math.PI * 2, 0);   // 往外傾斜 0.5 ~ 0.75 弧度
    _q.setFromEuler(_e);
    _p.set(x, y, z);
    const k = size * (0.85 + rand() * 0.3);
    _s.set(k, k, k);
    b.push(PLANT_GEO.leaf, i % 2 ? M.green : M.plazaLawn, _m.compose(_p, _q, _s));
  }
}

// 一撮草：3 片胖草葉往外張
export function grassTuft(b, rand, x, y, z) {
  const yaw0 = rand() * Math.PI * 2;
  [-0.4, 0, 0.4].forEach((t, i) => {
    _e.set(0.08, yaw0, t);                               // 繞葉面法線轉 t，三片呈扇形張開
    _q.setFromEuler(_e);
    _p.set(x, y, z);
    const k = i === 1 ? 1 : 0.8;
    _s.set(k, k, k);
    b.push(PLANT_GEO.blade, M.plazaLeaf, _m.compose(_p, _q, _s));
  });
}

// 棒棒糖花：一群 3~4 朵，高低錯落、同一個顏色
export function bloomCluster(b, rand, x, y, z, mat) {
  const n = 3 + Math.floor(rand() * 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(), r = i === 0 ? 0 : 0.14;
    const fx = x + Math.cos(a) * r, fz = z + Math.sin(a) * r, h = 0.3 + rand() * 0.22;
    _q.identity(); _p.set(fx, y, fz); _s.set(1, h, 1);
    b.push(PLANT_GEO.stem, M.green, _m.compose(_p, _q, _s));
    _p.set(fx, y + h, fz); _s.set(1, 1, 1);
    b.push(PLANT_GEO.bloom, mat, _m.compose(_p, _q, _s));
  }
}
