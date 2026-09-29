# 金剛經每日讀誦｜簡潔版

這是一個可直接部署到 GitHub Pages 的手機 Web App（PWA）。

## 這一版刻意只保留
- 《金剛經》三十二分全文
- 每日日期
- 今日完整讀誦遍數
- 今日每一分讀了幾次
- 當前一遍已讀到哪些分
- 最近 7 天的完整讀誦遍數
- 手機左右滑動翻頁（沒有上一頁／下一頁箭頭）
- 本地保存，不需要登入、不需要中國手機號
- 可把網址直接分享到微信

## 使用方式
1. 首頁會顯示「今日已完成 X 遍」。
2. 1–32 的格子顯示每一分今天讀誦的次數。
3. 點「開始／繼續讀誦」進入經文。
4. 閱讀時用手指左右滑動翻到上一分／下一分。
5. 每讀完一分，點一次「本分讀完 +1」。
6. 當 32 分都完成一次，系統自動將今日完整遍數 +1。

## GitHub Pages 發布
把本資料夾裡的所有檔案直接上傳到 GitHub repository 的最外層，確保 `index.html` 位於根目錄。

然後：
Settings → Pages → Build and deployment → Deploy from a branch
- Branch: `main`
- Folder: `/(root)`
- Save

如果 repository 名為 `diamond-sutra-community`，網址通常是：
`https://你的GitHub用户名.github.io/diamond-sutra-community/`

## 經文
經文文字依據使用者提供的《金剛般若波羅蜜經》PDF（中台翻譯委員會版本；中文為鳩摩羅什譯本）整理。
