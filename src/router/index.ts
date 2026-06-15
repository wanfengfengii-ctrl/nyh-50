import { createRouter, createWebHistory } from 'vue-router'
import FreeMode from '@/views/FreeMode.vue'
import ChallengeMode from '@/views/ChallengeMode.vue'
import ReviewMode from '@/views/ReviewMode.vue'
import PrescriptionMode from '@/views/PrescriptionMode.vue'
import PrescriptionReviewMode from '@/views/PrescriptionReviewMode.vue'
import MentorMode from '@/views/MentorMode.vue'
import MentorReviewMode from '@/views/MentorReviewMode.vue'
import ClinicMode from '@/views/ClinicMode.vue'
import ClinicReviewMode from '@/views/ClinicReviewMode.vue'

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
      path: '/prescription',
      name: 'prescription',
      component: PrescriptionMode,
      meta: { title: '处方配伍' }
    },
    {
      path: '/mentor',
      name: 'mentor',
      component: MentorMode,
      meta: { title: '师徒教学' }
    },
    {
      path: '/review',
      name: 'review',
      component: ReviewMode,
      meta: { title: '错题复盘' }
    },
    {
      path: '/prescription-review',
      name: 'prescription-review',
      component: PrescriptionReviewMode,
      meta: { title: '处方复盘' }
    },
    {
      path: '/mentor-review',
      name: 'mentor-review',
      component: MentorReviewMode,
      meta: { title: '成长记录' }
    },
    {
      path: '/clinic',
      name: 'clinic',
      component: ClinicMode,
      meta: { title: '药房接诊' }
    },
    {
      path: '/clinic-review',
      name: 'clinic-review',
      component: ClinicReviewMode,
      meta: { title: '接诊记录' }
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || ''} - 传统药秤砝码组合训练台`
  next()
})

export default router
