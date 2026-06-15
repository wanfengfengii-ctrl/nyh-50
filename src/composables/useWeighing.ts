import { ref, computed } from 'vue'
import type { Weight, Herb, PrescriptionHerb } from '@/types'
import { WEIGHTS } from '@/constants'

export interface UseWeighingOptions {
  initialTargetWeight?: number
  initialAllowedError?: number
  initialHerb?: Herb | PrescriptionHerb | null
  trackUsedWeights?: boolean
  allWeights?: Weight[]
}

export function useWeighing(options: UseWeighingOptions = {}) {
  const {
    initialTargetWeight = 10,
    initialAllowedError = 0.1,
    initialHerb = null,
    trackUsedWeights = false,
    allWeights = WEIGHTS
  } = options

  const placedWeights = ref<Weight[]>([])
  const herbCount = ref(0)
  const currentHerb = ref<Herb | PrescriptionHerb | null>(initialHerb)
  const targetWeight = ref(initialTargetWeight)
  const allowedError = ref(initialAllowedError)
  const usedWeightIds = ref<Set<string>>(new Set())

  const leftWeight = computed(() => {
    return placedWeights.value.reduce((sum, w) => sum + w.weight, 0)
  })

  const rightWeight = computed(() => {
    if (!currentHerb.value) return 0
    const unitWeight = 'unitWeight' in currentHerb.value ? currentHerb.value.unitWeight : 0
    return herbCount.value * unitWeight
  })

  const error = computed(() => leftWeight.value - rightWeight.value)

  const isBalanced = computed(() => {
    return Math.abs(error.value) <= allowedError.value
  })

  const errorPercentage = computed(() => {
    if (targetWeight.value === 0) return 0
    return (Math.abs(error.value) / targetWeight.value) * 100
  })

  const placedWeightIds = computed(() => placedWeights.value.map(w => w.id))

  const availableWeights = computed(() => {
    return allWeights.filter(w => {
      const isPlaced = placedWeightIds.value.includes(w.id)
      const isUsed = trackUsedWeights && usedWeightIds.value.has(w.id)
      return !isPlaced && !isUsed
    })
  })

  function addWeight(weight: Weight): boolean {
    if (weight.weight <= 0) return false
    if (placedWeightIds.value.includes(weight.id)) return false
    if (trackUsedWeights && usedWeightIds.value.has(weight.id)) return false

    placedWeights.value.push(weight)
    return true
  }

  function removeWeight(weightId: string): boolean {
    const index = placedWeights.value.findIndex(w => w.id === weightId)
    if (index === -1) return false

    placedWeights.value.splice(index, 1)
    return true
  }

  function setHerbCount(count: number): boolean {
    if (count < 0) return false
    if (count === herbCount.value) return false

    herbCount.value = count
    return true
  }

  function setCurrentHerb(herb: Herb | PrescriptionHerb) {
    currentHerb.value = herb
    herbCount.value = 0
    placedWeights.value = []
    if ('targetWeight' in herb && herb.targetWeight) {
      targetWeight.value = herb.targetWeight
    }
    if ('allowedError' in herb && herb.allowedError) {
      allowedError.value = herb.allowedError
    }
  }

  function setTargetWeight(weight: number) {
    if (weight <= 0) return
    targetWeight.value = weight
  }

  function setAllowedError(err: number) {
    allowedError.value = Math.max(0, err)
  }

  function markWeightsUsed(weights: Weight[]) {
    weights.forEach(w => usedWeightIds.value.add(w.id))
  }

  function isWeightUsed(weightId: string): boolean {
    return usedWeightIds.value.has(weightId)
  }

  function isWeightPlaced(weightId: string): boolean {
    return placedWeights.value.some(w => w.id === weightId)
  }

  function resetWeighing(resetUsed: boolean = false) {
    placedWeights.value = []
    herbCount.value = 0
    if (resetUsed) {
      usedWeightIds.value = new Set()
    }
  }

  function resetAll() {
    placedWeights.value = []
    herbCount.value = 0
    currentHerb.value = initialHerb || null
    targetWeight.value = initialTargetWeight
    allowedError.value = initialAllowedError
    usedWeightIds.value = new Set()
  }

  function getHerbUnitWeight(): number {
    if (!currentHerb.value) return 0
    return 'unitWeight' in currentHerb.value ? currentHerb.value.unitWeight : 0
  }

  return {
    placedWeights,
    herbCount,
    currentHerb,
    targetWeight,
    allowedError,
    usedWeightIds,

    leftWeight,
    rightWeight,
    error,
    isBalanced,
    errorPercentage,
    placedWeightIds,
    availableWeights,

    addWeight,
    removeWeight,
    setHerbCount,
    setCurrentHerb,
    setTargetWeight,
    setAllowedError,
    markWeightsUsed,
    isWeightUsed,
    isWeightPlaced,
    resetWeighing,
    resetAll,
    getHerbUnitWeight
  }
}
