# Music Desktop

感谢[GD音乐台(https://music.gdstudio.xyz)](https://music.gdstudio.xyz) 提供的 API，主要解决网页版必须常开浏览器，不支持系统托盘与桌面歌词/迷你窗的问题

基于 **Tauri 2 + Vue 3 + Naive UI** 的桌面端在线音乐播放器。

对接 [GD Studio Music API](https://music-api.gdstudio.xyz/api.php)，提供搜索、在线播放、歌词、播放队列，以及系统托盘与桌面歌词/迷你窗，避免网页版必须常开浏览器的问题。

> **免责声明**：音源 API 仅供学习研究，禁止商用（CC BY-NC 4.0）。本项目不提供任何破解或付费内容，资源来自网络，仅限本人学习参考，严禁下载、传播或商用，如侵权请与我联系删除。继续使用将视为同意本声明

## 功能

- 多音源搜索（默认网易云，可切换）
- 播放 / 暂停 / 上一首 / 下一首 / 进度 / 音量
- 播放队列、循环模式
- LRC 歌词同步
- 关闭到系统托盘、托盘菜单控制
- 迷你播放器、桌面歌词悬浮窗
- 无需登录
- 单曲下载（可选音质，另存为本地文件）
- **多套主题皮肤**（含丰富亮色），独立主题窗口切换；标题栏调色盘入口

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

### 本地打包

```bash
pnpm tauri build
# 或
pnpm tauri:build
```

产物在 `src-tauri/target/release/bundle/`。

### GitHub Actions 自动发布（Windows + macOS）

仓库已配置 [`.github/workflows/release.yml`](.github/workflows/release.yml)：

1. **上传代码到 GitHub**（开启 Actions 权限）
2. **改版本号**（两处保持一致）：
   - `package.json` → `"version"`
   - `src-tauri/tauri.conf.json` → `"version"`
   - （可选）`src-tauri/Cargo.toml` → `version`
3. **打标签并推送**：

```bash
git add .
git commit -m "release: v0.1.0"
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

4. 打开仓库 **Actions** 查看 `Release` 工作流
5. 构建完成后到 **Releases** 下载：
   - Windows：`.exe` / `.msi`
   - macOS ARM：`aarch64` 的 `.dmg`
   - macOS Intel：`x64` 的 `.dmg`

也可在 **Actions → Release → Run workflow** 手动触发（可勾选草稿 Release）。

> 首次使用请确认：仓库 **Settings → Actions → General** 中允许读写权限（Workflow permissions → Read and write）。

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
