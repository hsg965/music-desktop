import { createRouter, createWebHashHistory } from "vue-router";
import MainView from "../views/MainView.vue";
import MiniPlayer from "../views/MiniPlayer.vue";
import DesktopLyric from "../views/DesktopLyric.vue";
import ThemeWindow from "../views/ThemeWindow.vue";
import SettingsWindow from "../views/SettingsWindow.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // main / album / playlist 共用主窗口壳；专辑/歌单从搜索进入
    { path: "/", name: "main", component: MainView },
    { path: "/album", name: "album", component: MainView },
    { path: "/playlist", name: "playlist", component: MainView },
    { path: "/mini", name: "mini", component: MiniPlayer },
    { path: "/lyric", name: "lyric", component: DesktopLyric },
    { path: "/theme", name: "theme", component: ThemeWindow },
    { path: "/settings", name: "settings", component: SettingsWindow },
  ],
});
