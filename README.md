# 金刚经 · 每日读诵共修 Web App / PWA

这是一个不依赖微信小程序账号的移动网页应用。它可以在美国直接使用，也可以把公开网址分享到微信、短信或邮件。用户点开链接即可使用；在 iPhone/Android 浏览器中还可以添加到主屏幕，体验接近小程序 / App。

## 已包含

- 完整《金刚般若波罗蜜经》三十二分（繁体 / 简体）
- 开经偈与附件中的日课附录
- 每日经句
- 读诵计时
- 每日打卡、月历、心得/回向（心得仅保存在本机）
- 连续 7 / 21 / 49 / 108 天徽章
- 每周三 Zoom 共学入口
- 分享按钮（浏览器支持时调用系统分享；否则复制链接）
- PWA：可“添加到主屏幕”
- 离线缓存：首次打开后，大部分功能可离线继续使用
- 每日提醒：可导出一个每天重复的 `.ics` 日历提醒；浏览器打开期间也可使用通知提醒
- 可选 Supabase 共修排行榜：无需中国手机号；终端用户无需注册邮箱或手机号，使用匿名身份

## 最快发布：Netlify / Cloudflare Pages / GitHub Pages

这个项目是纯静态网站，不需要服务器代码。把整个文件夹部署到任意静态网站托管服务即可。

### 方案 A：Netlify Drop（最省事）

1. 解压本项目。
2. 在浏览器搜索 `Netlify Drop` 并打开 Netlify 的拖拽部署页面。
3. 将整个 `diamond-sutra-community-web` 文件夹拖进去。
4. 几十秒后会得到一个 `https://...` 的公开网址。
5. 用手机打开这个网址，点击页面右上角分享按钮；或者直接复制网址发到微信群。

### 方案 B：GitHub Pages

1. 新建一个 GitHub repository。
2. 将本项目全部文件上传到仓库根目录。
3. Repository Settings → Pages → Deploy from a branch → `main` / root。
4. 等 GitHub 生成公开网址后，把网址发到微信即可。

## 在手机上像 App 一样使用

### iPhone

Safari 打开网站 → 分享按钮 → **Add to Home Screen / 添加到主屏幕**。

如果链接是在微信内打开，可先点右上角菜单，选择“在浏览器打开”，再用 Safari 添加到主屏幕。

### Android

Chrome 打开网站 → 浏览器菜单 → **Install app / Add to Home screen**。

## 共修排行榜（可选）

不设置云端时，所有打卡数据只保存在每个人自己的手机浏览器里。若想让共修群看到真实排行榜：

1. 注册一个 Supabase 项目。
2. 在 Supabase SQL Editor 运行 `supabase-schema.sql`。
3. 在 Supabase Authentication 设置中启用 **Anonymous Sign-Ins**。
4. 打开 `config.js`，填写：

```js
supabaseUrl: "https://YOUR_PROJECT.supabase.co",
supabaseAnonKey: "YOUR_ANON_KEY",
```

5. 重新部署网站。

排行榜只同步：共修名、打卡日期、读诵分钟数。**心得 / 回向不会上传。**

## 每日提醒说明

普通网页在完全关闭后，无法像原生 App 那样可靠地每天后台弹通知。因此本版同时提供：

- **添加每日提醒到日历**：会下载一个每日重复的 iCalendar 文件，这是最稳定的方式。
- **浏览器通知**：当网页/PWA正在运行时，可以按设定时间提醒。

如果以后希望做真正的后台 Web Push，也可以再接入 OneSignal、Firebase Cloud Messaging 或自建 push server。

## 文件说明

- `index.html`：入口
- `styles.css`：界面
- `app.js`：打卡 / 阅读 / 分享 / 排行榜逻辑
- `sutra-data.js`：完整经文数据
- `config.js`：Zoom 与可选 Supabase 配置
- `service-worker.js`：PWA 离线缓存
- `manifest.webmanifest`：安装到主屏幕
- `supabase-schema.sql`：共修排行榜数据库结构

## 经文来源

经文数据依据用户提供的中台禅寺《金刚般若波罗蜜经》PDF 版本整理，中文为姚秦三藏法师鸠摩罗什译。正式对外发布前，建议再以原 PDF / 纸本做一次逐字校对。
