// 「關於這個計畫」電腦螢幕幻燈片：一個獨立的 3D 小劇場（透視鏡頭），由首頁鑽進復古電腦螢幕後播放
// 三段：01 資產活化（大學淡出 → 新大樓落下 → 公園換成街景）、02 人才培育（師生慢慢走進大門）、03 產業推動（室內研究空間握手）
//
// 用法（hero-map 端）：
//   import { createAboutSlides, ABOUT_COPY, ABOUT_TIMING } from './shared/slides.js';
//   const about = createAboutSlides();                 // 建一次就好
//   about.setView(innerWidth, innerHeight, { shiftX }); // 視窗大小改變時呼叫；shiftX = 主體往右推的像素（左邊留給文字卡片）
//   about.update(step, t);                              // 每幀：step = 0／1／2，t = 這一步播了幾秒；回傳 { flash }（穿過大門的白光 0～1）
//   renderer.render(about.scene, about.camera);         // 用地圖同一個 renderer 畫
//   about.setNight(k);                                  // 0 = 白天、1 = 夜晚（可以給中間值做漸變）
//
// 設計原則：
// - 畫面是 (第幾步, 播了幾秒) 的結果，不記任何狀態 → 往回捲時直接給「那一步的完成時間」就能顯示完成畫面
// - 之前的步驟一律視為已播完；step 0、t 0 就是開場畫面（大學和公園已經在畫面裡）
// - 共用材質（M.xxx）不會被改到：需要淡出的物件都複製一份半透明材質
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { M } from './materials.js';
import { SUN_DIR } from './stage.js';
import { box, cyl, ball, tree, lamp } from './kit.js';
import buildUniversity from '../scenes/university.js';
import buildTower from '../scenes/tower.js';
import buildShop from '../scenes/shop.js';
import buildPlazaA from '../scenes/plaza-a.js';
import buildPlazaB from '../scenes/plaza-b.js';
import buildCowork from '../scenes/cowork.js';
import buildExchange from '../scenes/exchange.js';
import buildOffice from '../scenes/office.js';

// ---------- 文字（給 hero-map 的 HTML 卡片用，螢幕裡不放字） ----------
export const ABOUT_COPY = {
  eyebrow: '理念與使命',
  title: '創新從這裡起步',
  lead: '從研究計畫到產學論壇，合作在這裡逐步展開。',
  steps: [
    { n: '01', h: '資產活化', p: '這裡是臺北大學建國校區，法商學院的起源地。新建的綠建築保留了學校的重要資產，也讓這塊地成為產學合作的新空間。' },
    { n: '02', h: '人才培育', p: '結合北大各院系的特色，透過空間與產業媒合，讓學生提早接觸產業、累積實務經驗。' },
    { n: '03', h: '產業推動', p: '結合產學雙方的資源，提供實習與創新的環境，建立學校與產業交流的平台；並且持續協助導入投資基金及人才資源，成為新創事業的孵化器。' },
  ],
};

// ---------- 時間（秒） ----------
export const ABOUT_TIMING = {
  dur: [7.2, 12, 6],         // 每一步主要動態的長度；往回捲時用 t = dur + 1.5 顯示完成畫面
  advance: [9.5, 14, 9],     // 自動接續播放：到達這一步幾秒後換下一步（03 之後回到 01 從頭循環）
  swap: 1.4,                 // 第 3 步在這一秒穿過大門、切到室內
};

