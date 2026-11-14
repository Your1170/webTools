<script setup lang="ts">
import { ref } from 'vue';
import { pageLinks } from '../router/path';

// サイドバーの展開状態（初期は折りたたみ）
const isExpanded = ref<boolean>(true);
const toggleSidebar = () => { isExpanded.value = !isExpanded.value; };

// モバイル用ハンバーガーメニュー
const mobileMenuOpen = ref<boolean>(false);
const toggleMobileMenu = () => { mobileMenuOpen.value = !mobileMenuOpen.value; };
const closeMobileMenu = () => { mobileMenuOpen.value = false; };
</script>

<template>
  <!-- ============================================================
       PC / Desktop: 折りたたみ式サイドバー
       ============================================================ -->
  <aside
    class="sidebar"
    :class="{ expanded: isExpanded }"
    aria-label="メインナビゲーション"
  >
    <!-- 上部：展開切り替えボタン -->
    <div class="sidebar-top">
      <button
        class="sidebar-toggle"
        type="button"
        @click="toggleSidebar"
        :aria-expanded="isExpanded"
        :title="isExpanded ? 'サイドバーを折りたたむ' : 'サイドバーを展開する'"
        :aria-label="isExpanded ? 'サイドバーを折りたたむ' : 'サイドバーを展開する'"
      >
        <!-- panel-left アイコン（展開・折りたたみで回転） -->
        <svg
          class="toggle-icon"
          :class="{ rotated: isExpanded }"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
        <span class="sidebar-label toggle-label">メニュー</span>
      </button>
    </div>

    <!-- 中央：機能ナビゲーション（スクロール対象） -->
    <nav class="sidebar-nav" aria-label="機能ナビゲーション">
      <router-link
        v-for="page in pageLinks"
        :key="page.path"
        class="nav-item"
        :to="page.path"
        :title="isExpanded ? '' : page.name"
        :aria-label="page.name"
      >
        <!-- アイコン -->
        <svg
          class="nav-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path :d="page.iconPath"/>
        </svg>
        <!-- ラベル（展開時のみ表示） -->
        <span class="sidebar-label nav-label">{{ page.name }}</span>
      </router-link>
    </nav>

    <!-- 下部：固定領域（将来の共通操作用） -->
    <div class="sidebar-bottom">
      <div class="sidebar-divider"></div>
      <!-- 現時点では将来の拡張用プレースホルダー -->
    </div>
  </aside>

  <!-- ============================================================
       Mobile: ヘッダー + ハンバーガーメニュー（既存の挙動を維持）
       ============================================================ -->
  <header class="mobile-header" aria-label="モバイルヘッダー">
    <div class="mobile-header-inner">
      <router-link class="mobile-logo" to="/" @click="closeMobileMenu">
        <span class="mobile-logo-icon" aria-hidden="true">⚙</span>
        <span class="mobile-logo-text">WebTools</span>
      </router-link>

      <button
        class="hamburger-btn"
        type="button"
        :class="{ active: mobileMenuOpen }"
        @click="toggleMobileMenu"
        :aria-expanded="mobileMenuOpen"
        aria-label="メニューを開閉する"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>

  <!-- モバイルドロワーメニュー -->
  <transition name="mobile-slide">
    <div
      class="mobile-menu"
      v-show="mobileMenuOpen"
      role="dialog"
      aria-label="モバイルナビゲーション"
    >
      <nav class="mobile-nav">
        <router-link
          v-for="page in pageLinks"
          :key="page.path"
          class="mobile-nav-link"
          :to="page.path"
          @click="closeMobileMenu"
        >
          <svg
            class="mobile-nav-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="page.iconPath"/>
          </svg>
          {{ page.name }}
        </router-link>
      </nav>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
/* ============================================================
   PC Sidebar — 共通
   ============================================================ */
.sidebar {
  /* 折りたたみ状態の幅 */
  width: var(--sidebar-width-collapsed);
  flex-shrink: 0;

  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;

  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);

  overflow: hidden;                        /* ラベルのはみ出しを隠す */
  transition: var(--sidebar-transition);

  /* モバイルでは非表示 */
  @media screen and (max-width: 768px) {
    display: none;
  }

  /* 展開状態 */
  &.expanded {
    width: var(--sidebar-width-expanded);
  }
}

/* ============================================================
   サイドバー上部：展開切り替えボタン
   ============================================================ */
