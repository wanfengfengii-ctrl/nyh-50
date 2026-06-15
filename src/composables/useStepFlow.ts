import { ref, computed } from 'vue'
import type { StepDefinition, StepResult } from '@/types'

export interface UseStepFlowOptions<TStepId extends string = string> {
  steps: StepDefinition<TStepId>[]
  onStepComplete?: (stepId: TStepId, result: StepResult) => void
  onStepSkip?: (stepId: TStepId, result: StepResult) => void
  autoAdvance?: boolean
}

export function useStepFlow<TStepId extends string = string>(
  options: UseStepFlowOptions<TStepId>
) {
  const { steps, onStepComplete, onStepSkip, autoAdvance = false } = options

  const currentStepIndex = ref(0)
  const stepResults = ref<Record<string, StepResult>>(createEmptyResults())

  function createEmptyResults(): Record<string, StepResult> {
    const result: Record<string, StepResult> = {}
    steps.forEach(step => {
      result[step.id] = {
        stepId: step.id,
        completed: false,
        skipped: false,
        score: 0,
        maxScore: step.maxScore,
        attempts: 0,
        timeSpent: 0,
        feedbacks: [],
        startTimestamp: 0
      }
    })
    return result
  }

  const currentStep = computed<StepDefinition<TStepId> | null>(() => {
    if (currentStepIndex.value >= steps.length) return null
    return steps[currentStepIndex.value]
  })

  const currentStepId = computed<TStepId | null>(() => {
    return currentStep.value?.id || null
  })

  const currentStepResult = computed<StepResult | null>(() => {
    if (!currentStepId.value) return null
    return stepResults.value[currentStepId.value] || null
  })

  const isFirstStep = computed(() => currentStepIndex.value === 0)
  const isLastStep = computed(() => currentStepIndex.value === steps.length - 1)

  const totalScore = computed(() => {
    return Object.values(stepResults.value).reduce((sum, r) => sum + r.score, 0)
  })

  const maxScore = computed(() => {
    return steps.reduce((sum, s) => sum + s.maxScore, 0)
  })

  const completedSteps = computed(() => {
    return Object.values(stepResults.value).filter(r => r.completed).length
  })

  const skippedCount = computed(() => {
    return Object.values(stepResults.value).filter(r => r.skipped).length
  })

  function goToStep(index: number): boolean {
    if (index < 0 || index >= steps.length) return false
    currentStepIndex.value = index
    startCurrentStep()
    return true
  }

  function goToStepById(stepId: TStepId): boolean {
    const index = steps.findIndex(s => s.id === stepId)
    if (index === -1) return false
    return goToStep(index)
  }

  function goToNextStep(): boolean {
    if (currentStepIndex.value < steps.length - 1) {
      currentStepIndex.value++
      startCurrentStep()
      return true
    }
    return false
  }

  function goToPrevStep(): boolean {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
      return true
    }
    return false
  }

  function startCurrentStep() {
    if (!currentStepId.value) return
    const result = stepResults.value[currentStepId.value]
    if (result && !result.startTimestamp) {
      result.startTimestamp = Date.now()
    }
  }

  function completeStep(score: number, skipped: boolean = false): boolean {
    if (!currentStepId.value || !currentStep.value) return false

    const stepId = currentStepId.value
    const step = currentStep.value
    const result = stepResults.value[stepId]

    if (!result) return false

    result.completed = true
    result.skipped = skipped
    result.score = Math.max(0, Math.min(step.maxScore, score))
    result.attempts = result.attempts + 1
    result.timeSpent = Date.now() - result.startTimestamp
    result.endTimestamp = Date.now()

    if (skipped) {
      onStepSkip?.(stepId as TStepId, result)
    } else {
      onStepComplete?.(stepId as TStepId, result)
    }

    if (autoAdvance || step.autoAdvance) {
      setTimeout(() => goToNextStep(), 500)
    }

    return true
  }

  function skipStep(): boolean {
    if (!currentStep.value || !currentStep.value.allowedSkip) return false

    const penalty = currentStep.value.skipPenalty
    const success = completeStep(0, true)

    if (success && currentStepResult.value) {
      currentStepResult.value.score = -penalty
    }

    return success
  }

  function getStepResult(stepId: string): StepResult | null {
    return stepResults.value[stepId] || null
  }

  function setStepScore(stepId: string, score: number) {
    const result = stepResults.value[stepId]
    if (result) {
      const step = steps.find(s => s.id === stepId)
      result.score = step ? Math.max(0, Math.min(step.maxScore, score)) : score
    }
  }

  function addAttempt(stepId: string) {
    const result = stepResults.value[stepId]
    if (result) {
      result.attempts++
    }
  }

  function addFeedback(stepId: string, feedback: any) {
    const result = stepResults.value[stepId]
    if (result) {
      result.feedbacks.push(feedback)
    }
  }

  function resetSteps() {
    currentStepIndex.value = 0
    stepResults.value = createEmptyResults()
  }

  function isStepCompleted(stepId: string): boolean {
    return stepResults.value[stepId]?.completed || false
  }

  return {
    steps,
    currentStepIndex,
    stepResults,

    currentStep,
    currentStepId,
    currentStepResult,
    isFirstStep,
    isLastStep,
    totalScore,
    maxScore,
    completedSteps,
    skippedCount,

    goToStep,
    goToStepById,
    goToNextStep,
    goToPrevStep,
    completeStep,
    skipStep,
    getStepResult,
    setStepScore,
    addAttempt,
    addFeedback,
    resetSteps,
    isStepCompleted,
    startCurrentStep
  }
}
