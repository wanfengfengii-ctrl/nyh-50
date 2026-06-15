import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  MentorStepType,
  MentorDifficulty,
  MentorFeedback,
  MentorFeedbackLevel,
  MentorStepResult,
  MentorHerbResult,
  MentorSessionResult,
  MentorSessionSummary,
  MentorReplayFrame,
  ApprenticeProfile,
  ApprendiceSkillRecord,
  ApprenticeAchievement,
  Weight
} from '@/types'
import {
  PRESCRIPTIONS,
  WEIGHTS,
  MENTOR_STEPS,
  MENTOR_DIFFICULTY_CONFIG,
  MENTOR_HERB_QUESTIONS,
  INITIAL_SKILLS,
  INITIAL_ACHIEVEMENTS,
  APPRENTICE_TITLES,
  XP_PER_LEVEL
} from '@/constants'
import { speakStepInstruction, speakFeedback, stopSpeaking, isVoiceEnabled } from '@/utils/speech'

let feedbackCounter = 0

export const useMentorStore = defineStore('mentor', () => {
  const isStarted = ref(false)
  const isCompleted = ref(false)
  const isPaused = ref(false)

  const currentPrescriptionIndex = ref(0)
  const currentHerbIndex = ref(0)
  const currentStepIndex = ref(0)
  const currentDifficulty = ref<MentorDifficulty>('beginner')

  const sessionStartTime = ref(0)
  const sessionEndTime = ref(0)
  const sessionTimeRemaining = ref(0)
  let sessionTimer: number | null = null

  const herbStepStartTime = ref(0)

  const placedWeights = ref<Weight[]>([])
  const currentHerbCount = ref(0)
  const usedWeightIds = ref<Set<string>>(new Set())

  const stepResults = ref<Record<MentorStepType, MentorStepResult>>(createEmptyStepResults())
  const currentHerbStepResults = ref<Record<MentorStepType, MentorStepResult>>(createEmptyStepResults())

  const sessionFeedbacks = ref<MentorFeedback[]>([])
  const currentFeedbacks = ref<MentorFeedback[]>([])

  const herbResults = ref<MentorHerbResult[]>([])
  const sessionResults = ref<MentorSessionResult[]>([])
  const lastSessionResult = ref<MentorSessionResult | null>(null)

  const herbIdentifyAnswerSelected = ref<number | null>(null)
  const herbIdentifyAnswerCorrect = ref<boolean | null>(null)
  const balanceJudgmentSelected = ref<'' | 'over' | 'under' | 'balanced'>('')
  const balanceJudgmentCorrect = ref<boolean | null>(null)

  const replayData = ref<MentorReplayFrame[]>([])
  const replayStartTimestamp = ref(0)

  const apprenticeProfile = ref<ApprenticeProfile>(loadProfile())
  const showGuide = ref(true)

  function createEmptyStepResults(): Record<MentorStepType, MentorStepResult> {
    const result = {} as Record<MentorStepType, MentorStepResult>
    MENTOR_STEPS.forEach(step => {
      result[step.id] = {
        stepId: step.id,
        completed: false,
        skipped: false,
        score: 0,
        maxScore: step.maxScore,
        attempts: 0,
        timeSpent: 0,
        feedbacks: [],
        startTimestamp: 0
      }
    })
    return result
  }

  function loadProfile(): ApprenticeProfile {
    try {
      const stored = localStorage.getItem('scaleTrainer_apprenticeProfile')
      if (stored) {
        const profile = JSON.parse(stored)
        if (!profile.skills || profile.skills.length === 0) {
          profile.skills = JSON.parse(JSON.stringify(INITIAL_SKILLS))
        }
        if (!profile.achievements || profile.achievements.length === 0) {
          profile.achievements = JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS))
        }
        return profile
      }
    } catch (e) {
      console.error('Failed to load apprentice profile:', e)
    }
    return createDefaultProfile()
  }

  function createDefaultProfile(): ApprenticeProfile {
    return {
      id: 'apprentice_' + Date.now(),
      name: '小学徒',
      avatar: '🧑‍🎓',
      totalXP: 0,
      level: 0,
      title: APPRENTICE_TITLES[0].title,
      unlockedDifficulties: ['beginner'],
      completedSessions: 0,
      totalScore: 0,
      perfectSessions: 0,
      totalTimeSpent: 0,
      skills: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      unlockedPrescriptions: [],
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    }
  }

  function saveProfile(): void {
    try {
      localStorage.setItem('scaleTrainer_apprenticeProfile', JSON.stringify(apprenticeProfile.value))
    } catch (e) {
      console.error('Failed to save apprentice profile:', e)
    }
  }

  function saveSessionResults(): void {
    try {
      localStorage.setItem('scaleTrainer_mentorSessionResults', JSON.stringify(sessionResults.value))
    } catch (e) {
      console.error('Failed to save mentor session results:', e)
    }
  }

  function loadSessionResults(): MentorSessionResult[] {
    try {
      const stored = localStorage.getItem('scaleTrainer_mentorSessionResults')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load mentor session results:', e)
    }
    return []
  }

  const prescriptions = computed(() => {
    return PRESCRIPTIONS.map(p => ({
      ...p,
      herbs: p.herbs.map(h => ({
        ...h,
        allowedError: h.allowedError * MENTOR_DIFFICULTY_CONFIG[currentDifficulty.value].errorMultiplier
      }))
    }))
  })

  const currentPrescription = computed(() => {
    if (currentPrescriptionIndex.value >= prescriptions.value.length) return null
    return prescriptions.value[currentPrescriptionIndex.value]
  })

  const currentHerb = computed(() => {
    if (!currentPrescription.value) return null
    if (currentHerbIndex.value >= currentPrescription.value.herbs.length) return null
    return currentPrescription.value.herbs[currentHerbIndex.value]
  })

  const currentStep = computed(() => {
    if (currentStepIndex.value >= MENTOR_STEPS.length) return null
    return MENTOR_STEPS[currentStepIndex.value]
  })

  const currentHerbQuestion = computed(() => {
    if (!currentHerb.value) return null
    const questions = MENTOR_HERB_QUESTIONS[currentHerb.value.id]
    return questions ? questions[0] : null
  })

  const leftWeight = computed(() => {
    return placedWeights.value.reduce((sum, w) => sum + w.weight, 0)
  })

  const rightWeight = computed(() => {
    if (!currentHerb.value) return 0
    return currentHerbCount.value * currentHerb.value.unitWeight
  })

  const currentError = computed(() => leftWeight.value - rightWeight.value)

  const isCurrentBalanced = computed(() => {
    if (!currentHerb.value) return false
    return Math.abs(currentError.value) <= currentHerb.value.allowedError
  })

  const currentErrorPercentage = computed(() => {
    if (!currentHerb.value || currentHerb.value.targetWeight === 0) return 0
    return (Math.abs(currentError.value) / currentHerb.value.targetWeight) * 100
  })

  const completedHerbs = computed(() => herbResults.value.length)

  const totalHerbs = computed(() => currentPrescription.value?.herbs.length || 0)

  const sessionTotalScore = computed(() => {
    return Object.values(stepResults.value).reduce((sum, r) => sum + r.score, 0)
  })

  const sessionMaxScore = computed(() => {
    const perHerb = MENTOR_STEPS.reduce((sum, s) => sum + s.maxScore, 0)
    return perHerb * (totalHerbs.value || 1)
  })

  const currentStepScore = computed(() => {
    if (!currentStep.value) return 0
    return currentHerbStepResults.value[currentStep.value.id]?.score || 0
  })

  const skippedCount = computed(() => {
    let count = 0
    Object.values(stepResults.value).forEach(r => { if (r.skipped) count++ })
    return count
  })

  const errorCount = computed(() => {
    return sessionFeedbacks.value.filter(f => f.level === 'error').length
  })

  const apprenticeLevelProgress = computed(() => {
    const xpInLevel = apprenticeProfile.value.totalXP % XP_PER_LEVEL
    return Math.round((xpInLevel / XP_PER_LEVEL) * 100)
  })

  function getPrescriptionTimeLimit(): number {
    if (!currentPrescription.value) return 300
    const multiplier = MENTOR_DIFFICULTY_CONFIG[currentDifficulty.value].timeMultiplier
    return Math.round(currentPrescription.value.timeLimit * multiplier)
  }

  function addFeedback(level: MentorFeedbackLevel, title: string, message: string, suggestion?: string, relatedAction?: string): MentorFeedback {
    const feedback: MentorFeedback = {
      id: ++feedbackCounter,
      timestamp: Date.now(),
      level,
      title,
      message,
      suggestion,
      relatedAction
    }
    currentFeedbacks.value.push(feedback)
    sessionFeedbacks.value.push(feedback)

    if (currentStep.value) {
      currentHerbStepResults.value[currentStep.value.id].feedbacks.push(feedback)
    }

    speakFeedback(level, message)

    return feedback
  }

  function addReplayFrame(action: string, feedback?: MentorFeedback): void {
    if (!currentStep.value) return
    const frame: MentorReplayFrame = {
      timestamp: Date.now() - replayStartTimestamp.value,
      stepId: currentStep.value.id,
      action,
      placedWeights: [...placedWeights.value],
      herbCount: currentHerbCount.value,
      leftWeight: leftWeight.value,
      rightWeight: rightWeight.value,
      error: currentError.value,
      currentHerbId: currentHerb.value?.id,
      feedback
    }
    replayData.value.push(frame)
  }

  function setDifficulty(difficulty: MentorDifficulty): boolean {
    const config = MENTOR_DIFFICULTY_CONFIG[difficulty]
    if (apprenticeProfile.value.level < config.unlockLevel) {
      addFeedback('warning', '等级不足', `当前等级${apprenticeProfile.value.level}级，需要达到${config.unlockLevel}级才能解锁"${config.label}"`, '继续练习积累经验，提升学徒等级')
      return false
    }
    currentDifficulty.value = difficulty
    return true
  }

  function selectPrescription(index: number): void {
    currentPrescriptionIndex.value = index
  }

  function initializeHerbState(): void {
    placedWeights.value = []
    currentHerbCount.value = 0
    currentHerbStepResults.value = createEmptyStepResults()
    currentFeedbacks.value = []
    herbIdentifyAnswerSelected.value = null
    herbIdentifyAnswerCorrect.value = null
    balanceJudgmentSelected.value = ''
    balanceJudgmentCorrect.value = null
    currentStepIndex.value = 0
    herbStepStartTime.value = Date.now()
    startCurrentStep()
  }

  function startCurrentStep(): void {
    if (!currentStep.value) return
    const stepId = currentStep.value.id
    if (!currentHerbStepResults.value[stepId].startTimestamp) {
      currentHerbStepResults.value[stepId].startTimestamp = Date.now()
    }
    speakStepInstruction(currentStep.value.title, currentStep.value.instruction)
    addReplayFrame(`开始步骤: ${currentStep.value.title}`)
  }

  function startSession(): void {
    stopSpeaking()
    currentHerbIndex.value = 0
    herbResults.value = []
    sessionFeedbacks.value = []
    stepResults.value = createEmptyStepResults()
    replayData.value = []
    replayStartTimestamp.value = Date.now()
    usedWeightIds.value = new Set()

    isStarted.value = true
    isCompleted.value = false
    isPaused.value = false

    sessionStartTime.value = Date.now()
    sessionTimeRemaining.value = getPrescriptionTimeLimit()

    startSessionTimer()
    initializeHerbState()

    addFeedback('info', '开始学习', `今天学习《${currentPrescription.value?.name}》，共${totalHerbs.value}味药材，祝您好运！`, '按步骤完成每味药材的称量操作')
    addReplayFrame(`开始教学: ${currentPrescription.value?.name}`)
  }

  function startSessionTimer(): void {
    if (sessionTimer) clearInterval(sessionTimer)
    sessionTimer = window.setInterval(() => {
      if (isPaused.value) return
      if (sessionTimeRemaining.value > 0) {
        sessionTimeRemaining.value--
      } else {
        completeSession()
      }
    }, 1000)
  }

  function stopSessionTimer(): void {
    if (sessionTimer) {
      clearInterval(sessionTimer)
      sessionTimer = null
    }
  }

  function goToStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex >= MENTOR_STEPS.length) return
    currentStepIndex.value = stepIndex
    startCurrentStep()
  }

  function goToNextStep(): void {
    if (currentStepIndex.value < MENTOR_STEPS.length - 1) {
      goToStep(currentStepIndex.value + 1)
    }
  }

  function togglePause(): void {
    if (!isStarted.value || isCompleted.value) return
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      stopSpeaking()
      addFeedback('info', '已暂停', '学习已暂停，休息一下吧', '点击继续按钮可恢复学习')
    } else {
      addFeedback('success', '继续学习', '欢迎回来，继续加油！', '完成当前步骤可获得更高评分')
      if (isVoiceEnabled.value && currentStep.value) {
        speakStepInstruction(currentStep.value.title, currentStep.value.instruction)
      }
    }
  }

  function pauseSession(): void {
    if (!isPaused.value) {
      togglePause()
    }
  }

  function resumeSession(): void {
    if (isPaused.value) {
      togglePause()
    }
  }

  function completeCurrentStep(score: number, skipped: boolean = false): void {
    if (!currentStep.value) return
    const stepId = currentStep.value.id
    const step = currentStep.value

    const result = currentHerbStepResults.value[stepId]
    result.completed = true
    result.skipped = skipped
    result.score = Math.max(0, Math.min(step.maxScore, score))
    result.attempts = result.attempts + 1
    result.timeSpent = Date.now() - result.startTimestamp
    result.endTimestamp = Date.now()

    if (!stepResults.value[stepId].startTimestamp) {
      stepResults.value[stepId].startTimestamp = Date.now()
    }
    stepResults.value[stepId].completed = true
    stepResults.value[stepId].score += result.score
    stepResults.value[stepId].attempts += result.attempts
    stepResults.value[stepId].timeSpent += result.timeSpent
    if (skipped) stepResults.value[stepId].skipped = true

    addReplayFrame(`完成步骤: ${step.title}, 得分: ${result.score}/${step.maxScore}${skipped ? ' (跳步)' : ''}`)

    if (skipped) {
      addFeedback('warning', '跳步扣分', `您跳过了"${step.title}"，扣减${step.skipPenalty}分`, '建议按照步骤依次练习，打牢基础')
    } else if (result.score >= step.maxScore) {
      addFeedback('success', '完美完成', `太棒了！"${step.title}"获得满分${step.maxScore}分！`)
    } else if (result.score >= step.minCompletionScore) {
      addFeedback('success', '步骤通过', `"${step.title}"得分${result.score}分，继续加油！`)
    } else {
      addFeedback('warning', '勉强通过', `"${step.title}"得分${result.score}分，还有提升空间`)
    }

    if (step.autoAdvance) {
      setTimeout(() => goToNextStep(), 1000)
    }
  }

  function skipCurrentStep(): void {
    if (!currentStep.value) return
    if (!currentStep.value.allowedSkip) {
      addFeedback('error', '无法跳过', `此步骤为必做项，不能跳过`)
      return
    }
    const penalty = currentStep.value.skipPenalty
    completeCurrentStep(0, true)
    currentHerbStepResults.value[currentStep.value.id].score = -penalty
    stepResults.value[currentStep.value.id].score -= penalty
  }

  function confirmPrescriptionSelection(): void {
    completeCurrentStep(50)
  }

  function answerHerbIdentify(optionIndex: number): void {
    if (!currentHerbQuestion.value) return
    if (herbIdentifyAnswerCorrect.value !== null) return

    herbIdentifyAnswerSelected.value = optionIndex
    const isCorrect = optionIndex === currentHerbQuestion.value.correctOptionIndex
    herbIdentifyAnswerCorrect.value = isCorrect

    const step = MENTOR_STEPS.find(s => s.id === 'identify_herb')!
    let score = step.maxScore

    if (isCorrect) {
      addFeedback('success', '答对了！', '您对这味药材的认识非常准确！')
      completeCurrentStep(score)
    } else {
      score = Math.round(step.maxScore * 0.6)
      addFeedback(
        'error',
        '答错了',
        `正确答案是：${currentHerbQuestion.value.options[currentHerbQuestion.value.correctOptionIndex]}`,
        '请仔细阅读药材说明，了解其性状和功效'
      )
      completeCurrentStep(score)
    }
  }

  function addWeight(weight: Weight): boolean {
    if (currentStep.value?.id !== 'select_weights') {
      addFeedback('warning', '操作时机不对', '当前不是"选择砝码"步骤，请按步骤操作', '点击上方步骤导航或按提示操作')
      return false
    }
    if (placedWeights.value.find(w => w.id === weight.id)) return false
    if (usedWeightIds.value.has(weight.id)) return false

    placedWeights.value.push(weight)
    addReplayFrame(`添加砝码: ${weight.name}`)
    return true
  }

  function removeWeight(weightId: string): boolean {
    if (currentStep.value?.id !== 'select_weights') {
      addFeedback('warning', '操作时机不对', '当前不是"选择砝码"步骤，请按步骤操作')
      return false
    }
    const index = placedWeights.value.findIndex(w => w.id === weightId)
    if (index === -1) return false

    const weight = placedWeights.value[index]
    placedWeights.value.splice(index, 1)
    addReplayFrame(`移除砝码: ${weight.name}`)
    return true
  }

  function confirmWeightSelection(): void {
    if (!currentHerb.value || !currentHerbQuestion.value) return

    const step = MENTOR_STEPS.find(s => s.id === 'select_weights')!
    const correctCombination = currentHerbQuestion.value.correctWeightCombination
    const targetWeight = currentHerb.value.targetWeight

    const correctIds = correctCombination.map(w => w.id).sort().join(',')
    const currentIds = placedWeights.value.map(w => w.id).sort().join(',')
    const currentTotal = leftWeight.value

    let score = step.maxScore
    let matchedPerfect = correctIds === currentIds

    if (currentTotal === targetWeight) {
      if (matchedPerfect) {
        score = step.maxScore
        addFeedback('success', '砝码组合完美', '您选择了最优砝码组合，准确高效！')
      } else {
        score = Math.round(step.maxScore * 0.9)
        addFeedback('warning', '重量达标，组合可优化', '总重量正确，但可以尝试使用更少或更大的砝码来提高效率')
      }
    } else if (Math.abs(currentTotal - targetWeight) <= currentHerb.value.allowedError * 2) {
      score = Math.round(step.maxScore * 0.7)
      addFeedback('warning', '接近目标', '总重量接近目标，微调一下就更好了', '建议增加或减少一些小砝码')
    } else {
      score = Math.max(0, Math.round(step.maxScore * (1 - Math.abs(currentTotal - targetWeight) / targetWeight)))
      if (currentTotal < targetWeight) {
        addFeedback('error', '砝码不足', `当前砝码总重${currentTotal}钱，少于目标${targetWeight}钱`, '请添加更多砝码')
      } else {
        addFeedback('error', '砝码过多', `当前砝码总重${currentTotal}钱，多于目标${targetWeight}钱`, '请移除部分砝码')
      }
    }

    completeCurrentStep(score)
  }

  function setHerbCount(count: number): boolean {
    if (currentStep.value?.id !== 'adjust_herb_count') {
      addFeedback('warning', '操作时机不对', '当前不是"调整药量"步骤，请按步骤操作')
      return false
    }
    if (count < 0) return false
    if (count === currentHerbCount.value) return false

    const oldCount = currentHerbCount.value
    currentHerbCount.value = count
    addReplayFrame(`调整药量: ${oldCount} → ${count}`)
    return true
  }

  function confirmHerbCountAdjustment(): void {
    if (!currentHerb.value) return

    const step = MENTOR_STEPS.find(s => s.id === 'adjust_herb_count')!
    const error = currentError.value
    const absError = Math.abs(error)
    const allowedError = currentHerb.value.allowedError
    const targetWeight = currentHerb.value.targetWeight

    let score = step.maxScore

    if (absError <= allowedError * 0.1) {
      score = step.maxScore
      addFeedback('success', '剂量精准', '误差极小，堪比老药工的手艺！')
    } else if (absError <= allowedError * 0.5) {
      score = Math.round(step.maxScore * 0.9)
      addFeedback('success', '药量合适', '剂量控制得很好，误差在极小范围内')
    } else if (absError <= allowedError) {
      score = Math.round(step.maxScore * 0.75)
      addFeedback('warning', '接近平衡', '已经接近平衡，再微调一下就更好了')
    } else {
      const errorRatio = absError / targetWeight
      score = Math.max(0, Math.round(step.maxScore * (1 - errorRatio * 2)))
      if (error > 0) {
        addFeedback('error', '药量不足', '砝码比药材重，需要增加药材数量', '继续点击+号增加药材')
      } else {
        addFeedback('error', '药量过多', '药材比砝码重，需要减少药材数量', '点击-号减少一些药材')
      }
    }

    completeCurrentStep(score)
  }

  function judgeBalance(judgment: 'over' | 'under' | 'balanced'): void {
    if (balanceJudgmentCorrect.value !== null) return

    balanceJudgmentSelected.value = judgment
    let actual: 'over' | 'under' | 'balanced'
    const allowedError = currentHerb.value?.allowedError || 0.2

    if (currentError.value > allowedError) {
      actual = 'under'
    } else if (currentError.value < -allowedError) {
      actual = 'over'
    } else {
      actual = 'balanced'
    }

    const isCorrect = judgment === actual
    balanceJudgmentCorrect.value = isCorrect

    const step = MENTOR_STEPS.find(s => s.id === 'judge_balance')!
    let score = step.maxScore

    if (isCorrect) {
      addFeedback('success', '判断正确', `您的判断很准确！当前天平状态是${actual === 'balanced' ? '平衡' : actual === 'over' ? '药材偏重' : '砝码偏重'}`)
    } else {
      score = Math.round(step.maxScore * 0.5)
      addFeedback(
        'error',
        '判断有误',
        `正确状态是${actual === 'balanced' ? '平衡' : actual === 'over' ? '药材偏重（右低）' : '砝码偏重（左低）'}，当前误差${currentError.value > 0 ? '+' : ''}${currentError.value.toFixed(2)}钱`,
        '左低右高说明砝码重，左高右低说明药材重'
      )
    }

    completeCurrentStep(score)
  }

  function confirmSubmitResult(): void {
    if (!currentHerb.value || !currentPrescription.value) return

    const step = MENTOR_STEPS.find(s => s.id === 'submit_result')!
    const error = currentError.value
    const absError = Math.abs(error)
    const allowedError = currentHerb.value.allowedError

    if (absError > allowedError) {
      addFeedback(
        'error',
        '无法提交',
        `当前误差${error > 0 ? '+' : ''}${error.toFixed(2)}钱，超出允许范围±${allowedError}钱`,
        '请返回调整砝码或药量，使误差在允许范围内'
      )
      goToStep(2)
      return
    }

    const herbResult: MentorHerbResult = {
      herbId: currentHerb.value.id,
      herbName: currentHerb.value.herbName,
      targetWeight: currentHerb.value.targetWeight,
      finalWeight: rightWeight.value,
      finalError: error,
      allowedError: allowedError,
      placedWeights: [...placedWeights.value],
      herbCount: currentHerbCount.value,
      score: Object.values(currentHerbStepResults.value).reduce((sum, r) => sum + r.score, 0),
      isPerfect: absError <= allowedError * 0.1 && errorCount.value === 0,
      stepResults: JSON.parse(JSON.stringify(currentHerbStepResults.value))
    }

    herbResults.value.push(herbResult)

    placedWeights.value.forEach(w => usedWeightIds.value.add(w.id))

    addFeedback('success', '药材完成', `${currentHerb.value.herbName}称量完成，综合得分${herbResult.score}分！`)
    addReplayFrame(`完成药材: ${currentHerb.value.herbName}`)

    completeCurrentStep(step.maxScore)

    const nextIndex = currentPrescription.value.herbs.findIndex((_, idx) => !herbResults.value.find(h => h.herbId === currentPrescription.value!.herbs[idx].id))

    if (nextIndex !== -1) {
      currentHerbIndex.value = nextIndex
      setTimeout(() => {
        initializeHerbState()
        addFeedback('info', '下一味药材', `现在开始称量：${currentPrescription.value!.herbs[nextIndex].herbName}`)
      }, 1500)
    } else {
      completeSession()
    }
  }

  function completeSession(): void {
    if (!currentPrescription.value) return
    if (isCompleted.value) return

    stopSessionTimer()
    stopSpeaking()
    isCompleted.value = true
    sessionEndTime.value = Date.now()

    const totalTime = sessionEndTime.value - sessionStartTime.value
    const totalScore = sessionTotalScore.value
    const maxScore = sessionMaxScore.value
    const scorePercentage = Math.round((totalScore / maxScore) * 100)

    const config = MENTOR_DIFFICULTY_CONFIG[currentDifficulty.value]
    const baseXP = Math.round((totalScore / maxScore) * 300)
    const xpEarned = Math.round(baseXP * config.xpMultiplier)

    const skillsImproved = computeSkillsImproved()
    const summary = generateSessionSummary()

    const result: MentorSessionResult = {
      id: 'session_' + Date.now(),
      prescriptionId: currentPrescription.value.id,
      prescriptionName: currentPrescription.value.name,
      difficulty: currentDifficulty.value,
      startTime: sessionStartTime.value,
      endTime: sessionEndTime.value,
      totalTime,
      totalScore,
      maxScore,
      scorePercentage,
      herbResults: [...herbResults.value],
      stepResults: JSON.parse(JSON.stringify(stepResults.value)),
      allFeedbacks: [...sessionFeedbacks.value],
      skippedCount: skippedCount.value,
      errorCount: errorCount.value,
      xpEarned,
      skillsImproved,
      replayData: [...replayData.value],
      summary
    }

    lastSessionResult.value = result
    sessionResults.value.push(result)
    saveSessionResults()

    updateApprenticeProfile(result)
    saveProfile()

    addFeedback('info', '教学完成', `本次学习获得${xpEarned}经验值，综合得分率${scorePercentage}%！`)
  }

  function computeSkillsImproved(): string[] {
    const improved: string[] = []

    if (herbIdentifyAnswerCorrect.value) improved.push('herb_identification')
    if (currentStep) {
      const herbResult = herbResults.value[herbResults.value.length - 1]
      if (herbResult) {
        const weightStepScore = herbResult.stepResults['select_weights']?.score || 0
        const weightStepMax = herbResult.stepResults['select_weights']?.maxScore || 1
        if (weightStepScore / weightStepMax >= 0.8) improved.push('weight_selection')

        const adjustStepScore = herbResult.stepResults['adjust_herb_count']?.score || 0
        const adjustStepMax = herbResult.stepResults['adjust_herb_count']?.maxScore || 1
        if (adjustStepScore / adjustStepMax >= 0.8) improved.push('dosage_precision')

        const balanceStepScore = herbResult.stepResults['judge_balance']?.score || 0
        const balanceStepMax = herbResult.stepResults['judge_balance']?.maxScore || 1
        if (balanceStepScore / balanceStepMax >= 0.8) improved.push('balance_judgment')

        if (herbResult.isPerfect) improved.push('dosage_precision')
      }
    }

    return [...new Set(improved)]
  }

  function generateSessionSummary(): MentorSessionSummary {
    const highlights: string[] = []
    const weakPoints: string[] = []
    const suggestions: string[] = []
    const nextGoals: string[] = []

    const scorePct = sessionMaxScore.value > 0 ? (sessionTotalScore.value / sessionMaxScore.value) * 100 : 0

    if (herbResults.value.some(h => h.isPerfect)) {
      const perfectHerbs = herbResults.value.filter(h => h.isPerfect)
      highlights.push(`${perfectHerbs.map(h => h.herbName).join('、')}称量精准，堪称完美！`)
    }

    if (skippedCount.value === 0) {
      highlights.push('全程无跳步，学习态度非常扎实！')
    }

    if (sessionTotalScore.value >= sessionMaxScore.value * 0.8) {
      highlights.push('综合得分率超过80%，表现优秀！')
    }

    if (skippedCount.value > 0) {
      weakPoints.push(`本次跳过了${skippedCount.value}个步骤，建议下次按顺序练习`)
    }

    if (errorCount.value > 3) {
      weakPoints.push(`操作中出现${errorCount.value}次错误，需要加强基础训练`)
    }

    const herbWithLowestScore = herbResults.value.reduce((min, h) => h.score < min.score ? h : min, herbResults.value[0])
    if (herbWithLowestScore && herbWithLowestScore.score < 350) {
      weakPoints.push(`${herbWithLowestScore.herbName}得分较低，建议重点复习`)
    }

    if (scorePct < 60) {
      suggestions.push('建议先完成入门难度的基础练习，巩固称量流程')
    } else if (scorePct < 80) {
      suggestions.push('可以尝试减少操作错误，追求更精确的剂量控制')
    } else {
      suggestions.push('基础已经很扎实，可以尝试更高难度的挑战')
    }

    const currentLevel = apprenticeProfile.value.level
    const nextLevelTitles = APPRENTICE_TITLES.filter(t => t.level > currentLevel)
    if (nextLevelTitles.length > 0) {
      nextGoals.push(`达到${nextLevelTitles[0].level}级，解锁称号"${nextLevelTitles[0].title}"`)
    }

    const unlockedDiffs = apprenticeProfile.value.unlockedDifficulties
    if (!unlockedDiffs.includes('intermediate')) {
      nextGoals.push('升到5级解锁"药剂学徒"难度')
    } else if (!unlockedDiffs.includes('advanced')) {
      nextGoals.push('升到15级解锁"坐堂郎中"难度')
    }

    let overallComment = ''
    if (scorePct >= 90) overallComment = '技艺精湛，假以时日必成大器！'
    else if (scorePct >= 80) overallComment = '勤学苦练，进步显著！'
    else if (scorePct >= 60) overallComment = '已入门径，继续努力！'
    else overallComment = '路漫漫其修远兮，吾将上下而求索。'

    let difficultyRecommendation: MentorDifficulty = currentDifficulty.value
    if (scorePct >= 90 && currentDifficulty.value === 'beginner' && apprenticeProfile.value.level >= 5) {
      difficultyRecommendation = 'intermediate'
    } else if (scorePct >= 90 && currentDifficulty.value === 'intermediate' && apprenticeProfile.value.level >= 15) {
      difficultyRecommendation = 'advanced'
    } else if (scorePct >= 90 && currentDifficulty.value === 'advanced' && apprenticeProfile.value.level >= 30) {
      difficultyRecommendation = 'expert'
    }

    return {
      highlights,
      weakPoints,
      suggestions,
      nextGoals,
      difficultyRecommendation,
      overallComment
    }
  }

  function updateApprenticeProfile(result: MentorSessionResult): void {
    const profile = apprenticeProfile.value

    profile.totalXP += result.xpEarned
    profile.completedSessions += 1
    profile.totalScore += result.totalScore
    profile.totalTimeSpent += result.totalTime

    const newLevel = Math.floor(profile.totalXP / XP_PER_LEVEL)
    if (newLevel > profile.level) {
      profile.level = newLevel
    }

    for (const t of APPRENTICE_TITLES) {
      if (profile.level >= t.level) {
        profile.title = t.title
      }
    }

    if (result.scorePercentage >= 100) {
      profile.perfectSessions += 1
    }

    if (!profile.unlockedPrescriptions.includes(result.prescriptionId)) {
      profile.unlockedPrescriptions.push(result.prescriptionId)
    }

    for (const diff of (['beginner', 'intermediate', 'advanced', 'expert'] as MentorDifficulty[])) {
      const unlockLevel = MENTOR_DIFFICULTY_CONFIG[diff].unlockLevel
      if (profile.level >= unlockLevel && !profile.unlockedDifficulties.includes(diff)) {
        profile.unlockedDifficulties.push(diff)
      }
    }

    result.skillsImproved.forEach(skillId => {
      const skill = profile.skills.find(s => s.id === skillId)
      if (skill && skill.level < skill.maxLevel) {
        skill.xp += Math.round(result.xpEarned / result.skillsImproved.length)
        while (skill.xp >= skill.nextLevelXP && skill.level < skill.maxLevel) {
          skill.xp -= skill.nextLevelXP
          skill.level += 1
          skill.nextLevelXP = Math.round(skill.nextLevelXP * 1.5)
        }
      }
    })

    const nonKnowledgeSkills = ['herb_identification', 'weight_selection', 'balance_judgment', 'dosage_precision', 'speed_efficiency']
    nonKnowledgeSkills.forEach(id => {
      const skill = profile.skills.find(s => s.id === id)
      if (skill && skill.level < skill.maxLevel && !result.skillsImproved.includes(id)) {
        skill.xp += Math.round(result.xpEarned * 0.1)
        while (skill.xp >= skill.nextLevelXP && skill.level < skill.maxLevel) {
          skill.xp -= skill.nextLevelXP
          skill.level += 1
          skill.nextLevelXP = Math.round(skill.nextLevelXP * 1.5)
        }
      }
    })

    const knowledgeSkill = profile.skills.find(s => s.id === 'knowledge_mastery')
    if (knowledgeSkill && knowledgeSkill.level < knowledgeSkill.maxLevel) {
      knowledgeSkill.xp += Math.round(result.xpEarned * 0.3)
      while (knowledgeSkill.xp >= knowledgeSkill.nextLevelXP && knowledgeSkill.level < knowledgeSkill.maxLevel) {
        knowledgeSkill.xp -= knowledgeSkill.nextLevelXP
        knowledgeSkill.level += 1
        knowledgeSkill.nextLevelXP = Math.round(knowledgeSkill.nextLevelXP * 1.5)
      }
    }

    updateAchievements(result)
    profile.lastActiveAt = Date.now()
  }

  function updateAchievements(result: MentorSessionResult): void {
    const achievements = apprenticeProfile.value.achievements

    const updateProgress = (id: string, add: number = 1, maxOnce: boolean = false) => {
      const a = achievements.find(x => x.id === id)
      if (!a || a.unlocked) return
      if (maxOnce) {
        a.progress = Math.max(a.progress || 0, add)
      } else {
        a.progress = Math.min((a.maxProgress || 1), (a.progress || 0) + add)
      }
      if ((a.progress || 0) >= (a.maxProgress || 1)) {
        a.unlocked = true
        a.unlockedAt = Date.now()
      }
    }

    updateProgress('first_prescription', 1, true)

    if (result.herbResults.some(h => h.isPerfect)) {
      updateProgress('perfect_herb', 1, true)
      updateProgress('five_perfect', result.herbResults.filter(h => h.isPerfect).length)
    }

    if (result.skippedCount === 0) {
      updateProgress('no_skip', 1, true)
    }

    updateProgress('ten_sessions', 1)

    if (result.totalTime < (sessionEndTime.value - sessionStartTime.value) / 2) {
      updateProgress('speed_demon', 1, true)
    }

    const unlockedCount = apprenticeProfile.value.unlockedPrescriptions.length
    if (unlockedCount >= 1) updateProgress('all_prescriptions', unlockedCount, true)

    if (apprenticeProfile.value.unlockedDifficulties.includes('intermediate')) {
      updateProgress('unlock_intermediate', 1, true)
    }
    if (apprenticeProfile.value.unlockedDifficulties.includes('advanced')) {
      updateProgress('unlock_advanced', 1, true)
    }
    if (apprenticeProfile.value.unlockedDifficulties.includes('expert')) {
      updateProgress('unlock_expert', 1, true)
    }
  }

  function isWeightUsed(weightId: string): boolean {
    return usedWeightIds.value.has(weightId)
  }

  function isWeightPlaced(weightId: string): boolean {
    return placedWeights.value.some(w => w.id === weightId)
  }

  function getAvailableWeights(): Weight[] {
    return WEIGHTS.filter(w => !isWeightPlaced(w.id) && !isWeightUsed(w.id))
  }

  function resetAll(): void {
    stopSessionTimer()
    stopSpeaking()
    isStarted.value = false
    isCompleted.value = false
    isPaused.value = false
    currentStepIndex.value = 0
    placedWeights.value = []
    currentHerbCount.value = 0
    usedWeightIds.value = new Set()
    stepResults.value = createEmptyStepResults()
    currentHerbStepResults.value = createEmptyStepResults()
    sessionFeedbacks.value = []
    currentFeedbacks.value = []
    herbResults.value = []
    lastSessionResult.value = null
    replayData.value = []
    herbIdentifyAnswerSelected.value = null
    herbIdentifyAnswerCorrect.value = null
    balanceJudgmentSelected.value = ''
    balanceJudgmentCorrect.value = null
  }

  function init(): void {
    sessionResults.value = loadSessionResults()
  }

  function clearSessionHistory(): void {
    sessionResults.value = []
    try {
      localStorage.removeItem('scaleTrainer_mentorSessionResults')
    } catch (e) {
      console.error('Failed to clear session history:', e)
    }
  }

  const sessionHistory = computed(() => sessionResults.value)

  return {
    isStarted,
    isCompleted,
    isPaused,
    currentPrescriptionIndex,
    currentHerbIndex,
    currentStepIndex,
    currentDifficulty,
    sessionTimeRemaining,
    placedWeights,
    currentHerbCount,
    usedWeightIds,
    stepResults,
    currentHerbStepResults,
    sessionFeedbacks,
    currentFeedbacks,
    herbResults,
    sessionResults,
    lastSessionResult,
    herbIdentifyAnswerSelected,
    herbIdentifyAnswerCorrect,
    balanceJudgmentSelected,
    balanceJudgmentCorrect,
    replayData,
    apprenticeProfile,
    showGuide,
    sessionHistory,

    prescriptions,
    currentPrescription,
    currentHerb,
    currentStep,
    currentHerbQuestion,
    leftWeight,
    rightWeight,
    currentError,
    isCurrentBalanced,
    currentErrorPercentage,
    completedHerbs,
    totalHerbs,
    sessionTotalScore,
    sessionMaxScore,
    currentStepScore,
    skippedCount,
    errorCount,
    apprenticeLevelProgress,

    setDifficulty,
    selectPrescription,
    startSession,
    togglePause,
    pauseSession,
    resumeSession,
    goToStep,
    goToNextStep,
    skipCurrentStep,
    confirmPrescriptionSelection,
    answerHerbIdentify,
    addWeight,
    removeWeight,
    confirmWeightSelection,
    setHerbCount,
    confirmHerbCountAdjustment,
    judgeBalance,
    confirmSubmitResult,
    completeSession,
    isWeightUsed,
    isWeightPlaced,
    getAvailableWeights,
    resetAll,
    init,
    saveProfile,
    clearSessionHistory
  }
})
