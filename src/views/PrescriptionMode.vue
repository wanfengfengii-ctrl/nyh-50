<template>
  <div class="prescription-mode-page">
    <div class="page-header">
      <div class="header-top">
        <h2 class="page-title">处方配伍模式</h2>
        <div class="header-right">
          <template v-if="prescriptionStore.isStarted && !prescriptionStore.isCompleted">
            <div class="progress-info">
              <span>进度：{{ prescriptionStore.completedHerbs }} / {{ prescriptionStore.herbs.length }} 味</span>
              <span class="timer" :class="{ warning: isTimeWarning }">
                <n-icon :component="TimeOutline" />
                <span>{{ formatTime(prescriptionStore.timeRemaining) }}</span>
              </span>
            </div>
          </template>
        </div>
      </div>
      <div v-if="prescriptionStore.isStarted && !prescriptionStore.isCompleted" class="progress-bar">
        <n-progress 
          type="line" 
          :percentage="prescriptionStore.totalProgress" 
          :show-indicator="true"
          :indicator-placement="'inside'"
          color="#8B4513"
          rail-color="#FAEBD7"
        />
      </div>
    </div>

    <!-- 开始选择页面 -->
    <div v-if="!prescriptionStore.isStarted && !prescriptionStore.isCompleted" class="start-screen">
      <div class="prescription-list">
        <h3 class="list-title">选择处方</h3>
        <p class="list-desc">按处方同时称量多味药材，共享同一组砝码完成整张处方</p>
        <div class="prescription-cards">
          <div
            v-for="(p, index) in prescriptionStore.prescriptions"
            :key="p.id"
            class="prescription-card"
            :class="{ active: prescriptionStore.currentPrescriptionIndex === index }"
            @click="prescriptionStore.selectPrescription(index)"
          >
            <div class="card-header">
              <h4 class="prescription-name">{{ p.name }}</h4>
              <span class="herb-count-badge">{{ p.herbs.length }} 味药</span>
            </div>
            <p class="prescription-desc">{{ p.description }}</p>
            <div class="herb-preview">
              <div
                v-for="h in p.herbs"
                :key="h.id"
                class="herb-chip"
                :style="{ background: h.color + '33', borderColor: h.color }"
              >
                <span class="herb-chip-name">{{ h.herbName }}</span>
                <span class="herb-chip-target">{{ h.targetWeight }}钱</span>
              </div>
            </div>
            <div class="card-footer">
              <span class="time-limit">
                <n-icon :component="TimeOutline" />
                {{ formatTime(p.timeLimit) }}
              </span>
            </div>
          </div>
        </div>
        <div class="start-actions">
          <n-button 
            type="primary" 
            size="large" 
            @click="startPrescription"
            color="#8B4513"
          >
            <template #icon>
              <n-icon :component="PlayOutline" />
            </template>
            开始配药
          </n-button>
        </div>
      </div>
    </div>

    <!-- 完成页面 -->
    <div v-else-if="prescriptionStore.isCompleted && result" class="result-screen">
      <div class="result-container">
        <div class="result-header-card">
          <div class="result-icon" :class="resultClass">
            <n-icon size="56" :component="resultIcon" />
          </div>
          <div class="result-title-section">
            <h3 class="result-title">{{ resultTitle }}</h3>
            <p class="result-prescription-name">{{ prescriptionStore.currentPrescription?.name }}</p>
          </div>
          <div class="result-score-section">
            <div class="total-score">
              <span class="score-num">{{ result.totalScore }}</span>
              <span class="score-total"> / {{ result.maxScore }}</span>
            </div>
            <div class="score-percent">
              得分率：{{ scorePercent }}%
            </div>
            <div class="time-used">
              用时：{{ formatTime(result.totalTimeUsed) }}
            </div>
          </div>
        </div>

        <div class="herb-results-section">
          <h4 class="section-header">各味药材得分</h4>
          <div class="herb-results-grid">
            <div
              v-for="(hr, index) in result.herbResults"
              :key="hr.herb.id"
              class="herb-result-card"
              :class="{ 
                best: index === result.bestHerbIndex,
                worst: index === result.worstHerbIndex
              }"
            >
              <div class="herb-result-header">
                <div class="herb-result-color" :style="{ background: hr.herb.color }"></div>
                <span class="herb-result-name">{{ hr.herb.herbName }}</span>
                <template v-if="index === result.bestHerbIndex">
                  <n-tag type="success" round size="small">最佳</n-tag>
                </template>
                <template v-else-if="index === result.worstHerbIndex">
                  <n-tag type="warning" round size="small">待改进</n-tag>
                </template>
              </div>
              <div class="herb-result-body">
                <div class="herb-score-row">
                  <span class="herb-score">{{ hr.score }} 分</span>
                  <n-progress 
                    type="line" 
                    :percentage="hr.score" 
                    :show-indicator="false"
                    :color="hr.score >= 80 ? '#2E8B57' : hr.score >= 60 ? '#DAA520' : '#DC143C'"
                    rail-color="#F5F5F5"
                    style="flex: 1"
                  />
                </div>
                <div class="herb-detail-row">
                  <span>目标：{{ hr.herb.targetWeight }}钱</span>
                  <span>误差：<span :class="getErrorClass(hr.finalError, hr.herb.allowedError)">
                    {{ formatError(hr.finalError) }}
                  </span></span>
                </div>
                <div class="herb-detail-row">
                  <span>数量：{{ hr.herb.herbCount }} 味</span>
                  <span>砝码：{{ hr.herb.placedWeights.map(w => w.name).join('+') || '无' }}</span>
                </div>
                <div v-if="hr.bestStepIndex >= 0 && hr.history.length > 0" class="step-highlight best-step">
                  <n-icon :component="CheckmarkCircleOutline" />
                  <span>最佳步骤：{{ hr.history[hr.bestStepIndex]?.description }}</span>
                </div>
                <div v-if="hr.worstStepIndex >= 0 && hr.history.length > 0" class="step-highlight worst-step">
                  <n-icon :component="AlertCircleOutline" />
                  <span>最大误差步骤：{{ hr.history[hr.worstStepIndex]?.description }} 
                    (误差 {{ formatError(hr.history[hr.worstStepIndex]?.error || 0) }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <n-button @click="restart">
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
            再来一次
          </n-button>
          <n-button 
            type="primary" 
            color="#483D8B"
            @click="goToReview"
          >
            <template #icon>
              <n-icon :component="BookOutline" />
            </template>
            查看复盘
          </n-button>
        </div>
      </div>
    </div>

    <!-- 游戏主页面 -->
    <div v-else class="main-content">
      <!-- 药味列表 -->
      <div class="herbs-sidebar">
        <div class="sidebar-header">
          <h4 class="sidebar-title">处方药材</h4>
          <span class="sidebar-hint">点击切换称量</span>
        </div>
        <div class="herbs-list">
          <div
            v-for="(herb, index) in prescriptionStore.herbs"
            :key="herb.id"
            class="herb-list-item"
            :class="{ 
              active: index === prescriptionStore.currentHerbIndex,
              completed: herb.completed
            }"
            @click="!herb.completed && prescriptionStore.selectHerb(index)"
          >
            <div class="herb-item-color" :style="{ background: herb.color }"></div>
            <div class="herb-item-info">
              <div class="herb-item-name-row">
                <span class="herb-item-name">{{ herb.herbName }}</span>
                <span v-if="herb.completed" class="completed-badge">
                  <n-icon size="14" :component="CheckmarkCircleOutline" />
                </span>
              </div>
              <div class="herb-item-target">
                目标：{{ herb.targetWeight }}钱
                <span class="error-tip">(±{{ herb.allowedError }}钱)</span>
              </div>
              <div v-if="herb.completed" class="herb-item-result">
                <span class="herb-item-score">{{ herb.score }}分</span>
                <span :class="getErrorClass(herb.finalError, herb.allowedError)">
                  {{ formatError(herb.finalError) }}
                </span>
              </div>
              <div v-else-if="index === prescriptionStore.currentHerbIndex" class="herb-item-current">
                当前称量中...
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中心区域 -->
      <div class="center-area">
        <!-- 当前药材信息卡片 -->
        <div v-if="currentHerb" class="current-herb-card">
          <div class="current-herb-header">
            <div class="current-herb-color" :style="{ background: currentHerb.color }"></div>
            <div class="current-herb-text">
              <span class="current-herb-label">正在称量</span>
              <span class="current-herb-name">{{ currentHerb.herbName }}</span>
            </div>
            <div class="current-target">
              <span class="target-label">目标重量</span>
              <span class="target-value">{{ currentHerb.targetWeight }} 钱</span>
              <span class="target-error">±{{ currentHerb.allowedError }}钱</span>
            </div>
          </div>
          <div class="current-status-row">
            <div class="status-item">
              <span class="status-label">砝码</span>
              <span class="status-value">{{ prescriptionStore.leftWeight.toFixed(1) }} 钱</span>
            </div>
            <div class="status-item">
              <span class="status-label">药材</span>
              <span class="status-value">{{ prescriptionStore.rightWeight.toFixed(1) }} 钱</span>
            </div>
            <div class="status-item error-item" :class="{
              good: prescriptionStore.isCurrentBalanced,
              warning: !prescriptionStore.isCurrentBalanced && prescriptionStore.currentErrorPercentage < 10,
              bad: prescriptionStore.currentErrorPercentage >= 10
            }">
              <span class="status-label">误差</span>
              <span class="status-value">{{ formatError(prescriptionStore.currentError) }}</span>
            </div>
          </div>
        </div>

        <!-- 秤杆模拟 -->
        <PrescriptionScale />

        <!-- 药材数量控制 -->
        <div v-if="currentHerb" class="herb-control-card">
          <div class="control-row">
            <label class="control-label">药材数量 (单味 {{ currentHerb.unitWeight }}钱)</label>
            <div class="control-buttons">
              <n-button 
                circle 
                size="large" 
                @click="decreaseHerb"
                :disabled="prescriptionStore.currentHerbCount <= 0 || currentHerb.completed"
              >
                -
              </n-button>
              <span class="count-display">{{ prescriptionStore.currentHerbCount }}</span>
              <n-button 
                circle 
                size="large" 
                @click="increaseHerb"
                :disabled="currentHerb.completed"
              >
                +
              </n-button>
            </div>
          </div>
          <div class="complete-btn-row">
            <n-button 
              type="primary" 
              size="large" 
              block
              @click="completeHerb"
              :disabled="currentHerb.completed || !prescriptionStore.isCurrentBalanced"
              :color="prescriptionStore.isCurrentBalanced ? '#2E8B57' : '#DAA520'"
            >
              <template #icon>
                <n-icon :component="CheckmarkCircleOutline" />
              </template>
              {{ currentHerb.completed ? '已完成' : '确认此味药材' }}
              <span v-if="!prescriptionStore.isCurrentBalanced && !currentHerb.completed" class="btn-hint">
                (误差超出允许范围，无法确认)
              </span>
            </n-button>
          </div>
        </div>
      </div>

      <!-- 砝码面板 -->
      <div class="weights-panel">
        <PrescriptionWeights />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrescriptionStore } from '@/stores/prescription'
