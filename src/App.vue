<script setup lang="ts">
import Sidebar from './components/Sidebar.vue';
</script>

<template>
  <Sidebar />
  <main class="app-main">
    <router-view />
  </main>
</template>

<style lang="scss" scoped>
/* モバイルでは固定ヘッダー分の余白を確保 */
.app-main {
  @media screen and (max-width: 768px) {
    padding-top: 56px;
  }
}
</style>
