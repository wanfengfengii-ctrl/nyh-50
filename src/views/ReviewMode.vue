<template>
  <div class="review-mode-page">
    <div class="page-header">
      <h2 class="page-title">错题复盘模式</h2>
      <p class="page-desc">回顾错题，分析最大误差步骤，巩固称量技巧</p>
    </div>

    <div v-if="reviewItems.length === 0" class="empty-review">
      <div class="empty-card">
        <div class="empty-icon">
          <n-icon size="48" :component="BookOutline" />
        </div>
        <h3>暂无错题记录</h3>
        <p>完成限时挑战后，错题会自动收录到这里</p>
        <n-button type="primary" @click="goToChallenge" color="#DAA520">
          去挑战
        </n-button>
      </div>
    </div>

    <div v-else class="review-content">
      <div class="review-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">错题列表</span>
          <span class="sidebar-count">共 {{ reviewItems.length }} 题</span>
        </div>
        <div class="review-list">
          <div
            v-for="(item, index) in reviewItems"
            :key="item.question.id"
            class="review-item"
            :class="{ active: currentReviewIndex === index }"
            @click="selectReview(index)"
          >
            <div class="item-num">第 {{ index + 1 }} 题</div>
            <div class="item-target">
              目标：{{ item.question.targetWeight }} 钱 {{ item.question.herbName }}
            </div>
            <div class="item-error">
              最大误差：{{ formatError(item.maxError) }}
            </div>
          </div>
        </div>
      </div>

      <div class="review-main">
        <div v-if="currentReviewItem" class="review-detail">
          <div class="detail-header">
            <h3 class="detail-title">
              第 {{ currentReviewIndex + 1 }} 题分析
            </h3>
            <div class="detail-target">
              目标重量：<strong>{{ currentReviewItem.question.targetWeight }} 钱</strong>
              {{ currentReviewItem.question.herbName }}
            </div>
          </div>

          <div class="analysis-section">
            <div class="analysis-card your-answer">
              <h4>你的答案</h4>
              <div class="answer-weights">
                <span v-if="currentReviewItem.userAnswer.length === 0" class="no-weight">
                  未放置砝码
                </span>
                <span
                  v-for="w in currentReviewItem.userAnswer"
                  :key="w.id"
                  class="weight-tag"
                  :style="{ background: w.color }"
                >
                  {{ w.name }}
                </span>
              </div>
              <div class="answer-herb">
                药材数量：{{ currentReviewItem.herbCount }} 味
              </div>
              <div class="answer-error" :class="getErrorClass(currentReviewItem.maxError)">
                最大误差：{{ formatError(currentReviewItem.maxError) }}
              </div>
            </div>

            <div class="analysis-card reference">
              <h4>正确组合</h4>
              <template v-if="showAnswer">
                <div class="answer-weights">
                  <span
                    v-for="w in currentReviewItem.question.bestSolution"
                    :key="w.id"
                    class="weight-tag correct"
                    :style="{ background: w.color }"
                  >
                    {{ w.name }}
                  </span>
                </div>
                <div class="answer-total">
                  总重：{{ getBestSolutionTotal() }} 钱
                </div>
                <div class="answer-tip">
                  提示：通过调整药材数量使秤杆平衡
                </div>
              </template>
              <template v-else>
                <div class="answer-hidden">
                  <p>点击下方按钮查看正确组合</p>
                  <n-button size="small" @click="showAnswer = true" type="primary" color="#2E8B57">
                    显示正确答案
                  </n-button>
                </div>
              </template>
            </div>
          </div>

          <div class="steps-section">
            <h4 class="steps-title">
              操作步骤分析
              <span class="max-error-hint">（红色标记为最大误差步骤）</span>
            </h4>
            <div class="steps-container">
              <div
                v-for="(record, index) in currentReviewItem.history"
                :key="record.id"
                class="step-item"
                :class="{ 
                  'max-error': index === currentReviewItem.maxErrorStep 
                }"
              >
                <div class="step-number">
                  {{ index + 1 }}
                </div>
                <div class="step-content">
                  <div class="step-desc">{{ record.description }}</div>
                  <div class="step-detail">
                    <span>砝码：{{ record.leftWeight.toFixed(1) }} 钱</span>
                    <span>药材：{{ record.rightWeight.toFixed(1) }} 钱</span>
                  </div>
                </div>
                <div class="step-error" :class="getErrorClass(record.error)">
                  {{ formatError(record.error) }}
                </div>
              </div>
              <div v-if="currentReviewItem.history.length === 0" class="no-steps">
                暂无操作记录
              </div>
            </div>
          </div>

          <div class="review-actions">
            <n-button @click="prevReview" :disabled="currentReviewIndex <= 0">
              上一题
            </n-button>
            <n-button type="primary" @click="practiceAgain" color="#2E8B57">
              <template #icon>
                <n-icon :component="RefreshOutline" />
              </template>
              再练一次
            </n-button>
            <n-button @click="nextReview" :disabled="currentReviewIndex >= reviewItems.length - 1">
              下一题
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useScaleStore } from '@/stores/scale'
import type { ReviewItem } from '@/types'
import { BookOutline, RefreshOutline } from '@vicons/ionicons5'

const router = useRouter()
const gameStore = useGameStore()
const scaleStore = useScaleStore()

const reviewItems = ref<ReviewItem[]>([])
const currentReviewIndex = ref(0)
const showAnswer = ref(false)

const currentReviewItem = computed(() => {
  if (reviewItems.value.length === 0) return null
  return reviewItems.value[currentReviewIndex.value]
})

function formatError(error: number): string {
  const sign = error > 0 ? '+' : ''
  return `${sign}${error.toFixed(2)} 钱`
}