import PrescriptionScale from '@/components/PrescriptionScale.vue'
import PrescriptionWeights from '@/components/PrescriptionWeights.vue'
import { 
  TrophyOutline, 
  CheckmarkCircleOutline, 
  TimeOutline,
  SadOutline,
  PlayOutline,
  RefreshOutline,
  BookOutline,
  AlertCircleOutline
} from '@vicons/ionicons5'

const router = useRouter()
const prescriptionStore = usePrescriptionStore()

const currentHerb = computed(() => prescriptionStore.currentHerb)
const result = computed(() => prescriptionStore.lastResult)

const isTimeWarning = computed(() => prescriptionStore.timeRemaining <= 30)

const scorePercent = computed(() => {
  if (!result.value || result.value.maxScore === 0) return 0
  return Math.round((result.value.totalScore / result.value.maxScore) * 100)
})

const resultClass = computed(() => {
  if (scorePercent.value >= 80) return 'excellent'
  if (scorePercent.value >= 60) return 'pass'
  return 'fail'
})

const resultIcon = computed(() => {
  return scorePercent.value >= 60 ? TrophyOutline : SadOutline
})

const resultTitle = computed(() => {
  if (scorePercent.value >= 90) return '配药精湛！'
  if (scorePercent.value >= 80) return '表现优秀！'
  if (scorePercent.value >= 60) return '处方完成'
  return '继续加油！'
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

function getErrorClass(error: number, allowed: number): string {
  const absError = Math.abs(error)
  if (absError <= allowed) return 'error-good'
  if (absError <= allowed * 2) return 'error-warning'
  return 'error-bad'
}

function startPrescription() {
  prescriptionStore.startPrescription()
}

function increaseHerb() {
  prescriptionStore.setHerbCount(prescriptionStore.currentHerbCount + 1)
}

function decreaseHerb() {
  if (prescriptionStore.currentHerbCount > 0) {
    prescriptionStore.setHerbCount(prescriptionStore.currentHerbCount - 1)
  }
}

function completeHerb() {
  prescriptionStore.completeCurrentHerb()
}

function restart() {
  prescriptionStore.startPrescription()
}

function goToReview() {
  router.push('/prescription-review')
}

onMounted(() => {
  prescriptionStore.selectPrescription(0)
})
</script>

<style scoped>
.prescription-mode-page {
  min-height: 100%;
  padding: 20px;
}

.page-header {
  max-width: 1400px;
  margin: 0 auto 20px auto;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.page-title {
  font-size: 24px;
  color: #4A2C17;
  margin: 0;
  font-weight: 700;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #6B4423;
  font-weight: 500;
}

.timer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 18px;
  font-weight: bold;
  color: #2E8B57;
  background: #E8F5E9;
  padding: 6px 16px;
  border-radius: 20px;
}

.timer.warning {
  color: #DC143C;
  background: #FFF0F5;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 开始选择页面 */
.start-screen {
  max-width: 1200px;
  margin: 0 auto;
}

.prescription-list {
  background: #FFF;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #DEB887;
}

.list-title {
  font-size: 28px;
  color: #4A2C17;
  margin: 0 0 8px 0;
  text-align: center;
  font-weight: 700;
}

.list-desc {
  text-align: center;
  color: #8B7355;
  margin: 0 0 32px 0;
}

.prescription-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.prescription-card {
  background: #FFFAF0;
  border: 2px solid #DEB887;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.prescription-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(139, 69, 19, 0.15);
}

.prescription-card.active {
  border-color: #8B4513;
  background: #FFF8DC;
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.prescription-name {
  font-size: 20px;
  color: #4A2C17;
  margin: 0;
  font-weight: 600;
}

.herb-count-badge {
  background: #8B4513;
  color: #FFF8DC;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.prescription-desc {
  font-size: 13px;
  color: #8B7355;
  margin: 0 0 16px 0;
}

.herb-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.herb-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid;
}

.herb-chip-name {
  font-size: 12px;
  color: #4A2C17;
  font-weight: 500;
}

.herb-chip-target {
  font-size: 11px;
  color: #8B7355;
}

.card-footer {
  border-top: 1px dashed #DEB887;
  padding-top: 12px;
}

.time-limit {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6B4423;
  font-weight: 500;
}

.start-actions {
  display: flex;
  justify-content: center;
}

/* 游戏主页面 */
.main-content {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: flex-start;
}

.herbs-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: #FFF8DC;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #DEB887;
}

.sidebar-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #DEB887;
}

.sidebar-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #4A2C17;
  font-weight: 600;
}

