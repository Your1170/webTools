import { createRouter, createWebHistory } from 'vue-router'
import Top from '../page/Top.vue'
import Pass from '../page/CreatePass.vue'

const routes = [
  { path: '/', component: Top },
  { path: '/create_pass', component: Pass }
]

const base = (import.meta.env.MODE === 'production') ? '/webTools/' : '/'
const router = createRouter({
  history: createWebHistory(base),
  routes,
})

export default router