# Music Desktop

基于 **Tauri 2 + Vue 3 + Naive UI** 的桌面端在线音乐播放器。

对接 [GD Studio Music API](https://music-api.gdstudio.xyz/api.php)，提供搜索、在线播放、歌词、播放队列，以及系统托盘与桌面歌词/迷你窗，避免网页版必须常开浏览器的问题。

> **声明**：音源 API 仅供学习研究，禁止商用（CC BY-NC 4.0）。本项目不提供任何破解或付费内容。

## 功能

- 多音源搜索（默认网易云，可切换）
- 播放 / 暂停 / 上一首 / 下一首 / 进度 / 音量
- 播放队列、循环模式
- LRC 歌词同步
- 关闭到系统托盘、托盘菜单控制
- 迷你播放器、桌面歌词悬浮窗
- 无需登录
- 单曲下载（可选音质，另存为本地文件）

## 技术栈

- Tauri 2 / Rust
- Vue 3 + TypeScript + Vite
- Pinia / Vue Router
- Naive UI + UnoCSS
- `@iconify/vue`（Remix Icon）

## 开发

前置：Node.js、pnpm、Rust（Windows 还需 WebView2）。

```bash
cd music-desktop
pnpm install
pnpm tauri dev
```

仅前端预览（无托盘/多窗口）：

```bash
pnpm dev
```

## 打包

```bash
pnpm tauri build
```

产物在 `src-tauri/target/release/bundle/`。

## API

基址：`https://music-api.gdstudio.xyz/api.php`

| types  | 说明     |
|--------|----------|
| search | 搜索     |
| url    | 播放地址 |
| pic    | 封面     |
| lyric  | 歌词     |

## 快捷键（主窗口）

| 按键 | 功能 |
|------|------|
| `Space` | 播放 / 暂停 |
| `Ctrl + ←` | 上一首 |
| `Ctrl + →` | 下一首 |

## License

本仓库代码可按需使用；第三方 API 遵循其自身协议。