.sidebar-top {
  flex-shrink: 0;
  padding: var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--transition-fast),
              border-color var(--transition-fast),
              color var(--transition-fast);

  &:hover {
    background-color: var(--color-elevated);
    border-color: var(--color-border);
    color: var(--color-text-primary);
  }

  &:active {
    background-color: var(--color-panel);
  }
}

.toggle-icon {
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &.rotated {
    transform: scaleX(-1);
  }
}

/* ============================================================
   サイドバー中央：ナビゲーション（スクロール対象）
   ============================================================ */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-3) var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  /* スクロールバー：細め・ダークテーマ調 */
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--color-border);
    border-radius: 4px;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  text-decoration: none;
  color: var(--color-text-secondary);
  white-space: nowrap;
  transition: background-color var(--transition-fast),
              border-color var(--transition-fast),
              color var(--transition-fast);
  position: relative;

  /* アクティブ状態の左インジケーター */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 20%;
    height: 60%;
    width: 2px;
    border-radius: 2px;
    background-color: transparent;
    transition: background-color var(--transition-fast);
  }

  &:hover {
    background-color: var(--color-elevated);
    color: var(--color-text-primary);
  }

  &.router-link-exact-active {
    background-color: rgba(88, 166, 255, 0.1);
    border-color: rgba(88, 166, 255, 0.15);
    color: var(--color-primary-light);

    &::before {
      background-color: var(--color-primary);
    }
  }
}

.nav-icon {
  flex-shrink: 0;
}

/* ============================================================
   サイドバー下部：固定領域
   ============================================================ */
.sidebar-bottom {
  flex-shrink: 0;
  padding: var(--space-2);
}

.sidebar-divider {
  height: 1px;
  background-color: var(--color-border);
  margin-bottom: var(--space-2);
}

/* ============================================================
   ラベル共通：展開アニメーション
   展開時に width でフェードインさせる（overflow: hidden と連動）
   ============================================================ */
.sidebar-label {
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  opacity: 0;
  max-width: 0;
  transition: opacity 0.2s ease,
              max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  .sidebar.expanded & {
    opacity: 1;
    max-width: 200px;
  }
}

/* ============================================================
   Mobile Header
   ============================================================ */
.mobile-header {
  display: none;

  @media screen and (max-width: 768px) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }
}

.mobile-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--space-4);
}

.mobile-logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;

  .mobile-logo-icon {
    font-size: 1.1rem;
    color: var(--color-primary);
  }

  .mobile-logo-text {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

/* ============================================================
   Hamburger Button
   ============================================================ */
.hamburger-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  padding: var(--space-2);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);

  span {
    display: block;
    width: 16px;
    height: 1.5px;
    background-color: var(--color-text-secondary);
    border-radius: 2px;
    transition: transform var(--transition-base), opacity var(--transition-base);
  }

  &:hover {
    background-color: var(--color-elevated);
    border-color: var(--color-primary);

    span { background-color: var(--color-text-primary); }
  }

  &.active {
    background-color: var(--color-elevated);
    border-color: var(--color-primary);

    span:nth-child(1) { transform: rotate(45deg) translate(4.5px, 4.5px); }
    span:nth-child(2) { opacity: 0; }
    span:nth-child(3) { transform: rotate(-45deg) translate(4.5px, -4.5px); }
  }
}

/* ============================================================
   Mobile Menu Drawer
   ============================================================ */
.mobile-menu {
  display: none;

  @media screen and (max-width: 768px) {
    display: block;
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99;
    background-color: rgba(13, 17, 23, 0.95);
    backdrop-filter: blur(4px);
  }
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: color var(--transition-fast), background-color var(--transition-fast);

  &:hover {
    color: var(--color-text-primary);
    background-color: var(--color-elevated);
  }

  &.router-link-exact-active {
    color: var(--color-primary-light);
    background-color: rgba(88, 166, 255, 0.1);
  }
}

.mobile-nav-icon {
  flex-shrink: 0;
  color: inherit;
}

/* ============================================================
   Mobile Slide Transition
   ============================================================ */
.mobile-slide-enter-from,
.mobile-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.mobile-slide-enter-to,
.mobile-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.mobile-slide-enter-active,
.mobile-slide-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

/* ============================================================
   アクセシビリティ：視覚効果を減らす設定への対応
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .toggle-icon,
  .sidebar-label {
    transition: none;
  }
}
</style>
