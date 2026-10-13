// 共用材質庫：所有場景只能從這裡取材質，不可在場景檔內自行 new 材質（例外見 SPEC.md）
// 改這裡的顏色 = 全站同步
import * as THREE from 'three';

// 霧面塑膠質感：本專案唯一的基礎材質
export const plastic = (color, extra = {}) => new THREE.MeshPhysicalMaterial({
  color, roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.45, ...extra,
});

export const M = {
  // ---- 場景物件（來自辦公研發空間） ----
  base:    plastic('#e4e4e6'),                                   // 場景地基
  wall:    plastic('#f3f3f4'),                                   // 室內牆面
  white:   plastic('#fbfbfb'),                                   // 白色家具、外殼
  rug:     plastic('#6fb2f0', { roughness: 0.9, clearcoat: 0 }), // 地毯
  wood:    plastic('#e2b273', { roughness: 0.7 }),               // 木紋
  blue:    plastic('#1f6fd6', { side: THREE.DoubleSide }),       // 主色・藍（雙面：中空物件如筆筒要用）
  accent:  plastic('#fb5b1a'),                                   // 點綴・橘（品牌色）
  yellow:  plastic('#f2b632'),                                   // 點綴・黃
  green:   plastic('#4bb04f'),                                   // 植物
  dark:    plastic('#2b2f36', { roughness: 0.4 }),               // 深色：螢幕框、椅腳
  keybase: plastic('#dfe2e7'),                                   // 鍵盤底座（比按鍵深一階）
  screen:  plastic('#dfe8f2', { roughness: 0.2, clearcoat: 0.8 }),
  line:    plastic('#c9ccd2'),                                   // 細線、縫隙、文字線
  glass:   plastic('#cfe6fb', { transmission: 0.6, roughness: 0.15, thickness: 0.2 }),

  // ---- 園區地圖 ----
  road:     plastic('#c4c8cf', { roughness: 0.9, clearcoat: 0 }),   // 道路
  sidewalk: plastic('#f2f0eb', { roughness: 0.8, clearcoat: 0.1 }), // 街區人行道
  lane:     plastic('#ffffff', { roughness: 0.9, clearcoat: 0 }),   // 道路標線
  grass:    plastic('#8fd16a', { roughness: 0.85, clearcoat: 0 }),  // 草地
  shelfWood: plastic('#a8754a', { roughness: 0.7 }),            // 書櫃（比 wood 深、比大學外牆淺的咖啡色）
  retroShell:   plastic('#e6dac5', { roughness: 0.7, clearcoat: 0.15 }),   // 廣場復古電腦：米色外殼、鍵帽
  retroShellDk: plastic('#cfc1a8', { roughness: 0.75, clearcoat: 0.1 }),   // 復古電腦：螢幕框、散熱孔、底座（比外殼深一階）
  crt:          plastic('#26352b', { roughness: 0.12, clearcoat: 1, emissive: '#4f8a5c', emissiveIntensity: 0.12 }),   // 復古電腦：映像管螢幕（之後放幻燈片）
  parkLawn: plastic('#3f8535', { roughness: 0.85, clearcoat: 0 }),  // 中央大綠地的底（比 grass 深，讓畫面中心有份量）
  treeTop:  plastic('#4bb04f'),                                       // 樹冠
  trunk:    plastic('#b98a5c', { roughness: 0.8 }),                   // 樹幹
  facade:   plastic('#f6f4ef'),                                       // 建築外牆
  window:   plastic('#7fb6ea', { roughness: 0.25, clearcoat: 0.9 }),  // 建築玻璃窗帶
  path:     plastic('#e8e2d6', { roughness: 0.85, clearcoat: 0 }), // 聚落步道
  curb:     plastic('#e9e6df', { roughness: 0.8, clearcoat: 0.1 }),  // 街區邊緣路緣石
  lampBulb: plastic('#fffaf0', { emissive: '#ffd58a', emissiveIntensity: 0 }), // 地圖路燈燈泡（夜晚模式才發光）
  cloud:    plastic('#ffffff', { roughness: 0.45, clearcoat: 0.5, emissive: '#ffffff', emissiveIntensity: 0.12 }), // 對話雲（微微自發光，夜晚也看得清楚）
  cloudDot: plastic('#8e96a3', { roughness: 0.4 }),                     // 對話雲裡「輸入中」的三個點
  clockFace: plastic('#ffffff', { emissive: '#fff4dc', emissiveIntensity: 0 }),  // 公園時鐘鐘面（夜晚發光，見檔案底部的 userData.night）
  stone:    plastic('#d6d1c7', { roughness: 0.8, clearcoat: 0.1, side: THREE.DoubleSide }), // 雕像、噴水池石材（雙面：旋轉成形的盆內外都要看得到）
  water:     plastic('#3fa6e6', { roughness: 0.1, clearcoat: 1 }),    // 噴水池水面（不透明，避免移動鏡頭時破圖）
  waterLight: plastic('#a9dcf8', { roughness: 0.15, clearcoat: 1 }),  // 噴出的水柱、流下的水簾
  brandSign: plastic('#fb5b1a', { emissive: '#ff6a2a', emissiveIntensity: 0 }), // CNRD 立體字（夜晚發光）

  // ---- 人物 ----
  skin:      plastic('#f3cfb1', { roughness: 0.6 }),
  hair:      plastic('#3b2a22', { roughness: 0.6 }),
  hairBrown: plastic('#7a5236', { roughness: 0.6 }),
  pantsNavy: plastic('#2f3b52', { roughness: 0.7 }),
  pantsSand: plastic('#cdb48e', { roughness: 0.7 }),

  // ---- 動物 ----
  furDog:   plastic('#d9a066', { roughness: 0.75, clearcoat: 0.1 }),  // 柴犬色小狗
  furDogDk: plastic('#a8713f', { roughness: 0.75, clearcoat: 0.1 }),  // 小狗耳朵
  furCat:   plastic('#8e949c', { roughness: 0.75, clearcoat: 0.1 }),  // 灰色小貓
  cream:    plastic('#fbf3e6', { roughness: 0.75, clearcoat: 0.1 }),  // 口鼻、胸口白毛

  // ---- 灰盒（尚未建模的佔位，正式模型完成後就不再使用） ----
  clay:     plastic('#d9d5ce', { roughness: 0.8, clearcoat: 0 }),
  clayDark: plastic('#c4bfb6', { roughness: 0.8, clearcoat: 0 }),
};

