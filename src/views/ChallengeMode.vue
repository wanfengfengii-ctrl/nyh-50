<template>
  <div class="challenge-mode-page">
    <div class="page-header">
      <div class="header-top">
        <h2 class="page-title">限时挑战模式</h2>
        <div class="score-display">
          得分：{{ gameStore.challengeScore }} / {{ gameStore.totalQuestions }}
        </div>
      </div>
      <div class="progress-bar">
        <n-progress 
          type="line" 
          :percentage="gameStore.progress" 
          :show-indicator="false"
          color="#DAA520"
          rail-color="#FAEBD7"
        />
      </div>
    </div>

    <div v-if="!challengeStarted" class="start-screen">
      <div class="start-card">
        <div class="start-icon">
          <n-icon size="48" :component="TrophyOutline" />
        </div>
        <h3 class="start-title">限时挑战</h3>
        <p class="start-desc">
          共 {{ totalQuestions }} 道题目，每道题限时作答<br/>
          称量误差在允许范围内即为正确
        </p>
        <div class="start-rules">
          <div class="rule-item">
            <n-icon :component="CheckmarkCircleOutline" />
            <span>传统砝码组合练习</span>
          </div>
          <div class="rule-item">
            <n-icon :component="CheckmarkCircleOutline" />
            <span>实时秤杆物理模拟</span>
          </div>
          <div class="rule-item">
            <n-icon :component="CheckmarkCircleOutline" />
            <span>错题自动收录复盘</span>
          </div>
        </div>
        <n-button 
          type="primary" 
          size="large" 
          @click="startChallenge"
          color="#DAA520"
        >
          开始挑战
        </n-button>
      </div>
    </div>

    <div v-else-if="challengeFinished" class="result-screen">
      <div class="result-card">
        <div class="result-icon" :class="{ pass: isPassed }">
          <n-icon size="56" :component="isPassed ? TrophyOutline : SadOutline" />
        </div>
        <h3 class="result-title">
          {{ isPassed ? '挑战成功！' : '挑战结束' }}
        </h3>
        <div class="result-score">
          <span class="score-num">{{ gameStore.challengeScore }}</span>
          <span class="score-total"> / {{ gameStore.totalQuestions }}</span>
        </div>
        <p class="result-desc">
          {{ isPassed ? '恭喜你，掌握得不错！' : '继续加油，多多练习！' }}
        </p>
        <div class="result-actions">
          <n-button @click="restartChallenge">
            重新挑战
          </n-button>
          <n-button 
            type="primary" 
            v-if="wrongCount > 0"
            @click="goToReview"
            color="#DAA520"
          >
            错题复盘 ({{ wrongCount }})
          </n-button>
        </div>
      </div>
    </div>

    <div v-else class="main-content">
      <div class="question-info">
        <div class="question-num">
          第 {{ currentQuestionIndex + 1 }} / {{ totalQuestions }} 题
        </div>
        <div class="timer" :class="{ warning: isTimeWarning }">
          <n-icon :component="TimeOutline" />
          <span>{{ formatTime(gameStore.timeRemaining) }}</span>
        </div>
      </div>

      <div class="question-card">
        <span class="question-label">请称量</span>
        <span class="question-target">{{ currentQuestion?.targetWeight }} 钱</span>
        <span class="question-herb">{{ currentQuestion?.herbName }}</span>
      </div>

      <div class="game-area">
        <div class="left-panel">
          <WeightPanel />
        </div>

        <div class="center-panel">
          <ScaleSimulation />
        </div>

        <div class="right-panel">
          <div class="herb-info-card">
            <h4>当前药材</h4>
            <div class="herb-name">{{ currentQuestion?.herbName }}</div>
            <div class="herb-unit">单味：{{ currentQuestion?.herbUnitWeight }} 钱</div>
            
            <div class="count-control">
              <label>药材数量</label>
              <div class="count-row">
                <n-button 
                  circle 
                  size="medium" 
                  @click="decreaseHerb"
                  :disabled="herbCount <= 0"
                >
                  -
                </n-button>
                <span class="count-display">{{ herbCount }}</span>
                <n-button 
                  circle 
                  size="medium" 
                  @click="increaseHerb"
                >
                  +
                </n-button>
              </div>
            </div>

            <div class="weight-total">
              药材总重：<strong>{{ herbTotalWeight.toFixed(2) }} 钱</strong>
            </div>
          </div>

          <div class="action-buttons">
            <n-button 
              type="primary" 
              size="large" 
              block
              @click="submitAnswer"
              :disabled="!scaleStore.isBalanced"
              color="#2E8B57"
            >
              <template #icon>
                <n-icon :component="CheckmarkCircleOutline" />
              </template>
              提交答案
            </n-button>
          </div>

          <ControlPanel />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useScaleStore } from '@/stores/scale'
import { useGameStore } from '@/stores/game'
import { CHALLENGE_QUESTIONS } from '@/constants'
import ScaleSimulation from '@/components/ScaleSimulation.vue'
import WeightPanel from '@/components/WeightPanel.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import { 
  TrophyOutline, 
  CheckmarkCircleOutline, 
  TimeOutline,
  SadOutline
} from '@vicons/ionicons5'

