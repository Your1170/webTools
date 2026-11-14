import { createRouter, createWebHistory } from 'vue-router'
import Top from '../pages/Top.vue'
import Pass from '../pages/CreatePass.vue'
import Hash from '../pages/ChangeHash.vue'
import ImageConverter from '../pages/ImageConverter.vue'

const routes = [
  { path: '/', component: Top },
  { path: '/create_pass', component: Pass },
  { path: '/change_hash', component: Hash },
  { path: '/image_converter', component: ImageConverter },
]

const base = (import.meta.env.MODE === 'production') ? '/webTools/' : '/'
const router = createRouter({
  history: createWebHistory(base),
  routes,
})

export default router