// 夜晚發光標記：userData.night = [白天, 夜晚] 的發光強度，hero-map 的夜晚模式會自動在兩者之間切換
M.clockFace.userData.night = [0, 1.1];

// ---- 場景新增（建模 session 只能在這個區塊新增材質，不可修改上方既有材質） ----
// 格式：M.xxx = plastic('#色碼');   // 用在哪個場景、什麼物件
M.sage    = plastic('#9cc59a');                                  // cowork：鼠尾草綠討論椅
M.rugSand = plastic('#efe3cf', { roughness: 0.9, clearcoat: 0 }); // cowork：暖沙色圓形地毯
M.rugBlue = plastic('#3d86dc', { roughness: 0.9, clearcoat: 0 }); // exchange：沙發區藍色地毯
M.glassPane = plastic('#d6ebfb', { transparent: true, opacity: 0.06, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.2, depthWrite: false }); // exchange：玻璃牆（很通透 + 環境光澤，不寫入深度，避免擋住室內）
M.glassGlint = plastic('#ffffff', { transparent: true, opacity: 0.32, roughness: 0.1, clearcoat: 0, depthWrite: false, side: THREE.DoubleSide }); // exchange：玻璃上的斜向反光帶
M.metal   = plastic('#b9c0ca', { roughness: 0.3, metalness: 0.5 }); // exchange：玻璃屋金屬框
M.shopWall = plastic('#f1c9a2');                                  // shop：商店建築外牆（暖奶油色）
M.apricot  = plastic('#f5832a');                                  // shop：大店面的櫥窗框、側牆、橘色椅子
M.paving   = plastic('#e58f72', { roughness: 0.85, clearcoat: 0.1 }); // shop：粉色系人行道地磚
M.shopGlow = plastic('#ffe2ad', { emissive: '#ffc970', emissiveIntensity: 0.35, roughness: 0.3 }); // shop：亮燈的櫥窗（暖色室內光）
M.lampGlow = plastic('#fff6dc', { emissive: '#ffe2a0', emissiveIntensity: 0.7 }); // shop：路燈燈罩
M.plazaStone = plastic('#e8cba8', { roughness: 0.75, clearcoat: 0.1 }); // plaza-a：廣場石材（台階、花台）
M.plazaFloor = plastic('#f1dabd', { roughness: 0.8, clearcoat: 0.1 });  // plaza-a：下沉廣場中心地面
M.plazaMint  = plastic('#8ed2ae', { roughness: 0.8, clearcoat: 0.1 });  // plaza-a：地基側面薄荷綠
M.plazaLeaf  = plastic('#9fd46a');                                       // plaza-a：樹冠亮面淺綠
M.plazaLawn  = plastic('#5ea83f', { roughness: 0.85, clearcoat: 0 });  // plaza-a：花圃草地（比 M.grass 飽和，避免被燈光洗淡）
M.plazaPink  = plastic('#f39bb9');                                       // plaza-a：花圃小花（粉紅花瓣）
M.plazaBLawn = plastic('#68b02c', { roughness: 0.85, clearcoat: 0 });  // plaza-b：萊姆綠草坪
M.towerGlass   = plastic('#4f9be8', { roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.1 }); // tower：玻璃帷幕
M.towerMullion = plastic('#2f74c4', { roughness: 0.35 });             // tower：直向窗櫺（深藍）
M.towerBand    = plastic('#d9ecfc', { roughness: 0.3, clearcoat: 0.6 }); // tower：每層樓板帶（淺藍白）
M.univStone = plastic('#5f3f2b', { roughness: 0.7, clearcoat: 0.15 }); // university：外牆、柱子、山牆（深咖啡色）
M.univRoof  = plastic('#3f76cc', { roughness: 0.5 });                  // university：藍色平屋頂
M.towerLit  = plastic('#4f9be8', { roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.1, emissive: '#ffd27a', emissiveIntensity: 0 }); // tower：會亮的窗格（白天與 towerGlass 相同；夜晚由地圖調高 emissiveIntensity）
// 夜晚發光標記：userData.night = [白天, 夜晚] 的 emissiveIntensity，由地圖的夜晚模式統一調整
M.towerLit.userData.night  = [0, 1.4];
M.univLit = plastic('#7fb6ea', { roughness: 0.25, clearcoat: 0.9, emissive: '#ffd27a', emissiveIntensity: 0 }); // university：窗玻璃（白天同 M.window；夜晚亮暖黃）
M.univLit.userData.night = [0, 1.3];
M.crt.userData.night = [0.12, 0.9];   // 復古電腦螢幕：夜晚亮起綠光