.sidebar-hint {
  font-size: 11px;
  color: #8B7355;
}

.herbs-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.herb-list-item {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: #FFFAF0;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.herb-list-item:hover:not(.completed) {
  border-color: #DEB887;
  background: #FFF8DC;
}

.herb-list-item.active {
  border-color: #8B4513;
  background: #FFF8DC;
  box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
}

.herb-list-item.completed {
  opacity: 0.7;
  cursor: default;
  background: #F5F5F5;
}

.herb-item-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  border: 1px solid rgba(0,0,0,0.1);
}

.herb-item-info {
  flex: 1;
  min-width: 0;
}

.herb-item-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.herb-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #4A2C17;
}

.completed-badge {
  color: #2E8B57;
  display: flex;
}

.herb-item-target {
  font-size: 12px;
  color: #8B7355;
  margin-top: 4px;
}

.error-tip {
  color: #B8860B;
  font-size: 11px;
}

.herb-item-result {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
}

.herb-item-score {
  font-weight: 600;
  color: #2E8B57;
}

.herb-item-current {
  margin-top: 6px;
  font-size: 12px;
  color: #8B4513;
  font-weight: 500;
  font-style: italic;
}

.center-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.current-herb-card {
  width: 100%;
  max-width: 720px;
  background: linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 100%);
  border-radius: 12px;
  padding: 16px 20px;
  border: 2px solid #DAA520;
}

