import { ref, computed } from 'vue'
import type { Weight, HerbWeighingResult, PrescriptionHerb } from '@/types'

export interface UseHerbSessionOptions {
  herbs: PrescriptionHerb[]
  onHerbComplete?: (herb: PrescriptionHerb, result: HerbWeighingResult) => void
  onSessionComplete?: (results: HerbWeighingResult[]) => void
  onHerbSwitch?: (currentIndex: number, nextIndex: number) => void
}

export function useHerbSession(options: UseHerbSessionOptions) {
  const { herbs, onHerbComplete, onSessionComplete, onHerbSwitch } = options

  const sessionHerbs = ref<PrescriptionHerb[]>(JSON.parse(JSON.stringify(herbs)))
  const currentHerbIndex = ref(0)
  const herbResults = ref<HerbWeighingResult[]>([])
  const herbStartTime = ref(0)
  const isStarted = ref(false)
  const isCompleted = ref(false)

  const currentHerb = computed<PrescriptionHerb | null>(() => {
    if (currentHerbIndex.value >= sessionHerbs.value.length) return null
    return sessionHerbs.value[currentHerbIndex.value]
  })

  const totalHerbs = computed(() => sessionHerbs.value.length)

  const completedHerbs = computed(() => {
    return sessionHerbs.value.filter(h => h.completed).length
  })

  const totalProgress = computed(() => {
    if (totalHerbs.value === 0) return 0
    return (completedHerbs.value / totalHerbs.value) * 100
  })

  const allCompleted = computed(() => {
    return sessionHerbs.value.every(h => h.completed)
  })

  function startSession() {
    sessionHerbs.value = JSON.parse(JSON.stringify(herbs))
    currentHerbIndex.value = 0
    herbResults.value = []
    isStarted.value = true
    isCompleted.value = false
    herbStartTime.value = Date.now()
  }

  function selectHerb(index: number): boolean {
    if (index < 0 || index >= sessionHerbs.value.length) return false
    if (sessionHerbs.value[index].completed) return false

    const prevIndex = currentHerbIndex.value
    currentHerbIndex.value = index
    herbStartTime.value = Date.now()

    onHerbSwitch?.(prevIndex, index)
    return true
  }

  function getNextIncompleteHerbIndex(): number {
    return sessionHerbs.value.findIndex(h => !h.completed)
  }

  function completeCurrentHerb(
    placedWeights: Weight[],
    herbCount: number,
    finalWeight: number,
    finalError: number,
    score: number,
    isPerfect: boolean
  ): HerbWeighingResult | null {
    const herb = currentHerb.value
    if (!herb || herb.completed) return null

    const timeSpent = Date.now() - herbStartTime.value

    const result: HerbWeighingResult = {
      herbId: herb.id,
      herbName: herb.herbName,
      targetWeight: herb.targetWeight,
      finalWeight,
      finalError,
      allowedError: herb.allowedError,
      placedWeights: [...placedWeights],
      herbCount,
      score,
      isPerfect,
      timeSpent,
      completed: true,
      skipped: false
    }

    herb.completed = true
    herb.finalError = finalError
    herb.herbCount = herbCount
    herb.placedWeights = [...placedWeights]
    herb.score = score

    herbResults.value.push(result)

    onHerbComplete?.(herb, result)

    const nextIndex = getNextIncompleteHerbIndex()
    if (nextIndex !== -1) {
      selectHerb(nextIndex)
    } else if (allCompleted.value) {
      isCompleted.value = true
      onSessionComplete?.(herbResults.value)
    }

    return result
  }

  function skipCurrentHerb(): HerbWeighingResult | null {
    const herb = currentHerb.value
    if (!herb || herb.completed) return null

    const timeSpent = Date.now() - herbStartTime.value

    const result: HerbWeighingResult = {
      herbId: herb.id,
      herbName: herb.herbName,
      targetWeight: herb.targetWeight,
      finalWeight: 0,
      finalError: herb.targetWeight,
      allowedError: herb.allowedError,
      placedWeights: [],
      herbCount: 0,
      score: 0,
      isPerfect: false,
      timeSpent,
      completed: true,
      skipped: true
    }

    herb.completed = true
    herb.finalError = herb.targetWeight
    herb.herbCount = 0
    herb.placedWeights = []
    herb.score = 0

    herbResults.value.push(result)

    const nextIndex = getNextIncompleteHerbIndex()
    if (nextIndex !== -1) {
      selectHerb(nextIndex)
    } else if (allCompleted.value) {
      isCompleted.value = true
      onSessionComplete?.(herbResults.value)
    }

    return result
  }

  function getHerbResult(herbId: string): HerbWeighingResult | undefined {
    return herbResults.value.find(r => r.herbId === herbId)
  }

  function calculateTotalScore(): number {
    return herbResults.value.reduce((sum, r) => sum + r.score, 0)
  }

  function calculatePerfectCount(): number {
    return herbResults.value.filter(r => r.isPerfect).length
  }

  function calculateSkippedCount(): number {
    return herbResults.value.filter(r => r.skipped).length
  }

  function calculateAverageError(): number {
    if (herbResults.value.length === 0) return 0
    const total = herbResults.value.reduce((sum, r) => sum + Math.abs(r.finalError), 0)
    return total / herbResults.value.length
  }

  function getBestHerbIndex(): number {
    if (herbResults.value.length === 0) return -1
    let bestIndex = 0
    herbResults.value.forEach((r, i) => {
      if (r.score > herbResults.value[bestIndex].score) {
        bestIndex = i
      }
    })
    return bestIndex
  }

  function getWorstHerbIndex(): number {
    if (herbResults.value.length === 0) return -1
    let worstIndex = 0
    herbResults.value.forEach((r, i) => {
      if (r.score < herbResults.value[worstIndex].score) {
        worstIndex = i
      }
    })
    return worstIndex
  }

  function resetSession() {
    sessionHerbs.value = JSON.parse(JSON.stringify(herbs))
    currentHerbIndex.value = 0
    herbResults.value = []
    isStarted.value = false
    isCompleted.value = false
    herbStartTime.value = 0
  }

  function updateHerbs(newHerbs: PrescriptionHerb[]) {
    sessionHerbs.value = JSON.parse(JSON.stringify(newHerbs))
  }

  return {
    sessionHerbs,
    currentHerbIndex,
    herbResults,
    herbStartTime,
    isStarted,
    isCompleted,

    currentHerb,
    totalHerbs,
    completedHerbs,
    totalProgress,
    allCompleted,

    startSession,
    selectHerb,
    completeCurrentHerb,
    skipCurrentHerb,
    getHerbResult,
    getNextIncompleteHerbIndex,
    calculateTotalScore,
    calculatePerfectCount,
    calculateSkippedCount,
    calculateAverageError,
    getBestHerbIndex,
    getWorstHerbIndex,
    resetSession,
    updateHerbs
  }
}