const clamp01 = x => Math.min(Math.max(x, 0), 1);
const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
const fall = k => 1 - (1 - k) ** 3;                                   // 落地：ease-out（一開始快、落地前慢慢減速，不回彈）
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- 工具：把場景零件拆開，做「一塊一塊組起來」 ----------
function piecesOf(items) {
  const list = [];
  items.forEach(g => g.children.forEach(p => {
    const b = new THREE.Box3().setFromObject(p);
    list.push({ obj: p, base: p.position.clone(), minY: b.min.y, x: (b.min.x + b.max.x) / 2 });
  }));
  list.sort((a, b) => (a.minY - b.minY) || (a.x - b.x));             // 由下往上、由左往右
  list.forEach((p, i) => p.order = i / Math.max(list.length - 1, 1));
  return list;
}
function dropPieces(list, t, { spread = 1, dur = 0.6, drop = 10 } = {}) {
  for (const p of list) {
    const k = clamp01((t - p.order * spread) / dur);
    p.obj.visible = k > 0;
    p.obj.position.y = p.base.y + (1 - fall(k)) * drop;
  }
}
function dropGroup(g, t, delay, dur = 0.7, drop = 9) {
  const k = clamp01((t - delay) / dur);
  g.visible = k > 0;
  g.position.y = (1 - fall(k)) * drop;
}
// 工具：讓一整組物件可以淡出／淡入
// 共用材質不能直接改透明度，所以複製一份半透明版本；再疊一份「只寫深度」的分身，半透明時才不會看到內部重疊的面
const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
function fadeable(root, { depthPrepass = true } = {}) {
  const mats = new Map(), meshes = [];
  root.traverse(o => { if (o.isMesh) meshes.push(o); });              // 先收集，避免邊走訪邊加物件
  meshes.forEach(o => {
    if (!mats.has(o.material)) {
      const m = o.material.clone(); m.transparent = true; m.userData.baseOp = o.material.opacity;
      m.userData.src = o.material;                                     // 記住原本的共用材質（夜晚發光要跟著同步）
      mats.set(o.material, m);
    }
    o.material = mats.get(o.material);
    if (depthPrepass && o.material.userData.baseOp >= 1) {            // 本來就是透明的玻璃不用加
      const d = new THREE.Mesh(o.geometry, depthOnly);
      d.renderOrder = 1; d.castShadow = false; d.raycast = () => {};
      o.add(d);
    }
  });
  const set = a => {
    mats.forEach(m => {
      m.opacity = m.userData.baseOp * a;
      m.emissiveIntensity = m.userData.src.emissiveIntensity ?? 0;    // 地圖切夜晚時會調共用材質的發光，複製品跟著同步
    });
    root.visible = a > 0.01;
  };
  return set;
}

