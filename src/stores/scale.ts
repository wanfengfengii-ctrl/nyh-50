import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Weight, PlacedWeight, HistoryRecord, Herb } from '@/types'
import { WEIGHTS, HERBS, ALLOWED_ERROR } from '@/constants'

export const useScaleStore = defineStore('scale', () => {
  const placedWeights = ref<PlacedWeight[]>([])
  const herbCount = ref(0)
  const currentHerb = ref<Herb>(HERBS[0])
  const targetWeight = ref(10)
  const history = ref<HistoryRecord[]>([])
  const historyIndex = ref(-1)
  const historyCounter = ref(0)

  const leftWeight = computed(() => {
    return placedWeights.value
      .filter(w => w.placedOn === 'left')
      .reduce((sum, w) => sum + w.weight.weight, 0)
  })

  const rightWeight = computed(() => {
    return herbCount.value * currentHerb.value.unitWeight
  })

  const error = computed(() => {
    return leftWeight.value - rightWeight.value
  })

  const isBalanced = computed(() => {
    return Math.abs(error.value) <= ALLOWED_ERROR
  })

  const errorPercentage = computed(() => {
    if (targetWeight.value === 0) return 0
    return (Math.abs(error.value) / targetWeight.value) * 100
  })

  const placedWeightIds = computed(() => {
    return placedWeights.value.map(w => w.weight.id)
  })

  const canUndo = computed(() => {
    return historyIndex.value >= 0
  })

  const canRedo = computed(() => {
    return historyIndex.value < history.value.length - 1
  })

  function addWeight(weight: Weight, side: 'left' | 'right'): boolean {
    if (weight.weight <= 0) return false
    if (placedWeightIds.value.includes(weight.id)) return false

    const placed: PlacedWeight = {
      weight,
      x: 0,
      y: 0,
      placedOn: side
    }

    placedWeights.value.push(placed)
    addHistory({
      type: 'add_weight',
      description: `添加${weight.name}到${side === 'left' ? '砝码盘' : '药材盘'}`
    })

    return true
  }

  function removeWeight(weightId: string): boolean {
    const index = placedWeights.value.findIndex(w => w.weight.id === weightId)
    if (index === -1) return false

    const weight = placedWeights.value[index].weight
    placedWeights.value.splice(index, 1)

    addHistory({
      type: 'remove_weight',
      description: `移除${weight.name}`
    })

    return true
  }

  function setHerbCount(count: number): boolean {
    if (count < 0) return false
    if (count === herbCount.value) return false

    const oldCount = herbCount.value
    herbCount.value = count

    addHistory({
      type: 'adjust_herb',
      description: `调整药材数量：${oldCount} → ${count}`
    })

    return true
  }

  function setCurrentHerb(herb: Herb) {
    currentHerb.value = herb
    herbCount.value = 0
  }

  function setTargetWeight(weight: number) {
    if (weight <= 0) return
    targetWeight.value = weight
    addHistory({
      type: 'set_target',
      description: `设置目标重量：${weight}钱`
    })
  }

  function addHistory(partial: Partial<HistoryRecord>) {
    const newHistory = history.value.slice(0, historyIndex.value + 1)
    
    historyCounter.value++
    const record: HistoryRecord = {
      id: historyCounter.value,
      timestamp: Date.now(),
      type: partial.type || 'adjust_herb',
      description: partial.description || '',
      leftWeight: leftWeight.value,
      rightWeight: rightWeight.value,
      error: error.value,
      herbCount: herbCount.value,
      placedWeights: placedWeights.value.map(pw => pw.weight)
    }

    newHistory.push(record)
    history.value = newHistory
    historyIndex.value = newHistory.length - 1
  }

  function undo() {
    if (!canUndo.value) return

    historyIndex.value--
    restoreState(historyIndex.value)
  }

  function redo() {
    if (!canRedo.value) return

    historyIndex.value++
    restoreState(historyIndex.value)
  }

  function restoreState(index: number) {
    if (index < -1 || index >= history.value.length) return

    if (index === -1) {
      placedWeights.value = []
      herbCount.value = 0
      return
    }

    const record = history.value[index]
    herbCount.value = record.herbCount
    
    placedWeights.value = record.placedWeights.map((w, i) => ({
      weight: w,
      x: 0,
      y: 0,
      placedOn: 'left' as const
    }))
  }

  function reset() {
    placedWeights.value = []
    herbCount.value = 0
    history.value = []
    historyIndex.value = -1
    historyCounter.value = 0
  }

  function getFullHistory(): HistoryRecord[] {
    return history.value
  }

  function getMaxErrorStep(): number {
    if (history.value.length === 0) return -1
    
    let maxError = 0
    let maxIndex = 0
    
    history.value.forEach((record, index) => {
      if (Math.abs(record.error) > maxError) {
        maxError = Math.abs(record.error)
        maxIndex = index
      }
    })
    
    return maxIndex
  }

  return {
    placedWeights,
    herbCount,
    currentHerb,
    targetWeight,
    history,
    historyIndex,
    leftWeight,
    rightWeight,
    error,
    isBalanced,
    errorPercentage,
    placedWeightIds,
    canUndo,
    canRedo,
    addWeight,
    removeWeight,
    setHerbCount,
    setCurrentHerb,
    setTargetWeight,
    undo,
    redo,
    reset,
    getFullHistory,
    getMaxErrorStep
  }
})
