<script setup lang="ts">
import { pageLinks } from '../router/path'

// Top自身（'/'）を除いたツールリストを表示する
const toolLinks = pageLinks.filter(p => p.path !== '/')
</script>

<template>
  <div class="page-wrapper">
    <div class="page-title-block">
      <h1 class="page-title">WebTools</h1>
      <p class="page-subtitle">ちょっとした開発作業に使えるツール集</p>
    </div>

    <div class="tools-grid">
      <router-link
        class="tool-card"
        v-for="page in toolLinks"
        :key="page.path"
        :to="page.path"
      >
        <span class="tool-card-name">{{ page.name }}</span>
        <span class="tool-card-arrow">→</span>
      </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tools-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.tool-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  background-color: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: background-color var(--transition-fast),
              border-color var(--transition-fast);

  &:hover {
    background-color: var(--color-elevated);
    border-color: var(--color-primary);

    .tool-card-arrow {
      color: var(--color-primary-light);
      transform: translateX(3px);
    }
  }
}

.tool-card-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.tool-card-arrow {
  font-size: 1rem;
  color: var(--color-text-muted);
  transition: color var(--transition-fast), transform var(--transition-fast);
}
</style>
