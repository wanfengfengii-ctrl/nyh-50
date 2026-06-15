import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ClinicOrder,
  ClinicPhase,
  ClinicSessionResult,
  ClinicPriorityJudgment,
  ClinicPrescriptionSelection,
  ClinicHerbResult,
  ClinicCaseReview,
  ClinicHistoryRecord,
  ClinicRating,
  UrgencyLevel,
  Weight,
  Prescription,
  PrescriptionHerb
} from '@/types'
import {
  PRESCRIPTIONS,
  WEIGHTS,
  SYMPTOMS,
  PATIENT_FIRST_NAMES,
  PATIENT_LAST_NAMES,
  DISEASE_TEMPLATES,
  URGENCY_CONFIG,
  CLINIC_RATING_CONFIG,
  CLINIC_SCORE_WEIGHTS,
  XP_PER_LEVEL
} from '@/constants'
import { useMentorStore } from './mentor'

let historyCounter = 0

export const useClinicStore = defineStore('clinic', () => {
  const isStarted = ref(false)
  const isCompleted = ref(false)
  const currentPhase = ref<ClinicPhase>('select_order')
  const pendingOrders = ref<ClinicOrder[]>([])
  const currentOrder = ref<ClinicOrder | null>(null)
  const currentPrescription = ref<Prescription | null>(null)
  const currentHerbIndex = ref(0)

  const timeRemaining = ref(0)
  const phaseStartTime = ref(0)
  const sessionStartTime = ref(0)
  const sessionEndTime = ref(0)
  let timerInterval: number | null = null

  const placedWeights = ref<Weight[]>([])
  const currentHerbCount = ref(0)
  const usedWeightIds = ref<Set<string>>(new Set())
  const history = ref<ClinicHistoryRecord[]>([])

  const priorityJudgment = ref<ClinicPriorityJudgment>({
    selectedPriority: null,
    isCorrect: null,
    timeSpent: 0
  })

  const prescriptionSelection = ref<ClinicPrescriptionSelection>({
    selectedPrescriptionId: null,
    isCorrect: null,
    timeSpent: 0
  })

  const herbResults = ref<ClinicHerbResult[]>([])
  const lastResult = ref<ClinicSessionResult | null>(null)
  const sessionResults = ref<ClinicSessionResult[]>([])

  const leftWeight = computed(() => {
    return placedWeights.value.reduce((sum, w) => sum + w.weight, 0)
  })

  const placedWeightIds = computed(() => placedWeights.value.map(w => w.id))

  const rightWeight = computed(() => {
    const herb = currentHerb.value
    if (!herb) return 0
    return currentHerbCount.value * herb.unitWeight
  })

  const currentError = computed(() => leftWeight.value - rightWeight.value)

  const currentHerb = computed((): PrescriptionHerb | null => {
    if (!currentPrescription.value) return null
    if (currentHerbIndex.value >= currentPrescription.value.herbs.length) return null
    return currentPrescription.value.herbs[currentHerbIndex.value]
  })

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

  const availablePrescriptions = computed(() => {
    const mentorStore = useMentorStore()
    const unlockedIds = mentorStore.apprenticeProfile.unlockedPrescriptions
    return PRESCRIPTIONS.filter((_, idx) => unlockedIds.includes(idx + 1) || unlockedIds.length === 0)
  })

  function generateRandomOrder(): ClinicOrder {
    const templates = DISEASE_TEMPLATES
    const template = templates[Math.floor(Math.random() * templates.length)]

    const urgencyLevels: UrgencyLevel[] = ['mild', 'moderate', 'severe', 'critical']
    const weights = [0.35, 0.35, 0.2, 0.1]
    let random = Math.random()
    let urgencyLevel: UrgencyLevel = 'mild'
    let cumulative = 0
    for (let i = 0; i < urgencyLevels.length; i++) {
      cumulative += weights[i]
      if (random < cumulative) {
        urgencyLevel = urgencyLevels[i]
        break
      }
    }

    const firstName = PATIENT_FIRST_NAMES[Math.floor(Math.random() * PATIENT_FIRST_NAMES.length)]
    const lastName = PATIENT_LAST_NAMES[Math.floor(Math.random() * PATIENT_LAST_NAMES.length)]
    const gender = Math.random() > 0.5 ? '男' : '女'
    const age = Math.floor(Math.random() * 60) + 18

    const symptomObjs = template.symptomIds
      .map(id => SYMPTOMS.find(s => s.id === id)!)
      .filter(Boolean)

    const caseDesc = template.caseDescriptions[
      Math.floor(Math.random() * template.caseDescriptions.length)
    ]
    const requirement = template.requirements[
      Math.floor(Math.random() * template.requirements.length)
    ]

    const prescription = PRESCRIPTIONS.find(p => p.id === template.prescriptionId)
    const baseTime = prescription?.timeLimit || 300
    const timeLimit = Math.round(baseTime * URGENCY_CONFIG[urgencyLevel].timeMultiplier + 60)

    const correctPriority = URGENCY_CONFIG[urgencyLevel].priorityWeight

    return {
      id: 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      patientName: firstName + lastName,
      patientAge: age,
      patientGender: gender as '男' | '女',
      symptoms: symptomObjs,
      urgencyLevel,
      correctPriority,
      correctPrescriptionId: template.prescriptionId,
      diseaseName: template.name,
      prescriptionRequirement: requirement,
      caseDescription: caseDesc,
      timeLimit,
      createdAt: Date.now()
    }
  }

  function generatePendingOrders(count: number = 3) {
    const orders: ClinicOrder[] = []
    for (let i = 0; i < count; i++) {
      orders.push(generateRandomOrder())
    }
    pendingOrders.value = orders.sort((a, b) => 
      URGENCY_CONFIG[b.urgencyLevel].priorityWeight - URGENCY_CONFIG[a.urgencyLevel].priorityWeight
    )
  }

  function selectOrder(orderId: string) {
    const order = pendingOrders.value.find(o => o.id === orderId)
    if (!order) return

    currentOrder.value = order
    priorityJudgment.value = {
      selectedPriority: null,
      isCorrect: null,
      timeSpent: 0
    }
    prescriptionSelection.value = {
      selectedPrescriptionId: null,
      isCorrect: null,
      timeSpent: 0
    }
    herbResults.value = []
    history.value = []
    usedWeightIds.value = new Set()

    currentPhase.value = 'judge_priority'
    phaseStartTime.value = Date.now()
  }

  function judgePriority(priority: number) {
    if (!currentOrder.value) return

    const isCorrect = priority === currentOrder.value.correctPriority
    const timeSpent = Date.now() - phaseStartTime.value

    priorityJudgment.value = {
      selectedPriority: priority,
      isCorrect,
      timeSpent
    }

    addHistory({
      type: 'priority_judge',
      description: `判断优先级：${priority}级，${isCorrect ? '正确' : '错误'}`,
      details: { priority, correct: currentOrder.value.correctPriority }
    })

    currentPhase.value = 'select_prescription'
    phaseStartTime.value = Date.now()
  }

  function selectPrescription(prescriptionId: number) {
    if (!currentOrder.value) return

    const isCorrect = prescriptionId === currentOrder.value.correctPrescriptionId
    const timeSpent = Date.now() - phaseStartTime.value

    prescriptionSelection.value = {
      selectedPrescriptionId: prescriptionId,
      isCorrect,
      timeSpent
    }

    const prescription = PRESCRIPTIONS.find(p => p.id === prescriptionId)
    if (prescription) {
      currentPrescription.value = JSON.parse(JSON.stringify(prescription))
    }

    addHistory({
      type: 'prescription_select',
      description: `选择处方：${prescription?.name || '未知'}，${isCorrect ? '正确' : '错误'}`,
      details: { prescriptionId, correct: currentOrder.value.correctPrescriptionId }
    })

    currentPhase.value = 'weighing'
    currentHerbIndex.value = 0
    placedWeights.value = []
    currentHerbCount.value = 0
    phaseStartTime.value = Date.now()
    startSessionTimer()
  }

  function startSessionTimer() {
    stopSessionTimer()
    if (!currentOrder.value) return
    timeRemaining.value = currentOrder.value.timeLimit
    sessionStartTime.value = Date.now()

    timerInterval = window.setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value--
      } else {
        completeSession()
      }
    }, 1000)
  }

  function stopSessionTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function addWeight(weight: Weight): boolean {
    if (!currentHerb.value) return false
    if (placedWeights.value.find(w => w.id === weight.id)) return false
    if (usedWeightIds.value.has(weight.id)) return false

    placedWeights.value.push(weight)
    addHistory({
      type: 'add_weight',
      description: `添加 ${weight.name} 到砝码盘`
    })
    return true
  }

  function removeWeight(weightId: string): boolean {
    if (!currentHerb.value) return false
    const index = placedWeights.value.findIndex(w => w.id === weightId)
    if (index === -1) return false

    const weight = placedWeights.value[index]
    placedWeights.value.splice(index, 1)
    addHistory({
      type: 'remove_weight',
      description: `移除 ${weight.name}`
    })
    return true
  }

  function setHerbCount(count: number): boolean {
    if (!currentHerb.value) return false
    if (count < 0) return false
    if (count === currentHerbCount.value) return false

    const oldCount = currentHerbCount.value
    currentHerbCount.value = count
    addHistory({
      type: 'adjust_herb',
      description: `调整药材数量：${oldCount} → ${count}`
    })
    return true
  }

  function completeCurrentHerb(): boolean {
    if (!currentHerb.value || !currentPrescription.value) return false

    const herb = currentHerb.value
    const error = currentError.value
    const absError = Math.abs(error)

    if (absError > herb.allowedError) {
      return false
    }

    const timeSpent = Date.now() - phaseStartTime.value
    const isPerfect = absError <= herb.allowedError * 0.1

    let score = 0
    if (isPerfect) {
      score = 100
    } else if (absError <= herb.allowedError) {
      const errorRatio = absError / herb.allowedError
      score = Math.round(100 - errorRatio * 30)
    }

    const herbResult: ClinicHerbResult = {
      herbId: herb.id,
      herbName: herb.herbName,
      targetWeight: herb.targetWeight,
      finalWeight: rightWeight.value,
      finalError: error,
      allowedError: herb.allowedError,
      score,
      isPerfect,
      skipped: false,
      timeSpent
    }

    herbResults.value.push(herbResult)

    placedWeights.value.forEach(w => {
      usedWeightIds.value.add(w.id)
    })

    addHistory({
      type: 'complete_herb',
      description: `完成 ${herb.herbName} 称量，误差：${error > 0 ? '+' : ''}${error.toFixed(2)}钱，得分：${score}分`
    })

    const nextIndex = currentPrescription.value.herbs.findIndex((_, idx) => 
      !herbResults.value.find(h => h.herbId === currentPrescription.value!.herbs[idx].id)
    )

    if (nextIndex !== -1) {
      currentHerbIndex.value = nextIndex
      placedWeights.value = []
      currentHerbCount.value = 0
      phaseStartTime.value = Date.now()

      addHistory({
        type: 'switch_herb',
        description: `切换到 ${currentPrescription.value.herbs[nextIndex].herbName}`
      })
    } else {
      completeSession()
    }

    return true
  }

  function skipCurrentHerb() {
    if (!currentHerb.value || !currentPrescription.value) return

    const herb = currentHerb.value
    const timeSpent = Date.now() - phaseStartTime.value

    const herbResult: ClinicHerbResult = {
      herbId: herb.id,
      herbName: herb.herbName,
      targetWeight: herb.targetWeight,
      finalWeight: 0,
      finalError: herb.targetWeight,
      allowedError: herb.allowedError,
      score: 0,
      isPerfect: false,
      skipped: true,
      timeSpent
    }

    herbResults.value.push(herbResult)

    addHistory({
      type: 'complete_herb',
      description: `跳过 ${herb.herbName} 称量，得0分`
    })

    const nextIndex = currentPrescription.value.herbs.findIndex((_, idx) => 
      !herbResults.value.find(h => h.herbId === currentPrescription.value!.herbs[idx].id)
    )

    if (nextIndex !== -1) {
      currentHerbIndex.value = nextIndex
      placedWeights.value = []
      currentHerbCount.value = 0
      phaseStartTime.value = Date.now()
    } else {
      completeSession()
    }
  }

  function completeSession() {
    if (!currentOrder.value) return
    if (isCompleted.value) return

    stopSessionTimer()
    isCompleted.value = true
    sessionEndTime.value = Date.now()

    const totalTime = sessionEndTime.value - sessionStartTime.value
    const result = calculateResult()
    lastResult.value = result
    sessionResults.value.push(result)

    addHistory({
      type: 'submit',
      description: `接诊完成，评级：${result.rating}，得分：${result.totalScore}分`
    })

    updateApprenticeProfile(result)
    persistResults()

    currentPhase.value = 'result'
  }

  function calculateResult(): ClinicSessionResult {
    if (!currentOrder.value) {
      throw new Error('No current order')
    }

    const order = currentOrder.value
    const config = URGENCY_CONFIG[order.urgencyLevel]

    const priorityScore = priorityJudgment.value.isCorrect ? 100 : 0
    const prescriptionScore = prescriptionSelection.value.isCorrect ? 100 : 0

    const totalHerbScore = herbResults.value.reduce((sum, h) => sum + h.score, 0)
    const maxHerbScore = totalHerbs.value * 100
    const accuracyScore = maxHerbScore > 0 ? (totalHerbScore / maxHerbScore) * 100 : 0

    const totalTimeUsed = order.timeLimit - timeRemaining.value
    const totalTime = Math.round(totalTimeUsed)
    const timeRatio = totalTimeUsed / order.timeLimit
    let speedScore = 100
    if (timeRatio < 0.5) {
      speedScore = 100
    } else if (timeRatio < 0.8) {
      speedScore = 80
    } else if (timeRatio < 1.0) {
      speedScore = 60
    } else {
      speedScore = 40
    }

    const weightedScore = 
      priorityScore * CLINIC_SCORE_WEIGHTS.priorityJudgment / 100 +
      prescriptionScore * CLINIC_SCORE_WEIGHTS.prescriptionSelection / 100 +
      accuracyScore * CLINIC_SCORE_WEIGHTS.weighingAccuracy / 100 +
      speedScore * CLINIC_SCORE_WEIGHTS.speedEfficiency / 100

    const finalScore = Math.round(weightedScore * config.scoreMultiplier)
    const maxScore = 100

    const finalScorePct = Math.min(100, Math.round((finalScore / maxScore) * 100))

    let rating: ClinicRating = 'D'
    for (const [key, cfg] of Object.entries(CLINIC_RATING_CONFIG)) {
      if (finalScorePct >= cfg.minScore) {
        rating = key as ClinicRating
        break
      }
    }

    const skippedCount = herbResults.value.filter(h => h.skipped).length
    const perfectCount = herbResults.value.filter(h => h.isPerfect).length
    const averageError = herbResults.value.length > 0
      ? herbResults.value.reduce((sum, h) => sum + Math.abs(h.finalError), 0) / herbResults.value.length
      : 0

    const skillsImproved = computeSkillsImproved(priorityScore, prescriptionScore, accuracyScore, speedScore)

    const baseXP = Math.round(finalScorePct * 3)
    const xpEarned = Math.round(baseXP * config.xpMultiplier)

    const caseReview = generateCaseReview(order, priorityScore, prescriptionScore, accuracyScore, speedScore, rating)

    return {
      id: 'clinic_' + Date.now(),
      order,
      startTime: sessionStartTime.value,
      endTime: sessionEndTime.value,
      totalTime,
      totalScore: finalScorePct,
      maxScore,
      scorePercentage: finalScorePct,
      priorityJudgment: { ...priorityJudgment.value },
      prescriptionSelection: { ...prescriptionSelection.value },
      herbResults: [...herbResults.value],
      skippedCount,
      perfectCount,
      averageError,
      rating,
      xpEarned,
      skillsImproved,
      caseReview
    }
  }

  function computeSkillsImproved(
    priorityScore: number,
    prescriptionScore: number,
    accuracyScore: number,
    speedScore: number
  ): string[] {
    const improved: string[] = []

    if (priorityScore >= 80) improved.push('herb_identification')
    if (prescriptionScore >= 80) improved.push('knowledge_mastery')
    if (accuracyScore >= 80) {
      improved.push('dosage_precision')
      improved.push('weight_selection')
      improved.push('balance_judgment')
    }
    if (speedScore >= 80) improved.push('speed_efficiency')

    return [...new Set(improved)]
  }

  function generateCaseReview(
    order: ClinicOrder,
    priorityScore: number,
    prescriptionScore: number,
    accuracyScore: number,
    speedScore: number,
    rating: ClinicRating
  ): ClinicCaseReview {
    const highlights: string[] = []
    const weakPoints: string[] = []
    const suggestions: string[] = []
    const knowledgePoints: string[] = []

    if (priorityScore >= 80) {
      highlights.push('优先级判断准确，分诊能力强')
    } else {
      weakPoints.push('优先级判断有误，需加强分诊能力')
      suggestions.push('学习中医急症知识，掌握不同病症的优先级判断')
    }

    if (prescriptionScore >= 80) {
      highlights.push('处方选择正确，辨证论治精准')
    } else {
      weakPoints.push('处方选择错误，需加强方剂知识')
      suggestions.push('复习常用方剂的组成、功效和适应症')
    }

    if (accuracyScore >= 80) {
      highlights.push('称量精准，剂量控制得很好')
    } else if (accuracyScore >= 60) {
      suggestions.push('继续练习称量，提高剂量控制精度')
    } else {
      weakPoints.push('称量精度不足，需加强基础练习')
      suggestions.push('多进行自由练习，熟悉砝码组合和剂量控制')
    }

    if (speedScore >= 80) {
      highlights.push('操作迅速，效率很高')
    } else {
      suggestions.push('多练习提高操作速度，熟能生巧')
    }

    const correctPrescription = PRESCRIPTIONS.find(p => p.id === order.correctPrescriptionId)
    knowledgePoints.push(`《${correctPrescription?.name || '未知方剂'}》：${correctPrescription?.description || ''}`)
    knowledgePoints.push(`${URGENCY_CONFIG[order.urgencyLevel].label}患者需${URGENCY_CONFIG[order.urgencyLevel].description}`)

    const summary = `本次接诊评级为${CLINIC_RATING_CONFIG[rating].label}，${CLINIC_RATING_CONFIG[rating].description}`

    const correctDecision = `正确判断：${URGENCY_CONFIG[order.urgencyLevel].label}，应选用${correctPrescription?.name || '未知'}`
    const userDecision = `您的判断：${priorityScore >= 80 ? '优先级正确' : '优先级有误'}，${prescriptionScore >= 80 ? '处方正确' : '处方有误'}`

    let decisionAnalysis = ''
    if (priorityScore >= 80 && prescriptionScore >= 80) {
      decisionAnalysis = '诊断思路清晰，辨证准确，选方恰当。'
    } else if (prescriptionScore < 80) {
      decisionAnalysis = `处方选择偏差。本证为${order.caseDescription}，治宜${order.prescriptionRequirement}，应选用${correctPrescription?.name}。`
    } else {
      decisionAnalysis = '优先级判断需加强。应根据病情危急程度合理安排接诊顺序。'
    }

    return {
      summary,
      correctDecision,
      userDecision,
      decisionAnalysis,
      highlights,
      weakPoints,
      suggestions,
      knowledgePoints
    }
  }

  function updateApprenticeProfile(result: ClinicSessionResult) {
    const mentorStore = useMentorStore()
    const profile = mentorStore.apprenticeProfile

    profile.totalXP += result.xpEarned

    const newLevel = Math.floor(profile.totalXP / XP_PER_LEVEL)
    if (newLevel > profile.level) {
      profile.level = newLevel
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

    profile.lastActiveAt = Date.now()
    mentorStore.saveProfile()
  }

  function addHistory(partial: Partial<ClinicHistoryRecord>) {
    historyCounter++
    const record: ClinicHistoryRecord = {
      id: 'h_' + historyCounter,
      timestamp: Date.now(),
      type: (partial.type as any) || 'adjust_herb',
      description: partial.description || '',
      details: partial.details || {}
    }
    history.value.push(record)
  }

  function getAvailableWeights(): Weight[] {
    return WEIGHTS.filter(w => 
      !placedWeights.value.find(pw => pw.id === w.id) && 
      !usedWeightIds.value.has(w.id)
    )
  }

  function isWeightUsed(weightId: string): boolean {
    return usedWeightIds.value.has(weightId)
  }

  function getPlacedWeights(): Weight[] {
    return [...placedWeights.value]
  }

  function startNewSession() {
    stopSessionTimer()
    isStarted.value = true
    isCompleted.value = false
    currentPhase.value = 'select_order'
    history.value = []
    lastResult.value = null
    herbResults.value = []
    priorityJudgment.value = {
      selectedPriority: null,
      isCorrect: null,
      timeSpent: 0
    }
    prescriptionSelection.value = {
      selectedPrescriptionId: null,
      isCorrect: null,
      timeSpent: 0
    }
    generatePendingOrders(3)
  }

  function reset() {
    stopSessionTimer()
    isStarted.value = false
    isCompleted.value = false
    currentPhase.value = 'select_order'
    pendingOrders.value = []
    currentOrder.value = null
    currentPrescription.value = null
    currentHerbIndex.value = 0
    timeRemaining.value = 0
    placedWeights.value = []
    currentHerbCount.value = 0
    usedWeightIds.value = new Set()
    history.value = []
    priorityJudgment.value = {
      selectedPriority: null,
      isCorrect: null,
      timeSpent: 0
    }
    prescriptionSelection.value = {
      selectedPrescriptionId: null,
      isCorrect: null,
      timeSpent: 0
    }
    herbResults.value = []
    lastResult.value = null
  }

  function persistResults() {
    try {
      localStorage.setItem('scaleTrainer_clinicResults', JSON.stringify(sessionResults.value))
    } catch (e) {
      console.error('Failed to persist clinic results:', e)
    }
  }

  function loadResults(): ClinicSessionResult[] {
    try {
      const stored = localStorage.getItem('scaleTrainer_clinicResults')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load clinic results:', e)
    }
    return []
  }

  function init() {
    sessionResults.value = loadResults()
  }

  function clearSessionHistory() {
    sessionResults.value = []
    persistResults()
  }

  return {
    isStarted,
    isCompleted,
    currentPhase,
    pendingOrders,
    currentOrder,
    currentPrescription,
    currentHerbIndex,
    timeRemaining,
    placedWeights,
    currentHerbCount,
    usedWeightIds,
    history,
    priorityJudgment,
    prescriptionSelection,
    herbResults,
    lastResult,
    sessionResults,

    leftWeight,
    rightWeight,
    currentError,
    currentHerb,
    isCurrentBalanced,
    currentErrorPercentage,
    completedHerbs,
    totalHerbs,
    availablePrescriptions,
    placedWeightIds,

    generateRandomOrder,
    generatePendingOrders,
    selectOrder,
    judgePriority,
    selectPrescription,
    addWeight,
    removeWeight,
    setHerbCount,
    completeCurrentHerb,
    skipCurrentHerb,
    completeSession,
    getAvailableWeights,
    isWeightUsed,
    getPlacedWeights,
    startNewSession,
    reset,
    init,
    loadResults,
    clearSessionHistory
  }
})
