// 載入畫面的跑步小人（3D 模型）
// 跟地圖上的插畫公仔同一套造型（新版髮型與五官、敞開外套、直筒褲、厚底鞋），但多了膝蓋和手肘，才跑得像真的：
//   腿：大腿前後擺，小腿在擺盪期往後折（腳跟踢到屁股附近）、著地時打直；手：手肘彎 90 度、跟對側的腳同步前後擺
//   身體：微微前傾，每一步騰空時往上彈一點，骨盆和肩膀反向輕微扭轉
// 網站不直接畫這個模型：用 tools/runner-sprite.html 預先拍成連續動作圖（assets/loader-runner.png），載入畫面一打開就能播
import * as THREE from 'three';
import { M } from './materials.js';
import { box, cyl, ball } from './kit.js';
import { hairNew, faceNew } from './face.js';

export const RUN_HZ = 1.45;                 // 每秒 1.45 個循環 ≈ 每分鐘 174 步（一般慢跑的步頻）

const capsule = (r, len, mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat);

export function createRunner() {
  const coat = M.blue, pants = M.pantsNavy;
  const root = new THREE.Group(); root.rotation.y = Math.PI / 2;            // 面向畫面右邊（往進度條前進的方向跑）
  const pelvis = new THREE.Group(); pelvis.position.y = 1.9; root.add(pelvis);
  const torso = new THREE.Group(); pelvis.add(torso);
  torso.add(box(0.86, 0.36, 0.5, pants, 0, 0.04, 0, 0.16));                                   // 臀部
  torso.add(box(0.74, 1.1, 0.46, M.white, 0, 0.72, 0, 0.18));                                // 內搭
  [-1, 1].forEach(sx => torso.add(box(0.36, 1.16, 0.54, coat, sx * 0.25, 0.7, 0, 0.16)));    // 外套左右片
  const head = new THREE.Group(); head.position.y = 1.3; torso.add(head);
  head.add(box(1.0, 1.06, 0.94, M.skin, 0, 0.6, 0, 0.42));                                   // 臉
  hairNew(head, M.hair, false, 1, 'smooth');                                                 // 新版髮型：側撥瀏海（跟地圖上的人物同一套）
  faceNew(head, M.hair);                                                                     // 新版五官：大眼睛、小鼻子、微笑嘴、耳朵
  // 腳：大腿（髖關節）→ 小腿（膝關節）→ 腳踝＋鞋
  const leg = x => {
    const hip = new THREE.Group(); hip.position.set(x, 0, 0); pelvis.add(hip);
    hip.add(cyl(0.21, 0.21, 0.9, pants, 0, -0.4, 0, 14));
    const knee = new THREE.Group(); knee.position.y = -0.82; hip.add(knee);
    knee.add(cyl(0.2, 0.2, 0.66, pants, 0, -0.3, 0, 14));
    knee.add(cyl(0.15, 0.15, 0.14, M.skin, 0, -0.66, 0, 12));
    knee.add(box(0.44, 0.34, 0.64, M.dark, 0, -0.87, 0.08, 0.14));
    return { hip, knee };
  };
  // 手：上臂（肩關節）→ 前臂＋手（肘關節）
  const arm = sx => {
    const sh = new THREE.Group(); sh.position.set(sx * 0.52, 1.15, 0); torso.add(sh);
    const up = capsule(0.17, 0.32, coat); up.position.y = -0.27; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.56; sh.add(el);
    const fo = capsule(0.16, 0.26, coat); fo.position.y = -0.22; el.add(fo);
    const hand = ball(0.17, M.skin, 0, -0.52, 0.02); hand.scale.set(0.85, 1.15, 0.75); el.add(hand);
    return { sh, el };
  };
  const L = leg(-0.22), R = leg(0.22), AL = arm(-1), AR = arm(1);
  // t：秒。依跑步循環擺好姿勢
  const pose = t => {
    const ph = t * RUN_HZ * Math.PI * 2;
    [[L, AR, ph], [R, AL, ph + Math.PI]].forEach(([lg, am, p]) => {
      const s = Math.sin(p), c = Math.cos(p);
      lg.hip.rotation.x = -0.8 * s + 0.12;                                  // 大腿：往前（負）往後（正）
      lg.knee.rotation.x = 0.2 + 1.5 * Math.pow(Math.max(0, c), 1.4) + 0.25 * Math.max(0, -s);   // 擺盪期往後大折、著地時接近打直
      am.sh.rotation.x = 0.75 * s;                                          // 手跟對側的腳同步：右手配左腳
      am.el.rotation.x = -1.45 - 0.25 * s;                                  // 手肘約 90 度彎
    });
    pelvis.position.y = 1.9 + 0.16 * Math.abs(Math.cos(ph)) - 0.06;        // 每一步騰空時往上彈
    torso.rotation.x = 0.2 + 0.03 * Math.cos(ph * 2);                       // 身體前傾
    head.rotation.x = -0.12;                                                // 頭抬起來看前方
    pelvis.rotation.y = 0.12 * Math.sin(ph);                                // 骨盆隨步伐輕微扭轉
    torso.rotation.y = -0.2 * Math.sin(ph);                                 // 肩膀反向扭轉
  };
  return { root, pose };
}