const router = useRouter()
const scaleStore = useScaleStore()
const gameStore = useGameStore()

const challengeStarted = ref(false)
const challengeFinished = ref(false)

const totalQuestions = computed(() => CHALLENGE_QUESTIONS.length)
const currentQuestionIndex = computed(() => gameStore.currentQuestionIndex)
const currentQuestion = computed(() => gameStore.currentQuestion)

const herbCount = computed(() => scaleStore.herbCount)
const herbTotalWeight = computed(() => scaleStore.rightWeight)

const isTimeWarning = computed(() => gameStore.timeRemaining <= 10)

const isPassed = computed(() => {
  return gameStore.challengeScore >= Math.ceil(gameStore.totalQuestions * 0.6)
})

const wrongCount = computed(() => {
  return gameStore.getWrongAnswers().length
})

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function startChallenge() {
  challengeStarted.value = true
  challengeFinished.value = false
  gameStore.startChallenge()
}

function restartChallenge() {
  challengeFinished.value = false
  gameStore.startChallenge()
}

function submitAnswer() {
  const isCorrect = gameStore.submitAnswer()
  
  if (gameStore.isLastQuestion()) {
    challengeFinished.value = true
    gameStore.stopTimer()
  } else {
    gameStore.nextQuestion()
  }
}

function increaseHerb() {
  scaleStore.setHerbCount(scaleStore.herbCount + 1)
}

function decreaseHerb() {
  if (scaleStore.herbCount > 0) {
    scaleStore.setHerbCount(scaleStore.herbCount - 1)
  }
}

function goToReview() {
  gameStore.setGameMode('review')
  router.push('/review')
}

watch(() => gameStore.timeRemaining, (val) => {
  if (val <= 0 && challengeStarted.value && !challengeFinished.value) {
    if (gameStore.isLastQuestion()) {
      challengeFinished.value = true
    } else {
      gameStore.nextQuestion()
    }
  }
})

onMounted(() => {
  gameStore.setGameMode('challenge')
})
</script>

<style scoped>
.challenge-mode-page {
  min-height: 100%;
  padding: 20px;
}

.page-header {
  max-width: 1200px;
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

.score-display {
  font-size: 16px;
  font-weight: 600;
  color: #DAA520;
  background: #FFF8DC;
  padding: 6px 16px;
  border-radius: 20px;
  border: 2px solid #DAA520;
}

.start-screen,
.result-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.start-card,
.result-card {
  background: #FFF;
  border-radius: 20px;
  padding: 40px 60px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #DAA520;
}

.start-icon,
.result-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px auto;
  background: #FFF8DC;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #DAA520;
}

.result-icon.pass {
  background: #E8F5E9;
  color: #2E8B57;
}

.start-title,
.result-title {
  font-size: 28px;
  color: #4A2C17;
  margin: 0 0 12px 0;
  font-weight: 700;
}

.start-desc,
.result-desc {
  font-size: 14px;
  color: #8B7355;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.start-rules {
  text-align: left;
  margin-bottom: 24px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  color: #556B2F;
  font-size: 14px;
}

.result-score {
  margin-bottom: 12px;
}

.score-num {
  font-size: 48px;
  font-weight: bold;
  color: #DAA520;
}

.score-total {
  font-size: 24px;
  color: #999;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.question-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1000px;
  margin: 0 auto 16px auto;
  padding: 0 20px;
}

.question-num {
  font-size: 16px;
  color: #6B4423;
  font-weight: 500;
}

.timer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 20px;
  font-weight: bold;
  color: #2E8B57;
  background: #E8F5E9;
  padding: 8px 20px;
  border-radius: 24px;
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

.question-card {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 100%);
  border-radius: 12px;
  margin: 0 auto 20px auto;
  max-width: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 2px solid #DAA520;
}

.question-label {
  font-size: 16px;
  color: #8B7355;
}

.question-target {
  font-size: 32px;
  font-weight: bold;
  color: #4A2C17;
}

.question-herb {
  font-size: 18px;
  color: #556B2F;
  background: #F0FFF0;
  padding: 4px 12px;
  border-radius: 16px;
}

.game-area {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
}

.left-panel {
  width: 260px;
  flex-shrink: 0;
}

.center-panel {
  flex: 0 0 auto;
}

.right-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.herb-info-card {
  background: #F5FFFA;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #90EE90;
}

.herb-info-card h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #2E8B57;
}

.herb-name {
  font-size: 20px;
  font-weight: bold;
  color: #2E8B57;
  margin-bottom: 4px;
}

.herb-unit {
  font-size: 13px;
  color: #6B8E23;
  margin-bottom: 16px;
}

.count-control {
  margin-bottom: 12px;
}

.count-control label {
  display: block;
  font-size: 13px;
  color: #556B2F;
  margin-bottom: 8px;
}

.count-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.count-display {
  font-size: 24px;
  font-weight: bold;
  color: #2E8B57;
  min-width: 60px;
  text-align: center;
}

.weight-total {
  text-align: center;
  font-size: 14px;
  color: #556B2F;
  padding-top: 12px;
  border-top: 1px dashed #90EE90;
}

.weight-total strong {
  font-size: 18px;
  color: #2E8B57;
}

.action-buttons {
  margin-top: 4px;
}
</style>
