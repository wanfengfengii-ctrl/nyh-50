<template>
  <div class="mentor-mode-page">
    <div class="page-header">
      <div class="header-top">
        <h2 class="page-title">
          <n-icon size="24" :component="BookOutline" />
          师徒教学模式
        </h2>
        <div class="profile-card">
          <div class="profile-avatar">{{ mentorStore.apprenticeProfile.avatar }}</div>
          <div class="profile-info">
            <div class="profile-name-row">
              <span class="profile-name">{{ mentorStore.apprenticeProfile.name }}</span>
              <span class="profile-title-badge">{{ mentorStore.apprenticeProfile.title }}</span>
            </div>
            <div class="profile-level">
              <n-tag size="small" type="info" round>Lv.{{ mentorStore.apprenticeProfile.level }}</n-tag>
              <n-progress
                type="line"
                :percentage="mentorStore.apprenticeLevelProgress"
                :show-indicator="false"
                style="width: 100px; display: inline-block"
                color="#DAA520"
                rail-color="#DEB887"
              />
              <span class="xp-text">{{ mentorStore.apprenticeLevelProgress }}%</span>
            </div>
          </div>
          <div class="voice-toggle" @click="handleVoiceToggle">
            <n-icon size="20" :component="isVoiceEnabled ? CheckmarkCircleOutline : AlertCircleOutline" />
          </div>
        </div>
      </div>

      <div v-if="mentorStore.isStarted && !mentorStore.isCompleted" class="header-stats">
        <div class="stat-item">
          <span class="stat-label">处方</span>
          <span class="stat-value">{{ mentorStore.currentPrescription?.name }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">药材进度</span>
          <span class="stat-value">{{ mentorStore.completedHerbs }} / {{ mentorStore.totalHerbs }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">当前药材</span>
          <span class="stat-value">{{ mentorStore.currentHerb?.herbName }}</span>
        </div>
        <div class="stat-item timer" :class="{ warning: mentorStore.sessionTimeRemaining <= 60 }">
          <n-icon :component="TimeOutline" />
          <span>{{ formatTime(mentorStore.sessionTimeRemaining) }}</span>
        </div>
        <div class="stat-item score-item">
          <span class="stat-label">累计得分</span>
          <span class="stat-value score-value">{{ mentorStore.sessionTotalScore }}</span>
        </div>
        <div class="header-actions">
          <n-button 
            size="small" 
            :type="mentorStore.isPaused ? 'success' : 'warning'"
            @click="handleTogglePause"
            class="pause-btn"
          >
            <template #icon>
              <n-icon :component="mentorStore.isPaused ? PlayOutline : SadOutline" />
            </template>
            {{ mentorStore.isPaused ? '继续学习' : '暂停学习' }}
          </n-button>
        </div>
      </div>
    </div>

    <div v-if="!mentorStore.isStarted && !mentorStore.isCompleted" class="start-screen">
      <div class="start-container">
        <div class="difficulty-section">
          <h3 class="section-title">选择难度等级</h3>
          <div class="difficulty-grid">
            <div
              v-for="(config, diff) in MENTOR_DIFFICULTY_CONFIG"
              :key="diff"
              class="diff-card"
              :class="{
                active: mentorStore.currentDifficulty === diff,
                locked: mentorStore.apprenticeProfile.level < config.unlockLevel
              }"
              :style="{ borderColor: config.color }"
              @click="handleSelectDifficulty(diff as MentorDifficulty)"
            >
              <div class="diff-header" :style="{ background: config.color }">
                <span class="diff-name">{{ config.label }}</span>
                <span v-if="mentorStore.apprenticeProfile.level < config.unlockLevel" class="lock-icon">🔒</span>
              </div>
              <p class="diff-desc">{{ config.description }}</p>
              <div class="diff-stats">
                <div class="diff-stat">
                  <span class="label">时间倍率</span>
                  <span class="value">×{{ config.timeMultiplier }}</span>
                </div>
                <div class="diff-stat">
                  <span class="label">经验倍率</span>
                  <span class="value">×{{ config.xpMultiplier }}</span>
                </div>
                <div class="diff-stat">
                  <span class="label">需要等级</span>
                  <span class="value">Lv.{{ config.unlockLevel }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="prescription-section">
          <h3 class="section-title">选择处方学习</h3>
          <div class="prescription-cards">
            <div
              v-for="(p, index) in mentorStore.prescriptions"
              :key="p.id"
              class="prescription-card"
              :class="{ active: mentorStore.currentPrescriptionIndex === index }"
              @click="mentorStore.selectPrescription(index)"
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
                  {{ formatTime(Math.round(p.timeLimit * diffConfig.timeMultiplier)) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="start-actions">
          <n-button
            type="primary"
            size="large"
            color="#8B4513"
            @click="handleStartSession"
          >
            <template #icon>
              <n-icon :component="PlayOutline" />
            </template>
            开始学习
          </n-button>
        </div>
      </div>
    </div>

    <div v-else-if="mentorStore.isCompleted && lastResult" class="result-screen">
      <div class="result-container">
        <div class="result-header-card">
          <div class="result-icon excellent">
            <n-icon size="56" :component="TrophyOutline" />
          </div>
          <div class="result-title-section">
            <h3 class="result-title">{{ lastResult.summary.overallComment }}</h3>
            <p class="result-prescription-name">{{ lastResult.prescriptionName }} · {{ diffConfig.label }}</p>
          </div>
          <div class="result-score-section">
            <div class="total-score">
              <span class="score-num">{{ lastResult.totalScore }}</span>
              <span class="score-total"> / {{ lastResult.maxScore }}</span>
            </div>
            <div class="score-percent">得分率：{{ lastResult.scorePercentage }}%</div>
            <div class="xp-earned">
              <n-tag color="#DAA520" text-color="#FFF" round>+{{ lastResult.xpEarned }} XP</n-tag>
            </div>
          </div>
        </div>

        <div class="summary-sections">
          <div v-if="lastResult.summary.highlights.length > 0" class="summary-card highlights">
            <h4>⭐ 本次亮点</h4>
            <ul>
              <li v-for="(h, i) in lastResult.summary.highlights" :key="i">{{ h }}</li>
            </ul>
          </div>
          <div v-if="lastResult.summary.weakPoints.length > 0" class="summary-card weakpoints">
            <h4>⚠️ 待改进</h4>
            <ul>
              <li v-for="(w, i) in lastResult.summary.weakPoints" :key="i">{{ w }}</li>
            </ul>
          </div>
          <div v-if="lastResult.summary.suggestions.length > 0" class="summary-card suggestions">
            <h4>💡 师傅建议</h4>
            <ul>
              <li v-for="(s, i) in lastResult.summary.suggestions" :key="i">{{ s }}</li>
            </ul>
          </div>
          <div v-if="lastResult.summary.nextGoals.length > 0" class="summary-card goals">
            <h4>🚀 下一步目标</h4>
            <ul>
              <li v-for="(g, i) in lastResult.summary.nextGoals" :key="i">{{ g }}</li>
            </ul>
          </div>
        </div>

        <div class="result-actions">
          <n-button @click="handleReset">
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
            再学一次
          </n-button>
          <n-button @click="goToMentorReview">
            <template #icon><n-icon :component="TrophyOutline" /></template>
            查看成长记录
          </n-button>
          <n-button type="primary" color="#8B4513" @click="handleSelectNew">
            <template #icon>
              <n-icon :component="BookOutline" />
            </template>
            学习新处方
          </n-button>
        </div>
      </div>
    </div>

    <div v-else class="main-content">
      <div class="workspace-wrapper">
        <div class="steps-navbar">
          <div
            v-for="(step, index) in MENTOR_STEPS"
            :key="step.id"
            class="step-nav-item"
            :class="{
              active: mentorStore.currentStepIndex === index,
              completed: isStepCompleted(step.id),
              skipped: isStepSkipped(step.id),
              disabled: index > mentorStore.currentStepIndex
            }"
            :title="index > mentorStore.currentStepIndex ? '请依次完成前面的步骤' : step.title"
            @click="handleStepNavClick(index)"
          >
            <div class="step-num-circle">
              {{ isStepCompleted(step.id) ? '✓' : index + 1 }}
            </div>
            <span class="step-nav-title">{{ step.title.replace(/第.步：/, '') }}</span>
          </div>
        </div>

      <div class="workspace">
        <div class="left-panel">
          <div v-if="currentStep" class="instruction-card">
            <div class="instruction-header" :class="currentStep.id">
              <h3>{{ currentStep.title }}</h3>
              <span class="step-score-badge">{{ currentStepScore }} / {{ currentStep.maxScore }}分</span>
            </div>
            <div class="instruction-body">
              <p class="instruction-text">
                <n-icon :component="CheckmarkCircleOutline" />
                {{ currentStep.instruction }}
              </p>
              <div v-if="showHint" class="hint-box">
                <n-icon :component="AlertCircleOutline" />
                <span>{{ currentStep.hint }}</span>
              </div>
            </div>
            <div class="instruction-actions">
              <n-button size="small" text @click="toggleHint">{{ showHint ? '隐藏提示' : '显示提示' }}</n-button>
              <n-button
                v-if="currentStep.allowedSkip && !isStepCompleted(currentStep.id)"
                size="small"
                type="warning"
                quaternary
                @click="handleSkipStep"
              >
                跳过此步 (-{{ currentStep.skipPenalty }}分)
              </n-button>
            </div>
          </div>

          <div v-if="mentorStore.currentFeedbacks.length > 0" class="feedback-panel">
            <h4 class="feedback-title">
              <n-icon :component="BookOutline" />师傅反馈
            </h4>
            <div class="feedback-list">
              <div
                v-for="fb in recentFeedbacks"
                :key="fb.id"
                class="feedback-item"
                :class="fb.level"
              >
                <div class="feedback-icon">
                  {{ fb.level === 'success' ? '✅' : fb.level === 'warning' ? '⚠️' : fb.level === 'error' ? '❌' : 'ℹ️' }}
                </div>
                <div class="feedback-content">
                  <span class="feedback-title-text">{{ fb.title }}</span>
                  <p class="feedback-message">{{ fb.message }}</p>
                  <p v-if="fb.suggestion" class="feedback-suggestion">💡 {{ fb.suggestion }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="herb-progress-panel">
            <h4 class="panel-title">处方进度</h4>
            <div class="herbs-list">
              <div
                v-for="(h, index) in mentorStore.currentPrescription?.herbs"
                :key="h.id"
                class="herb-progress-item"
                :class="{
                  active: index === mentorStore.currentHerbIndex,
                  completed: mentorStore.herbResults.find(r => r.herbId === h.id)
                }"
              >
                <div class="herb-progress-color" :style="{ background: h.color }"></div>
                <div class="herb-progress-info">
                  <span class="herb-progress-name">{{ h.herbName }}</span>
                  <span class="herb-progress-target">{{ h.targetWeight }}钱</span>
                </div>
                <div class="herb-progress-status">
                  <span v-if="mentorStore.herbResults.find(r => r.herbId === h.id)" class="done-badge">✓</span>
                  <span v-else-if="index === mentorStore.currentHerbIndex" class="current-badge">进行中</span>
                  <span v-else class="pending-badge">待称量</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="center-area">
          <template v-if="currentStep?.id === 'select_prescription'">
            <div class="step-content select-prescription-step">
              <div class="step-prescription-card">
                <div class="step-prescription-header">
                  <h3>{{ mentorStore.currentPrescription?.name }}</h3>
                  <n-tag round>{{ mentorStore.currentPrescription?.herbs.length }}味药</n-tag>
                </div>
                <p class="step-prescription-desc">{{ mentorStore.currentPrescription?.description }}</p>
                <div class="step-herbs-overview">
                  <div
                    v-for="h in mentorStore.currentPrescription?.herbs"
                    :key="h.id"
                    class="step-herb-overview-item"
                  >
                    <div class="overview-color" :style="{ background: h.color }"></div>
                    <div class="overview-info">
                      <span class="overview-name">{{ h.herbName }}</span>
                      <span class="overview-target">{{ h.targetWeight }}钱 (±{{ h.allowedError.toFixed(2) }}钱)</span>
                    </div>
                  </div>
                </div>
                <n-button type="primary" size="large" color="#8B4513" block @click="mentorStore.confirmPrescriptionSelection()">
                  确认选择此处方，开始学习
                </n-button>
              </div>
            </div>
          </template>

          <template v-else-if="currentStep?.id === 'identify_herb'">
            <div class="step-content identify-herb-step">
              <div v-if="mentorStore.currentHerb && currentHerbQuestion" class="herb-id-card">
                <div class="herb-visual-card">
                  <div class="herb-visual" :style="{ background: `radial-gradient(circle, ${mentorStore.currentHerb.color}, ${mentorStore.currentHerb.color}88)` }">
                    <div class="herb-visual-count">
                      <span>单味</span>
                      <strong>{{ mentorStore.currentHerb.unitWeight }}钱</strong>
                    </div>
                  </div>
                  <div class="herb-basic-info">
                    <h3 class="herb-name">{{ mentorStore.currentHerb.herbName }}</h3>
                    <p class="herb-description">{{ currentHerbQuestion.description }}</p>
                    <div class="herb-stats-row">
                      <n-tag color="#8B4513" text-color="#FFF">目标：{{ mentorStore.currentHerb.targetWeight }}钱</n-tag>
                      <n-tag color="#6B4423" text-color="#FFF">误差：±{{ mentorStore.currentHerb.allowedError.toFixed(2) }}钱</n-tag>
                    </div>
                  </div>
                </div>
                <div class="question-card" :class="{ answered: mentorStore.herbIdentifyAnswerCorrect !== null }">
                  <h4 class="question-text">❓ {{ currentHerbQuestion.question }}</h4>
                  <div class="options-list">
                    <div
                      v-for="(opt, idx) in currentHerbQuestion.options"
                      :key="idx"
                      class="option-item"
                      :class="{
                        selected: mentorStore.herbIdentifyAnswerSelected === idx,
                        correct: mentorStore.herbIdentifyAnswerCorrect !== null && idx === currentHerbQuestion.correctOptionIndex,
                        wrong: mentorStore.herbIdentifyAnswerCorrect === false && mentorStore.herbIdentifyAnswerSelected === idx
                      }"
                      @click="mentorStore.answerHerbIdentify(idx)"
                    >
                      <span class="option-label">{{ ['A', 'B', 'C', 'D'][idx] }}</span>
                      <span class="option-text">{{ opt }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <MentorScale />
            <div v-if="currentStep?.id === 'select_weights'" class="weight-selection-area">
              <div class="section-title-bar">
                <h4>选择砝码组合</h4>
                <span class="subtitle">目标重量：<strong>{{ mentorStore.currentHerb?.targetWeight }}钱</strong></span>
              </div>
              <div class="weight-grid">
                <div
                  v-for="weight in allWeights"
                  :key="weight.id"
                  class="weight-item"
                  :class="{
                    placed: mentorStore.isWeightPlaced(weight.id),
                    used: mentorStore.isWeightUsed(weight.id)
                  }"
                  :style="{ background: mentorStore.isWeightUsed(weight.id) ? '#9E9E9E' : weight.color }"
                  @click="handleWeightClick(weight)"
                >
                  <span class="weight-name">{{ weight.name }}</span>
                  <span v-if="mentorStore.isWeightUsed(weight.id)" class="lock-badge">🔒</span>
                </div>
              </div>
              <div class="placed-weights-summary">
                <div class="placed-tags">
                  <span v-if="mentorStore.placedWeights.length === 0" class="empty-placed">（点击上方砝码放置到秤盘）</span>
                  <n-tag
                    v-for="pw in mentorStore.placedWeights"
                    :key="pw.id"
                    :color="pw.color"
                    text-color="#FFF8DC"
                    round
                    closable
                    @close="mentorStore.removeWeight(pw.id)"
                  >
                    {{ pw.name }}
                  </n-tag>
                </div>
                <div class="total-weight-row">
                  总计：<strong>{{ mentorStore.leftWeight.toFixed(1) }}钱</strong>
                </div>
              </div>
              <n-button
                type="primary"
                size="large"
                block
                color="#D2691E"
                :disabled="isStepCompleted(currentStep.id)"
                @click="mentorStore.confirmWeightSelection()"
              >确认砝码选择</n-button>
            </div>

            <div v-if="currentStep?.id === 'adjust_herb_count'" class="herb-adjust-area">
              <div class="herb-adjust-card">
                <div class="adjust-header">
                  <span class="herb-color-dot" :style="{ background: mentorStore.currentHerb?.color }"></span>
                  <span class="adjust-herb-name">{{ mentorStore.currentHerb?.herbName }}</span>
                  <span class="adjust-unit">(单味 {{ mentorStore.currentHerb?.unitWeight }}钱)</span>
                </div>
                <div class="adjust-controls">
                  <n-button circle size="huge" @click="decreaseHerb" :disabled="mentorStore.currentHerbCount <= 0">-</n-button>
                  <div class="count-display-wrapper">
                    <span class="count-number">{{ mentorStore.currentHerbCount }}</span>
                    <span class="count-label">味</span>
                    <span class="count-weight">= {{ mentorStore.rightWeight.toFixed(1) }}钱</span>
                  </div>
                  <n-button circle size="huge" type="primary" color="#556B2F" @click="increaseHerb">+</n-button>
                </div>
                <n-button
                  type="primary"
                  size="large"
                  block
                  color="#556B2F"
                  :disabled="isStepCompleted(currentStep.id)"
                  @click="mentorStore.confirmHerbCountAdjustment()"
                >确认药量调整</n-button>
              </div>
            </div>

            <div v-if="currentStep?.id === 'judge_balance'" class="balance-judge-area">
              <div class="judge-card">
                <h4 class="judge-question">请判断当前天平的平衡状态</h4>
                <div class="judge-options">
                  <div class="judge-option" @click="mentorStore.judgeBalance('under')">
                    <div class="judge-icon">⬅️</div>
                    <div class="judge-text">砝码偏重（左低右高）</div>
                  </div>
                  <div class="judge-option" @click="mentorStore.judgeBalance('balanced')">
                    <div class="judge-icon">⚖️</div>
                    <div class="judge-text">平衡（误差在允许范围内）</div>
                  </div>
                  <div class="judge-option" @click="mentorStore.judgeBalance('over')">
                    <div class="judge-icon">➡️</div>
                    <div class="judge-text">药材偏重（左高右低）</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="currentStep?.id === 'submit_result'" class="submit-result-area">
              <div class="submit-card">
                <h4 class="submit-title">最终确认</h4>
                <div class="submit-details">
                  <div class="detail-row">
                    <span class="detail-label">药材名称</span>
                    <span class="detail-value">{{ mentorStore.currentHerb?.herbName }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">目标/实际</span>
                    <span class="detail-value">{{ mentorStore.currentHerb?.targetWeight }} / {{ mentorStore.rightWeight.toFixed(2) }} 钱</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">药材数量</span>
                    <span class="detail-value">{{ mentorStore.currentHerbCount }}味</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">砝码组合</span>
                    <span class="detail-value">{{ mentorStore.placedWeights.length > 0 ? mentorStore.placedWeights.map(w => w.name).join('+') : '无' }}</span>
                  </div>
                  <div class="detail-row highlight">
                    <span class="detail-label">最终误差</span>
                    <span class="detail-value" :class="getErrorClass(mentorStore.currentError, mentorStore.currentHerb?.allowedError || 0)">
                      {{ formatError(mentorStore.currentError) }}
                      <span v-if="mentorStore.isCurrentBalanced" class="ok-tag">✅合格</span>
                      <span v-else class="bad-tag">❌超出</span>
                    </span>
                  </div>
                </div>
                <n-button
                  type="primary"
                  size="large"
                  block
                  :color="mentorStore.isCurrentBalanced ? '#2E8B57' : '#999'"
                  :disabled="!mentorStore.isCurrentBalanced || isStepCompleted(currentStep.id)"
                  @click="mentorStore.confirmSubmitResult()"
                >确认提交结果</n-button>
              </div>
            </div>
          </template>
        </div>

        <div class="right-panel">
          <div class="steps-progress-panel">
            <h4 class="panel-title">步骤进度</h4>
            <div class="steps-progress-list">
              <div
                v-for="step in MENTOR_STEPS"
                :key="step.id"
                class="step-progress-row"
                :class="{ done: isStepCompleted(step.id), skipped: isStepSkipped(step.id) }"
              >
                <span class="step-progress-icon">
                  {{ isStepCompleted(step.id) ? (isStepSkipped(step.id) ? '⏭️' : '✅') : '⬜' }}
                </span>
                <span class="step-progress-name">{{ step.title.replace(/第.步：/, '') }}</span>
                <span class="step-progress-score">{{ getCurrentHerbStepScore(step.id) }}/{{ step.maxScore }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="mentorStore.isPaused" class="pause-overlay">
        <div class="pause-content">
          <div class="pause-icon">⏸️</div>
          <h3 class="pause-title">学习已暂停</h3>
          <p class="pause-desc">喝口茶，休息一下再继续吧~</p>
          <n-button type="primary" size="large" @click="handleTogglePause">
            <template #icon>
              <n-icon :component="PlayOutline" />
            </template>
            继续学习
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
import { useMentorStore } from '@/stores/mentor'
import MentorScale from '@/components/MentorScale.vue'
import {
  TimeOutline, PlayOutline, TrophyOutline, RefreshOutline, BookOutline,
  CheckmarkCircleOutline, AlertCircleOutline, ScaleOutline, SadOutline
} from '@vicons/ionicons5'
import { MENTOR_STEPS, MENTOR_DIFFICULTY_CONFIG, WEIGHTS } from '@/constants'
import type { MentorDifficulty, MentorStepType, Weight } from '@/types'
import { isVoiceEnabled, toggleVoice, speak } from '@/utils/speech'

const router = useRouter()
const mentorStore = useMentorStore()
const showHint = ref(true)
const allWeights = computed(() => WEIGHTS)
const currentStep = computed(() => mentorStore.currentStep)
const currentHerbQuestion = computed(() => mentorStore.currentHerbQuestion)
const currentStepScore = computed(() => mentorStore.currentStepScore)
const lastResult = computed(() => mentorStore.lastSessionResult)
const diffConfig = computed(() => MENTOR_DIFFICULTY_CONFIG[mentorStore.currentDifficulty])
const recentFeedbacks = computed(() => [...mentorStore.currentFeedbacks].slice(-5).reverse())

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) seconds = 0
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatError(error: number): string {
  const sign = error > 0 ? '+' : ''
  return `${sign}${error.toFixed(2)}钱`
}

function getErrorClass(error: number, allowed: number): string {
  const abs = Math.abs(error)
  if (abs <= allowed) return 'error-good'
  if (abs <= allowed * 2) return 'error-warning'
  return 'error-bad'
}

function isStepCompleted(stepId: MentorStepType): boolean {
  return mentorStore.currentHerbStepResults[stepId]?.completed || false
}

function isStepSkipped(stepId: MentorStepType): boolean {
  return mentorStore.currentHerbStepResults[stepId]?.skipped || false
}

function getCurrentHerbStepScore(stepId: MentorStepType): number {
  const r = mentorStore.currentHerbStepResults[stepId]
  return r ? Math.max(0, r.score) : 0
}

function handleSelectDifficulty(diff: MentorDifficulty): void {
  mentorStore.setDifficulty(diff)
}

function handleStartSession(): void {
  mentorStore.startSession()
}

function handleStepNavClick(index: number): void {
  if (index <= mentorStore.currentStepIndex) mentorStore.goToStep(index)
}

function handleSkipStep(): void {
  mentorStore.skipCurrentStep()
}

function handleVoiceToggle(): void {
  toggleVoice()
}

function handleTogglePause(): void {
  mentorStore.togglePause()
}

function toggleHint(): void {
  showHint.value = !showHint.value
}

function handleWeightClick(weight: Weight): void {
  if (mentorStore.isWeightUsed(weight.id)) return
  if (mentorStore.isWeightPlaced(weight.id)) {
    mentorStore.removeWeight(weight.id)
  } else {
    mentorStore.addWeight(weight)
  }
}

function increaseHerb(): void {
  mentorStore.setHerbCount(mentorStore.currentHerbCount + 1)
}

function decreaseHerb(): void {
  if (mentorStore.currentHerbCount > 0) mentorStore.setHerbCount(mentorStore.currentHerbCount - 1)
}

function handleReset(): void {
  mentorStore.startSession()
}

function handleSelectNew(): void {
  mentorStore.resetAll()
}

function goToMentorReview(): void {
  router.push('/mentor-review')
}

onMounted(() => {
  mentorStore.init()
  mentorStore.selectPrescription(0)
})
</script>

<style scoped>
.mentor-mode-page { min-height: 100%; padding: 20px; }
.page-header { max-width: 1600px; margin: 0 auto 20px auto; }
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.page-title { display: flex; align-items: center; gap: 10px; font-size: 26px; color: #4A2C17; margin: 0; font-weight: 700; }
.profile-card { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 100%); padding: 10px 16px; border-radius: 16px; border: 2px solid #DEB887; }
.profile-avatar { font-size: 36px; line-height: 1; }
.profile-info { display: flex; flex-direction: column; gap: 4px; min-width: 160px; }
.profile-name-row { display: flex; align-items: center; gap: 8px; }
.profile-name { font-weight: 600; color: #4A2C17; font-size: 14px; }
.profile-title-badge { font-size: 11px; background: #8B4513; color: #FFF8DC; padding: 2px 8px; border-radius: 10px; }
.profile-level { display: flex; align-items: center; gap: 6px; }
.xp-text { font-size: 11px; color: #8B7355; }
.voice-toggle { padding: 8px; border-radius: 50%; background: rgba(139, 69, 19, 0.1); color: #8B4513; cursor: pointer; }
.header-stats { display: flex; gap: 12px; flex-wrap: wrap; background: #FFF8DC; padding: 12px 20px; border-radius: 12px; border: 2px solid #DEB887; }
.stat-item { display: flex; flex-direction: column; gap: 2px; padding: 4px 12px; border-right: 1px dashed #DEB887; }
.stat-item:last-child { border-right: none; }
.stat-label { font-size: 11px; color: #8B7355; }
.stat-value { font-size: 16px; font-weight: 600; color: #4A2C17; }
.timer { color: #2E8B57; font-weight: bold; }
.timer.warning { color: #DC143C; animation: pulse 1s infinite; }
.score-value { color: #DAA520; font-size: 20px; }
.header-actions { display: flex; align-items: center; margin-left: auto; }
.pause-btn { min-width: 100px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

.start-screen, .result-screen { max-width: 1400px; margin: 0 auto; }
.start-container { background: #FFF; border-radius: 20px; padding: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); border: 3px solid #DEB887; }
.section-title { font-size: 22px; color: #4A2C17; margin: 0 0 20px 0; font-weight: 700; text-align: center; }
.difficulty-section { margin-bottom: 32px; }
.difficulty-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.diff-card { border: 2px solid #CCC; border-radius: 16px; overflow: hidden; cursor: pointer; transition: all 0.25s ease; background: #FFF8DC; }
.diff-card:hover:not(.locked) { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
.diff-card.active { box-shadow: 0 0 0 4px rgba(139,69,19,0.2); transform: translateY(-3px); }
.diff-card.locked { opacity: 0.6; cursor: not-allowed; }
.diff-header { padding: 12px 16px; color: #FFF; font-weight: 600; font-size: 16px; display: flex; justify-content: space-between; align-items: center; }
.diff-desc { padding: 12px 16px; margin: 0; font-size: 13px; color: #6B4423; line-height: 1.5; border-bottom: 1px dashed #DEB887; }
.diff-stats { padding: 12px 16px; display: flex; justify-content: space-between; }
.diff-stat { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.diff-stat .label { font-size: 11px; color: #8B7355; }
.diff-stat .value { font-size: 14px; font-weight: 600; color: #4A2C17; }
.prescription-section { margin-bottom: 28px; }
.prescription-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
.prescription-card { background: #FFFAF0; border: 2px solid #DEB887; border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.25s ease; }
.prescription-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(139,69,19,0.15); }
.prescription-card.active { border-color: #8B4513; background: #FFF8DC; box-shadow: 0 0 0 4px rgba(139,69,19,0.15); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.prescription-name { font-size: 20px; color: #4A2C17; margin: 0; font-weight: 600; }
.herb-count-badge { background: #8B4513; color: #FFF8DC; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
.prescription-desc { font-size: 13px; color: #8B7355; margin: 0 0 14px 0; }
.herb-preview { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.herb-chip { display: flex; flex-direction: column; align-items: center; padding: 6px 10px; border-radius: 10px; border: 1px solid; }
.herb-chip-name { font-size: 12px; color: #4A2C17; font-weight: 500; }
.herb-chip-target { font-size: 11px; color: #8B7355; }
.card-footer { border-top: 1px dashed #DEB887; padding-top: 10px; }
.time-limit { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6B4423; font-weight: 500; }
.start-actions { display: flex; justify-content: center; gap: 16px; }

.result-container { background: #FFF; border-radius: 20px; padding: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); border: 3px solid #DAA520; }
.result-header-card { display: flex; align-items: center; gap: 24px; padding-bottom: 24px; border-bottom: 2px dashed #DEB887; margin-bottom: 24px; flex-wrap: wrap; }
.result-icon { width: 96px; height: 96px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #E8F5E9; color: #2E8B57; }
.result-title-section { flex: 1; min-width: 200px; }
.result-title { font-size: 28px; color: #4A2C17; margin: 0 0 4px 0; font-weight: 700; }
.result-prescription-name { margin: 0; color: #8B7355; font-size: 16px; }
.result-score-section { text-align: right; }
.total-score { margin-bottom: 4px; }
.score-num { font-size: 56px; font-weight: bold; color: #DAA520; line-height: 1; }
.score-total { font-size: 24px; color: #999; }
.score-percent { font-size: 14px; color: #8B7355; margin-bottom: 6px; }
.summary-sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
.summary-card { border-radius: 12px; padding: 16px; }
.summary-card h4 { margin: 0 0 12px 0; font-size: 16px; color: #4A2C17; display: flex; align-items: center; gap: 8px; }
.summary-card ul { margin: 0; padding-left: 20px; }
.summary-card li { font-size: 13px; color: #6B4423; line-height: 1.7; }
.summary-card.highlights { background: #F0FFF0; border: 2px solid #90EE90; }
.summary-card.weakpoints { background: #FFFEF0; border: 2px solid #F0E68C; }
.summary-card.suggestions { background: #F0F8FF; border: 2px solid #87CEEB; }
.summary-card.goals { background: #FFF0F5; border: 2px solid #FFB6C1; }
.result-actions { display: flex; justify-content: center; gap: 16px; padding-top: 24px; border-top: 2px dashed #DEB887; flex-wrap: wrap; }

.main-content { max-width: 1600px; margin: 0 auto; }
.workspace-wrapper { position: relative; }

.steps-navbar { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px; background: #FFF8DC; padding: 16px 24px; border-radius: 16px; border: 2px solid #DEB887; overflow-x: auto; }
.step-nav-item { display: flex; align-items: center; cursor: pointer; flex-shrink: 0; padding: 6px 10px; border-radius: 10px; transition: all 0.2s; }
.step-nav-item:hover { background: rgba(139,69,19,0.08); }
.step-nav-item.disabled { cursor: not-allowed; opacity: 0.5; }
.step-nav-item.disabled:hover { background: transparent; }
.step-num-circle { width: 30px; height: 30px; border-radius: 50%; background: #DEB887; color: #6B4423; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; margin-right: 8px; }
.step-nav-item.active .step-num-circle { background: #8B4513; color: #FFF8DC; box-shadow: 0 0 0 3px rgba(139,69,19,0.2); }
.step-nav-item.completed .step-num-circle { background: #2E8B57; color: #FFF; }
.step-nav-item.skipped .step-num-circle { background: #B8860B; color: #FFF; }
.step-nav-title { font-size: 13px; color: #6B4423; font-weight: 500; white-space: nowrap; }
.step-nav-item.active .step-nav-title { color: #8B4513; font-weight: 600; }

.workspace { display: grid; grid-template-columns: 320px 1fr 240px; gap: 16px; align-items: flex-start; }
@media (max-width: 1400px) { .workspace { grid-template-columns: 300px 1fr; } .right-panel { display: none; } }
@media (max-width: 1024px) { .workspace { grid-template-columns: 1fr; } }

.left-panel, .right-panel { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 10px; }
.instruction-card { background: linear-gradient(135deg, #FFFAF0 0%, #FFF8DC 100%); border-radius: 16px; overflow: hidden; border: 2px solid #DEB887; }
.instruction-header { padding: 12px 16px; color: #FFF; display: flex; justify-content: space-between; align-items: center; }
.instruction-header.select_prescription { background: linear-gradient(135deg, #6B8E23, #556B2F); }
.instruction-header.identify_herb { background: linear-gradient(135deg, #4169E1, #2F4F8F); }
.instruction-header.select_weights { background: linear-gradient(135deg, #D2691E, #A0522D); }
.instruction-header.adjust_herb_count { background: linear-gradient(135deg, #228B22, #2E8B57); }
.instruction-header.judge_balance { background: linear-gradient(135deg, #8B008B, #663399); }
.instruction-header.submit_result { background: linear-gradient(135deg, #B8860B, #DAA520); }
.instruction-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
.step-score-badge { background: rgba(255,255,255,0.25); padding: 3px 10px; border-radius: 12px; font-size: 12px; }
.instruction-body { padding: 14px 16px; }
.instruction-text { display: flex; align-items: flex-start; gap: 8px; margin: 0 0 10px 0; line-height: 1.6; font-size: 13px; color: #4A2C17; }
.hint-box { display: flex; align-items: flex-start; gap: 8px; padding: 10px; background: #FFFEF0; border-radius: 10px; border: 1px dashed #DAA520; font-size: 12px; color: #8B6914; line-height: 1.5; }
.instruction-actions { display: flex; justify-content: space-between; padding: 10px 16px; border-top: 1px dashed #DEB887; gap: 8px; flex-wrap: wrap; }

.feedback-panel { background: #FFFAF0; border-radius: 16px; padding: 14px; border: 2px solid #DEB887; }
.feedback-title { display: flex; align-items: center; gap: 8px; margin: 0 0 12px 0; font-size: 14px; color: #4A2C17; font-weight: 600; }
.feedback-list { display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; }
.feedback-item { display: flex; gap: 8px; padding: 8px 10px; border-radius: 10px; border-left: 3px solid; }
.feedback-item.success { background: #F0FFF0; border-color: #2E8B57; }
.feedback-item.warning { background: #FFFEF0; border-color: #DAA520; }
.feedback-item.error { background: #FFF0F5; border-color: #DC143C; }
.feedback-item.info { background: #F0F8FF; border-color: #4169E1; }
.feedback-icon { font-size: 14px; line-height: 1.4; flex-shrink: 0; }
.feedback-title-text { font-size: 12px; font-weight: 600; color: #4A2C17; display: block; margin-bottom: 2px; }
.feedback-message { margin: 0; font-size: 12px; line-height: 1.5; color: #6B4423; }
.feedback-suggestion { margin: 4px 0 0 0; font-size: 11px; color: #8B6914; }

.herb-progress-panel, .steps-progress-panel { background: #FFF8DC; border-radius: 16px; padding: 14px; border: 2px solid #DEB887; }
.panel-title { margin: 0 0 10px 0; font-size: 14px; color: #4A2C17; font-weight: 600; }
.herbs-list { display: flex; flex-direction: column; gap: 6px; }
.herb-progress-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; background: #FFFAF0; border: 2px solid transparent; transition: all 0.2s; }
.herb-progress-item.active { border-color: #8B4513; background: #FFF8DC; }
.herb-progress-item.completed { opacity: 0.85; background: #F0FFF0; }
.herb-progress-color { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.herb-progress-info { flex: 1; min-width: 0; }
.herb-progress-name { font-size: 12px; font-weight: 600; color: #4A2C17; display: block; }
.herb-progress-target { font-size: 11px; color: #8B7355; }
.current-badge { font-size: 11px; background: #8B4513; color: #FFF; padding: 2px 6px; border-radius: 8px; }
.pending-badge { font-size: 11px; color: #999; }
.done-badge { color: #2E8B57; font-weight: bold; }

.center-area { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.step-content { width: 100%; max-width: 720px; }
.step-prescription-card, .herb-id-card, .weight-selection-area, .herb-adjust-card, .judge-card, .submit-card {
  background: #FFF; border-radius: 16px; padding: 24px; border: 2px solid #DEB887; box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.step-prescription-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.step-prescription-header h3 { margin: 0; font-size: 22px; color: #4A2C17; }
.step-prescription-desc { font-size: 14px; color: #6B4423; margin: 0 0 18px 0; }
.step-herbs-overview { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; padding: 14px; background: #FFFAF0; border-radius: 12px; }
.step-herb-overview-item { display: flex; align-items: center; gap: 10px; }
.overview-color { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); }
.overview-info { display: flex; flex-direction: column; }
.overview-name { font-size: 13px; font-weight: 600; color: #4A2C17; }
.overview-target { font-size: 12px; color: #8B7355; }

.herb-visual-card { display: flex; gap: 20px; margin-bottom: 20px; }
.herb-visual { width: 140px; height: 140px; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 4px 16px rgba(0,0,0,0.15); border: 3px solid rgba(255,255,255,0.5); flex-shrink: 0; }
.herb-visual-count { text-align: center; color: #FFF; text-shadow: 1px 1px 4px rgba(0,0,0,0.4); }
.herb-visual-count span { display: block; font-size: 12px; opacity: 0.9; }
.herb-visual-count strong { font-size: 24px; font-weight: bold; }
.herb-basic-info { flex: 1; }
.herb-name { font-size: 22px; color: #4A2C17; margin: 0 0 6px 0; }
.herb-description { font-size: 13px; color: #6B4423; line-height: 1.7; margin: 0 0 12px 0; }
.herb-stats-row { display: flex; gap: 8px; flex-wrap: wrap; }
.question-card { padding: 18px; background: #FFFAF0; border-radius: 12px; border: 2px dashed #DEB887; }
.question-card.answered.correct { border-color: #90EE90; background: #F0FFF0; }
.question-card.answered.wrong { border-color: #F08080; background: #FFF0F5; }
.question-text { font-size: 15px; color: #4A2C17; margin: 0 0 16px 0; font-weight: 600; }
.options-list { display: flex; flex-direction: column; gap: 10px; }
.option-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; background: #FFF; border: 2px solid #DEB887; cursor: pointer; transition: all 0.2s; }
.option-item:hover { border-color: #8B4513; background: #FFF8DC; }
.option-item.selected { border-color: #4169E1; background: #F0F8FF; }
.option-item.correct { border-color: #2E8B57; background: #F0FFF0; }
.option-item.wrong { border-color: #DC143C; background: #FFF0F5; }
.option-label { width: 28px; height: 28px; border-radius: 50%; background: #DEB887; color: #4A2C17; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; flex-shrink: 0; }
.option-item.selected .option-label { background: #4169E1; color: #FFF; }
.option-item.correct .option-label { background: #2E8B57; color: #FFF; }
.option-item.wrong .option-label { background: #DC143C; color: #FFF; }
.option-text { flex: 1; font-size: 14px; color: #4A2C17; }

.section-title-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-title-bar h4 { margin: 0; font-size: 16px; color: #4A2C17; }
.section-title-bar .subtitle { font-size: 13px; color: #6B4423; }
.weight-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 14px; }
.weight-item { aspect-ratio: 1; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 2px solid #4A2C17; position: relative; user-select: none; }
.weight-item:hover:not(.used):not(.placed) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
.weight-item.placed { border-color: #2E8B57; box-shadow: 0 0 0 3px rgba(46,139,87,0.3); }
.weight-item.used { opacity: 0.5; cursor: not-allowed; border-color: #666; }
.weight-name { color: #FFF8DC; font-size: 12px; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
.lock-badge { font-size: 10px; position: absolute; top: 2px; right: 4px; }
.placed-weights-summary { background: #FFFAF0; border-radius: 10px; padding: 12px; margin-bottom: 14px; }
.empty-placed { color: #999; font-size: 13px; font-style: italic; }
.placed-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.total-weight-row { font-size: 14px; color: #4A2C17; border-top: 1px dashed #DEB887; padding-top: 8px; }
.total-weight-row strong { color: #D2691E; font-size: 16px; }

.herb-adjust-card, .judge-card, .submit-card { width: 100%; max-width: 560px; }
.adjust-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px dashed #DEB887; }
.herb-color-dot { width: 24px; height: 24px; border-radius: 8px; border: 2px solid rgba(0,0,0,0.1); }
.adjust-herb-name { font-size: 18px; font-weight: 600; color: #4A2C17; }
.adjust-unit { font-size: 13px; color: #8B7355; }
.adjust-controls { display: flex; justify-content: center; align-items: center; gap: 32px; margin-bottom: 20px; }
.count-display-wrapper { display: flex; flex-direction: column; align-items: center; }
.count-number { font-size: 64px; font-weight: bold; color: #556B2F; line-height: 1; }
.count-label { font-size: 14px; color: #6B4423; }
.count-weight { font-size: 16px; color: #8B4513; font-weight: 600; margin-top: 4px; }

.judge-question { font-size: 16px; color: #4A2C17; margin: 0 0 20px 0; font-weight: 600; text-align: center; }
.judge-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.judge-option { padding: 20px 14px; border-radius: 14px; background: #FFFAF0; border: 2px solid #DEB887; cursor: pointer; transition: all 0.2s; text-align: center; }
.judge-option:hover { transform: translateY(-3px); border-color: #8B4513; background: #FFF8DC; }
.judge-icon { font-size: 32px; margin-bottom: 8px; }
.judge-text { font-size: 13px; color: #4A2C17; font-weight: 500; line-height: 1.5; }

.submit-title { font-size: 18px; color: #4A2C17; margin: 0 0 16px 0; padding-bottom: 10px; border-bottom: 2px dashed #DEB887; text-align: center; font-weight: 600; }
.submit-details { margin-bottom: 18px; }
.detail-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px dashed #F0E6D2; }
.detail-row:last-of-type { border-bottom: none; }
.detail-row.highlight { background: #FFFEF0; border-radius: 8px; margin: 8px 0; border-bottom: none; }
.detail-label { font-size: 13px; color: #8B7355; }
.detail-value { font-size: 14px; color: #4A2C17; font-weight: 500; }
.error-good { color: #2E8B57; font-weight: 600; }
.error-warning { color: #DAA520; font-weight: 600; }
.error-bad { color: #DC143C; font-weight: 600; }
.ok-tag, .bad-tag { font-size: 11px; margin-left: 6px; font-weight: normal; }

.steps-progress-list { display: flex; flex-direction: column; gap: 6px; }
.step-progress-row { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: #FFFAF0; }
.step-progress-row.done { background: #F0FFF0; }
.step-progress-row.skipped { background: #FFFEF0; }
.step-progress-icon { font-size: 12px; }
.step-progress-name { flex: 1; font-size: 12px; color: #4A2C17; }
.step-progress-score { font-size: 11px; color: #6B4423; font-weight: 600; }

.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(139, 69, 19, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.pause-content {
  text-align: center;
  color: #FFF8DC;
}

.pause-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.pause-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.pause-desc {
  font-size: 16px;
  margin: 0 0 24px 0;
  opacity: 0.85;
}
</style>
