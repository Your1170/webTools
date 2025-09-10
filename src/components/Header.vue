<script setup lang="ts">
import { ref } from 'vue';

interface PageLinks {
  name: string;
  path: string;
}
const pageLinks: PageLinks[] = [
  { name: 'Top', path:'/' },
  { name: 'パスワード作成', path:'/create_pass' },
];

const toggleFlag = ref<boolean>(false);

const toggleSwitch = () => { toggleFlag.value = !toggleFlag.value; };

</script>

<template>
  <div class="header">
    <ul class="UnorderedList">
      <li class="ListItem" v-for="page in pageLinks" :key="page.path">
        <router-link class="RouteLink" :to="page.path">{{ page.name }}</router-link>
      </li>
    </ul>
    <div class="header-toggle" @click="toggleSwitch">
      <div class="hamburger" :class="{ active: toggleFlag }">
        <span></span>
        <span></span>
        <span></span>
      </div>

    </div>
    <transition name="slide">
      <div class="mini-menu" v-show="toggleFlag">
          <ul class="mini-UnorderedList" >
            <li class="mini-ListItem " v-for="page in pageLinks" :key="page.path" @click="toggleSwitch">
              <router-link class="mini-RouteLink" :to="page.path">{{ page.name }}</router-link>
            </li>
          </ul>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  
  width: 100%;
  height: 80px;
  padding-bottom: 5px;
  border-bottom: 2px solid #f6ca97;

  .UnorderedList {
    .ListItem {
      display: inline-flex;
      position: relative;
      left: -20px;

      list-style: none;

      .RouteLink{
        text-align:center;
        text-decoration: none;
        color:#ffffff;

        min-width: 100px;
        padding: 10px;

        background-color: #000000;
        border:2px solid #787676;
      }
    }
    .RouteLink:hover {
      color:#ff0374;
    }
  }

  /* スライドアニメーション用クラス */
  .slide-enter-from {
    transform: translateX(100%); // 右外からスタート
    opacity: 0;                  // フェードイン
  }
  .slide-enter-to {
    transform: translateX(0);    // 元の位置
    opacity: 1;
  }
  .slide-leave-from {
    transform: translateX(0);    // 元の位置
    opacity: 1;
  }
  .slide-leave-to {
    transform: translateX(100%); // 右外に戻る
    opacity: 0;
  }

  /* アニメーション時間・イージング */
  .slide-enter-active,
  .slide-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.header-toggle {
  display: none;
}
.mini-UnorderedList {
  display: none;
}

@media screen and (max-width: 768px) {
  .UnorderedList {
    display: none;
  }
  .header-toggle {
    background-color: #000000;
    border-radius: 10px;

    display: block;
    position: absolute;
    top: 15px;
    right: 15px;

    width: 70px;
    height: 70px;

    .hamburger {
      display: block;
      position: absolute;

      width: 70px;
      height: 70px;

      span {
        display: block;
        margin: 11px;
        padding-top: 1px;
        height: 7px;

        background: #ffffff;
        border-radius: 2px;
        transition: all 0.3s ease;
      }

      &.active {
        span:nth-child(1) {
          transform: rotate(45deg) translate(15px, 15px);
        }
        span:nth-child(2) {
          opacity: 0; // 真ん中は消える
        }
        span:nth-child(3) {
          transform: rotate(-45deg) translate(10px, -10px);
        }
      }
    }
  }
  .header-toggle:hover {
    background-color: #5c5c5c;
  }
  .mini-menu {
    display: block;
    position: absolute;
    top: 94px;

    width: 100vw;
    height: 100vh;
    background-color: #000000a6;

    .mini-UnorderedList {
      display: block;

      .mini-ListItem {
        display: flex;
        flex-direction: row-reverse;
        position: relative;
        right: 115px;
  
        .mini-RouteLink {
          display: flex;
          flex-direction: row-reverse;
          position: relative;
          right: -20px;

          text-decoration: none;
          text-align: left;
          color:#ffffff;
          font-size: 1.8em;
          border-bottom: 2px solid #ffffff;

          width: 60%;
          padding: 10px;
        }
      }
    }
  }
}

</style>