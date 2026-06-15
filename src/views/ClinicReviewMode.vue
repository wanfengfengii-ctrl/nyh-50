<template>
  <div class="clinic-review-container">
    <div class="header-section">
      <n-card class="header-card" :bordered="false">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">药房接诊记录</h1>
            <p class="page-subtitle">回顾你的接诊历史，总结经验，提升医术</p>
          </div>
          <div class="stats-overview">
            <div class="overview-stat">
              <div class="stat-icon">📋</div>
              <div class="stat-info">
                <span class="stat-value">{{ totalSessions }}</span>
                <span class="stat-label">总接诊数</span>
              </div>
            </div>
            <div class="overview-stat">
              <div class="stat-icon">⭐</div>
              <div class="stat-info">
                <span class="stat-value">{{ avgScore }}%</span>
                <span class="stat-label">平均得分</span>
              </div>
            </div>
            <div class="overview-stat">
              <div class="stat-icon">🏆</div>
              <div class="stat-info">
                <span class="stat-value">{{ bestRating }}</span>
                <span class="stat-label">最高评级</span>
              </div>
            </div>
            <div class="overview-stat">
              <div class="stat-icon">⏱️</div>
              <div class="stat-info">
                <span class="stat-value">{{ avgTime }}</span>
                <span class="stat-label">平均用时</span>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <div class="content-grid">
      <div class="left-column">
        <n-card title="接诊评级分布" :bordered="false" class="ratings-card">
          <div class="ratings-chart">
            <div v-for="rating in ratingOrder" :key="rating" class="rating-bar-item">
              <div class="rating-label">
                <span class="rating-badge" :class="'rating-' + rating.toLowerCase()">{{ rating }}</span>
                <span class="rating-count">{{ ratingStats[rating] || 0 }}次</span>
              </div>
              <div class="rating-bar-container">
                <div 
                  class="rating-bar" 
                  :class="'rating-' + rating.toLowerCase()"
                  :style="{ width: getRatingPercentage(rating) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </n-card>

        <n-card title="能力分析" :bordered="false" class="analysis-card">
          <div class="analysis-list">
            <div class="analysis-item">
              <div class="analysis-header">
                <span class="analysis-name">优先级判断</span>
                <span class="analysis-score">{{ priorityAccuracy }}%</span>
              </div>
              <n-progress 
                type="line" 
                :percentage="priorityAccuracy" 
                :color="'#2E8B57'"
                :rail-color="'#E8F5E9'"
                :height="8"
                :show-indicator="false"
              />
            </div>
            <div class="analysis-item">
              <div class="analysis-header">
                <span class="analysis-name">处方选择</span>
                <span class="analysis-score">{{ prescriptionAccuracy }}%</span>
              </div>
              <n-progress 
                type="line" 
                :percentage="prescriptionAccuracy" 
                :color="'#4169E1'"
                :rail-color="'#E3F2FD'"
                :height="8"
                :show-indicator="false"
              />
            </div>
            <div class="analysis-item">
              <div class="analysis-header">
                <span class="analysis-name">称量精度</span>
                <span class="analysis-score">{{ weighingAccuracy }}%</span>
              </div>
              <n-progress 
                type="line" 
                :percentage="weighingAccuracy" 
                :color="'#CD853F'"
                :rail-color="'#FFF8DC'"
                :height="8"
                :show-indicator="false"
              />
            </div>
            <div class="analysis-item">
              <div class="analysis-header">
                <span class="analysis-name">效率速度</span>
                <span class="analysis-score">{{ speedScore }}%</span>
              </div>
              <n-progress 
                type="line" 
                :percentage="speedScore" 
                :color="'#9370DB'"
                :rail-color="'#F3E5F5'"
                :height="8"
                :show-indicator="false"
              />
            </div>
          </div>
        </n-card>
      </div>

      <div class="right-column">
        <n-card title="历史接诊记录" :bordered="false" class="sessions-card">
          <template #header-extra>
            <n-button size="small" @click="clearSessions" :disabled="!sessions.length">
              <template #icon>
                <n-icon :component="RefreshOutline" />
              </template>
              清空记录
            </n-button>
          </template>
          
          <div v-if="!sessions.length" class="empty-state">
            <n-empty description="暂无接诊记录，快去药房接诊吧！" />
            <n-button type="primary" style="margin-top: 16px" @click="goToClinic">
              <template #icon>
                <n-icon :component="PlayOutline" />
              </template>
              开始接诊
            </n-button>
          </div>

          <div v-else class="sessions-list">
            <div v-for="(session, index) in sortedSessions" :key="session.id" 
              class="session-item" :class="{ active: selectedSessionId === session.id }"
              @click="toggleSession(session.id)">
              <div class="session-header">
                <div class="session-left">
                  <span class="rating-badge" :class="'rating-' + session.rating.toLowerCase()">{{ session.rating }}</span>
                  <div class="session-info">
                    <span class="patient-name">{{ session.order.patientName }}</span>
                    <span class="patient-disease">{{ session.order.diseaseName }}</span>
                  </div>
                </div>
                <div class="session-right">
                  <span class="session-score" :class="getScoreClass(session.scorePercentage)">
                    {{ Math.round(session.scorePercentage) }}分
                  </span>
                </div>
              </div>
              <div class="session-meta">
                <span class="meta-item">
                  <n-icon :component="TimeOutline" size="12" /> 
                  {{ formatTime(session.totalTime) }}
                </span>
                <span class="meta-item">
                  <n-icon :component="TrophyOutline" size="12" /> 
                  +{{ session.xpEarned }} XP
                </span>
                <span class="meta-item">
                  <n-icon :component="BookOutline" size="12" /> 
                  {{ formatDate(session.endTime) }}
                </span>
              </div>

              <div v-if="selectedSessionId === session.id" class="session-detail">
                <n-divider style="margin: 12px 0" />
                
                <div class="detail-section">
                  <h4 class="detail-title">诊断结果</h4>
                  <div class="decision-grid">
                    <div class="decision-item">
                      <span class="decision-label">优先级判断</span>
                      <span class="decision-value" :class="{ correct: session.priorityJudgment.isCorrect, wrong: !session.priorityJudgment.isCorrect }">
                        {{ session.priorityJudgment.isCorrect ? '✓ 正确' : '✗ 错误' }}
                        <span class="decision-detail">
                          (选了{{ getPriorityLabel(session.priorityJudgment.selectedPriority) }}级，正确{{ getUrgencyLabel(session.order.urgencyLevel) }})
                        </span>
                      </span>
                    </div>
                    <div class="decision-item">
                      <span class="decision-label">处方选择</span>
                      <span class="decision-value" :class="{ correct: session.prescriptionSelection.isCorrect, wrong: !session.prescriptionSelection.isCorrect }">
                        {{ session.prescriptionSelection.isCorrect ? '✓ 正确' : '✗ 错误' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="detail-section">
                  <h4 class="detail-title">药材称量结果</h4>
                  <div class="herb-results">
                    <div v-for="(herb, hIdx) in session.herbResults" :key="hIdx" class="herb-result-item">
                      <div class="herb-result-header">
                        <span class="herb-name">{{ herb.herbName }}（目标{{ herb.targetWeight }}钱）</span>
                        <span class="herb-score">{{ herb.score }}分</span>
                      </div>
                      <div class="herb-detail">
                        <span>实际：{{ herb.finalWeight.toFixed(2) }}钱</span>
                        <span>误差：{{ getErrorPercentage(herb).toFixed(1) }}%</span>
                        <span v-if="herb.skipped" class="skipped-badge">跳过</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="detail-section">
                  <h4 class="detail-title">病例复盘</h4>
                  <div class="case-review">
                    <div class="review-summary">
                      <span class="review-label">总结</span>
                      <p>{{ session.caseReview.summary }}</p>
                    </div>
                    <div class="review-highlights">
                      <span class="review-label">亮点</span>
                      <ul>
                        <li v-for="(h, i) in session.caseReview.highlights" :key="i">{{ h }}</li>
                      </ul>
                    </div>
                    <div class="review-weakpoints">
                      <span class="review-label">不足</span>
                      <ul>
                        <li v-for="(w, i) in session.caseReview.weakPoints" :key="i">{{ w }}</li>
                      </ul>
                    </div>
                    <div class="review-suggestions">
                      <span class="review-label">建议</span>
                      <ul>
                        <li v-for="(s, i) in session.caseReview.suggestions" :key="i">{{ s }}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div class="session-actions">
                  <n-button type="primary" size="small" @click="goToClinic">
                    <template #icon>
                      <n-icon :component="PlayOutline" />
                    </template>
                    继续接诊
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClinicStore } from '@/stores/clinic'
import { URGENCY_CONFIG, CLINIC_RATING_CONFIG } from '@/constants'
import type { ClinicRating, UrgencyLevel, ClinicHerbResult } from '@/types'
import {
  TimeOutline,
  TrophyOutline,
  PlayOutline,
  RefreshOutline,
  BookOutline,
  AlertCircleOutline
} from '@vicons/ionicons5'
import {
  NCard, NProgress, NEmpty, NDivider, NButton, NIcon
} from 'naive-ui'

const router = useRouter()
const clinicStore = useClinicStore()

const selectedSessionId = ref<string | null>(null)

const sessions = computed(() => clinicStore.sessionResults)
const sortedSessions = computed(() => [...sessions.value].sort((a, b) => b.endTime - a.endTime))

const totalSessions = computed(() => sessions.value.length)

const avgScore = computed(() => {
  if (!sessions.value.length) return 0
  const total = sessions.value.reduce((sum, s) => sum + s.scorePercentage, 0)
  return Math.round(total / sessions.value.length)
})

const bestRating = computed(() => {
  if (!sessions.value.length) return '-'
  const ratings: ClinicRating[] = ['S', 'A', 'B', 'C', 'D']
  for (const r of ratings) {
    if (sessions.value.some(s => s.rating === r)) {
      return r
    }
  }
  return '-'
})

const avgTime = computed(() => {
  if (!sessions.value.length) return '0秒'
  const total = sessions.value.reduce((sum, s) => sum + s.totalTime, 0)
  return formatTime(Math.round(total / sessions.value.length))
})

const ratingOrder: ClinicRating[] = ['S', 'A', 'B', 'C', 'D']

const ratingStats = computed(() => {
  const stats: Record<string, number> = {}
  sessions.value.forEach(s => {
    stats[s.rating] = (stats[s.rating] || 0) + 1
  })
  return stats
})

function getRatingPercentage(rating: ClinicRating): number {
  if (!sessions.value.length) return 0
  return ((ratingStats.value[rating] || 0) / sessions.value.length) * 100
}

const priorityAccuracy = computed(() => {
  if (!sessions.value.length) return 0
  const correct = sessions.value.filter(s => s.priorityJudgment.isCorrect).length
  return Math.round((correct / sessions.value.length) * 100)
})

const prescriptionAccuracy = computed(() => {
  if (!sessions.value.length) return 0
  const correct = sessions.value.filter(s => s.prescriptionSelection.isCorrect).length
  return Math.round((correct / sessions.value.length) * 100)
})

const weighingAccuracy = computed(() => {
  if (!sessions.value.length) return 0
  let totalHerbs = 0
  let totalScore = 0
  sessions.value.forEach(s => {
    s.herbResults.forEach(h => {
      totalHerbs++
      totalScore += h.score
    })
  })
  if (!totalHerbs) return 0
  return Math.round((totalScore / (totalHerbs * 100)) * 100)
})

const speedScore = computed(() => {
  if (!sessions.value.length) return 0
  let totalTimeScore = 0
  sessions.value.forEach(s => {
    const timeLimit = s.order.timeLimit
    const timeRatio = Math.max(0, 1 - s.totalTime / timeLimit)
    totalTimeScore += timeRatio * 100
  })
  return Math.round(totalTimeScore / sessions.value.length)
})

function toggleSession(id: string) {
  selectedSessionId.value = selectedSessionId.value === id ? null : id
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

function getUrgencyLabel(level: UrgencyLevel | null): string {
  if (!level) return '未知'
  return URGENCY_CONFIG[level]?.label || level
}

function getPriorityLabel(priority: number | null): string {
  if (!priority) return '未知'
  const labels: Record<number, string> = {
    1: '一',
    2: '二',
    3: '三',
    4: '四'
  }
  return labels[priority] || String(priority)
}

function getErrorPercentage(herb: ClinicHerbResult): number {
  if (herb.targetWeight === 0) return 0
  return (Math.abs(herb.finalError) / herb.targetWeight) * 100
}

function formatTime(seconds: number): string {
  if (!seconds) return '0秒'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function formatDate(dateNum: number): string {
  const d = new Date(dateNum)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function clearSessions() {
  if (confirm('确定要清空所有接诊记录吗？此操作不可恢复。')) {
    clinicStore.clearSessionHistory()
    selectedSessionId.value = null
  }
}

function goToClinic() {
  router.push('/clinic')
}
</script>

<style scoped>
.clinic-review-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-section .header-card {
  background: linear-gradient(135deg, #FFFAF0 0%, #FFF8DC 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.title-section {
  flex: 1;
  min-width: 250px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #4A2C17;
  font-weight: 700;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: #8B7355;
}

.stats-overview {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.overview-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(139, 69, 19, 0.1);
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #4A2C17;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #8B7355;
}

.content-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
}

.left-column, .right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ratings-card, .analysis-card, .sessions-card {
  background: #FFFCF5;
}

.ratings-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rating-bar-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rating-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rating-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 18px;
  color: #FFF;
}

.rating-s {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.rating-a {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.rating-b {
  background: linear-gradient(135deg, #2196F3, #1565C0);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.rating-c {
  background: linear-gradient(135deg, #FF9800, #E65100);
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.rating-d {
  background: linear-gradient(135deg, #F44336, #B71C1C);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.rating-count {
  font-size: 13px;
  color: #6B4423;
  font-weight: 500;
}

.rating-bar-container {
  height: 8px;
  background: #F5F0E8;
  border-radius: 4px;
  overflow: hidden;
}

.rating-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.analysis-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.analysis-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.analysis-name {
  font-weight: 500;
  color: #5D4037;
}

.analysis-score {
  font-weight: 600;
  color: #8B4513;
}

.empty-state {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 800px;
  overflow-y: auto;
  padding-right: 4px;
}

.session-item {
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(139, 69, 19, 0.1);
  background: #FFFCF5;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  border-color: #CD853F;
  background: #FFF8DC;
}

.session-item.active {
  border-color: #8B4513;
  background: #FFF8DC;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.12);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.session-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.patient-name {
  font-weight: 600;
  color: #5D4037;
  font-size: 15px;
}

.patient-disease {
  font-size: 12px;
  color: #8B7355;
}

.session-score {
  font-weight: 700;
  font-size: 20px;
  padding: 4px 12px;
  border-radius: 8px;
}

.session-score.excellent {
  background: #d4edda;
  color: #155724;
}

.session-score.good {
  background: #cce5ff;
  color: #004085;
}

.session-score.pass {
  background: #fff3cd;
  color: #856404;
}

.session-score.fail {
  background: #f8d7da;
  color: #721c24;
}

.session-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8B7355;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.session-detail {
  margin-top: 4px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-title {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #5D4037;
}

.decision-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.decision-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.decision-label {
  font-size: 12px;
  color: #8B7355;
}

.decision-value {
  font-size: 14px;
  font-weight: 600;
}

.decision-value.correct {
  color: #2E7D32;
}

.decision-value.wrong {
  color: #C62828;
}

.decision-detail {
  font-size: 11px;
  font-weight: normal;
  color: #8B7355;
  margin-left: 4px;
}

.herb-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.herb-result-item {
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.herb-result-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.herb-name {
  font-weight: 600;
  color: #5D4037;
}

.herb-score {
  font-weight: 600;
  color: #8B4513;
}

.herb-detail {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #8B7355;
}

.skipped-badge {
  color: #FF9800;
  font-weight: 500;
}

.case-review {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 12px;
}

.review-summary,
.review-highlights,
.review-weakpoints,
.review-suggestions {
  margin-bottom: 10px;
}

.review-summary:last-child,
.review-highlights:last-child,
.review-weakpoints:last-child,
.review-suggestions:last-child {
  margin-bottom: 0;
}

.review-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.review-summary .review-label {
  background: #E3F2FD;
  color: #1565C0;
}

.review-highlights .review-label {
  background: #E8F5E9;
  color: #2E7D32;
}

.review-weakpoints .review-label {
  background: #FFEBEE;
  color: #C62828;
}

.review-suggestions .review-label {
  background: #FFF8E1;
  color: #F57F17;
}

.case-review p {
  margin: 0;
  font-size: 13px;
  color: #6B4423;
  line-height: 1.6;
}

.case-review ul {
  margin: 0;
  padding-left: 18px;
}

.case-review li {
  font-size: 13px;
  color: #6B4423;
  line-height: 1.6;
}

.session-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stats-overview {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .clinic-review-container {
    padding: 16px;
  }
  
  .page-title {
    font-size: 22px;
  }
  
  .stats-overview {
    gap: 12px;
  }
  
  .overview-stat {
    padding: 8px 12px;
    gap: 8px;
  }
  
  .stat-icon {
    font-size: 24px;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  .decision-grid {
    grid-template-columns: 1fr;
  }
}
</style>
