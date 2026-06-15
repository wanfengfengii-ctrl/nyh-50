import { ref, computed, onUnmounted } from 'vue'
import type { TimerMode } from '@/types'

export interface UseTimerOptions {
  mode?: TimerMode
  initialTime?: number
  autoStart?: boolean
  onTimeUp?: () => void
  onTick?: (timeRemaining: number, timeElapsed: number) => void
  interval?: number
}

export function useTimer(options: UseTimerOptions = {}) {
  const {
    mode = 'countdown',
    initialTime = 60,
    autoStart = false,
    onTimeUp,
    onTick,
    interval = 1000
  } = options

  const totalTime = ref(initialTime)
  const timeRemaining = ref(initialTime)
  const timeElapsed = ref(0)
  const isRunning = ref(false)
  const isPaused = ref(false)

  let timerInterval: number | null = null

  const progress = computed(() => {
    if (totalTime.value === 0) return 0
    if (mode === 'countdown') {
      return ((totalTime.value - timeRemaining.value) / totalTime.value) * 100
    } else {
      return (timeElapsed.value / totalTime.value) * 100
    }
  })

  function start() {
    if (isRunning.value) return

    isRunning.value = true
    isPaused.value = false

    timerInterval = window.setInterval(() => {
      if (isPaused.value) return

      if (mode === 'countdown') {
        if (timeRemaining.value > 0) {
          timeRemaining.value--
          timeElapsed.value++
          onTick?.(timeRemaining.value, timeElapsed.value)
        } else {
          stop()
          onTimeUp?.()
        }
      } else {
        timeElapsed.value++
        if (timeRemaining.value > 0) {
          timeRemaining.value--
        }
        onTick?.(timeRemaining.value, timeElapsed.value)
      }
    }, interval)
  }

  function stop() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    isRunning.value = false
    isPaused.value = false
  }

  function pause() {
    if (!isRunning.value || isPaused.value) return
    isPaused.value = true
  }

  function resume() {
    if (!isRunning.value || !isPaused.value) return
    isPaused.value = false
  }

  function reset(newTime?: number) {
    stop()
    if (newTime !== undefined) {
      totalTime.value = newTime
      timeRemaining.value = newTime
    } else {
      timeRemaining.value = totalTime.value
    }
    timeElapsed.value = 0
  }

  function setTime(time: number) {
    totalTime.value = time
    timeRemaining.value = time
    timeElapsed.value = 0
  }

  function addTime(seconds: number) {
    timeRemaining.value = Math.max(0, timeRemaining.value + seconds)
    if (mode === 'countdown') {
      totalTime.value = Math.max(totalTime.value, timeRemaining.value)
    }
  }

  function togglePause() {
    if (isPaused.value) {
      resume()
    } else {
      pause()
    }
  }

  function restart() {
    reset()
    start()
  }

  onUnmounted(() => {
    stop()
  })

  if (autoStart) {
    start()
  }

  return {
    timeRemaining,
    timeElapsed,
    totalTime,
    isRunning,
    isPaused,
    progress,

    start,
    stop,
    pause,
    resume,
    reset,
    setTime,
    addTime,
    togglePause,
    restart
  }
}
