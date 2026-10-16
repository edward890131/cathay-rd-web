// 人物的新版五官與髮型（地圖上的插畫公仔、理念與使命小劇場裡的人物共用）
// ── 髮型：參考圖二、三那對男女，貼頭的薄頭殼＋幾團根部埋進頭殼的髮量，看起來是同一片頭髮
// ── 五官：參考圖一，大大的正圓眼白（兩眼碰在一起）＋往中間靠的小黑眼珠、小鼻子、微笑嘴、耳朵、短平眉
// 座標都是頭部自己的座標（臉：x ±0.5、y 0.07～1.13、z ±0.47）
import * as THREE from 'three';
import { M } from './materials.js';
import { ball } from './kit.js';

// 目前採用：新版髮型（detail）＋新版五官（big）；舊版（classic／dot）的程式還留著，改這裡就能切回去
export const FACE = { hair: 'detail', eyes: 'big' };

// blob：縮放、旋轉過的球（做髮束、眼睛、耳朵用）
export function blob(r, mat, [x, y, z], [sx, sy, sz], [rx = 0, ry = 0, rz = 0] = []) {
  const m = ball(r, mat, x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz); return m;
}

export const HAIR_SHORT = ['smooth', 'cloud'], HAIR_LONG = ['buns', 'bobSmooth'];
// 髮型：kind 沒指定就依 n 輪流；分線方向每個人輪流左右
export function hairNew(head, hair, long, n, kind) {
  kind ??= long ? HAIR_LONG[n % HAIR_LONG.length] : HAIR_SHORT[n % HAIR_SHORT.length];
  const s = n % 2 ? 1 : -1;
  head.add(blob(0.6, hair, [0, 0.97, -0.08], [0.93, 0.74, 0.94]));                      // 貼著頭的薄頭殼，兩側露出耳朵
  switch (kind) {
    case 'smooth':                                                                       // 圖二男生：一大片側撥瀏海越過額頭＋頭頂另一團
      head.add(blob(0.36, hair, [s * 0.14, 1.04, 0.27], [1.35, 0.55, 0.8], [-0.5, 0, s * 0.34]));
      head.add(blob(0.3, hair, [-s * 0.16, 1.16, 0.0], [1.0, 0.5, 1.2], [-0.15, 0, -s * 0.15]));
      break;
    case 'cloud':                                                                        // 圖三男生：額頭一排雲朵般的圓髮團
      [-0.3, -0.1, 0.1, 0.3].forEach((x, i) => head.add(blob(0.18, hair, [x, 1.03 + (i % 2) * 0.04, 0.34 - Math.abs(x) * 0.25], [1.05, 0.9, 0.8])));
      [-0.18, 0.18].forEach(x => head.add(blob(0.18, hair, [x, 1.24, 0.06], [1, 0.75, 1])));
      break;
    case 'buns':                                                                         // 圖二女生：側分瀏海＋頭頂兩側偏後兩顆包包
      head.add(blob(0.3, hair, [s * 0.1, 1.04, 0.22], [1.3, 0.5, 0.78], [-0.45, 0, s * 0.3]));
      [-1, 1].forEach(sx => head.add(blob(0.25, hair, [sx * 0.34, 1.32, -0.2], [1, 0.95, 1])));
      break;
    case 'bobSmooth':                                                                    // 長髮版：側分瀏海，兩側和後面垂到下巴
      head.add(blob(0.32, hair, [s * 0.1, 1.03, 0.22], [1.3, 0.5, 0.78], [-0.45, 0, s * 0.3]));
      [-1, 1].forEach(sx => head.add(blob(0.4, hair, [sx * 0.44, 0.64, -0.1], [0.5, 1.15, 0.98])));
      head.add(blob(0.55, hair, [0, 0.6, -0.26], [1.0, 1.0, 0.72]));
      break;
  }
}

// 五官：眼睛、小鼻子、微笑嘴、耳朵、眉毛（眉毛跟頭髮同色）；glasses：黑框眼鏡（鏡框套住大眼睛）
export function faceNew(head, hair, { glasses = false } = {}) {
  [-1, 1].forEach(sx => {
    head.add(blob(0.16, M.white, [sx * 0.16, 0.56, 0.43], [1, 1, 0.5]));               // 眼白：正圓、很大，兩眼碰在一起
    head.add(blob(0.068, M.dark, [sx * 0.115, 0.56, 0.5], [1, 1, 0.5]));               // 黑眼珠：約眼白的四成大，往中間靠
    head.add(blob(0.13, M.skin, [sx * 0.51, 0.6, 0.02], [0.45, 1, 0.8]));              // 耳朵
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.07, 6, 12), hair);  // 短短的平眉
    brow.rotation.z = Math.PI / 2; brow.position.set(sx * 0.16, 0.81, 0.46); head.add(brow);
  });
  head.add(ball(0.04, M.skin, 0, 0.47, 0.49));                                          // 小鼻子
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.013, 8, 16, Math.PI), M.dark);   // 小小的微笑弧線
  smile.rotation.z = Math.PI; smile.position.set(0, 0.4, 0.47); head.add(smile);
  if (glasses) {
    [-0.17, 0.17].forEach(x => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.024, 8, 24), M.dark); r.position.set(x, 0.56, 0.52); r.castShadow = true; head.add(r); });
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 6), M.dark); bridge.rotation.z = Math.PI / 2; bridge.position.set(0, 0.59, 0.52); head.add(bridge);
  }
}