// ---------- 人物：插畫版（同 hero-map 的 personIllus；之後若搬到共用檔，這裡改成 import） ----------
const coatGray = M.coatGray ?? new THREE.MeshPhysicalMaterial({ color: '#b9bec6', roughness: 0.5, clearcoat: 0.3 });   // 主線還沒有這兩個材質時的備用（一次性）
const bagBrown = M.bagBrown ?? new THREE.MeshPhysicalMaterial({ color: '#8a5a3c', roughness: 0.6 });
const capsule = (r, len, mat) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat); m.castShadow = true; return m; };
function mergeParts(group) {                                          // 同材質的零件合併成一個，減少繪製次數
  const byMat = new Map();
  [...group.children].forEach(c => {
    if (!c.isMesh || c.material.transparent) return;
    c.updateMatrix();
    const geo = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
    Object.keys(geo.attributes).forEach(k => { if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k); });
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    geo.applyMatrix4(c.matrix);
    (byMat.get(c.material) ?? byMat.set(c.material, []).get(c.material)).push({ geo, mesh: c });
  });
  byMat.forEach((list, mat) => {
    if (list.length < 2) return;
    const merged = mergeGeometries(list.map(x => x.geo), false);
    if (!merged) return;
    list.forEach(x => group.remove(x.mesh));
    const m = new THREE.Mesh(merged, mat); m.castShadow = true; m.receiveShadow = true;
    group.add(m);
  });
  return group;
}
let illusN = 0;
function personIllus({ shirt, pants, hair, long = false }, scale) {
  const n = illusN++;
  const coat = shirt === M.white ? coatGray : shirt;                  // 白色的人改穿淺灰外套
  const g = new THREE.Group();
  const legJ = x => {                                                  // 腳：直筒褲管 + 腳踝 + 厚底鞋
    const j = new THREE.Group(); j.position.set(x, 1.9, 0);
    j.add(cyl(0.21, 0.21, 1.42, pants, 0, -0.66, 0, 16));
    j.add(cyl(0.15, 0.15, 0.16, M.skin, 0, -1.42, 0, 12));
    j.add(box(0.44, 0.34, 0.64, M.dark, 0, -1.63, 0.08, 0.14));
    [0.62, -0.62].forEach(a => { const l = box(0.2, 0.025, 0.04, M.wood, 0, -1.465, 0.22, 0.01); l.rotation.y = a; j.add(l); });
    g.add(mergeParts(j)); return j;
  };
  const legL = legJ(-0.22), legR = legJ(0.22);
  g.add(box(0.86, 0.36, 0.5, pants, 0, 1.94, 0, 0.16));                // 臀部
  g.add(box(0.74, 1.1, 0.46, M.white, 0, 2.62, 0, 0.18));              // 白色內搭
  [-1, 1].forEach(sx => g.add(box(0.36, 1.16, 0.54, coat, sx * 0.25, 2.6, 0, 0.16)));   // 敞開的外套
  const armJ = sx => {                                                 // 手：袖子 + 連指手套般的手
    const j = new THREE.Group(); j.position.set(sx * 0.52, 3.05, 0);
    const sleeve = capsule(0.17, 0.72, coat); sleeve.position.y = -0.48; j.add(sleeve);
    const palm = ball(0.17, M.skin, 0, -1.02, 0.02); palm.scale.set(0.85, 1.25, 0.75); j.add(palm);
    const thumb = capsule(0.055, 0.1, M.skin); thumb.position.set(-sx * 0.12, -0.96, 0.1); thumb.rotation.z = sx * 0.5; j.add(thumb);
    g.add(mergeParts(j)); return j;
  };
  const armL = armJ(-1), armR = armJ(1);
  armL.rotation.z = -0.08; armR.rotation.z = 0.08;
  const head = new THREE.Group(); head.position.y = 3.2;              // 頭：方圓臉 + 鮑伯頭 + 豆豆眼 + 一字嘴
  head.add(box(1.0, 1.06, 0.94, M.skin, 0, 0.6, 0, 0.42));
  head.add(box(1.14, 0.72, 1.08, hair, 0, 1.06, -0.03, 0.35));
  head.add(box(1.12, long ? 0.9 : 0.66, 0.6, hair, 0, long ? 0.42 : 0.55, -0.25, 0.24));
  [-0.2, 0.2].forEach(x => head.add(ball(0.06, M.dark, x, 0.6, 0.47)));
  const mouth = capsule(0.022, 0.1, M.dark); mouth.rotation.z = Math.PI / 2; mouth.position.set(0, 0.36, 0.47); head.add(mouth);
  if (n % 3 === 0) {                                                   // 黑框眼鏡
    [-0.21, 0.21].forEach(x => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.026, 8, 24), M.dark); r.position.set(x, 0.61, 0.5); r.castShadow = true; head.add(r); });
    const bridge = cyl(0.018, 0.018, 0.13, M.dark, 0, 0.64, 0.5, 6); bridge.rotation.z = Math.PI / 2; head.add(bridge);
  }
  g.add(mergeParts(head));
  if (n % 3 === 1) {                                                   // 外帶咖啡
    armR.add(cyl(0.11, 0.09, 0.3, M.white, 0, -1.08, 0.2, 14));
    armR.add(cyl(0.12, 0.12, 0.06, M.dark, 0, -0.9, 0.2, 14));
  } else if (n % 3 === 2) {                                            // 斜背包
    g.add(box(0.5, 0.42, 0.18, bagBrown, -0.62, 2.05, 0.05, 0.06));
    const strap = box(0.06, 1.25, 0.05, bagBrown, -0.32, 2.75, 0.03, 0.02); strap.rotation.z = -0.42; g.add(strap);
  }
  mergeParts(g);
  g.scale.setScalar(scale);
  return { g, legL, legR, armL, armR, head };
}
const OUTFITS = [
  { shirt: M.blue, pants: M.pantsNavy, hair: M.hair },
  { shirt: M.accent, pants: M.pantsSand, hair: M.hairBrown, long: true },
  { shirt: M.white, pants: M.pantsNavy, hair: M.hair, long: true },
  { shirt: M.yellow, pants: M.pantsNavy, hair: M.hairBrown },
  { shirt: M.green, pants: M.pantsSand, hair: M.hair },
  { shirt: M.rug, pants: M.pantsNavy, hair: M.hairBrown, long: true },
];

