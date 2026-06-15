import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Weight, Prescription, PrescriptionHerb, PrescriptionStepRecord, PrescriptionResult } from '@/types'
import { PRESCRIPTIONS, WEIGHTS } from '@/constants'

export const usePrescriptionStore = defineStore('prescription', () => {
  const prescriptions = ref<Prescription[]>(JSON.parse(JSON.stringify(PRESCRIPTIONS)))
  const currentPrescriptionIndex = ref(0)
  const currentHerbIndex = ref(0)
  const isStarted = ref(false)
  const isCompleted = ref(false)
  const timeRemaining = ref(0)
  const startTime = ref(0)
  const history = ref<PrescriptionStepRecord[]>([])
  const historyCounter = ref(0)
  const placedWeights = ref<Weight[]>([])
  const currentHerbCount = ref(0)
  const lastResult = ref<PrescriptionResult | null>(null)
  const prescriptionResults = ref<PrescriptionResult[]>([])
  let timerInterval: number | null = null

  const currentPrescription = computed<Prescription | null>(() => {
    if (currentPrescriptionIndex.value >= prescriptions.value.length) return null
    return prescriptions.value[currentPrescriptionIndex.value]
  })

  const currentHerb = computed<PrescriptionHerb | null>(() => {
    if (!currentPrescription.value) return null
    if (currentHerbIndex.value >= currentPrescription.value.herbs.length) return null
    return currentPrescription.value.herbs[currentHerbIndex.value]
  })

  const herbs = computed(() => currentPrescription.value?.herbs || [])

  const completedHerbs = computed(() => herbs.value.filter(h => h.completed).length)

  const totalProgress = computed(() => {
    if (!currentPrescription.value) return 0
    return (completedHerbs.value / currentPrescription.value.herbs.length) * 100
  })

  const placedWeightIds = computed(() => placedWeights.value.map(w => w.id))

  const leftWeight = computed(() => placedWeights.value.reduce((sum, w) => sum + w.weight, 0))

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

  const allHerbsCompleted = computed(() => {
    if (!currentPrescription.value) return false
    return currentPrescription.value.herbs.every(h => h.completed)
  })

  function selectPrescription(index: number) {
    if (index < 0 || index >= prescriptions.value.length) return
    currentPrescriptionIndex.value = index
    resetPrescriptionState()
  }

  function resetPrescriptionState() {
    stopTimer()
    isStarted.value = false
    isCompleted.value = false
    currentHerbIndex.value = 0
    placedWeights.value = []
    currentHerbCount.value = 0
    history.value = []
    historyCounter.value = 0
    lastResult.value = null

    if (currentPrescription.value) {
      timeRemaining.value = currentPrescription.value.timeLimit
      currentPrescription.value.herbs.forEach(h => {
        h.completed = false
        h.herbCount = 0
        h.placedWeights = []
        h.finalError = 0
        h.score = 0
      })
    }
  }

  function startPrescription() {
    if (!currentPrescription.value) return
    resetPrescriptionState()
    isStarted.value = true
    startTime.value = Date.now()
    startTimer()
    addHistory({
      type: 'switch_herb',
      description: `开始称量 ${currentHerb.value?.herbName}，目标：${currentHerb.value?.targetWeight}钱`
    })
  }

  function startTimer() {
    stopTimer()
    timerInterval = window.setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value--
      } else {
        completePrescription()
      }
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function selectHerb(index: number) {
    if (!currentPrescription.value) return
    if (index < 0 || index >= currentPrescription.value.herbs.length) return
    if (currentPrescription.value.herbs[index].completed) return

    const prevHerb = currentPrescription.value.herbs[currentHerbIndex.value]
    if (prevHerb && !prevHerb.completed) {
      prevHerb.herbCount = currentHerbCount.value
      prevHerb.placedWeights = [...placedWeights.value]
    }

    currentHerbIndex.value = index
    const herb = currentPrescription.value.herbs[index]
    placedWeights.value = [...herb.placedWeights]
    currentHerbCount.value = herb.herbCount

    addHistory({
      type: 'switch_herb',
      description: `切换到 ${herb.herbName}，目标：${herb.targetWeight}钱`
    })
  }

  function addWeight(weight: Weight): boolean {
    if (!currentHerb.value || currentHerb.value.completed) return false
    if (placedWeightIds.value.includes(weight.id)) return false

    placedWeights.value.push(weight)
    addHistory({
      type: 'add_weight',
      description: `添加 ${weight.name} 到砝码盘`
    })
    return true
  }

  function removeWeight(weightId: string): boolean {
    if (!currentHerb.value || currentHerb.value.completed) return false
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
    if (!currentHerb.value || currentHerb.value.completed) return false
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

  function addHistory(partial: Partial<PrescriptionStepRecord>) {
    if (!currentHerb.value) return

    historyCounter.value++
    const record: PrescriptionStepRecord = {
      id: historyCounter.value,
      timestamp: Date.now(),
      herbId: currentHerb.value.id,
      herbName: currentHerb.value.herbName,
      type: (partial.type as any) || 'adjust_herb',
      description: partial.description || '',
      placedWeights: [...placedWeights.value],
      herbCount: currentHerbCount.value,
      leftWeight: leftWeight.value,
      rightWeight: rightWeight.value,
      error: currentError.value,
      targetWeight: currentHerb.value.targetWeight
    }
    history.value.push(record)
  }

  function completeCurrentHerb(): boolean {
    if (!currentHerb.value || !currentPrescription.value) return false
    if (currentHerb.value.completed) return false

    const herb = currentHerb.value
    const error = currentError.value
    const absError = Math.abs(error)
    herb.finalError = error
    herb.herbCount = currentHerbCount.value
    herb.placedWeights = [...placedWeights.value]

    let score = 0
    if (absError <= herb.allowedError) {
      score = 100
    } else {
      const errorRatio = absError / herb.targetWeight
      score = Math.max(0, Math.round(100 * (1 - errorRatio * 2)))
    }
    herb.score = score
    herb.completed = true

    addHistory({
      type: 'complete_herb',
      description: `完成 ${herb.herbName} 称量，误差：${error > 0 ? '+' : ''}${error.toFixed(2)}钱，得分：${score}分`
    })

    const nextIndex = currentPrescription.value.herbs.findIndex(h => !h.completed)
    if (nextIndex !== -1) {
      selectHerb(nextIndex)
    } else if (allHerbsCompleted.value) {
      completePrescription()
    }

    return true
  }

  function completePrescription() {
    if (!currentPrescription.value) return
    if (isCompleted.value) return

    stopTimer()
    isCompleted.value = true

    const herbResults = currentPrescription.value.herbs.map(herb => {
      const herbHistory = history.value.filter(h => h.herbId === herb.id)
      let bestStepIndex = 0
      let worstStepIndex = 0
      let minAbsError = Infinity
      let maxAbsError = 0

      herbHistory.forEach((record, idx) => {
        const absError = Math.abs(record.error)
        if (absError < minAbsError && record.type !== 'complete_herb' && record.type !== 'switch_herb') {
          minAbsError = absError
          bestStepIndex = idx
        }
        if (absError > maxAbsError && record.type !== 'complete_herb' && record.type !== 'switch_herb') {
          maxAbsError = absError
          worstStepIndex = idx
        }
      })

      return {
        herb,
        score: herb.score,
        finalError: herb.finalError,
        errorPercentage: herb.targetWeight > 0 ? (Math.abs(herb.finalError) / herb.targetWeight) * 100 : 0,
        bestStepIndex,
        worstStepIndex,
        history: herbHistory
      }
    })

    const totalScore = herbResults.reduce((sum, r) => sum + r.score, 0)
    const maxScore = herbResults.length * 100

    let bestHerbIndex = 0
    let worstHerbIndex = 0
    herbResults.forEach((r, idx) => {
      if (r.score > herbResults[bestHerbIndex].score) bestHerbIndex = idx
      if (r.score < herbResults[worstHerbIndex].score) worstHerbIndex = idx
    })

    const result: PrescriptionResult = {
      prescription: JSON.parse(JSON.stringify(currentPrescription.value)),
      totalScore,
      maxScore,
      herbResults,
      bestHerbIndex,
      worstHerbIndex,
      totalTimeUsed: currentPrescription.value.timeLimit - timeRemaining.value,
      history: JSON.parse(JSON.stringify(history.value))
    }

    lastResult.value = result
    prescriptionResults.value.push(result)
    persistResults()
  }

  function getAvailableWeights(): Weight[] {
    return WEIGHTS.filter(w => !placedWeightIds.value.includes(w.id))
  }

  function getPlacedWeights(): Weight[] {
    return placedWeights.value
  }

  function persistResults() {
    try {
      const serialized = prescriptionResults.value.map(r => ({
        ...r,
        herbKeySteps: {}
      }))
      localStorage.setItem('scaleTrainer_prescriptionResults', JSON.stringify(serialized))
    } catch (e) {
      console.error('Failed to persist prescription results:', e)
    }
  }

  function loadResults(): PrescriptionResult[] {
    try {
      const stored = localStorage.getItem('scaleTrainer_prescriptionResults')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load prescription results:', e)
    }
    return []
  }

  function clearResults() {
    localStorage.removeItem('scaleTrainer_prescriptionResults')
    prescriptionResults.value = []
  }

  return {
    prescriptions,
    currentPrescriptionIndex,
    currentHerbIndex,
    isStarted,
    isCompleted,
    timeRemaining,
    history,
    placedWeights,
    currentHerbCount,
    lastResult,
    prescriptionResults,
    currentPrescription,
    currentHerb,
    herbs,
    completedHerbs,
    totalProgress,
    placedWeightIds,
    leftWeight,
    rightWeight,
    currentError,
    isCurrentBalanced,
    currentErrorPercentage,
    allHerbsCompleted,
    selectPrescription,
    resetPrescriptionState,
    startPrescription,
    stopTimer,
    selectHerb,
    addWeight,
    removeWeight,
    setHerbCount,
    completeCurrentHerb,
    completePrescription,
    getAvailableWeights,
    getPlacedWeights,
    loadResults,
    clearResults
  }
})
