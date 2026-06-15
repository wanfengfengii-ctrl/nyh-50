<template>
  <div class="clinic-mode-page">
    <div class="page-header">
      <div class="header-top">
        <h2 class="page-title">药房接诊模式</h2>
        <div class="header-right">
          <template v-if="clinicStore.isStarted && !clinicStore.isCompleted && clinicStore.currentPhase === 'weighing'">
            <div class="progress-info">
              <span>进度：{{ clinicStore.completedHerbs }} / {{ clinicStore.totalHerbs }} 味</span>
              <span class="timer" :class="{ warning: isTimeWarning }">
                <n-icon :component="TimeOutline" />
                <span>{{ formatTime(clinicStore.timeRemaining) }}</span>
              </span>
            </div>
          </template>
        </div>
      </div>
      <div v-if="clinicStore.currentPhase === 'weighing'" class="progress-bar">
        <n-progress 
          type="line" 
          :percentage="weighingProgress" 
          :show-indicator="true"
          :indicator-placement="'inside'"
          color="#8B4513"
          rail-color="#FAEBD7"
        />
      </div>
    </div>

    <!-- 开始页面 -->
    <div v-if="!clinicStore.isStarted" class="start-screen">
      <div class="intro-card">
        <div class="intro-icon">
          <n-icon size="64" :component="AlertCircleOutline" />
        </div>
        <h2 class="intro-title">药房接诊模式</h2>
        <p class="intro-desc">
          模拟真实药房接诊场景，系统随机生成带患者症状、紧急程度和处方要求的接诊单。
          你需要在限定时间内先判断优先级，再从已解锁处方中选择合适方剂，
          按多味药逐项完成称量并提交。系统将综合评估你的接诊能力。
        </p>
        <div class="feature-list">
          <div class="feature-item">
            <n-icon :component="AlertCircleOutline" />
            <span>判断病情优先级</span>
          </div>
          <div class="feature-item">
            <n-icon :component="BookOutline" />
            <span>选择合适方剂</span>
          </div>
          <div class="feature-item">
            <n-icon :component="ScaleOutline" />
            <span>精确称量药材</span>
          </div>
          <div class="feature-item">
            <n-icon :component="TrophyOutline" />
            <span>获得药房评级</span>
          </div>
        </div>
        <div class="start-actions">
          <n-button 
            type="primary" 
            size="large" 
            @click="startClinic"
            color="#8B4513"
          >
            <template #icon>
              <n-icon :component="PlayOutline" />
            </template>
            开始接诊
          </n-button>
        </div>
      </div>
    </div>

    <!-- 接诊单选择页面 -->
    <div v-else-if="clinicStore.currentPhase === 'select_order'" class="order-select-screen">
      <div class="section-header">
        <h3 class="section-title">待接诊患者</h3>
        <p class="section-desc">请选择一位患者开始接诊，注意观察病情紧急程度</p>
      </div>
      <div class="orders-grid">
        <div
          v-for="order in clinicStore.pendingOrders"
          :key="order.id"
          class="order-card"
          :class="[`urgency-${order.urgencyLevel}`]"
          @click="selectOrder(order.id)"
        >
          <div class="order-header">
            <div class="patient-info">
              <span class="patient-name">{{ order.patientName }}</span>
              <span class="patient-detail">{{ order.patientGender }} · {{ order.patientAge }}岁</span>
            </div>
            <n-tag 
              :color="URGENCY_CONFIG[order.urgencyLevel].bgColor"
              :style="{ color: URGENCY_CONFIG[order.urgencyLevel].color, borderColor: URGENCY_CONFIG[order.urgencyLevel].color }"
              round
              size="small"
            >
              {{ URGENCY_CONFIG[order.urgencyLevel].label }}
            </n-tag>
          </div>
          <div class="order-symptoms">
            <span class="symptoms-label">主要症状：</span>
            <div class="symptom-tags">
              <n-tag 
                v-for="symptom in order.symptoms" 
                :key="symptom.id"
                size="small"
                type="info"
              >
                {{ symptom.name }}
              </n-tag>
            </div>
          </div>
          <div class="order-desc">
            <p>{{ order.caseDescription }}</p>
          </div>
          <div class="order-footer">
            <span class="time-limit">
              <n-icon :component="TimeOutline" />
              限时 {{ formatTime(order.timeLimit) }}
            </span>
            <span class="click-hint">点击接诊</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 优先级判断页面 -->
    <div v-else-if="clinicStore.currentPhase === 'judge_priority' && clinicStore.currentOrder" class="priority-judge-screen">
      <div class="patient-info-card">
        <div class="patient-header">
          <div class="patient-avatar">
            <n-icon size="40" :component="BookOutline" />
          </div>
          <div class="patient-info-text">
            <h3 class="patient-name-lg">{{ clinicStore.currentOrder.patientName }}</h3>
            <p class="patient-detail-lg">
              {{ clinicStore.currentOrder.patientGender }} · 
              {{ clinicStore.currentOrder.patientAge }}岁 · 
              {{ URGENCY_CONFIG[clinicStore.currentOrder.urgencyLevel].label }}
            </p>
          </div>
        </div>
        <div class="patient-symptoms-section">
          <h4 class="subsection-title">症状描述</h4>
          <div class="symptom-list">
            <div 
              v-for="symptom in clinicStore.currentOrder.symptoms" 
              :key="symptom.id"
              class="symptom-item"
            >
              <n-icon :component="AlertCircleOutline" />
              <span>{{ symptom.name }}：{{ symptom.description }}</span>
            </div>
          </div>
        </div>
        <div class="case-description-section">
          <h4 class="subsection-title">病情描述</h4>
          <p class="case-text">{{ clinicStore.currentOrder.caseDescription }}</p>
        </div>
        <div class="prescription-req-section">
          <h4 class="subsection-title">处方要求</h4>
          <p class="req-text">{{ clinicStore.currentOrder.prescriptionRequirement }}</p>
        </div>
      </div>

      <div class="priority-select-card">
        <h3 class="priority-title">请判断该患者的接诊优先级</h3>
        <p class="priority-desc">根据病情紧急程度，选择合适的优先级级别</p>
        <div class="priority-buttons">
          <n-button
            v-for="level in priorityLevels"
            :key="level.value"
            :type="selectedPriority === level.value ? 'primary' : 'default'"
            size="large"
            block
            @click="selectedPriority = level.value"
            :color="level.color"
          >
            <div class="priority-btn-content">
              <span class="priority-level">{{ level.label }}</span>
              <span class="priority-desc-sm">{{ level.description }}</span>
            </div>
          </n-button>
        </div>
        <div class="priority-actions">
          <n-button 
            type="primary" 
            size="large"
            :disabled="selectedPriority === null"
            @click="submitPriority"
            color="#8B4513"
          >
            确认判断，进入选方
          </n-button>
        </div>
      </div>
    </div>

    <!-- 处方选择页面 -->
    <div v-else-if="clinicStore.currentPhase === 'select_prescription' && clinicStore.currentOrder" class="prescription-select-screen">
      <div class="patient-info-mini">
        <div class="patient-brief">
          <span class="patient-name-sm">{{ clinicStore.currentOrder.patientName }}</span>
          <n-tag 
            :color="URGENCY_CONFIG[clinicStore.currentOrder.urgencyLevel].bgColor"
            :style="{ color: URGENCY_CONFIG[clinicStore.currentOrder.urgencyLevel].color }"
            round
            size="small"
          >
            {{ URGENCY_CONFIG[clinicStore.currentOrder.urgencyLevel].label }}
          </n-tag>
        </div>
        <div class="patient-symptoms-mini">
          <span 
            v-for="symptom in clinicStore.currentOrder.symptoms.slice(0, 3)" 
            :key="symptom.id"
            class="symptom-chip"
          >
            {{ symptom.name }}
          </span>
        </div>
      </div>

      <div class="prescription-list-section">
        <h3 class="section-title">请选择合适的处方</h3>
        <p class="section-desc">根据患者症状和病情，从已解锁的处方中选择最合适的方剂</p>
        
        <div class="prescription-cards">
          <div
            v-for="prescription in PRESCRIPTIONS"
            :key="prescription.id"
            class="prescription-card"
            :class="{ 
              active: selectedPrescriptionId === prescription.id,
              locked: !isPrescriptionUnlocked(prescription.id)
            }"
            @click="selectPrescription(prescription.id)"
          >
            <div v-if="!isPrescriptionUnlocked(prescription.id)" class="lock-overlay">
              <n-icon size="32" :component="SadOutline" />
              <span>未解锁</span>
            </div>
            <div class="card-header">
              <h4 class="prescription-name">{{ prescription.name }}</h4>
              <span class="herb-count-badge">{{ prescription.herbs.length }} 味药</span>
            </div>
            <p class="prescription-desc">{{ prescription.description }}</p>
            <div class="herb-preview">
              <div
                v-for="h in prescription.herbs"
                :key="h.id"
                class="herb-chip"
                :style="{ background: h.color + '33', borderColor: h.color }"
              >
                <span class="herb-chip-name">{{ h.herbName }}</span>
                <span class="herb-chip-target">{{ h.targetWeight }}钱</span>
              </div>
            </div>
          </div>
        </div>

        <div class="prescription-actions">
          <n-button @click="goBackToPriority">返回重新判断</n-button>
          <n-button 
            type="primary" 
            size="large"
            :disabled="selectedPrescriptionId === null || !isPrescriptionUnlocked(selectedPrescriptionId)"
            @click="submitPrescription"
            color="#8B4513"
          >
            <template #icon>
              <n-icon :component="PlayOutline" />
            </template>
            确认处方，开始称量
          </n-button>
        </div>
      </div>
    </div>

    <!-- 称量页面 -->
    <div v-else-if="clinicStore.currentPhase === 'weighing'" class="weighing-screen">
      <div class="patient-stripe">
        <div class="stripe-left">
          <n-icon :component="BookOutline" />
          <span>{{ clinicStore.currentOrder?.patientName }}</span>
          <n-tag 
            size="small" 
            round
            :color="clinicStore.currentOrder ? URGENCY_CONFIG[clinicStore.currentOrder.urgencyLevel].bgColor : ''"
            :style="clinicStore.currentOrder ? { color: URGENCY_CONFIG[clinicStore.currentOrder.urgencyLevel].color } : {}"
          >
            {{ clinicStore.currentOrder ? URGENCY_CONFIG[clinicStore.currentOrder.urgencyLevel].label : '' }}
          </n-tag>
        </div>
        <div class="stripe-right">
          <span>{{ clinicStore.currentPrescription?.name }}</span>
        </div>
      </div>

      <div class="main-content">
        <div class="herbs-sidebar">
          <div class="sidebar-header">
            <h4 class="sidebar-title">处方药材</h4>
            <span class="sidebar-hint">点击切换称量</span>
          </div>
          <div class="herbs-list">
            <div
              v-for="(herb, index) in herbsWithResults"
              :key="herb.id"
              class="herb-list-item"
              :class="{ 
                active: index === clinicStore.currentHerbIndex,
                completed: herb.completed,
                skipped: herb.skipped
              }"
              @click="!herb.completed && !herb.skipped && selectHerbByIndex(index)"
            >
              <div class="herb-item-color" :style="{ background: herb.color }"></div>
              <div class="herb-item-info">
                <div class="herb-item-name-row">
                  <span class="herb-item-name">{{ herb.herbName }}</span>
                  <span v-if="herb.completed" class="completed-badge">
                    <n-icon size="14" :component="CheckmarkCircleOutline" />
                  </span>
                  <span v-else-if="herb.skipped" class="skipped-badge">
                    <n-icon size="14" :component="SadOutline" />
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
                <div v-else-if="herb.skipped" class="herb-item-skipped">
                  已跳过 · 0分
                </div>
                <div v-else-if="index === clinicStore.currentHerbIndex" class="herb-item-current">
                  当前称量中...
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="center-area">
          <div v-if="clinicStore.currentHerb" class="current-herb-card">
            <div class="current-herb-header">
              <div class="current-herb-color" :style="{ background: clinicStore.currentHerb.color }"></div>
              <div class="current-herb-text">
                <span class="current-herb-label">正在称量</span>
                <span class="current-herb-name">{{ clinicStore.currentHerb.herbName }}</span>
              </div>
              <div class="current-target">
                <span class="target-label">目标重量</span>
                <span class="target-value">{{ clinicStore.currentHerb.targetWeight }} 钱</span>
                <span class="target-error">±{{ clinicStore.currentHerb.allowedError }}钱</span>
              </div>
            </div>
            <div class="current-status-row">
              <div class="status-item">
                <span class="status-label">砝码</span>
                <span class="status-value">{{ clinicStore.leftWeight.toFixed(1) }} 钱</span>
              </div>
              <div class="status-item">
                <span class="status-label">药材</span>
                <span class="status-value">{{ clinicStore.rightWeight.toFixed(1) }} 钱</span>
              </div>
              <div class="status-item error-item" :class="{
                good: clinicStore.isCurrentBalanced,
                warning: !clinicStore.isCurrentBalanced && clinicStore.currentErrorPercentage < 10,
                bad: clinicStore.currentErrorPercentage >= 10
              }">
                <span class="status-label">误差</span>
                <span class="status-value">{{ formatError(clinicStore.currentError) }}</span>
              </div>
            </div>
          </div>

          <ClinicScale />

          <div v-if="clinicStore.currentHerb" class="herb-control-card">
            <div class="control-row">
              <label class="control-label">药材数量 (单味 {{ clinicStore.currentHerb.unitWeight }}钱)</label>
              <div class="control-buttons">
                <n-button 
                  circle 
                  size="large" 
                  @click="decreaseHerb"
                  :disabled="clinicStore.currentHerbCount <= 0"
                >
                  -
                </n-button>
                <span class="count-display">{{ clinicStore.currentHerbCount }}</span>
                <n-button 
                  circle 
                  size="large" 
                  @click="increaseHerb"
                >
                  +
                </n-button>
              </div>
            </div>
            <div class="complete-btn-row">
              <n-button 
                size="large" 
                @click="skipHerb"
                type="default"
              >
                <template #icon>
                  <n-icon :component="ArrowRedoOutline" />
                </template>
                跳过此味
              </n-button>
              <n-button 
                type="primary" 
                size="large" 
                block
                @click="completeHerb"
                :disabled="!clinicStore.isCurrentBalanced"
                :color="clinicStore.isCurrentBalanced ? '#2E8B57' : '#DAA520'"
              >
                <template #icon>
                  <n-icon :component="CheckmarkCircleOutline" />
                </template>
                确认此味药材
                <span v-if="!clinicStore.isCurrentBalanced" class="btn-hint">
                  (误差超出允许范围，无法确认)
                </span>
              </n-button>
            </div>
          </div>
        </div>

        <div class="weights-panel">
          <ClinicWeights />
        </div>
      </div>
    </div>

    <!-- 结果页面 -->
    <div v-else-if="clinicStore.currentPhase === 'result' && clinicStore.lastResult" class="result-screen">
      <div class="result-container">
        <div class="result-header-card">
          <div class="rating-badge" :style="{ background: CLINIC_RATING_CONFIG[clinicStore.lastResult.rating].color }">
            <span class="rating-letter">{{ clinicStore.lastResult.rating }}</span>
            <span class="rating-label">{{ CLINIC_RATING_CONFIG[clinicStore.lastResult.rating].label }}</span>
          </div>
          <div class="result-title-section">
            <h3 class="result-title">接诊完成</h3>
            <p class="result-patient">
              患者：{{ clinicStore.lastResult.order.patientName }} · 
              {{ clinicStore.lastResult.order.patientGender }} · 
              {{ clinicStore.lastResult.order.patientAge }}岁
            </p>
          </div>
          <div class="result-score-section">
            <div class="total-score">
              <span class="score-num">{{ clinicStore.lastResult.totalScore }}</span>
              <span class="score-total"> 分</span>
            </div>
            <div class="score-percent">
              综合得分率：{{ clinicStore.lastResult.scorePercentage }}%
            </div>
            <div class="xp-earned">
              <n-icon :component="TrophyOutline" />
              获得 {{ clinicStore.lastResult.xpEarned }} 经验
            </div>
          </div>
        </div>

        <div class="result-details-grid">
          <div class="detail-card">
            <div class="detail-header">
              <n-icon :component="AlertCircleOutline" />
              <span>优先级判断</span>
            </div>
            <div class="detail-body">
              <div class="detail-score" :class="clinicStore.lastResult.priorityJudgment.isCorrect ? 'good' : 'bad'">
                {{ clinicStore.lastResult.priorityJudgment.isCorrect ? '正确' : '错误' }}
              </div>
              <div class="detail-sub">
                用时：{{ (clinicStore.lastResult.priorityJudgment.timeSpent / 1000).toFixed(1) }}秒
              </div>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-header">
              <n-icon :component="BookOutline" />
              <span>处方选择</span>
            </div>
            <div class="detail-body">
              <div class="detail-score" :class="clinicStore.lastResult.prescriptionSelection.isCorrect ? 'good' : 'bad'">
                {{ clinicStore.lastResult.prescriptionSelection.isCorrect ? '正确' : '错误' }}
              </div>
              <div class="detail-sub">
                用时：{{ (clinicStore.lastResult.prescriptionSelection.timeSpent / 1000).toFixed(1) }}秒
              </div>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-header">
              <n-icon :component="ScaleOutline" />
              <span>称量精度</span>
            </div>
            <div class="detail-body">
              <div class="detail-score">
                {{ clinicStore.lastResult.perfectCount }} / {{ clinicStore.lastResult.herbResults.length }} 完美
              </div>
              <div class="detail-sub">
                平均误差：{{ clinicStore.lastResult.averageError.toFixed(2) }}钱
              </div>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-header">
              <n-icon :component="TimeOutline" />
              <span>总用时</span>
            </div>
            <div class="detail-body">
              <div class="detail-score">
                {{ formatTime(Math.floor(clinicStore.lastResult.totalTime / 1000)) }}
              </div>
              <div class="detail-sub">
                跳步：{{ clinicStore.lastResult.skippedCount }} 次
              </div>
            </div>
          </div>
        </div>

        <div class="herb-results-section">
          <h4 class="section-header">各味药材结果</h4>
          <div class="herb-results-grid">
            <div
              v-for="(hr, index) in clinicStore.lastResult.herbResults"
              :key="hr.herbId"
              class="herb-result-card"
              :class="{ 
                perfect: hr.isPerfect,
                skipped: hr.skipped
              }"
            >
              <div class="herb-result-name">{{ hr.herbName }}</div>
              <div class="herb-result-score">{{ hr.score }} 分</div>
              <div v-if="hr.skipped" class="herb-result-status skipped">已跳过</div>
              <div v-else class="herb-result-error">
                误差：{{ formatError(hr.finalError) }}
              </div>
            </div>
          </div>
        </div>

        <div class="case-review-section">
          <h4 class="section-header">病例复盘</h4>
          <div class="review-card">
            <div class="review-summary">
              {{ clinicStore.lastResult.caseReview.summary }}
            </div>
            
            <div class="review-decision">
              <div class="decision-col correct">
                <span class="decision-label">正确决策</span>
                <p class="decision-text">{{ clinicStore.lastResult.caseReview.correctDecision }}</p>
              </div>
              <div class="decision-col user">
                <span class="decision-label">您的决策</span>
                <p class="decision-text">{{ clinicStore.lastResult.caseReview.userDecision }}</p>
              </div>
            </div>

            <div class="review-analysis">
              <h5>决策分析</h5>
              <p>{{ clinicStore.lastResult.caseReview.decisionAnalysis }}</p>
            </div>

            <div v-if="clinicStore.lastResult.caseReview.highlights.length > 0" class="review-highlights">
              <h5><n-icon :component="CheckmarkCircleOutline" /> 亮点表现</h5>
              <ul>
                <li v-for="(h, idx) in clinicStore.lastResult.caseReview.highlights" :key="idx">{{ h }}</li>
              </ul>
            </div>

            <div v-if="clinicStore.lastResult.caseReview.weakPoints.length > 0" class="review-weakpoints">
              <h5><n-icon :component="AlertCircleOutline" /> 待改进点</h5>
              <ul>
                <li v-for="(w, idx) in clinicStore.lastResult.caseReview.weakPoints" :key="idx">{{ w }}</li>
              </ul>
            </div>

            <div v-if="clinicStore.lastResult.caseReview.suggestions.length > 0" class="review-suggestions">
              <h5><n-icon :component="BookOutline" /> 学习建议</h5>
              <ul>
                <li v-for="(s, idx) in clinicStore.lastResult.caseReview.suggestions" :key="idx">{{ s }}</li>
              </ul>
            </div>

            <div v-if="clinicStore.lastResult.caseReview.knowledgePoints.length > 0" class="review-knowledge">
              <h5><n-icon :component="BookOutline" /> 知识点</h5>
              <ul>
                <li v-for="(k, idx) in clinicStore.lastResult.caseReview.knowledgePoints" :key="idx">{{ k }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <n-button @click="restart">
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
            再来一局
          </n-button>
          <n-button 
            type="primary" 
            color="#483D8B"
            @click="goToReview"
          >
            <template #icon>
              <n-icon :component="BookOutline" />
            </template>
            查看记录
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { useClinicStore } from '@/stores/clinic'
import { useMentorStore } from '@/stores/mentor'
import { 
  PRESCRIPTIONS, 
  URGENCY_CONFIG, 
  CLINIC_RATING_CONFIG 
} from '@/constants'
import { 
  TimeOutline,
  PlayOutline,
  TrophyOutline,
  AlertCircleOutline,
  BookOutline,
  ScaleOutline,
  CheckmarkCircleOutline,
  RefreshOutline,
  ArrowUndoOutline,
  ArrowRedoOutline,
  SadOutline
} from '@vicons/ionicons5'

const ClinicScale = defineAsyncComponent(() => import('@/components/ClinicScale.vue'))
const ClinicWeights = defineAsyncComponent(() => import('@/components/ClinicWeights.vue'))

const router = useRouter()
const clinicStore = useClinicStore()
const mentorStore = useMentorStore()

const selectedPriority = ref<number | null>(null)
const selectedPrescriptionId = ref<number | null>(null)

const priorityLevels = [
  { value: 1, label: '一级（普通）', description: '病情轻微，按顺序接诊', color: '#2E8B57' },
  { value: 2, label: '二级（一般）', description: '病情一般，需及时处理', color: '#DAA520' },
  { value: 3, label: '三级（紧急）', description: '病情较重，优先处理', color: '#DC143C' },
  { value: 4, label: '四级（危重）', description: '病情危急，立即处理', color: '#8B0000' }
]

const isTimeWarning = computed(() => clinicStore.timeRemaining <= 30)

const weighingProgress = computed(() => {
  if (clinicStore.totalHerbs === 0) return 0
  return (clinicStore.completedHerbs / clinicStore.totalHerbs) * 100
})

const herbsWithResults = computed(() => {
  if (!clinicStore.currentPrescription) return []
  return clinicStore.currentPrescription.herbs.map(herb => {
    const result = clinicStore.herbResults.find(h => h.herbId === herb.id)
    return {
      ...herb,
      completed: result ? true : false,
      skipped: result?.skipped || false,
      score: result?.score || 0,
      finalError: result?.finalError || 0
    }
  })
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

function isPrescriptionUnlocked(id: number): boolean {
  const unlocked = mentorStore.apprenticeProfile.unlockedPrescriptions
  return unlocked.length === 0 || unlocked.includes(id)
}

function startClinic() {
  mentorStore.init()
  clinicStore.startNewSession()
}

function selectOrder(orderId: string) {
  clinicStore.selectOrder(orderId)
  selectedPriority.value = null
  selectedPrescriptionId.value = null
}

function submitPriority() {
  if (selectedPriority.value !== null) {
    clinicStore.judgePriority(selectedPriority.value)
  }
}

function goBackToPriority() {
  clinicStore.currentPhase = 'judge_priority'
}

function selectPrescription(id: number) {
  if (isPrescriptionUnlocked(id)) {
    selectedPrescriptionId.value = id
  }
}

function submitPrescription() {
  if (selectedPrescriptionId.value !== null) {
    clinicStore.selectPrescription(selectedPrescriptionId.value)
  }
}

function selectHerbByIndex(index: number) {
  if (!clinicStore.currentPrescription) return
  const herb = clinicStore.currentPrescription.herbs[index]
  if (!herb) return

  const existingResult = clinicStore.herbResults.find(h => h.herbId === herb.id)
  if (existingResult) return

  clinicStore.currentHerbIndex = index
  clinicStore.placedWeights = []
  clinicStore.currentHerbCount = 0
}

function increaseHerb() {
  clinicStore.setHerbCount(clinicStore.currentHerbCount + 1)
}

function decreaseHerb() {
  if (clinicStore.currentHerbCount > 0) {
    clinicStore.setHerbCount(clinicStore.currentHerbCount - 1)
  }
}

function completeHerb() {
  clinicStore.completeCurrentHerb()
}

function skipHerb() {
  clinicStore.skipCurrentHerb()
}

function restart() {
  clinicStore.startNewSession()
}

function goToReview() {
  router.push('/clinic-review')
}

onMounted(() => {
  mentorStore.init()
  clinicStore.init()
})
</script>

<style scoped>
.clinic-mode-page {
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

.start-screen {
  max-width: 700px;
  margin: 40px auto;
}

.intro-card {
  background: #FFF;
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
  border: 3px solid #DEB887;
  text-align: center;
}

.intro-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #FFF8DC, #FFE4B5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8B4513;
  border: 4px solid #DEB887;
}

.intro-title {
  font-size: 32px;
  color: #4A2C17;
  margin: 0 0 16px 0;
  font-weight: 700;
}

.intro-desc {
  font-size: 15px;
  color: #6B4423;
  line-height: 1.8;
  margin: 0 0 32px 0;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: #FFFAF0;
  border-radius: 12px;
  border: 2px solid #DEB887;
  color: #4A2C17;
  font-weight: 500;
}

.feature-item svg {
  color: #8B4513;
  font-size: 20px;
}

.start-actions {
  display: flex;
  justify-content: center;
}

.section-header {
  text-align: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  color: #4A2C17;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.section-desc {
  color: #8B7355;
  margin: 0;
}

.order-select-screen {
  max-width: 1100px;
  margin: 0 auto;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.order-card {
  background: #FFF;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 2px solid #DEB887;
  position: relative;
  overflow: hidden;
}

.order-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #DEB887;
}

.order-card.urgency-mild::before {
  background: #2E8B57;
}

.order-card.urgency-moderate::before {
  background: #DAA520;
}

.order-card.urgency-severe::before {
  background: #DC143C;
}

.order-card.urgency-critical::before {
  background: #8B0000;
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(139, 69, 19, 0.15);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.patient-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.patient-name {
  font-size: 18px;
  font-weight: 600;
  color: #4A2C17;
}

.patient-detail {
  font-size: 13px;
  color: #8B7355;
}

.order-symptoms {
  margin-bottom: 12px;
}

.symptoms-label {
  font-size: 13px;
  color: #6B4423;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.symptom-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.order-desc {
  margin-bottom: 16px;
  padding: 12px;
  background: #FFFAF0;
  border-radius: 8px;
  border-left: 3px solid #DEB887;
}

.order-desc p {
  margin: 0;
  font-size: 13px;
  color: #6B4423;
  line-height: 1.6;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px dashed #DEB887;
}

.time-limit {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6B4423;
  font-weight: 500;
}

.click-hint {
  font-size: 12px;
  color: #8B4513;
  font-weight: 500;
}

.priority-judge-screen {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.patient-info-card {
  background: #FFF;
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #DEB887;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.patient-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px dashed #DEB887;
}

.patient-avatar {
  width: 60px;
  height: 60px;
  background: #FFF8DC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8B4513;
  border: 2px solid #DEB887;
}

.patient-name-lg {
  font-size: 22px;
  font-weight: 700;
  color: #4A2C17;
  margin: 0 0 4px 0;
}

.patient-detail-lg {
  font-size: 14px;
  color: #8B7355;
  margin: 0;
}

.subsection-title {
  font-size: 15px;
  font-weight: 600;
  color: #4A2C17;
  margin: 0 0 10px 0;
}

.patient-symptoms-section,
.case-description-section,
.prescription-req-section {
  margin-bottom: 20px;
}

.symptom-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.symptom-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #FFFAF0;
  border-radius: 8px;
  font-size: 13px;
  color: #6B4423;
}

.symptom-item svg {
  color: #DC143C;
  flex-shrink: 0;
  margin-top: 2px;
}

.case-text,
.req-text {
  margin: 0;
  font-size: 14px;
  color: #6B4423;
  line-height: 1.7;
  padding: 12px;
  background: #FFFAF0;
  border-radius: 8px;
  border-left: 3px solid #8B4513;
}

.priority-select-card {
  background: #FFF;
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #DAA520;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.priority-title {
  font-size: 20px;
  font-weight: 700;
  color: #4A2C17;
  margin: 0 0 8px 0;
  text-align: center;
}

.priority-desc {
  text-align: center;
  color: #8B7355;
  margin: 0 0 20px 0;
}

.priority-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.priority-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
}

.priority-level {
  font-weight: 600;
  font-size: 15px;
}

.priority-desc-sm {
  font-size: 12px;
  opacity: 0.9;
}

.priority-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.prescription-select-screen {
  max-width: 1100px;
  margin: 0 auto;
}

.patient-info-mini {
  background: #FFF;
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 20px;
  border: 2px solid #DEB887;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.patient-brief {
  display: flex;
  align-items: center;
  gap: 12px;
}

.patient-name-sm {
  font-size: 16px;
  font-weight: 600;
  color: #4A2C17;
}

.patient-symptoms-mini {
  display: flex;
  gap: 8px;
}

.symptom-chip {
  font-size: 12px;
  padding: 4px 10px;
  background: #FFF8DC;
  color: #8B4513;
  border-radius: 12px;
}

.prescription-list-section {
  background: #FFF;
  border-radius: 16px;
  padding: 32px;
  border: 2px solid #DEB887;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.prescription-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.prescription-card {
  background: #FFFAF0;
  border: 2px solid #DEB887;
  border-radius: 14px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.prescription-card:hover:not(.locked) {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(139, 69, 19, 0.12);
}

.prescription-card.active {
  border-color: #8B4513;
  background: #FFF8DC;
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.15);
}

.prescription-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #8B7355;
  font-weight: 500;
  z-index: 10;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.prescription-name {
  font-size: 18px;
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
  margin: 0 0 14px 0;
}

.herb-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.herb-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
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

.prescription-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 20px;
  border-top: 2px dashed #DEB887;
}

.weighing-screen {
  max-width: 1400px;
  margin: 0 auto;
}

.patient-stripe {
  background: linear-gradient(90deg, #FFF8DC, #FFE4B5);
  border-radius: 10px;
  padding: 10px 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid #DAA520;
}

.stripe-left,
.stripe-right {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #4A2C17;
  font-weight: 500;
}

.main-content {
  display: flex;
  gap: 20px;
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

.herb-list-item:hover:not(.completed):not(.skipped) {
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
  background: #F0FFF0;
}

.herb-list-item.skipped {
  opacity: 0.6;
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

.skipped-badge {
  color: #999;
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

.herb-item-skipped {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
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

.complete-btn-row {
  display: flex;
  gap: 12px;
}

.complete-btn-row > :first-child {
  flex-shrink: 0;
  width: auto;
}

.complete-btn-row > :last-child {
  flex: 1;
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

.result-screen {
  max-width: 1000px;
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

.rating-badge {
  width: 100px;
  height: 100px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #FFF;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.rating-letter {
  font-size: 40px;
  font-weight: 900;
  line-height: 1;
}

.rating-label {
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}

.result-title-section {
  flex: 1;
}

.result-title {
  font-size: 26px;
  color: #4A2C17;
  margin: 0 0 6px 0;
  font-weight: 700;
}

.result-patient {
  margin: 0;
  color: #8B7355;
  font-size: 15px;
}

.result-score-section {
  text-align: right;
}

.total-score {
  margin-bottom: 4px;
}

.score-num {
  font-size: 48px;
  font-weight: bold;
  color: #DAA520;
  line-height: 1;
}

.score-total {
  font-size: 20px;
  color: #999;
}

.score-percent {
  font-size: 14px;
  color: #8B7355;
  margin-bottom: 4px;
}

.xp-earned {
  font-size: 14px;
  color: #FFD700;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.result-details-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.detail-card {
  background: #FFFAF0;
  border: 2px solid #DEB887;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #6B4423;
  font-weight: 500;
  margin-bottom: 10px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-score {
  font-size: 18px;
  font-weight: 700;
  color: #4A2C17;
}

.detail-score.good {
  color: #2E8B57;
}

.detail-score.bad {
  color: #DC143C;
}

.detail-sub {
  font-size: 12px;
  color: #8B7355;
}

.section-header {
  font-size: 18px;
  color: #4A2C17;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.herb-results-section {
  margin-bottom: 24px;
}

.herb-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.herb-result-card {
  background: #FFFAF0;
  border: 2px solid #DEB887;
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}

.herb-result-card.perfect {
  border-color: #2E8B57;
  background: #F0FFF0;
}

.herb-result-card.skipped {
  opacity: 0.6;
  background: #F5F5F5;
}

.herb-result-name {
  font-size: 14px;
  font-weight: 600;
  color: #4A2C17;
  margin-bottom: 6px;
}

.herb-result-score {
  font-size: 22px;
  font-weight: bold;
  color: #DAA520;
  margin-bottom: 4px;
}

.herb-result-error {
  font-size: 12px;
  color: #6B4423;
}

.herb-result-status.skipped {
  font-size: 12px;
  color: #999;
}

.case-review-section {
  margin-bottom: 24px;
}

.review-card {
  background: #FFFAF0;
  border: 2px solid #DEB887;
  border-radius: 14px;
  padding: 20px;
}

.review-summary {
  font-size: 16px;
  font-weight: 600;
  color: #4A2C17;
  padding: 14px;
  background: #FFF8DC;
  border-radius: 10px;
  margin-bottom: 16px;
  border-left: 4px solid #DAA520;
}

.review-decision {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.decision-col {
  padding: 14px;
  border-radius: 10px;
  background: rgba(255,255,255,0.5);
}

.decision-col.correct {
  border-left: 4px solid #2E8B57;
}

.decision-col.user {
  border-left: 4px solid #4169E1;
}

.decision-label {
  font-size: 12px;
  font-weight: 600;
  color: #6B4423;
  display: block;
  margin-bottom: 6px;
}

.decision-text {
  margin: 0;
  font-size: 14px;
  color: #4A2C17;
  line-height: 1.6;
}

.review-analysis h5,
.review-highlights h5,
.review-weakpoints h5,
.review-suggestions h5,
.review-knowledge h5 {
  font-size: 15px;
  font-weight: 600;
  color: #4A2C17;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.review-analysis,
.review-highlights,
.review-weakpoints,
.review-suggestions,
.review-knowledge {
  margin-bottom: 16px;
}

.review-analysis p {
  margin: 0;
  font-size: 14px;
  color: #6B4423;
  line-height: 1.7;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.review-highlights ul,
.review-weakpoints ul,
.review-suggestions ul,
.review-knowledge ul {
  margin: 0;
  padding-left: 20px;
}

.review-highlights li,
.review-weakpoints li,
.review-suggestions li,
.review-knowledge li {
  font-size: 13px;
  color: #6B4423;
  line-height: 1.7;
  margin-bottom: 4px;
}

.review-highlights li::marker {
  color: #2E8B57;
}

.review-weakpoints li::marker {
  color: #DC143C;
}

.review-suggestions li::marker {
  color: #DAA520;
}

.review-knowledge li::marker {
  color: #4169E1;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  border-top: 2px dashed #DEB887;
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
</style>
