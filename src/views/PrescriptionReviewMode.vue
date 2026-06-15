<template>
  <div class="prescription-review-page">
    <div class="page-header">
      <h2 class="page-title">处方配伍复盘</h2>
      <p class="page-desc">按药味维度分析操作步骤，找出造成最大误差的关键环节</p>
    </div>

    <div v-if="reviewResults.length === 0" class="empty-review">
      <div class="empty-card">
        <div class="empty-icon">
          <n-icon size="48" :component="BookOutline" />
        </div>
        <h3>暂无处方记录</h3>
        <p>完成处方配伍模式后，记录会自动收录到这里</p>
        <n-button type="primary" @click="goToPrescription" color="#8B4513">
          去配药
        </n-button>
      </div>
    </div>

    <div v-else class="review-content">
      <!-- 左侧：处方列表 -->
      <div class="review-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">处方记录</span>
          <span class="sidebar-count">共 {{ reviewResults.length }} 次</span>
        </div>
        <div class="review-list">
          <div
            v-for="(result, index) in reviewResults"
            :key="index"
            class="review-item"
            :class="{ active: currentReviewIndex === index }"
            @click="selectReview(index)"
          >
            <div class="item-header">
              <span class="item-name">{{ result.prescription.name }}</span>
              <span 
                class="item-score-badge"
                :class="getScoreClass(result)"
              >
                {{ getScorePercent(result) }}%
              </span>
            </div>
            <div class="item-meta">
              <span>{{ result.prescription.herbs.length }} 味药</span>
              <span>用时 {{ formatTime(result.totalTimeUsed) }}</span>
            </div>
            <div class="item-herbs-preview">
              <span
                v-for="(hr, hi) in result.herbResults.slice(0, 4)"
                :key="hi"
                class="mini-herb"
                :style="{ background: hr.herb.color }"
                :title="hr.herb.herbName"
              ></span>
              <span v-if="result.herbResults.length > 4" class="more-herbs">
                +{{ result.herbResults.length - 4 }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="reviewResults.length > 0" class="clear-btn">
          <n-button size="small" @click="handleClear" type="default" dashed>
            清空记录
          </n-button>
        </div>
      </div>

      <!-- 右侧：详细分析 -->
      <div class="review-main">
        <div v-if="currentResult" class="review-detail">
          <!-- 概览 -->
          <div class="detail-overview">
            <div class="overview-header">
              <div>
                <h3 class="overview-title">{{ currentResult.prescription.name }}</h3>
                <p class="overview-desc">{{ currentResult.prescription.description }}</p>
              </div>
              <div class="overview-score">
                <div class="score-ring">
                  <n-progress 
                    type="circle" 
                    :percentage="getScorePercent(currentResult)"
                    :color="getScoreColor(currentResult)"
                    rail-color="#F0F0F0"
                    :width="90"
                  />
                </div>
                <div class="score-detail">
                  <div class="score-big">
                    {{ currentResult.totalScore }}
                    <span class="score-small">/ {{ currentResult.maxScore }}</span>
                  </div>
                  <div class="time-used">用时 {{ formatTime(currentResult.totalTimeUsed) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 药味选项卡 -->
          <div class="herb-tabs">
            <div
              v-for="(hr, hi) in currentResult.herbResults"
              :key="hr.herb.id"
              class="herb-tab"
              :class="{ active: currentHerbIndex === hi }"
              @click="selectHerb(hi)"
            >
              <span class="tab-color" :style="{ background: hr.herb.color }"></span>
              <span class="tab-name">{{ hr.herb.herbName }}</span>
              <span class="tab-score">{{ hr.score }}分</span>
            </div>
          </div>

          <!-- 当前药味详情 -->
          <div v-if="currentHerbResult" class="herb-detail-section">
            <div class="herb-stats-grid">
              <div class="stat-card">
                <div class="stat-label">目标重量</div>
                <div class="stat-value">{{ currentHerbResult.herb.targetWeight }} 钱</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">允许误差</div>
                <div class="stat-value">±{{ currentHerbResult.herb.allowedError }} 钱</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">最终误差</div>
                <div class="stat-value" :class="getErrorClass2(currentHerbResult.finalError, currentHerbResult.herb.allowedError)">
                  {{ formatError(currentHerbResult.finalError) }}
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">误差率</div>
                <div class="stat-value" :class="getErrorClass2(currentHerbResult.errorPercentage, 5)">
                  {{ currentHerbResult.errorPercentage.toFixed(1) }}%
                </div>
              </div>
            </div>

            <!-- 关键步骤标记 -->
            <div class="key-steps-section">
              <h4 class="section-title">
                <n-icon :component="AlertCircleOutline" />
                关键操作分析
              </h4>
              <div class="key-steps-grid">
                <div v-if="bestStep" class="key-step-card best">
                  <div class="step-card-header">
                    <n-icon :component="CheckmarkCircleOutline" />
                    <span>最佳操作步骤</span>
                  </div>
                  <div class="step-card-body">
                    <div class="step-desc">{{ bestStep.description }}</div>
                    <div class="step-detail-row">
                      <span>砝码：{{ bestStep.leftWeight.toFixed(1) }}钱</span>
                      <span>药材：{{ bestStep.rightWeight.toFixed(1) }}钱</span>
                    </div>
                    <div class="step-error good">
                      误差：{{ formatError(bestStep.error) }}
                    </div>
                  </div>
                </div>
                <div v-if="worstStep" class="key-step-card worst">
                  <div class="step-card-header">
                    <n-icon :component="AlertCircleOutline" />
                    <span>最大误差步骤（关键）</span>
                  </div>
                  <div class="step-card-body">
                    <div class="step-desc">{{ worstStep.description }}</div>
                    <div class="step-detail-row">
                      <span>砝码：{{ worstStep.leftWeight.toFixed(1) }}钱</span>
                      <span>药材：{{ worstStep.rightWeight.toFixed(1) }}钱</span>
                    </div>
                    <div class="step-error bad">
                      误差：{{ formatError(worstStep.error) }}
                    </div>
                  </div>
                  <div class="step-suggestion">
                    <strong>建议：</strong>
                    <span v-if="worstStep.error > 0">
                      此时砝码偏重 {{ formatError(worstStep.error) }}，可以减少一个大砝码或增加药材数量。
                    </span>
                    <span v-else>
                      此时药材偏重 {{ formatError(Math.abs(worstStep.error)) }}，可以增加砝码或减少药材数量。
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 完整步骤时间线 -->
            <div class="steps-section">
              <h4 class="section-title">
                <n-icon :component="TimeOutline" />
                完整操作记录（共 {{ currentHerbResult.history.length }} 步）
                <span class="step-hint">红色高亮为最大误差步骤</span>
              </h4>
              <div class="steps-timeline">
                <div
                  v-for="(record, index) in currentHerbResult.history"
                  :key="record.id"
                  class="timeline-item"
                  :class="{ 
                    'max-error': index === currentHerbResult.worstStepIndex,
                    'best-step': index === currentHerbResult.bestStepIndex,
                    'complete-step': record.type === 'complete_herb',
                    'switch-step': record.type === 'switch_herb'
                  }"
                >
                  <div class="timeline-dot">
                    <span v-if="index === currentHerbResult.worstStepIndex" class="dot-badge worst">!</span>
                    <span v-else-if="index === currentHerbResult.bestStepIndex" class="dot-badge best">★</span>
                    <span v-else class="dot-default"></span>
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="step-index">第 {{ index + 1 }} 步</span>
                      <span class="step-type-badge" :class="'type-' + record.type">
                        {{ getStepTypeLabel(record.type) }}
                      </span>
                    </div>
                    <div class="timeline-desc">{{ record.description }}</div>
                    <div class="timeline-detail">
                      <span class="detail-pill">砝码 {{ record.leftWeight.toFixed(1) }}钱</span>
                      <span class="detail-pill">药材 {{ record.rightWeight.toFixed(1) }}钱</span>
                      <span class="detail-pill error" :class="getStepErrorClass(record.error, currentHerbResult.herb.allowedError)">
                        误差 {{ formatError(record.error) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="currentHerbResult.history.length === 0" class="no-steps">
                  暂无操作记录
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrescriptionStore } from '@/stores/prescription'
import type { PrescriptionResult, PrescriptionStepRecord } from '@/types'
import { 
  BookOutline, 
  AlertCircleOutline, 
  CheckmarkCircleOutline,
  TimeOutline
} from '@vicons/ionicons5'

const router = useRouter()
const prescriptionStore = usePrescriptionStore()

const reviewResults = ref<PrescriptionResult[]>([])
const currentReviewIndex = ref(0)
const currentHerbIndex = ref(0)

const currentResult = computed(() => {
  if (reviewResults.value.length === 0) return null
  return reviewResults.value[currentReviewIndex.value]
})

const currentHerbResult = computed(() => {
  if (!currentResult.value) return null
  return currentResult.value.herbResults[currentHerbIndex.value]
})

const bestStep = computed((): PrescriptionStepRecord | null => {
  if (!currentHerbResult.value) return null
  if (currentHerbResult.value.bestStepIndex < 0) return null
  return currentHerbResult.value.history[currentHerbResult.value.bestStepIndex] || null
})

const worstStep = computed((): PrescriptionStepRecord | null => {
  if (!currentHerbResult.value) return null
  if (currentHerbResult.value.worstStepIndex < 0) return null
  return currentHerbResult.value.history[currentHerbResult.value.worstStepIndex] || null
})

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatError(error: number): string {
  const sign = error > 0 ? '+' : ''
  return `${sign}${error.toFixed(2)}钱`
}

function getScorePercent(result: PrescriptionResult): number {
  if (result.maxScore === 0) return 0
  return Math.round((result.totalScore / result.maxScore) * 100)
}

function getScoreClass(result: PrescriptionResult): string {
  const pct = getScorePercent(result)
  if (pct >= 80) return 'excellent'
  if (pct >= 60) return 'pass'
  return 'fail'
}

function getScoreColor(result: PrescriptionResult): string {
  const pct = getScorePercent(result)
  if (pct >= 80) return '#2E8B57'
  if (pct >= 60) return '#DAA520'
  return '#DC143C'
}

function getErrorClass2(value: number, threshold: number): string {
  const abs = Math.abs(value)
  if (abs <= threshold) return 'good'
  if (abs <= threshold * 2) return 'warning'
  return 'bad'
}

function getStepErrorClass(error: number, allowed: number): string {
  return getErrorClass2(error, allowed)
}

function getStepTypeLabel(type: string): string {
  const map: Record<string, string> = {
    'add_weight': '加砝码',
    'remove_weight': '减砝码',
    'adjust_herb': '调药材',
    'switch_herb': '切换药味',
    'complete_herb': '完成称量'
  }
  return map[type] || type
}

function selectReview(index: number) {
  currentReviewIndex.value = index
  currentHerbIndex.value = 0
}

function selectHerb(index: number) {
  currentHerbIndex.value = index
}

function goToPrescription() {
  router.push('/prescription')
}

function handleClear() {
  if (window.confirm('确定要清空所有处方复盘记录吗？')) {
    prescriptionStore.clearResults()
    reviewResults.value = []
  }
}

onMounted(() => {
  const stored = prescriptionStore.loadResults()
  if (stored.length > 0) {
    reviewResults.value = stored
  } else if (prescriptionStore.lastResult) {
    reviewResults.value = [prescriptionStore.lastResult]
  } else {
    reviewResults.value = prescriptionStore.prescriptionResults
  }
})
</script>

<style scoped>
.prescription-review-page {
  min-height: 100%;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  color: #483D8B;
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
  background: #F8F8FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #483D8B;
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
  max-width: 1400px;
  margin: 0 auto;
  align-items: flex-start;
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
  max-height: 600px;
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

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.item-score-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.item-score-badge.excellent {
  background: #E8F5E9;
  color: #2E8B57;
}

.item-score-badge.pass {
  background: #FFF8DC;
  color: #DAA520;
}

.item-score-badge.fail {
  background: #FFF0F5;
  color: #DC143C;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.item-herbs-preview {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-herb {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.1);
}

.more-herbs {
  font-size: 11px;
  color: #999;
}

.clear-btn {
  padding: 12px;
  border-top: 1px solid #F0F0F0;
  text-align: center;
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

.detail-overview {
  padding: 24px;
  background: linear-gradient(135deg, #F8F8FF 0%, #E6E6FA 100%);
  border-bottom: 1px solid #E6E6FA;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.overview-title {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: #483D8B;
}

.overview-desc {
  margin: 0;
  font-size: 14px;
  color: #6B8E23;
}

.overview-score {
  display: flex;
  align-items: center;
  gap: 20px;
}

.score-ring {
  flex-shrink: 0;
}

.score-big {
  font-size: 36px;
  font-weight: bold;
  color: #483D8B;
  line-height: 1;
}

.score-small {
  font-size: 16px;
  color: #999;
  font-weight: normal;
}

.time-used {
  font-size: 12px;
  color: #8B7355;
  margin-top: 6px;
}

.herb-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid #F0F0F0;
  background: #FAFAFA;
}

.herb-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 20px;
  background: #FFF;
  border: 2px solid #E0E0E0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.herb-tab:hover {
  border-color: #9370DB;
  background: #F8F8FF;
}

.herb-tab.active {
  background: #483D8B;
  border-color: #483D8B;
  color: #FFF;
}

.tab-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.1);
}

.tab-name {
  font-size: 14px;
  font-weight: 500;
}

.tab-score {
  font-size: 12px;
  opacity: 0.8;
  background: rgba(0,0,0,0.1);
  padding: 1px 6px;
  border-radius: 10px;
}

.herb-detail-section {
  padding: 24px;
}

.herb-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: #F8F8FF;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  border: 1px solid #E6E6FA;
}

.stat-label {
  font-size: 12px;
  color: #8B7355;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #483D8B;
}

.stat-value.good {
  color: #2E8B57;
}

.stat-value.warning {
  color: #DAA520;
}

.stat-value.bad {
  color: #DC143C;
}

.key-steps-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.step-hint {
  font-size: 12px;
  color: #999;
  font-weight: normal;
  margin-left: auto;
}

.key-steps-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.key-step-card {
  border-radius: 12px;
  padding: 16px;
  border: 2px solid;
}

.key-step-card.best {
  background: #F0FFF0;
  border-color: #90EE90;
}

.key-step-card.worst {
  background: #FFF0F5;
  border-color: #FFB6C1;
}

.step-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 14px;
}

