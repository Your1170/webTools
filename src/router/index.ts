import { createRouter, createWebHashHistory } from 'vue-router'
import Top from '../pages/Top.vue'
import Pass from '../pages/CreatePass.vue'
import Hash from '../pages/ChangeHash.vue'
import ImageConverter from '../pages/ImageConverter.vue'
import HtmlGameStudio from '../pages/HtmlGameStudio.vue'

const routes = [
  { path: '/', component: Top },
  { path: '/create_pass', component: Pass },
  { path: '/change_hash', component: Hash },
  { path: '/image_converter', component: ImageConverter },
  { path: '/html_game_studio', component: HtmlGameStudio },
]

const base = (import.meta.env.MODE === 'production') ? '/webTools/' : '/'
const router = createRouter({
  history: createWebHashHistory(base),
  routes,
})

export default router