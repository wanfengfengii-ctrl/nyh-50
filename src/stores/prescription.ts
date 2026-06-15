import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Weight, Prescription, PrescriptionHerb, PrescriptionStepRecord, PrescriptionResult } from '@/types'
import { PRESCRIPTIONS, WEIGHTS } from '@/constants'
import { useWeighing, useHerbSession, useTimer, usePersistence } from '@/composables'

export const usePrescriptionStore = defineStore('prescription', () => {
  const prescriptions = ref<Prescription[]>(JSON.parse(JSON.stringify(PRESCRIPTIONS)))
  const currentPrescriptionIndex = ref(0)
  const isStarted = ref(false)
  const isCompleted = ref(false)
  const lastResult = ref<PrescriptionResult | null>(null)
  const history = ref<PrescriptionStepRecord[]>([])
  const historyCounter = ref(0)

  const weighing = useWeighing({
    trackUsedWeights: true,
    allWeights: WEIGHTS
  })

  const herbSession = useHerbSession({
    herbs: [],
    onHerbComplete: () => {
      weighing.markWeightsUsed(weighing.placedWeights.value)
    },
    onSessionComplete: () => {
      completePrescription()
    }
  })

  const timer = useTimer({
    mode: 'countdown',
    onTimeUp: () => {
      completePrescription()
    }
  })

  const persistence = usePersistence<PrescriptionResult[]>({
    storageKey: 'scaleTrainer_prescriptionResults',
    defaultValue: []
  })

  const prescriptionResults = computed(() => persistence.data.value)

  const currentPrescription = computed<Prescription | null>(() => {
    if (currentPrescriptionIndex.value >= prescriptions.value.length) return null
    return prescriptions.value[currentPrescriptionIndex.value]
  })

  const currentHerb = computed<PrescriptionHerb | null>(() => herbSession.currentHerb.value)
  const herbs = computed(() => herbSession.sessionHerbs.value)
  const completedHerbs = computed(() => herbSession.completedHerbs.value)
  const totalProgress = computed(() => herbSession.totalProgress.value)

  const placedWeightIds = computed(() => weighing.placedWeightIds.value)
  const leftWeight = computed(() => weighing.leftWeight.value)
  const rightWeight = computed(() => weighing.rightWeight.value)
  const currentError = computed(() => weighing.error.value)
  const isCurrentBalanced = computed(() => weighing.isBalanced.value)
  const currentErrorPercentage = computed(() => weighing.errorPercentage.value)
  const allHerbsCompleted = computed(() => herbSession.allCompleted.value)
  const currentHerbCount = computed(() => weighing.herbCount.value)
  const placedWeights = computed(() => weighing.placedWeights.value)
  const usedWeightIds = computed(() => weighing.usedWeightIds.value)
  const timeRemaining = computed(() => timer.timeRemaining.value)

  function isWeightUsed(weightId: string): boolean {
    return weighing.isWeightUsed(weightId)
  }

  function selectPrescription(index: number) {
    if (index < 0 || index >= prescriptions.value.length) return
    currentPrescriptionIndex.value = index
    resetPrescriptionState()
  }

  function resetPrescriptionState() {
    timer.reset()
    isStarted.value = false
    isCompleted.value = false
    history.value = []
    historyCounter.value = 0
    lastResult.value = null
    weighing.resetAll()

    if (currentPrescription.value) {
      timer.setTime(currentPrescription.value.timeLimit)
      herbSession.updateHerbs(currentPrescription.value.herbs)
    }
  }

  function startPrescription() {
    if (!currentPrescription.value) return
    resetPrescriptionState()
    isStarted.value = true
    timer.start()

    herbSession.updateHerbs(currentPrescription.value.herbs)
    herbSession.startSession()

    const firstHerb = herbSession.currentHerb.value
    if (firstHerb) {
      weighing.setCurrentHerb(firstHerb)
    }

    addHistory({
      type: 'switch_herb',
      description: `开始称量 ${currentHerb.value?.herbName}，目标：${currentHerb.value?.targetWeight}钱`
    })
  }

  function selectHerb(index: number) {
    if (!currentPrescription.value) return
    if (index < 0 || index >= currentPrescription.value.herbs.length) return
    if (currentPrescription.value.herbs[index].completed) return

    const prevHerb = currentPrescription.value.herbs[herbSession.currentHerbIndex.value]
    if (prevHerb && !prevHerb.completed) {
      prevHerb.herbCount = weighing.herbCount.value
      prevHerb.placedWeights = [...weighing.placedWeights.value]
    }

    const success = herbSession.selectHerb(index)
    if (!success) return

    const herb = herbSession.currentHerb.value
    if (!herb) return

    const savedWeights = herb.placedWeights.filter(w => !usedWeightIds.value.has(w.id))
    if (savedWeights.length !== herb.placedWeights.length) {
      herb.placedWeights = savedWeights
    }

    weighing.placedWeights.value = [...savedWeights]
    weighing.herbCount.value = herb.herbCount
    weighing.currentHerb.value = herb

    addHistory({
      type: 'switch_herb',
      description: `切换到 ${herb.herbName}，目标：${herb.targetWeight}钱`
    })
  }

  function addWeight(weight: Weight): boolean {
    if (!currentHerb.value || currentHerb.value.completed) return false
    if (!weighing.addWeight(weight)) return false

    addHistory({
      type: 'add_weight',
      description: `添加 ${weight.name} 到砝码盘`
    })
    return true
  }

  function removeWeight(weightId: string): boolean {
    if (!currentHerb.value || currentHerb.value.completed) return false
    const weight = weighing.placedWeights.value.find(w => w.id === weightId)
    if (!weight) return false

    if (!weighing.removeWeight(weightId)) return false

    addHistory({
      type: 'remove_weight',
      description: `移除 ${weight.name}`
    })
    return true
  }

  function setHerbCount(count: number): boolean {
    if (!currentHerb.value || currentHerb.value.completed) return false
    if (count < 0) return false
    if (count === weighing.herbCount.value) return false

    const oldCount = weighing.herbCount.value
    if (!weighing.setHerbCount(count)) return false

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
      placedWeights: [...weighing.placedWeights.value],
      herbCount: weighing.herbCount.value,
      leftWeight: weighing.leftWeight.value,
      rightWeight: weighing.rightWeight.value,
      error: weighing.error.value,
      targetWeight: currentHerb.value.targetWeight
    }
    history.value.push(record)
  }

  function completeCurrentHerb(): boolean {
    if (!currentHerb.value || !currentPrescription.value) return false
    if (currentHerb.value.completed) return false

    const herb = currentHerb.value
    const error = weighing.error.value
    const absError = Math.abs(error)

    if (absError > herb.allowedError) {
      return false
    }

    let score = 0
    if (absError <= herb.allowedError * 0.1) {
      score = 100
    } else if (absError <= herb.allowedError) {
      const errorRatio = absError / herb.allowedError
      score = Math.round(100 - errorRatio * 30)
    }

    const result = herbSession.completeCurrentHerb(
      weighing.placedWeights.value,
      weighing.herbCount.value,
      weighing.rightWeight.value,
      error,
      score,
      absError <= herb.allowedError * 0.1
    )

    if (!result) return false

    addHistory({
      type: 'complete_herb',
      description: `完成 ${herb.herbName} 称量，误差：${error > 0 ? '+' : ''}${error.toFixed(2)}钱，得分：${score}分`
    })

    if (herbSession.allCompleted.value) {
      completePrescription()
    }

    return true
  }

  function completePrescription() {
    if (!currentPrescription.value) return
    if (isCompleted.value) return

    timer.stop()
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
      totalTimeUsed: currentPrescription.value.timeLimit - timer.timeRemaining.value,
      history: JSON.parse(JSON.stringify(history.value))
    }

    lastResult.value = result
    persistence.data.value.push(result)
    persistence.save()
  }

  function getAvailableWeights(): Weight[] {
    return weighing.availableWeights.value
  }

  function getPlacedWeights(): Weight[] {
    return [...weighing.placedWeights.value]
  }

  function loadResults(): PrescriptionResult[] {
    return persistence.load()
  }

  function clearResults() {
    persistence.clear()
  }

  function init() {
    persistence.load()
    if (currentPrescription.value) {
      herbSession.updateHerbs(currentPrescription.value.herbs)
    }
  }

  return {
    prescriptions,
    currentPrescriptionIndex,
    currentHerbIndex: herbSession.currentHerbIndex,
    isStarted,
    isCompleted,
    timeRemaining,
    history,
    placedWeights,
    currentHerbCount,
    lastResult,
    prescriptionResults,
    usedWeightIds,

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
    stopTimer: timer.stop,
    selectHerb,
    addWeight,
    removeWeight,
    setHerbCount,
    completeCurrentHerb,
    completePrescription,
    getAvailableWeights,
    getPlacedWeights,
    isWeightUsed,
    loadResults,
    clearResults,
    init
  }
})