function getErrorClass(error: number): string {
  const absError = Math.abs(error)
  if (absError <= 0.1) return 'error-good'
  if (absError <= 1) return 'error-warning'
  return 'error-bad'
}

function getBestSolutionTotal(): string {
  if (!currentReviewItem.value) return '0'
  const total = currentReviewItem.value.question.bestSolution.reduce(
    (sum, w) => sum + w.weight, 0
  )
  return total.toFixed(1)
}

function selectReview(index: number) {
  currentReviewIndex.value = index
  showAnswer.value = false
}

function prevReview() {
  if (currentReviewIndex.value > 0) {
    currentReviewIndex.value--
    showAnswer.value = false
  }
}

function nextReview() {
  if (currentReviewIndex.value < reviewItems.value.length - 1) {
    currentReviewIndex.value++
    showAnswer.value = false
  }
}

function practiceAgain() {
  if (!currentReviewItem.value) return

  gameStore.pendingPractice = {
    targetWeight: currentReviewItem.value.question.targetWeight,
    herb: {
      id: 'rv',
      name: currentReviewItem.value.question.herbName,
      unitWeight: currentReviewItem.value.question.herbUnitWeight,
      color: '#8B7355'
    }
  }

  gameStore.setGameMode('free')
  router.push('/free')
}

function goToChallenge() {
  router.push('/challenge')
}

onMounted(() => {
  gameStore.setGameMode('review')
  const wrongAnswers = gameStore.getWrongAnswers()
  
  if (wrongAnswers.length > 0) {
    reviewItems.value = wrongAnswers
  } else {
    reviewItems.value = gameStore.loadWrongAnswers()
  }
})
</script>

<style scoped>
.review-mode-page {
  min-height: 100%;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  color: #4A2C17;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.page-desc {
  font-size: 14px;
  color: #8B7355;
  margin: 0;
}

.empty-review {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.empty-card {
  text-align: center;
  padding: 40px 60px;
  background: #FFF;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid #E6E6FA;
}

.empty-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px auto;
  background: #F0F8FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4169E1;
}

.empty-card h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.empty-card p {
  margin: 0 0 20px 0;
  color: #999;
  font-size: 14px;
}

.review-content {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.review-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #FFF;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #E6E6FA;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  background: #F8F8FF;
  border-bottom: 1px solid #E6E6FA;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #483D8B;
}

.sidebar-count {
  font-size: 12px;
  color: #9370DB;
  background: #E6E6FA;
  padding: 2px 8px;
  border-radius: 10px;
}

.review-list {
  max-height: 500px;
  overflow-y: auto;
  padding: 8px;
}

.review-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 6px;
  border: 1px solid transparent;
}

.review-item:hover {
  background: #F8F8FF;
}

.review-item.active {
  background: #E6E6FA;
  border-color: #9370DB;
}

.item-num {
  font-size: 13px;
  font-weight: 600;
  color: #483D8B;
  margin-bottom: 4px;
}

.item-target {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.item-error {
  font-size: 12px;
  color: #DC143C;
  font-weight: 500;
}

.review-main {
  flex: 1;
  min-width: 0;
}

.review-detail {
  background: #FFF;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #E6E6FA;
  overflow: hidden;
}

.detail-header {
  padding: 20px;
  background: linear-gradient(135deg, #F8F8FF 0%, #E6E6FA 100%);
  border-bottom: 1px solid #E6E6FA;
}

.detail-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #483D8B;
}

.detail-target {
  font-size: 14px;
  color: #6B8E23;
}

.detail-target strong {
  font-size: 18px;
  color: #2E8B57;
}

.analysis-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 20px;
}

.analysis-card {
  padding: 16px;
  border-radius: 10px;
  border: 2px solid;
}

.analysis-card h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
}

.your-answer {
  background: #FFF0F5;
  border-color: #FFB6C1;
}

.your-answer h4 {
  color: #DC143C;
}

.reference {
  background: #F0FFF0;
  border-color: #90EE90;
}

.reference h4 {
  color: #2E8B57;
}

.answer-weights {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
  min-height: 32px;
}

.no-weight {
  font-size: 13px;
  color: #999;
  font-style: italic;
}

.weight-tag {
  padding: 4px 10px;
  border-radius: 14px;
  color: #FFF8DC;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #4A2C17;
}

.weight-tag.correct {
  box-shadow: 0 0 0 2px rgba(46, 139, 87, 0.3);
}

.answer-herb,
.answer-total {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.answer-error {
  font-size: 14px;
  font-weight: 600;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
}

.error-good {
  color: #2E8B57;
}

.error-warning {
  color: #DAA520;
}

.error-bad {
  color: #DC143C;
}

.answer-tip {
  font-size: 12px;
  color: #6B8E23;
  font-style: italic;
}

.answer-hidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.answer-hidden p {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.steps-section {
  padding: 0 20px 20px 20px;
}

.steps-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.max-error-hint {
  font-size: 12px;
  color: #999;
  font-weight: normal;
  margin-left: 8px;
}

.steps-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #EEE;
  border-radius: 8px;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
  transition: all 0.2s ease;
}

.step-item:last-child {
  border-bottom: none;
}

.step-item:hover {
  background: #F9F9F9;
}

.step-item.max-error {
  background: #FFF0F5;
  border-left: 4px solid #DC143C;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #E6E6FA;
  color: #483D8B;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;
}

.step-item.max-error .step-number {
  background: #DC143C;
  color: #FFF;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-desc {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.step-detail {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.step-error {
  font-size: 14px;
  font-weight: 600;
  margin-left: 12px;
  flex-shrink: 0;
}

.no-steps {
  text-align: center;
  padding: 30px;
  color: #BBB;
  font-size: 14px;
}

.review-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #EEE;
  background: #FAFAFA;
}
</style>
