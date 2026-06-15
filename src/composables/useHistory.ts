import { ref, computed } from 'vue'
import type { Weight } from '@/types'

export interface HistorySnapshot {
  placedWeights: Weight[]
  herbCount: number
  leftWeight: number
  rightWeight: number
  error: number
}

export interface HistoryEntry<T extends Record<string, any> = Record<string, any>> {
  id: number
  timestamp: number
  type: string
  description: string
  snapshot: HistorySnapshot
  extra?: T
}

export interface UseHistoryOptions {
  maxHistory?: number
  onUndo?: (snapshot: HistorySnapshot) => void
  onRedo?: (snapshot: HistorySnapshot) => void
  getSnapshot?: () => HistorySnapshot
}

export function useHistory(options: UseHistoryOptions = {}) {
  const { maxHistory = 100, getSnapshot } = options

  const history = ref<HistoryEntry[]>([])
  const historyIndex = ref(-1)
  const historyCounter = ref(0)

  const canUndo = computed(() => historyIndex.value >= 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function addEntry(
    type: string,
    description: string,
    snapshot: HistorySnapshot,
    extra?: Record<string, any>
  ): HistoryEntry {
    const newHistory = history.value.slice(0, historyIndex.value + 1)

    historyCounter.value++
    const entry: HistoryEntry = {
      id: historyCounter.value,
      timestamp: Date.now(),
      type,
      description,
      snapshot: { ...snapshot },
      extra
    }

    newHistory.push(entry)

    if (maxHistory && newHistory.length > maxHistory) {
      newHistory.shift()
    } else {
      historyIndex.value++
    }

    history.value = newHistory

    if (historyIndex.value >= newHistory.length) {
      historyIndex.value = newHistory.length - 1
    }

    return entry
  }

  function recordAction(
    type: string,
    description: string,
    extra?: Record<string, any>
  ): HistoryEntry | null {
    if (!getSnapshot) return null

    const snapshot = getSnapshot()
    return addEntry(type, description, snapshot, extra)
  }

  function undo(): HistorySnapshot | null {
    if (!canUndo.value) return null

    historyIndex.value--

    if (historyIndex.value === -1) {
      return {
        placedWeights: [],
        herbCount: 0,
        leftWeight: 0,
        rightWeight: 0,
        error: 0
      }
    }

    const entry = history.value[historyIndex.value]
    return { ...entry.snapshot }
  }

  function redo(): HistorySnapshot | null {
    if (!canRedo.value) return null

    historyIndex.value++
    const entry = history.value[historyIndex.value]
    return { ...entry.snapshot }
  }

  function getCurrentEntry(): HistoryEntry | null {
    if (historyIndex.value < 0 || historyIndex.value >= history.value.length) {
      return null
    }
    return history.value[historyIndex.value]
  }

  function getHistory(): HistoryEntry[] {
    return [...history.value]
  }

  function getMaxErrorStep(): number {
    if (history.value.length === 0) return -1

    let maxError = 0
    let maxIndex = 0

    history.value.forEach((entry, index) => {
      if (Math.abs(entry.snapshot.error) > maxError) {
        maxError = Math.abs(entry.snapshot.error)
        maxIndex = index
      }
    })

    return maxIndex
  }

  function getMinErrorStep(): number {
    if (history.value.length === 0) return -1

    let minError = Infinity
    let minIndex = 0

    history.value.forEach((entry, index) => {
      if (Math.abs(entry.snapshot.error) < minError) {
        minError = Math.abs(entry.snapshot.error)
        minIndex = index
      }
    })

    return minIndex
  }

  function resetHistory() {
    history.value = []
    historyIndex.value = -1
    historyCounter.value = 0
  }

  function goToStep(index: number): HistorySnapshot | null {
    if (index < -1 || index >= history.value.length) return null

    historyIndex.value = index

    if (index === -1) {
      return {
        placedWeights: [],
        herbCount: 0,
        leftWeight: 0,
        rightWeight: 0,
        error: 0
      }
    }

    return { ...history.value[index].snapshot }
  }

  return {
    history,
    historyIndex,

    canUndo,
    canRedo,

    addEntry,
    recordAction,
    undo,
    redo,
    getCurrentEntry,
    getHistory,
    getMaxErrorStep,
    getMinErrorStep,
    resetHistory,
    goToStep
  }
}
