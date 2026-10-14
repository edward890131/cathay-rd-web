// 共用舞台：渲染器、正交相機、燈光、進場動畫、hover
// 單一場景檢視器（scene-viewer.html）與園區地圖（hero-map.html）共用，確保光線與視角完全一致
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// 等角視角方向（全站唯一，不可修改）
export const ISO_DIR = new THREE.Vector3(20, 17, 20).normalize();
// 光源方向：左前上方
export const SUN_DIR = new THREE.Vector3(-6, 14, 9).normalize();

export function createStage({ view = 15, shadowSize = 9, shadowRes = 2048, background = '#f6f5f2', target = [0, 1.2, 0], maxPixelRatio = 2 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxPixelRatio));   // 解析度上限：越低越省效能
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // 正交相機：沒有近大遠小，所有物件透視一致
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 600);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minZoom = 0.5;
  controls.maxZoom = 8;
  controls.maxPolarAngle = Math.PI * 0.42;

  // 燈光
  scene.add(new THREE.HemisphereLight('#ffffff', '#c9cdd6', 0.55));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowRes, shadowRes);
  Object.assign(sun.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, far: 400 });
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  const stage = {
    renderer, scene, camera, controls, sun,
    view,        // 畫面高度可容納的世界單位
    shift: 0,    // 畫面水平偏移（佔畫面寬度比例，正值 = 內容往右）
    shiftY: 0,   // 畫面垂直偏移（佔畫面高度比例，正值 = 內容往上；直式螢幕把主體推到卡片上方用）
    target: new THREE.Vector3(...target),
    // 依 view / shift 更新相機視野
    frame() {
      const a = innerWidth / innerHeight;
      const hh = this.view / 2, hw = hh * a;
      const s = this.shift * 2 * hw, sy = this.shiftY * 2 * hh;
      Object.assign(camera, { left: -hw - s, right: hw - s, top: hh - sy, bottom: -hh - sy });
      camera.updateProjectionMatrix();
    },
    // 把相機擺到 target 的等角方向上（會重設旋轉）
    lookAt(t = this.target) {
      this.target.copy(t);
      controls.target.copy(t);
      camera.position.copy(t).addScaledVector(ISO_DIR, 120);
      camera.lookAt(t);
      sun.target.position.copy(t);
      sun.position.copy(t).addScaledVector(SUN_DIR, 80);
    },
  };
  stage.lookAt();
  stage.frame();
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); stage.frame(); });
  return stage;
}

// 彈跳緩動：落地後輕輕回彈
export function easeOutBounce(x) {
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

// 進場掉落 + hover 浮起
// items：每個 group 的 userData 需有 { delay, baseY, hoverable }
// 減速落下：一開始快、落地前慢慢減速，輕輕停住（不回彈）
export function easeOutCubic(x) { return 1 - (1 - x) ** 3; }

export function createAnimator(stage, items, { drop = 7, dur = 0.65, lift = 0.35 } = {}) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  let start = performance.now();
  let hovered = null;
  let hoverEnabled = true;
  stage.renderer.domElement.addEventListener('pointermove', e => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  });
  stage.renderer.domElement.addEventListener('pointerleave', () => pointer.set(9, 9));
  const findItem = o => { while (o && !o.userData.isItem) o = o.parent; return o; };

  return {
    replay() { start = performance.now(); },
    get elapsed() { return (performance.now() - start) / 1000; },   // 進場動畫開始後經過的秒數
    dur,                                                             // 每個物件的掉落時間
    setHover(on) { hoverEnabled = on; },
    get hovered() { return hovered; },
    update() {
      const t = (performance.now() - start) / 1000;
      hovered = null;
      if (hoverEnabled) {
        raycaster.setFromCamera(pointer, stage.camera);
        const hit = raycaster.intersectObjects(items, true)[0];
        const it = hit && findItem(hit.object);
        if (it && it.userData.hoverable) hovered = it;
      }
      for (const g of items) {
        const u = g.userData;
        u.lift += ((g === hovered ? (u.liftAmount ?? lift) : 0) - u.lift) * 0.15;
        const p = reduceMotion ? 1 : Math.min(Math.max((t - u.delay) / dur, 0), 1);
        g.visible = p > 0;
        g.position.y = (u.baseY ?? 0) + (1 - easeOutCubic(p)) * (u.drop ?? drop) + u.lift;   // 減速落地、不回彈（easeOutBounce 保留給其他地方用）
      }
      stage.renderer.domElement.style.cursor = hovered ? 'pointer' : '';
    },
  };
}
