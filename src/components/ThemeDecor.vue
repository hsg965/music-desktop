<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "../stores/settings";
import { getSkin } from "../themes/registry";
import type { SkinId } from "../themes/types";

const settings = useSettingsStore();
const skinId = computed(() => settings.skinId as SkinId);
const isLight = computed(() => getSkin(settings.skinId).mode === "light");
</script>

<template>
  <div class="theme-decor" aria-hidden="true">
    <!-- Midnight Violet：星云 + 光球 -->
    <svg
      v-if="skinId === 'midnight-violet'"
      class="decor-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="mv-orb1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#a89bff" stop-opacity="0.55" />
          <stop offset="55%" stop-color="#7c6af7" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#7c6af7" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="mv-orb2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#c4bbff" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#4a3a9a" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="mv-arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8b7cf7" stop-opacity="0" />
          <stop offset="50%" stop-color="#b8a9ff" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#8b7cf7" stop-opacity="0" />
        </linearGradient>
      </defs>
      <circle cx="180" cy="120" r="220" fill="url(#mv-orb1)" />
      <circle cx="1050" cy="160" r="160" fill="url(#mv-orb2)" />
      <circle cx="980" cy="620" r="200" fill="url(#mv-orb1)" opacity="0.5" />
      <path
        d="M100 650 Q400 480 700 620 T1100 500"
        fill="none"
        stroke="url(#mv-arc)"
        stroke-width="2"
      />
      <g fill="#e8e4ff" opacity="0.55">
        <circle cx="320" cy="180" r="1.5" />
        <circle cx="480" cy="90" r="1.2" />
        <circle cx="620" cy="220" r="1.8" />
        <circle cx="760" cy="140" r="1.1" />
        <circle cx="900" cy="280" r="1.4" />
        <circle cx="240" cy="320" r="1.2" />
        <circle cx="540" cy="360" r="1.6" />
        <circle cx="860" cy="420" r="1.3" />
      </g>
      <!-- 装饰音符 -->
      <g transform="translate(980,520)" fill="#9b8cff" opacity="0.35">
        <ellipse cx="0" cy="20" rx="10" ry="7" transform="rotate(-20)" />
        <rect x="6" y="-28" width="3" height="42" rx="1" />
        <path d="M9 -28 Q28 -36 28 -12 Q28 0 14 4" fill="none" stroke="#9b8cff" stroke-width="2.5" />
      </g>
    </svg>

    <!-- Cyber Neon：电路 + 角标 + 扫描 -->
    <svg
      v-else-if="skinId === 'cyber-neon'"
      class="decor-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="cn-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#00e5ff" stop-opacity="0" />
          <stop offset="50%" stop-color="#00e5ff" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#ff2bd6" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="cn-scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00e5ff" stop-opacity="0" />
          <stop offset="50%" stop-color="#00e5ff" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#ff2bd6" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="800" fill="url(#cn-scan)" />
      <!-- 角落括号 -->
      <g fill="none" stroke="#00e5ff" stroke-width="2" opacity="0.7">
        <path d="M40 40 H120 V60 H60 V120 H40 Z" />
        <path d="M1160 40 H1080 V60 H1140 V120 H1160 Z" />
        <path d="M40 760 H120 V740 H60 V680 H40 Z" />
        <path d="M1160 760 H1080 V740 H1140 V680 H1160 Z" stroke="#ff2bd6" />
      </g>
      <!-- 电路路径 -->
      <g fill="none" stroke="url(#cn-line)" stroke-width="1.5">
        <path d="M0 200 H280 L320 240 H520" />
        <path d="M1200 320 H900 L860 360 H640" />
        <path d="M80 700 H300 L340 660 H500 L540 620" stroke="#ff2bd6" opacity="0.7" />
      </g>
      <g fill="#00e5ff">
        <rect x="276" y="196" width="8" height="8" />
        <rect x="516" y="236" width="8" height="8" />
        <rect x="896" y="316" width="8" height="8" fill="#ff2bd6" />
        <rect x="536" y="616" width="8" height="8" fill="#ff2bd6" />
      </g>
      <!-- HUD 标签 -->
      <g font-family="monospace" font-size="11" fill="#00e5ff" opacity="0.45">
        <text x="50" y="160">SYS.AUDIO // ONLINE</text>
        <text x="980" y="700" fill="#ff2bd6">CH:NEON-07</text>
      </g>
    </svg>

    <!-- Vinyl Night：黑胶碟 + 唱臂 -->
    <svg
      v-else-if="skinId === 'vinyl-night'"
      class="decor-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="vn-disc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#2a2018" />
          <stop offset="18%" stop-color="#1a1410" />
          <stop offset="19%" stop-color="#d4a574" stop-opacity="0.35" />
          <stop offset="22%" stop-color="#1a1410" />
          <stop offset="100%" stop-color="#0c0a08" />
        </radialGradient>
        <linearGradient id="vn-warm" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#d4a574" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#d4a574" stop-opacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="980" cy="520" rx="280" ry="280" fill="url(#vn-disc)" opacity="0.9" />
      <!-- 纹路 -->
      <g fill="none" stroke="#3a3028" stroke-width="1" opacity="0.6">
        <circle cx="980" cy="520" r="80" />
        <circle cx="980" cy="520" r="110" />
        <circle cx="980" cy="520" r="145" />
        <circle cx="980" cy="520" r="180" />
        <circle cx="980" cy="520" r="215" />
        <circle cx="980" cy="520" r="250" />
      </g>
      <circle cx="980" cy="520" r="36" fill="#d4a574" opacity="0.85" />
      <circle cx="980" cy="520" r="10" fill="#1a1410" />
      <!-- 唱臂 -->
      <g transform="translate(780,280)" stroke="#c4a070" stroke-width="6" fill="none" opacity="0.75">
        <path d="M0 0 L160 180" stroke-linecap="round" />
        <circle cx="0" cy="0" r="14" fill="#8b5e3c" stroke="none" />
        <path d="M150 168 L175 195 L168 200 L145 175 Z" fill="#d4a574" stroke="none" opacity="0.9" />
      </g>
      <rect x="0" y="500" width="420" height="300" fill="url(#vn-warm)" />
      <!-- 波形装饰 -->
      <path
        d="M60 680 Q100 640 140 680 T220 680 T300 680"
        fill="none"
        stroke="#d4a574"
        stroke-width="2"
        opacity="0.4"
      />
    </svg>

    <!-- Glass Ocean：海浪 + 气泡 -->
    <svg
      v-else-if="skinId === 'glass-ocean'"
      class="decor-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="go-wave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3dd6c6" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#5b8def" stop-opacity="0.08" />
        </linearGradient>
        <linearGradient id="go-wave2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5b8def" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#3dd6c6" stop-opacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M0 520 C150 460 300 580 450 520 C600 460 750 560 900 500 C1050 440 1150 520 1200 480 L1200 800 L0 800 Z"
        fill="url(#go-wave)"
      />
      <path
        d="M0 600 C200 540 350 660 520 600 C700 530 850 640 1000 580 C1100 540 1160 600 1200 580 L1200 800 L0 800 Z"
        fill="url(#go-wave2)"
      />
      <g fill="#a8f0e8" opacity="0.25">
        <circle cx="160" cy="200" r="18" />
        <circle cx="220" cy="260" r="10" />
        <circle cx="980" cy="180" r="22" />
        <circle cx="1040" cy="240" r="12" />
        <circle cx="700" cy="140" r="8" />
        <circle cx="400" cy="300" r="14" />
      </g>
      <g fill="none" stroke="#3dd6c6" stroke-width="1.5" opacity="0.3">
        <circle cx="160" cy="200" r="28" />
        <circle cx="980" cy="180" r="34" />
      </g>
    </svg>

    <!-- Paper Light：纸张层叠 + 墨点 + 便签 -->
    <svg
      v-else-if="skinId === 'paper-light'"
      class="decor-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="pl-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.12" />
        </filter>
      </defs>
      <!-- 背景纸片 -->
      <g filter="url(#pl-shadow)" opacity="0.9">
        <rect
          x="820"
          y="80"
          width="280"
          height="200"
          rx="4"
          fill="#fffdf8"
          transform="rotate(8 960 180)"
          stroke="#e0d8cc"
        />
        <rect
          x="880"
          y="480"
          width="240"
          height="180"
          rx="4"
          fill="#f7f2e8"
          transform="rotate(-6 1000 570)"
          stroke="#ddd4c6"
        />
        <rect
          x="40"
          y="520"
          width="200"
          height="140"
          rx="3"
          fill="#fff9ef"
          transform="rotate(-4 140 590)"
          stroke="#e5dccd"
        />
      </g>
      <!-- 线条书写感 -->
      <g stroke="#c5b8a4" stroke-width="1.2" opacity="0.45">
        <line x1="860" y1="140" x2="1060" y2="155" transform="rotate(8 960 180)" />
        <line x1="860" y1="165" x2="1040" y2="178" transform="rotate(8 960 180)" />
        <line x1="860" y1="190" x2="1020" y2="200" transform="rotate(8 960 180)" />
      </g>
      <!-- 墨点 -->
      <circle cx="200" cy="160" r="6" fill="#3d5a80" opacity="0.15" />
      <circle cx="230" cy="175" r="3" fill="#3d5a80" opacity="0.12" />
      <path
        d="M180 200 Q200 190 210 210"
        fill="none"
        stroke="#3d5a80"
        stroke-width="2"
        opacity="0.12"
      />
    </svg>

    <!-- Macaron Soft：软糖色块 + 圆点 -->
    <svg
      v-else-if="skinId === 'macaron-soft'"
      class="decor-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="mc1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f5c6d6" stop-opacity="0.7" />
          <stop offset="100%" stop-color="#f5c6d6" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="mc2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#b8f0dc" stop-opacity="0.65" />
          <stop offset="100%" stop-color="#b8f0dc" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="mc3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffe6a8" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#ffe6a8" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="100" r="160" fill="url(#mc1)" />
      <circle cx="1100" cy="140" r="140" fill="url(#mc2)" />
      <circle cx="1000" cy="680" r="180" fill="url(#mc1)" />
      <circle cx="200" cy="650" r="120" fill="url(#mc3)" />
      <!-- 马卡龙侧剖面示意 -->
      <g transform="translate(980,420)" opacity="0.55">
        <ellipse cx="0" cy="0" rx="70" ry="28" fill="#f2a8c4" />
        <ellipse cx="0" cy="-8" rx="70" ry="22" fill="#f8c4d6" />
        <ellipse cx="0" cy="8" rx="70" ry="22" fill="#e891b0" />
        <ellipse cx="0" cy="0" rx="62" ry="12" fill="#fff0f5" opacity="0.8" />
      </g>
      <g transform="translate(160,380) scale(0.7)" opacity="0.45">
        <ellipse cx="0" cy="0" rx="70" ry="28" fill="#7ed6b8" />
        <ellipse cx="0" cy="-8" rx="70" ry="22" fill="#a8e6cf" />
        <ellipse cx="0" cy="8" rx="70" ry="22" fill="#5fc4a4" />
        <ellipse cx="0" cy="0" rx="62" ry="12" fill="#eefaf4" opacity="0.85" />
      </g>
      <g fill="#e891b0" opacity="0.35">
        <circle cx="400" cy="120" r="8" />
        <circle cx="460" cy="160" r="5" />
        <circle cx="700" cy="100" r="6" fill="#7ed6b8" />
        <circle cx="760" cy="150" r="9" fill="#ffe6a8" />
      </g>
    </svg>

    <!-- 其余亮色主题：通用柔光装饰（用当前主题色） -->
    <svg
      v-else-if="isLight"
      class="decor-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="lg-a" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.28" />
          <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="lg-b" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--accent-secondary)" stop-opacity="0.3" />
          <stop offset="100%" stop-color="var(--accent-secondary)" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="100" r="200" fill="url(#lg-a)" />
      <circle cx="1080" cy="140" r="180" fill="url(#lg-b)" />
      <circle cx="980" cy="680" r="220" fill="url(#lg-a)" opacity="0.7" />
      <circle cx="220" cy="640" r="140" fill="url(#lg-b)" opacity="0.65" />
      <g fill="var(--primary)" opacity="0.2">
        <circle cx="420" cy="160" r="7" />
        <circle cx="480" cy="210" r="4" />
        <circle cx="720" cy="120" r="5" />
        <circle cx="800" cy="200" r="8" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.theme-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.decor-full {
  width: 100%;
  height: 100%;
  display: block;
  opacity: 1;
}
</style>