.key-step-card.best .step-card-header {
  color: #2E8B57;
}

.key-step-card.worst .step-card-header {
  color: #DC143C;
}

.step-desc {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.5;
}

.step-detail-row {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.step-error {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  display: inline-block;
}

.step-error.good {
  background: #E8F5E9;
  color: #2E8B57;
}

.step-error.bad {
  background: #FFEBEE;
  color: #DC143C;
}

.step-suggestion {
  margin-top: 10px;
  padding: 10px;
  background: rgba(255, 215, 0, 0.15);
  border-radius: 8px;
  font-size: 12px;
  color: #8B6914;
  line-height: 1.5;
}

.steps-section {
  border-top: 1px solid #F0F0F0;
  padding-top: 24px;
}

.steps-timeline {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #EEE;
  border-radius: 10px;
  padding: 8px;
  background: #FAFAFA;
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all 0.2s ease;
  background: #FFF;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item.max-error {
  background: #FFF0F5;
  border-left: 4px solid #DC143C;
}

.timeline-item.best-step {
  background: #F0FFF0;
  border-left: 4px solid #2E8B57;
}

.timeline-item.complete-step {
  background: #E6E6FA;
  border-left: 4px solid #483D8B;
}

.timeline-item.switch-step {
  opacity: 0.7;
}

.timeline-dot {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot-default {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #CCC;
}

.dot-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #FFF;
}

.dot-badge.best {
  background: #2E8B57;
}

.dot-badge.worst {
  background: #DC143C;
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.step-index {
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.step-type-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 500;
}

.type-add_weight {
  background: #FFE4B5;
  color: #8B4513;
}

.type-remove_weight {
  background: #FFE4E1;
  color: #8B0000;
}

.type-adjust_herb {
  background: #E0FFE0;
  color: #2E8B57;
}

.type-switch_herb {
  background: #E6E6FA;
  color: #483D8B;
}

.type-complete_herb {
  background: #DDA0DD;
  color: #4B0082;
}

.timeline-desc {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
}

.timeline-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-pill {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  background: #F0F0F0;
  color: #666;
}

.detail-pill.error.good {
  background: #E8F5E9;
  color: #2E8B57;
}

.detail-pill.error.warning {
  background: #FFF8DC;
  color: #DAA520;
}

.detail-pill.error.bad {
  background: #FFEBEE;
  color: #DC143C;
}

.no-steps {
  text-align: center;
  padding: 40px;
  color: #BBB;
  font-size: 14px;
}

.good {
  color: #2E8B57;
}

.warning {
  color: #DAA520;
}

.bad {
  color: #DC143C;
}
</style>