.current-herb-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.current-herb-color {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 2px solid rgba(0,0,0,0.1);
}

.current-herb-text {
  flex: 1;
}

.current-herb-label {
  display: block;
  font-size: 12px;
  color: #8B7355;
}

.current-herb-name {
  font-size: 20px;
  font-weight: bold;
  color: #4A2C17;
}

.current-target {
  text-align: right;
}

.target-label {
  display: block;
  font-size: 12px;
  color: #8B7355;
}

.target-value {
  font-size: 24px;
  font-weight: bold;
  color: #4A2C17;
  margin-right: 6px;
}

.target-error {
  font-size: 12px;
  color: #B8860B;
}

.current-status-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.status-item {
  background: rgba(255,255,255,0.5);
  padding: 10px;
  border-radius: 8px;
  text-align: center;
}

.status-label {
  display: block;
  font-size: 11px;
  color: #8B7355;
  margin-bottom: 4px;
}

.status-value {
  font-size: 18px;
  font-weight: bold;
  color: #4A2C17;
}

.error-item.good .status-value {
  color: #2E8B57;
}

.error-item.warning .status-value {
  color: #DAA520;
}

.error-item.bad .status-value {
  color: #DC143C;
}

.herb-control-card {
  width: 100%;
  max-width: 720px;
  background: #F5FFFA;
  border-radius: 12px;
  padding: 16px 20px;
  border: 2px solid #90EE90;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.control-label {
  font-size: 14px;
  color: #2E8B57;
  font-weight: 500;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 20px;
}

