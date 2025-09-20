<script setup lang="ts">
import { pageLinks } from '../router/path'
</script>

<template>
  <div class="title">
    <h1 class="page-title">TOP</h1>
  </div>
  <div class="main">
    <ul class="UnorderedList" >
      <li class="ListItem " v-for="page in pageLinks" :key="page.path">
        <router-link class="RouteLink" :to="page.path">{{ page.name }}</router-link>
      </li>
    </ul>

    <div class="info">
    </div>
  </div>
</template>

<style lang="scss" scoped>

.UnorderedList {
  .ListItem {
    padding: 0px 0px 10px 0px;
    .RouteLink {
      color: white;
      font-size: 1.6em;
    }
  }
}
@media screen and (max-width: 768px) {

}
</style>