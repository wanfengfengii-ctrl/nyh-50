import { createRouter, createWebHistory } from 'vue-router'
import FreeMode from '@/views/FreeMode.vue'
import ChallengeMode from '@/views/ChallengeMode.vue'
import ReviewMode from '@/views/ReviewMode.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/free'
    },
    {
      path: '/free',
      name: 'free',
      component: FreeMode,
      meta: { title: '自由练习' }
    },
    {
      path: '/challenge',
      name: 'challenge',
      component: ChallengeMode,
      meta: { title: '限时挑战' }
    },
    {
      path: '/review',
      name: 'review',
      component: ReviewMode,
      meta: { title: '错题复盘' }
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || ''} - 传统药秤砝码组合训练台`
  next()
})

export default router
