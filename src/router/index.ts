import { createRouter, createWebHashHistory } from 'vue-router'
import Top from '../pages/Top.vue'
import Pass from '../pages/CreatePass.vue'
import Hash from '../pages/ChangeHash.vue'
import ImageConverter from '../pages/ImageConverter.vue'
import HtmlGameStudio from '../pages/HtmlGameStudio.vue'
import SvgConverter from '../pages/SvgConverter.vue'

const routes = [
  { path: '/', component: Top },
  { path: '/create_pass', component: Pass },
  { path: '/change_hash', component: Hash },
  { path: '/image_converter', component: ImageConverter },
  { path: '/html_game_studio', component: HtmlGameStudio },
  { path: '/svg_converter', component: SvgConverter },
]

// ドメイン取得して設定したので修正。もしPagesそのままに戻す場合は『=== 'production'』で全体検索をする。
// const base = (import.meta.env.MODE === 'production') ? '/webTools/' : '/'
const router = createRouter({
  history: createWebHashHistory(/*base*/),
  routes,
})

export default router