.count-display {
  font-size: 28px;
  font-weight: bold;
  color: #2E8B57;
  min-width: 60px;
  text-align: center;
}

.btn-hint {
  font-size: 12px;
  margin-left: 8px;
  opacity: 0.9;
}

.weights-panel {
  width: 280px;
  flex-shrink: 0;
}

/* 完成页面 */
.result-screen {
  max-width: 1200px;
  margin: 0 auto;
}

.result-container {
  background: #FFF;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #DAA520;
}

.result-header-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 2px dashed #DEB887;
  margin-bottom: 24px;
}

.result-icon {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-icon.excellent {
  background: #E8F5E9;
  color: #2E8B57;
}

.result-icon.pass {
  background: #FFF8DC;
  color: #DAA520;
}

.result-icon.fail {
  background: #FFF0F5;
  color: #DC143C;
}

.result-title-section {
  flex: 1;
}

.result-title {
  font-size: 28px;
  color: #4A2C17;
  margin: 0 0 4px 0;
  font-weight: 700;
}

.result-prescription-name {
  margin: 0;
  color: #8B7355;
  font-size: 16px;
}

.result-score-section {
  text-align: right;
}

.total-score {
  margin-bottom: 4px;
}

.score-num {
  font-size: 56px;
  font-weight: bold;
  color: #DAA520;
  line-height: 1;
}

.score-total {
  font-size: 24px;
  color: #999;
}

.score-percent {
  font-size: 14px;
  color: #8B7355;
  margin-bottom: 4px;
}

.time-used {
  font-size: 13px;
  color: #8B7355;
}

.section-header {
  font-size: 20px;
  color: #4A2C17;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.herb-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.herb-result-card {
  background: #FFFAF0;
  border: 2px solid #DEB887;
  border-radius: 14px;
  padding: 16px;
  transition: all 0.2s ease;
}

.herb-result-card.best {
  border-color: #2E8B57;
  background: #F0FFF0;
  box-shadow: 0 0 0 3px rgba(46, 139, 87, 0.1);
}

.herb-result-card.worst {
  border-color: #DAA520;
  background: #FFF8DC;
}

.herb-result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #DEB887;
}

.herb-result-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.1);
}

.herb-result-name {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #4A2C17;
}

.herb-result-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.herb-score-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.herb-score {
  font-size: 20px;
  font-weight: bold;
  min-width: 60px;
  color: #4A2C17;
}

.herb-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6B4423;
}

.error-good {
  color: #2E8B57;
  font-weight: 600;
}

.error-warning {
  color: #DAA520;
  font-weight: 600;
}

.error-bad {
  color: #DC143C;
  font-weight: 600;
}

.step-highlight {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
}

.best-step {
  background: #E8F5E9;
  color: #2E8B57;
}

.worst-step {
  background: #FFF8DC;
  color: #B8860B;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  border-top: 2px dashed #DEB887;
}
</style>
