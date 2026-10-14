# BGM 研究筆記（原型）

## 研究重點

- **自動播放限制：** 瀏覽器不允許頁面一打開就出聲，一定要等使用者點擊或按鍵。所以預設關閉，就算 localStorage 記住「開」，也要等第一次互動才真的播放。
- **淡入淡出：** 用 Web Audio 的 `GainNode`，以 `linearRampToValueAtTime` 慢慢拉音量（原型：淡入 1.5 秒、淡出 0.8 秒），不要直接改數值，會有爆音。
- **分頁隱藏：** 監聽 `visibilitychange`，隱藏時淡出再 `ctx.suspend()`，回來 `resume()` 再淡入。
- **iOS Safari：** 要在點擊事件裡呼叫 `AudioContext.resume()`；切換 App 後 context 可能變成 `interrupted`，回到前景需要再 resume，有些情況還要使用者再點一次。另外 Web Audio 預設會被實體靜音鍵擋住，可設 `navigator.audioSession.type = 'playback'`（iOS 16.4+，原型已加）。真機測試很重要，模擬器重現不了部分問題。
- **檔案格式與大小：** 建議 AAC（.m4a）主檔，加 MP3 備援；循環曲 1 到 2 MB（約 60 到 90 秒、96 到 128 kbps）。無縫循環建議 decode 成 `AudioBuffer` 用 `loop = true`（`<audio loop>` 在部分瀏覽器接縫會有空隙，MP3 因編碼器延遲更明顯，AAC/OGG 較好）。
- **無障礙：** 按鈕用固定 `aria-label` 搭配 `aria-pressed` 表示開關；預設靜音；有鍵盤可操作（原生 button）。音樂不應成為理解內容的必要條件。

參考：[WebKit Bug 263627（iOS 回前景 AudioContext 未恢復）](https://bugs.webkit.org/show_bug.cgi?id=263627)、[PlayCanvas 論壇討論](https://forum.playcanvas.com/t/ios-audio-context-suspended-on-visibility-change/20524)、[Babylon.js 論壇討論](https://forum.babylonjs.com/t/audio-is-not-resuming-to-play-after-visibilitychange-in-iphone-browsers-works-on-android-and-desktop/54164)。

## 候選音樂來源（只列候選，未下載；授權請在下載頁再確認一次）

| 來源 | 網址 | 授權備註 |
|---|---|---|
| OpenGameArt：relax_background1 | https://opengameart.org/content/relaxbackground1 | CC0，約 1.8 MB ogg，作者註明可當選單、城鎮循環 |
| OpenGameArt：Castle Town | https://opengameart.org/content/castle-town | CC0，短曲設計成循環，附 MIDI 與 MuseScore |
| OpenGameArt：JRPG Pack 2 Towns（SubspaceAudio） | https://opengameart.org/node/50854 （頁面號碼待確認） | CC0，約 14 MB 整包，氣氛最接近 JRPG 城鎮 |
| OpenGameArt：town theme 1（Geomancer） | https://opengameart.org/node/73274 （頁面號碼待確認） | CC0，作者希望使用時告知一聲 |
| OpenGameArt：CC0 Calm / Relaxing Music 合集 | https://opengameart.org （搜尋合集名稱） | 合集內多為 CC0 |
| Pixabay Music | https://pixabay.com/music/ | Pixabay Content License，可商用、不需署名，但不是 CC0，且不可單獨轉售 |
| Kevin MacLeod（Incompetech） | https://incompetech.com | CC BY 4.0，需署名 |

注意：上面幾個 OpenGameArt 的 node 編號是搜尋結果對應推測，我沒有逐頁確認，挑曲前請先打開試聽並確認授權。我也沒有聽過這些曲子，循環是否順暢要自己聽。

## 原型做了什麼

- Header 在白天／夜晚切換旁加一顆音符圖示按鈕（同樣是 `.seg.icon-seg` 樣式），關閉時有斜線。手機版跟白天／夜晚一起搬進選單的顯示設定。
- 預設關閉，狀態記在 `localStorage`（key：`cnrd-bgm`，全部包 try/catch）。
- 用 Web Audio 即時合成：96 BPM、C 大調五聲音階，八音盒式旋律、低音、柔和長音，加殘響與回音，主音量 0.2，8 小節循環。
- 淡入淡出、分頁隱藏暫停都已實作。
- 換真實音檔：只要把 `hero-map.html` 裡的 `BGM_FILE` 設成檔案路徑（例如 `assets/bgm.m4a`），音源就改走 `<audio loop>`，其餘邏輯不用動。
- 英文：在 `i18n/en.json` 新增「背景音樂」。

## 本機預覽

```
cd 這個 worktree 資料夾
python3 serve.py
```

打開網址後點右上角音符按鈕。重新整理後若上次是開，要先點一下頁面才會出聲。

## 建議下一步

1. 先聽原型，確認「氣氛」方向對不對（合成音質有限，主要是驗證互動）。
2. 從上面候選挑 2 到 3 首試聽，選一首真實曲目，目標 1 到 2 MB 的 AAC。
3. 換成 AudioBuffer 無縫循環，並在 iOS 真機測靜音鍵、切 App 回來的行為。
4. 決定是否在第一次進站給一個不打擾的提示，以及要不要署名頁（CC BY 曲目需要）。