export function createAboutSlides() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 600);  // 透視鏡頭：有近大遠小，才有身入其境的感覺

  // ---------- 燈光：跟地圖同一套（半球光 + 左前上方的太陽 + 室內反射環境） ----------
  let pmrem = null;
  const hemi = new THREE.HemisphereLight('#ffffff', '#c9cdd6', 0.55);
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 400 });
  sun.shadow.radius = 6; sun.shadow.bias = -0.0005;
  scene.add(hemi, sun, sun.target);

  // ---------- 天空：一顆包住鏡頭的大球，內側由上往下漸層；霧用地平線色，地面遠處自然融進天空 ----------
  const SKY = { day: ['#5fa8ec', '#d9ecfb'], night: ['#16233f', '#36466a'] };   // [頂端, 地平線]
  const INDOOR_BG = new THREE.Color('#f6f5f2'), INDOOR_BG_NIGHT = new THREE.Color('#2a2f38');
  const skyMat = new THREE.ShaderMaterial({                            // 一次性的天空材質（只用在這裡）
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(SKY.day[0]) }, bottom: { value: new THREE.Color(SKY.day[1]) } },
    vertexShader: 'varying float h; void main() { h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main() { gl_FragColor = vec4(mix(bottom, top, pow(clamp(h, 0.0, 1.0), 0.55)), 1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat);
  sky.renderOrder = -1;
  scene.add(sky);
  scene.fog = new THREE.Fog(SKY.day[1], 60, 150);
  scene.background = INDOOR_BG.clone();                                // 天空球看不到的時候（室內）才會露出來

  // ---------- 白雲：兩朵棉花球雲（大小不一的完整圓球擠成一團），慢慢往右飄 ----------
  // 雲用自己的材質：不受霧影響（不然遠處的雲會被洗成淡藍色）
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, emissive: '#ffffff', emissiveIntensity: 0.32, fog: false });
  const clouds = new THREE.Group(); scene.add(clouds);
  const ballGeo = new THREE.SphereGeometry(1, 24, 16);
  [
    { at: [-78, 16, -115], balls: [[-4, 1.1, 1.3], [-1.9, 1.8, 2.0], [0.8, 2.4, 2.5], [3.4, 1.6, 1.8], [5.2, 1.0, 1.1], [-0.4, 0.9, 1.6], [2.2, 0.8, 1.5]] },
    { at: [-8, 13, -125], balls: [[-2.8, 1.0, 1.2], [-0.8, 1.6, 1.8], [1.4, 1.4, 1.5], [3.0, 0.9, 1.0], [0.3, 0.8, 1.3]] },
  ].forEach(({ at, balls }) => {
    const c = new THREE.Group();
    balls.forEach(([x, y, r]) => { const m = new THREE.Mesh(ballGeo, cloudMat); m.position.set(x, y, 0); m.scale.set(r, r, r * 0.7); c.add(m); });   // 前後稍微薄一點
    c.position.set(...at); c.scale.setScalar(1.8); c.userData.baseX = at[0];
    clouds.add(c);
  });
  const CLOUD_SPEED = 1.2;

  // ---------- 遠山：跟其他物件一樣的圓潤公仔質感（圓頂山峰、霧面塑膠，不加頂蓋），前後兩排、越遠越淡 ----------
  // 不吃霧（不然會被洗成跟天空同色），改用比較淡的顏色做出遠近
  const mountains = new THREE.Group(); scene.add(mountains);
  const peakGeo = (() => {                                             // 圓頂山形：底部寬、往上收，山頂圓圓的（旋轉曲線做出來）
    const pts = [];
    for (let i = 0; i <= 16; i++) { const k = i / 16; pts.push(new THREE.Vector2(Math.max(0.001, 1 - Math.pow(k, 1.6)) * (1 - 0.15 * k), k)); }
    pts.push(new THREE.Vector2(0, 1));
    return new THREE.LatheGeometry(pts, 40);
  })();
  const mtnMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, fog: false });
  const RANGES = [
    { z: -165, mat: mtnMat('#a9cfae'), peaks: [[-150, 26, 30], [-105, 34, 36], [-60, 24, 28], [-15, 38, 40], [35, 28, 32], [80, 36, 38], [130, 25, 30]] },   // 後排：淡、高
    { z: -135, mat: mtnMat('#86bf86'), peaks: [[-125, 18, 26], [-80, 22, 28], [-38, 16, 22], [10, 20, 26], [58, 17, 24], [102, 21, 28], [145, 16, 22]] },   // 前排：綠一點、矮
  ];
  RANGES.forEach(({ z, mat, peaks }) => peaks.forEach(([x, h, r]) => {
    h *= 0.62;                                                         // 整體壓低：當背景襯托，不搶前面的建築
    const m = new THREE.Mesh(peakGeo, mat); m.scale.set(r, h, r * 0.7); m.position.set(x, -0.5, z); mountains.add(m);
  }));                                             // 每秒往右飄約 1.2 單位：看得出在動，但很慢

  // ---------- 地面：草地 + 中央廣場 + 人行道 + 道路 ----------
  const flat = (w, d, mat, x, z, y = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m;
  };
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(220, 64), M.grass);
  lawn.rotation.x = -Math.PI / 2; lawn.position.y = -0.03; lawn.receiveShadow = true; scene.add(lawn);
  flat(15, 13, M.plazaFloor, 0, 0.5, -0.01);                           // 大樓前的廣場
  flat(140, 4, M.sidewalk, 0, 9.4, -0.015);                            // 人行道
  flat(140, 5, M.road, 0, 13.9, -0.02);                                // 道路
  for (let i = -12; i <= 12; i++) flat(1.6, 0.18, M.lane, i * 4.5, 13.9, -0.01);   // 道路虛線
  flat(2.4, 5, M.plazaFloor, -1.7, 9.4, -0.012);                       // 通往大門的步道

  // ---------- 開場：大學 + 周圍的公園綠植 ----------
  const uni = buildUniversity();
  uni.root.children[0].visible = false;                               // 不要地基，站在廣場上
  uni.root.position.set(0, 0, -0.5);
  scene.add(uni.root);
  const setUniOpacity = fadeable(uni.root);
  const parks = new THREE.Group(); scene.add(parks);
  const pA = buildPlazaA(); pA.root.position.set(-12.5, 0, 1); parks.add(pA.root);
  const pB = buildPlazaB(); pB.root.position.set(12.5, 0, 1); parks.add(pB.root);
  [[-7.5, -6, 1.3], [7.5, -6.5, 1.4], [-19, -7, 1.2], [19, -6, 1.3], [-25, 3, 1.1], [25, 2, 1.2], [-7, 6.5, 0.9], [5, 6.5, 0.9],
   [-14, -12, 1.4], [14, -12, 1.3], [-30, -6, 1.2], [30, -8, 1.3]].forEach(([x, z, s]) => { const g = tree(s); g.position.set(x, 0, z); parks.add(g); });
  const setParksOpacity = fadeable(parks);

  // ---------- 新大樓（同一個位置一塊一塊組起來） ----------
  const tw = buildTower();
  tw.root.children[0].visible = false;
  scene.add(tw.root);
  const towerPieces = piecesOf(tw.items);
  const DOOR = V(-0.2 - 1.5, 0, -0.7 + 2.13);                          // 大樓玻璃大門的位置（取自 tower.js 的 CX、DX、FZ）

  // ---------- 大樓落地後：商家等場景落下（取代公園綠植） ----------
  const town = [];
  const place = (built, x, z, delay) => { built.root.position.set(x, 0, z); scene.add(built.root); town.push({ g: built.root, delay }); };
  place(buildShop(), -12.5, 1, 0.0);
  place(buildExchange(), 12.5, 1, 0.15);
  place(buildCowork(), -13, -11.5, 0.3);
  place(buildShop(), 13, -11.5, 0.45);
  place(buildPlazaB(), -25, 0, 0.6);
  place(buildShop(), 25.5, 0, 0.75);
  place(buildOffice(), 0, -15, 0.9);
  // 後排：再多一條街的店家、共創空間和公園，大樓後面不再空蕩蕩（越後面越晚落下，像城市一路往後長出來）
  flat(140, 3.2, M.road, 0, -22.5, -0.02);                             // 後街
  for (let i = -12; i <= 12; i++) flat(1.6, 0.18, M.lane, i * 4.5, -22.5, -0.01);
  place(buildPlazaA(), -26, -13, 0.95);
  place(buildExchange(), 26, -13, 1.0);
  place(buildShop(), -24, -30, 1.15);
  place(buildCowork(), -11, -30, 1.25);
  place(buildPlazaB(), 2, -30, 1.35);
  place(buildShop(), 14.5, -30, 1.45);
  place(buildOffice(), 28, -30, 1.55);
  place(buildExchange(), -18, -43, 1.7);
  place(buildShop(), -5, -43, 1.78);
  place(buildCowork(), 8, -43, 1.86);
  place(buildPlazaA(), 21, -43, 1.94);
  [[-32, -21], [-19, -19.5], [-6, -19.5], [7, -19.5], [20, -19.5], [33, -21], [-31, -37], [-12, -37], [9, -37], [31, -37], [-28, -50], [0, -51], [27, -50]]
    .forEach(([x, z], i) => { const g = tree(1.1 + (i % 3) * 0.15); g.position.set(x, 0, z); scene.add(g); town.push({ g, delay: 1.2 + i * 0.05 }); });   // 街道兩旁和後面的樹
  [-21, -14, -7, 6, 13, 20].forEach((x, i) => {                        // 人行道上的路燈
    const g = new THREE.Group(); g.add(lamp(2.8)); g.position.set(x, 0, 8.2); scene.add(g); town.push({ g, delay: 1.0 + i * 0.06 });
  });
  [-17.5, -10.5, 9.5, 16.5].forEach((x, i) => {                        // 行道樹
    const g = tree(0.85); g.position.set(x, 0, 8.4); scene.add(g); town.push({ g, delay: 1.1 + i * 0.06 });
  });

  // ---------- 02：師生慢慢走進大門（身高約 1.75，比大門 2.25 矮） ----------
  const WALK_SCALE = 0.38, WALK_SPEED = 1.1;
  const ROUTES = [[-9, 9.2, 0.3], [6.5, 9.6, 1.1], [-4, 12.2, 2.0], [9.5, 8.8, 2.9], [-12, 8.6, 3.7], [2.5, 12.6, 4.6], [-6.5, 9.8, 5.6]];   // [起點 x, z, 出發時間]
  const walkers = ROUTES.map(([x, z, delay], i) => {
    const p = personIllus(OUTFITS[i % OUTFITS.length], WALK_SCALE);
    scene.add(p.g);
    const off = ((i % 3) - 1) * 0.35;                                  // 進門時稍微左右錯開
    const pts = [V(x, 0, z), V(DOOR.x + off * 2, 0, 7.4), V(DOOR.x + off, 0, DOOR.z + 0.2)];
    const segs = [pts[0].distanceTo(pts[1]), pts[1].distanceTo(pts[2])];
    return { ...p, pts, segs, total: segs[0] + segs[1], delay, phase: i, setOp: fadeable(p.g, { depthPrepass: false }) };
  });
  const tmpV = new THREE.Vector3();
  function updateWalkers(t) {
    for (const w of walkers) {
      const d0 = (t - w.delay) * WALK_SPEED;
      if (d0 <= 0 || d0 >= w.total) { w.g.visible = false; continue; }
      let d = d0, k = 0;
      if (d > w.segs[0]) { d -= w.segs[0]; k = 1; }
      const a = w.pts[k], b = w.pts[k + 1];
      w.g.position.copy(tmpV.lerpVectors(a, b, d / w.segs[k]));
      w.g.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      w.setOp(Math.min(smooth(d0 / WALK_SPEED / 1.0), smooth((w.total - d0) / 1.2)));   // 出現時淡入約 1 秒，進門前淡出
      const sw = Math.sin(d0 * 3.2 + w.phase);                          // 走路時手腳擺動
      w.legL.rotation.x = sw * 0.4; w.legR.rotation.x = -sw * 0.4;
      w.armL.rotation.x = -sw * 0.3; w.armR.rotation.x = sw * 0.3;
    }
  }

  // ---------- 03：大樓內的研究空間（放在很遠的地方，跟戶外互不干擾） ----------
  const IX = 400;
  const office = buildOffice(); office.root.position.set(IX, 0, 0); scene.add(office.root);
  const lab = new THREE.Group(); lab.position.set(IX, 0, 0); scene.add(lab);
  {
    const rack = new THREE.Group();                                    // 伺服器機櫃
    rack.add(box(1.3, 3.4, 1.1, M.dark, 0, 1.7, 0, 0.1));
    for (let i = 0; i < 7; i++) rack.add(box(0.9, 0.06, 0.03, M.lampGlow, 0, 0.6 + i * 0.4, 0.56, 0.01));
    rack.position.set(-3.9, 0, -3.6); lab.add(rack);
    const bench = new THREE.Group();                                   // 實驗桌 + 儀器
    bench.add(box(2.6, 0.14, 1.2, M.white, 0, 1.75, 0, 0.05));
    [[-1.15, -0.5], [1.15, -0.5], [-1.15, 0.5], [1.15, 0.5]].forEach(([x, z]) => bench.add(box(0.12, 1.7, 0.12, M.metal, x, 0.85, z, 0.04)));
    bench.add(box(0.9, 0.7, 0.7, M.blue, -0.6, 2.17, 0, 0.12));
    bench.add(box(0.5, 0.06, 0.03, M.lampGlow, -0.6, 2.3, 0.36, 0.01));
    bench.add(cyl(0.12, 0.16, 0.9, M.white, 0.6, 2.27, 0, 16));
    bench.add(box(0.5, 0.12, 0.5, M.white, 0.6, 1.88, 0, 0.04));
    bench.position.set(3.4, 0, -2.6); lab.add(bench);
  }
  // 握手的兩個人（室內用地圖家具的比例 0.8），面對面站好，右手剛好在同一個位置
  const IN_SCALE = 0.8, HX = IX + 1.4, HZ = 2.2, REACH = 0.66, SIDE = 0.52 * IN_SCALE;
  const student = personIllus(OUTFITS[0], IN_SCALE), partner = personIllus({ shirt: M.white, pants: M.dark, hair: M.hairBrown }, IN_SCALE);
  student.g.position.set(HX - REACH, 0, HZ + SIDE); student.g.rotation.y = Math.PI / 2;
  partner.g.position.set(HX + REACH, 0, HZ - SIDE); partner.g.rotation.y = -Math.PI / 2;
  scene.add(student.g, partner.g);
  const notes = [];                                                    // 握手之後，白板上一張張冒出便利貼
  [[0.2, 3.5, M.yellow], [-0.5, 2.0, M.accent], [1.5, 1.9, M.green], [-1.4, 2.5, M.yellow], [0.9, 2.7, M.accent], [-0.2, 2.75, M.blue]].forEach(([x, y, mat], i) => {
    const n = box(0.5, 0.5, 0.04, mat, IX - 1.6 + x, y, -4.38, 0.02);
    scene.add(n); notes.push({ n, delay: 3.4 + i * 0.15 });
  });

  // ---------- 鏡頭關鍵影格 ----------
  const SHOTS = [
    // 01：看到大學和兩側公園 → 新大樓落下時鏡頭微微抬高 → 換成街景時稍微退後
    // 開場拉近：大學建築佔畫面更大；換成街景時只稍微退後，看得到大樓後面一路長出來的街區
    [{ t: 0, pos: V(3.5, 5.4, 18), look: V(0, 2.6, -0.5) }, { t: 3.6, pos: V(4, 6.8, 22), look: V(0, 5.2, 0) }, { t: 7.2, pos: V(5.5, 9, 27), look: V(-0.5, 4.8, -6) }],
    // 02：慢慢往大門推近，看著師生走進去
    [{ t: 0, pos: V(5.5, 9, 27), look: V(-0.5, 4.8, -6) }, { t: 3, pos: V(8, 3.6, 24), look: V(-1.5, 2.4, 1) }, { t: 12, pos: V(4.5, 2.4, 15), look: V(-1.7, 1.6, 1.5) }],
    // 03：穿過大門（之後切到室內）
    [{ t: 0, pos: V(4.5, 2.4, 15), look: V(-1.7, 1.6, 1.5) }, { t: 0.9, pos: V(DOOR.x + 0.6, 1.4, 6.5), look: V(DOOR.x, 1.1, 0) }, { t: 1.4, pos: V(DOOR.x, 1.1, 2.7), look: V(DOOR.x, 1.1, -4) }],
  ];
  const INTERIOR = [{ t: 1.4, pos: V(IX + 8.6, 3.2, 9.6), look: V(IX + 0.6, 2.4, 0.2) }, { t: 8, pos: V(IX + 6.8, 2.9, 9.4), look: V(IX + 0.8, 2.6, 0.4) }];
  const SWAP = ABOUT_TIMING.swap;
  const camState = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  function camAt(keys, t) {
    t = Math.min(Math.max(t, keys[0].t), keys.at(-1).t);
    let i = 0; while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const a = keys[i], b = keys[i + 1], k = smooth((t - a.t) / (b.t - a.t));
    camState.pos.lerpVectors(a.pos, b.pos, k); camState.look.lerpVectors(a.look, b.look, k);
  }

  let night = 0;
  const tmpC = new THREE.Color();
  // 直式畫面（手機、直式平板）：畫面很窄，原本的鏡頭左右會被裁掉、看起來貼很近
  // → 鏡頭視角放寬、整體往後退一點；03 室內把握手的兩個人放到畫面正中間
  let portrait = false;
  const PORTRAIT_BACK = 1.25;                                          // 往後退 25%
  const HANDSHAKE = V(HX, 2.0, HZ);

  // ---------- 每幀更新：畫面 = f(第幾步, 播了幾秒) ----------
  function update(step, t) {
    const T = [step > 0 ? 99 : t, step > 1 ? 99 : step === 1 ? t : -1, step === 2 ? t : -1];   // 每一步各自的時間（之前的步驟 = 已播完）
    const t1 = Math.max(T[0], 0);
    // 01：大學淡出（1.0～2.0 秒）→ 新大樓一塊塊落下（1.8～3.9 秒）→ 公園綠植淡出（4.2～5.0 秒）→ 商家等場景落下（4.8～6.8 秒）
    setUniOpacity(1 - smooth((t1 - 1.0) / 1.0));
    uni.root.position.y = -0.4 * smooth((t1 - 1.0) / 1.0);
    dropPieces(towerPieces, t1 - 1.8, { spread: 1.4, dur: 0.7, drop: 12 });
    setParksOpacity(1 - smooth((t1 - 4.2) / 0.8));
    town.forEach(s => dropGroup(s.g, t1 - 4.8, s.delay));
    // 02：師生慢慢走進大門
    updateWalkers(T[1]);
    // 03：先站著停兩秒 → 伸手握手、上下搖兩下 → 白板冒出便利貼
    const t3 = T[2] - SWAP;
    const reach = smooth((t3 - 2.0) / 0.5);
    const shake = t3 > 2.5 && t3 < 3.5 ? Math.sin((t3 - 2.5) * 12) * 0.1 : 0;
    [student, partner].forEach(p => { p.armR.rotation.x = -1.0 * reach + shake; });
    notes.forEach(o => { const k = clamp01((t3 - o.delay) / 0.35); o.n.visible = k > 0; o.n.scale.setScalar(k ? 0.4 + 0.6 * smooth(k) : 0.001); });

    // 鏡頭
    const inside = step === 2 && t >= SWAP;
    camAt(inside ? INTERIOR : SHOTS[step], t);
    if (portrait) {
      if (inside) camState.look.lerp(HANDSHAKE, 0.85);                  // 握手的兩個人在畫面中間
      camState.pos.sub(camState.look).multiplyScalar(PORTRAIT_BACK).add(camState.look);
    }
    camera.position.copy(camState.pos); camera.lookAt(camState.look);
    // 太靠近鏡頭的路人先隱藏（不然會擋住畫面，或鏡頭穿過人的身體）
    walkers.forEach(w => { if (w.g.visible && w.g.position.distanceTo(camera.position) < (step === 2 ? 7 : 3.5)) w.g.visible = false; });
    // 陰影範圍跟著鏡頭走
    sun.target.position.copy(camState.look);
    sun.position.copy(camState.look).addScaledVector(SUN_DIR, 80);
    // 天空跟著鏡頭（永遠包住鏡頭）；進到室內就不顯示藍天白雲，背景回到底色
    sky.visible = clouds.visible = mountains.visible = !inside;
    sky.position.copy(camera.position);
    scene.fog.color.copy(inside ? scene.background : skyMat.uniforms.bottom.value);
    const drift = performance.now() / 1000 * CLOUD_SPEED;
    clouds.children.forEach(c => { c.position.x = ((c.userData.baseX + drift + 110) % 220 + 220) % 220 - 110; });   // 飄出右邊就從左邊再進來
    // 穿過大門那一下的白光（0～1），由 hero-map 疊一層白色畫面
    return { flash: step === 2 ? Math.max(0, 1 - Math.abs(t - SWAP) / 0.3) : 0, inside };
  }

  return {
    scene, camera,
    update,
    // 視窗大小：shiftX = 主體往右推的像素（左邊留給文字卡片），shiftY = 往下推的像素（手機版卡片在下方時用）
    setView(w, h, { shiftX = 0, shiftY = 0 } = {}) {
      camera.aspect = w / h;
      portrait = camera.aspect < 1;
      // 直式畫面：讓左右至少看得到約 40 度（垂直視角最多放寬到 70 度，再大會變形）
      camera.fov = portrait ? THREE.MathUtils.clamp(2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(20)) / camera.aspect)), 38, 70) : 38;
      camera.setViewOffset(w, h, -shiftX, -shiftY, w, h);
      camera.updateProjectionMatrix();
    },
    // 夜晚：0 = 白天、1 = 夜晚。窗戶、路燈等發光由地圖原本的夜晚模式調共用材質，這裡只處理天空、雲和燈光
    setNight(k) {
      night = k;
      skyMat.uniforms.top.value.set(SKY.day[0]).lerp(tmpC.set(SKY.night[0]), k);
      skyMat.uniforms.bottom.value.set(SKY.day[1]).lerp(tmpC.set(SKY.night[1]), k);
      scene.background.copy(INDOOR_BG).lerp(INDOOR_BG_NIGHT, k);
      cloudMat.color.set('#ffffff').lerp(tmpC.set('#8a96b0'), k);
      cloudMat.emissiveIntensity = 0.32 * (1 - k * 0.8);
      hemi.intensity = 0.55 * (1 - k * 0.55);
      sun.intensity = 2.2 * (1 - k * 0.75);
    },
    // 室內反射環境：要用 renderer 才能產生，第一次畫之前呼叫一次
    init(renderer) {
      if (pmrem) return;
      pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    },
  };
}
