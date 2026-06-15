import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameMode, ChallengeQuestion, ReviewItem, Weight, Herb } from '@/types'
import { CHALLENGE_QUESTIONS } from '@/constants'
import { useScaleStore } from './scale'
import { useTimer } from '@/composables/useTimer'
import { usePersistence } from '@/composables/usePersistence'

export interface PendingPracticeState {
  targetWeight: number
  herb: Herb
}

export const useGameStore = defineStore('game', () => {
  const gameMode = ref<GameMode>('free')
  const currentQuestionIndex = ref(0)
  const reviewItems = ref<ReviewItem[]>([])
  const challengeScore = ref(0)
  const totalQuestions = ref(0)
  const pendingPractice = ref<PendingPracticeState | null>(null)

  const { timeRemaining, isRunning: isTimerRunning, start, stop, reset: resetTimer, setTime } = useTimer({
    mode: 'countdown',
    initialTime: 60,
    onTimeUp: () => {
      submitAnswer()
    }
  })

  function startTimer() {
    start()
  }

  function stopTimer() {
    stop()
  }

  const { data: wrongAnswersData, load: loadWrongAnswersPersist, save: saveWrongAnswers, clear: clearWrongAnswersPersist } = usePersistence<ReviewItem[]>({
    storageKey: 'scaleTrainer_wrongAnswers',
    defaultValue: []
  })

  const currentQuestion = computed<ChallengeQuestion | null>(() => {
    if (gameMode.value !== 'challenge' && gameMode.value !== 'review') return null
    if (currentQuestionIndex.value >= CHALLENGE_QUESTIONS.length) return null
    return CHALLENGE_QUESTIONS[currentQuestionIndex.value]
  })

  const progress = computed(() => {
    if (totalQuestions.value === 0) return 0
    return (currentQuestionIndex.value / totalQuestions.value) * 100
  })

  function setGameMode(mode: GameMode) {
    gameMode.value = mode
    stop()
    
    if (mode === 'challenge') {
      startChallenge()
    } else if (mode === 'review') {
    } else {
      const scaleStore = useScaleStore()
      scaleStore.reset()
    }
  }

  function startChallenge() {
    currentQuestionIndex.value = 0
    challengeScore.value = 0
    totalQuestions.value = CHALLENGE_QUESTIONS.length
    reviewItems.value = []
    loadQuestion(0)
  }

  function loadQuestion(index: number) {
    if (index >= CHALLENGE_QUESTIONS.length) {
      stop()
      return
    }

    const question = CHALLENGE_QUESTIONS[index]
    currentQuestionIndex.value = index

    const scaleStore = useScaleStore()
    scaleStore.reset()
    scaleStore.setTargetWeight(question.targetWeight)
    
    const herb = {
      id: 'ch',
      name: question.herbName,
      unitWeight: question.herbUnitWeight,
      color: '#8B7355'
    }
    scaleStore.currentHerb = herb

    setTime(question.timeLimit)
    start()
  }

  function submitAnswer(): boolean {
    stop()
    
    const scaleStore = useScaleStore()
    const question = currentQuestion.value
    
    if (!question) return false

    const isCorrect = scaleStore.isBalanced && 
      Math.abs(scaleStore.leftWeight - question.targetWeight) <= 0.1

    if (isCorrect) {
      challengeScore.value++
    }

    const history = scaleStore.getFullHistory()
    let maxError = 0
    let maxErrorStep = 0
    
    history.forEach((record, index) => {
      if (Math.abs(record.error) > maxError) {
        maxError = Math.abs(record.error)
        maxErrorStep = index
      }
    })

    const reviewItem: ReviewItem = {
      question,
      userAnswer: scaleStore.placedWeights.map(pw => pw.weight),
      herbCount: scaleStore.herbCount,
      maxError,
      maxErrorStep,
      history,
      isCorrect
    }

    reviewItems.value.push(reviewItem)

    persistWrongAnswers()

    return isCorrect
  }

  function nextQuestion() {
    if (currentQuestionIndex.value < totalQuestions.value - 1) {
      loadQuestion(currentQuestionIndex.value + 1)
    }
  }

  function isLastQuestion(): boolean {
    return currentQuestionIndex.value >= totalQuestions.value - 1
  }

  function getWrongAnswers(): ReviewItem[] {
    return reviewItems.value.filter(item => !item.isCorrect)
  }

  function setReviewItems(items: ReviewItem[]) {
    reviewItems.value = items
  }

  function persistWrongAnswers() {
    const wrong = reviewItems.value.filter(item => !item.isCorrect)
    wrongAnswersData.value = wrong
    saveWrongAnswers()
  }

  function loadWrongAnswers(): ReviewItem[] {
    return loadWrongAnswersPersist()
  }

  function clearWrongAnswers() {
    clearWrongAnswersPersist()
    reviewItems.value = reviewItems.value.filter(item => item.isCorrect)
  }

  return {
    gameMode,
    currentQuestionIndex,
    timeRemaining,
    isTimerRunning,
    reviewItems,
    challengeScore,
    totalQuestions,
    pendingPractice,
    currentQuestion,
    progress,
    setGameMode,
    startChallenge,
    loadQuestion,
    startTimer,
    stopTimer,
    submitAnswer,
    nextQuestion,
    isLastQuestion,
    getWrongAnswers,
    setReviewItems,
    persistWrongAnswers,
    loadWrongAnswers,
    clearWrongAnswers
  }
})
