import { createApp } from "vue";
import { createPinia } from "pinia";
import "virtual:uno.css";
import "@unocss/reset/tailwind.css";
import "./themes/tokens.css";
import "./themes/layouts.css";
import "./styles/global.css";
import App from "./App.vue";
import { router } from "./router";
import { applySkin, DEFAULT_SKIN_ID } from "./themes/apply";

// 尽早应用皮肤，减少闪白/闪黑（主窗 / 歌词窗 / 迷你窗共用）
function bootSkin() {
  try {
    const raw = localStorage.getItem("music-desktop-settings");
    const id = raw ? (JSON.parse(raw).skinId as string) : DEFAULT_SKIN_ID;
    applySkin(id || DEFAULT_SKIN_ID);
  } catch {
    applySkin(DEFAULT_SKIN_ID);
  }
}
bootSkin();

// 其它窗口改主题时同步（storage 跨窗口）
window.addEventListener("storage", (e) => {
  if (e.key === "music-desktop-settings") bootSkin();
});

// 禁用 WebView 默认右键菜单（桌面应用体验）
window.addEventListener(
  "contextmenu",
  (e) => {
    e.preventDefault();
  },
  { capture: true },
);

const app = createApp(App);

app.config.errorHandler = (err, _instance, info) => {
  console.error("[Music Desktop]", info, err);
};

app.use(createPinia());
app.use(router);
app.mount("#app");
