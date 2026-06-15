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
  Weight,
  Prescription
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
import { useWeighing, useStepFlow, useTimer, usePersistence } from '@/composables'

let feedbackCounter = 0

export const useMentorStore = defineStore('mentor', () => {
  const isStarted = ref(false)
  const isCompleted = ref(false)
  const isPaused = ref(false)

  const currentPrescriptionIndex = ref(0)
  const currentDifficulty = ref<MentorDifficulty>('beginner')

  const sessionStartTime = ref(0)
  const sessionEndTime = ref(0)

  const sessionFeedbacks = ref<MentorFeedback[]>([])
  const currentFeedbacks = ref<MentorFeedback[]>([])

  const herbResults = ref<MentorHerbResult[]>([])
  const lastSessionResult = ref<MentorSessionResult | null>(null)

  const herbIdentifyAnswerSelected = ref<number | null>(null)
  const herbIdentifyAnswerCorrect = ref<boolean | null>(null)
  const balanceJudgmentSelected = ref<'' | 'over' | 'under' | 'balanced'>('')
  const balanceJudgmentCorrect = ref<boolean | null>(null)

  const replayData = ref<MentorReplayFrame[]>([])
  const replayStartTimestamp = ref(0)

  const showGuide = ref(true)

  const weighing = useWeighing({
    trackUsedWeights: true,
    allWeights: WEIGHTS
  })

  const stepFlow = useStepFlow<MentorStepType>({
    steps: MENTOR_STEPS,
    autoAdvance: false
  })

  const sessionTimer = useTimer({
    mode: 'countdown',
    onTimeUp: () => {
      completeSession()
    }
  })

  const sessionResultsPersistence = usePersistence<MentorSessionResult[]>({
    storageKey: 'scaleTrainer_mentorSessionResults',
    defaultValue: []
  })

  const profilePersistence = usePersistence<ApprenticeProfile>({
    storageKey: 'scaleTrainer_apprenticeProfile',
    defaultValue: createDefaultProfile()
  })

  const apprenticeProfile = computed(() => profilePersistence.data.value)
  const sessionResults = computed(() => sessionResultsPersistence.data.value)

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

  function saveProfile(): void {
    profilePersistence.save()
  }

  function saveSessionResults(): void {
    sessionResultsPersistence.save()
  }

  function loadSessionResults(): MentorSessionResult[] {
    return sessionResultsPersistence.load()
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
    if (stepFlow.currentStepIndex.value >= 0) {
      const herbIndex = Math.floor(herbResults.value.length)
      if (herbIndex < currentPrescription.value.herbs.length) {
        return currentPrescription.value.herbs[herbIndex]
      }
    }
    return null
  })

  const currentStep = computed(() => stepFlow.currentStep.value)
  const currentHerbQuestion = computed(() => {
    if (!currentHerb.value) return null
    const questions = MENTOR_HERB_QUESTIONS[currentHerb.value.id]
    return questions ? questions[0] : null
  })

  const leftWeight = computed(() => weighing.leftWeight.value)
  const rightWeight = computed(() => weighing.rightWeight.value)
  const currentError = computed(() => weighing.error.value)
  const isCurrentBalanced = computed(() => weighing.isBalanced.value)
  const currentErrorPercentage = computed(() => weighing.errorPercentage.value)

  const completedHerbs = computed(() => herbResults.value.length)
  const totalHerbs = computed(() => currentPrescription.value?.herbs.length || 0)

  const sessionTotalScore = computed(() => {
    return Object.values(stepFlow.stepResults.value).reduce((sum, r) => sum + r.score, 0)
  })

  const sessionMaxScore = computed(() => {
    const perHerb = MENTOR_STEPS.reduce((sum, s) => sum + s.maxScore, 0)
    return perHerb * (totalHerbs.value || 1)
  })

  const currentStepScore = computed(() => {
    if (!currentStep.value) return 0
    return stepFlow.stepResults.value[currentStep.value.id]?.score || 0
  })

  const skippedCount = computed(() => {
    let count = 0
    Object.values(stepFlow.stepResults.value).forEach(r => { if (r.skipped) count++ })
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
      stepFlow.addFeedback(currentStep.value.id, feedback)
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
      placedWeights: [...weighing.placedWeights.value],
      herbCount: weighing.herbCount.value,
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
    weighing.resetWeighing(false)
    stepFlow.resetSteps()
    currentFeedbacks.value = []
    herbIdentifyAnswerSelected.value = null
    herbIdentifyAnswerCorrect.value = null
    balanceJudgmentSelected.value = ''
    balanceJudgmentCorrect.value = null
    stepFlow.startCurrentStep()

    if (currentHerb.value) {
      weighing.setCurrentHerb(currentHerb.value)
    }

    speakStepInstruction(currentStep.value?.title || '', currentStep.value?.instruction || '')
    addReplayFrame(`开始步骤: ${currentStep.value?.title}`)
  }

  function startSession(): void {
    stopSpeaking()
    herbResults.value = []
    sessionFeedbacks.value = []
    replayData.value = []
    replayStartTimestamp.value = Date.now()
    weighing.usedWeightIds.value = new Set()

    isStarted.value = true
    isCompleted.value = false
    isPaused.value = false

    sessionStartTime.value = Date.now()
    sessionTimer.setTime(getPrescriptionTimeLimit())
    sessionTimer.start()

    initializeHerbState()

    addFeedback('info', '开始学习', `今天学习《${currentPrescription.value?.name}》，共${totalHerbs.value}味药材，祝您好运！`, '按步骤完成每味药材的称量操作')
    addReplayFrame(`开始教学: ${currentPrescription.value?.name}`)
  }

  function togglePause(): void {
    if (!isStarted.value || isCompleted.value) return
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      stopSpeaking()
      sessionTimer.pause()
      addFeedback('info', '已暂停', '学习已暂停，休息一下吧', '点击继续按钮可恢复学习')
    } else {
      sessionTimer.resume()
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

  function skipCurrentStep(): void {
    if (!currentStep.value) return
    if (!currentStep.value.allowedSkip) {
      addFeedback('error', '无法跳过', `此步骤为必做项，不能跳过`)
      return
    }
    const penalty = currentStep.value.skipPenalty
    stepFlow.skipStep()
    if (stepFlow.currentStepResult.value) {
      stepFlow.currentStepResult.value.score = -penalty
    }
  }

  function confirmPrescriptionSelection(): void {
    stepFlow.completeStep(50)
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
      stepFlow.completeStep(score)
    } else {
      score = Math.round(step.maxScore * 0.6)
      addFeedback(
        'error',
        '答错了',
        `正确答案是：${currentHerbQuestion.value.options[currentHerbQuestion.value.correctOptionIndex]}`,
        '请仔细阅读药材说明，了解其性状和功效'
      )
      stepFlow.completeStep(score)
    }
  }

  function addWeight(weight: Weight): boolean {
    if (currentStep.value?.id !== 'select_weights') {
      addFeedback('warning', '操作时机不对', '当前不是"选择砝码"步骤，请按步骤操作', '点击上方步骤导航或按提示操作')
      return false
    }
    if (!weighing.addWeight(weight)) return false

    addReplayFrame(`添加砝码: ${weight.name}`)
    return true
  }

  function removeWeight(weightId: string): boolean {
    if (currentStep.value?.id !== 'select_weights') {
      addFeedback('warning', '操作时机不对', '当前不是"选择砝码"步骤，请按步骤操作')
      return false
    }
    const weight = weighing.placedWeights.value.find(w => w.id === weightId)
    if (!weight) return false

    if (!weighing.removeWeight(weightId)) return false

    addReplayFrame(`移除砝码: ${weight.name}`)
    return true
  }

  function confirmWeightSelection(): void {
    if (!currentHerb.value || !currentHerbQuestion.value) return

    const step = MENTOR_STEPS.find(s => s.id === 'select_weights')!
    const correctCombination = currentHerbQuestion.value.correctWeightCombination
    const targetWeight = currentHerb.value.targetWeight

    const correctIds = correctCombination.map(w => w.id).sort().join(',')
    const currentIds = weighing.placedWeights.value.map(w => w.id).sort().join(',')
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

    stepFlow.completeStep(score)
  }

  function setHerbCount(count: number): boolean {
    if (currentStep.value?.id !== 'adjust_herb_count') {
      addFeedback('warning', '操作时机不对', '当前不是"调整药量"步骤，请按步骤操作')
      return false
    }
    if (!weighing.setHerbCount(count)) return false

    addReplayFrame(`调整药量: ${weighing.herbCount.value} → ${count}`)
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

    stepFlow.completeStep(score)
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

    stepFlow.completeStep(score)
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
      stepFlow.goToStepById('select_weights')
      return
    }

    const herbResult: MentorHerbResult = {
      herbId: currentHerb.value.id,
      herbName: currentHerb.value.herbName,
      targetWeight: currentHerb.value.targetWeight,
      finalWeight: rightWeight.value,
      finalError: error,
      allowedError: allowedError,
      placedWeights: [...weighing.placedWeights.value],
      herbCount: weighing.herbCount.value,
      score: Object.values(stepFlow.stepResults.value).reduce((sum, r) => sum + r.score, 0),
      isPerfect: absError <= allowedError * 0.1 && errorCount.value === 0,
      stepResults: JSON.parse(JSON.stringify(stepFlow.stepResults.value))
    }

    herbResults.value.push(herbResult)

    weighing.markWeightsUsed(weighing.placedWeights.value)

    addFeedback('success', '药材完成', `${currentHerb.value.herbName}称量完成，综合得分${herbResult.score}分！`)
    addReplayFrame(`完成药材: ${currentHerb.value.herbName}`)

    stepFlow.completeStep(step.maxScore)

    const nextIndex = currentPrescription.value.herbs.findIndex((_, idx) => 
      !herbResults.value.find(h => h.herbId === currentPrescription.value!.herbs[idx].id)
    )

    if (nextIndex !== -1) {
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

    sessionTimer.stop()
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
      stepResults: JSON.parse(JSON.stringify(stepFlow.stepResults.value)),
      allFeedbacks: [...sessionFeedbacks.value],
      skippedCount: skippedCount.value,
      errorCount: errorCount.value,
      xpEarned,
      skillsImproved,
      replayData: [...replayData.value],
      summary
    }

    lastSessionResult.value = result
    sessionResultsPersistence.data.value.push(result)
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
    const profile = profilePersistence.data.value

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
    const achievements = profilePersistence.data.value.achievements

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

    const unlockedCount = profilePersistence.data.value.unlockedPrescriptions.length
    if (unlockedCount >= 1) updateProgress('all_prescriptions', unlockedCount, true)

    if (profilePersistence.data.value.unlockedDifficulties.includes('intermediate')) {
      updateProgress('unlock_intermediate', 1, true)
    }
    if (profilePersistence.data.value.unlockedDifficulties.includes('advanced')) {
      updateProgress('unlock_advanced', 1, true)
    }
    if (profilePersistence.data.value.unlockedDifficulties.includes('expert')) {
      updateProgress('unlock_expert', 1, true)
    }
  }

  function isWeightUsed(weightId: string): boolean {
    return weighing.isWeightUsed(weightId)
  }

  function isWeightPlaced(weightId: string): boolean {
    return weighing.isWeightPlaced(weightId)
  }

  function getAvailableWeights(): Weight[] {
    return weighing.availableWeights.value
  }

  function resetAll(): void {
    sessionTimer.stop()
    stopSpeaking()
    isStarted.value = false
    isCompleted.value = false
    isPaused.value = false
    weighing.resetAll()
    stepFlow.resetSteps()
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
    profilePersistence.load()
    sessionResultsPersistence.load()
    
    if (!profilePersistence.data.value.skills || profilePersistence.data.value.skills.length === 0) {
      profilePersistence.data.value.skills = JSON.parse(JSON.stringify(INITIAL_SKILLS))
    }
    if (!profilePersistence.data.value.achievements || profilePersistence.data.value.achievements.length === 0) {
      profilePersistence.data.value.achievements = JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS))
    }
  }

  function clearSessionHistory(): void {
    sessionResultsPersistence.clear()
  }

  const sessionHistory = computed(() => sessionResults.value)

  return {
    isStarted,
    isCompleted,
    isPaused,
    currentPrescriptionIndex,
    currentHerbIndex: ref(0),
    currentStepIndex: stepFlow.currentStepIndex,
    currentDifficulty,
    sessionTimeRemaining: sessionTimer.timeRemaining,
    placedWeights: weighing.placedWeights,
    currentHerbCount: weighing.herbCount,
    usedWeightIds: weighing.usedWeightIds,
    stepResults: stepFlow.stepResults,
    currentHerbStepResults: stepFlow.stepResults,
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
    currentStep: stepFlow.currentStep,
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
    goToStep: stepFlow.goToStep,
    goToNextStep: stepFlow.goToNextStep,
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
