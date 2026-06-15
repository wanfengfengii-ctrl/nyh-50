export interface Weight {
  id: string
  weight: number
  name: string
  color: string
}

export interface PlacedWeight {
  weight: Weight
  x: number
  y: number
  placedOn: 'left' | 'right'
}

export interface Herb {
  id: string
  name: string
  unitWeight: number
  color: string
}

export type GameMode = 'free' | 'challenge' | 'review' | 'prescription' | 'prescription-review'

export interface HistoryRecord {
  id: number
  timestamp: number
  type: 'add_weight' | 'remove_weight' | 'adjust_herb' | 'set_target'
  description: string
  leftWeight: number
  rightWeight: number
  error: number
  herbCount: number
  placedWeights: Weight[]
}

export interface ChallengeQuestion {
  id: number
  targetWeight: number
  herbName: string
  herbUnitWeight: number
  timeLimit: number
  bestSolution: Weight[]
}

export interface ReviewItem {
  question: ChallengeQuestion
  userAnswer: Weight[]
  herbCount: number
  maxError: number
  maxErrorStep: number
  history: HistoryRecord[]
  isCorrect: boolean
}

export interface PrescriptionHerb {
  id: string
  herbId: string
  herbName: string
  unitWeight: number
  color: string
  targetWeight: number
  allowedError: number
  completed: boolean
  herbCount: number
  placedWeights: Weight[]
  finalError: number
  score: number
}

export interface Prescription {
  id: number
  name: string
  description: string
  herbs: PrescriptionHerb[]
  timeLimit: number
}

export interface PrescriptionStepRecord {
  id: number
  timestamp: number
  herbId: string
  herbName: string
  type: 'add_weight' | 'remove_weight' | 'adjust_herb' | 'switch_herb' | 'complete_herb'
  description: string
  placedWeights: Weight[]
  herbCount: number
  leftWeight: number
  rightWeight: number
  error: number
  targetWeight: number
}

export interface PrescriptionResult {
  prescription: Prescription
  totalScore: number
  maxScore: number
  herbResults: {
    herb: PrescriptionHerb
    score: number
    finalError: number
    errorPercentage: number
    bestStepIndex: number
    worstStepIndex: number
    history: PrescriptionStepRecord[]
  }[]
  bestHerbIndex: number
  worstHerbIndex: number
  totalTimeUsed: number
  history: PrescriptionStepRecord[]
}

export interface PrescriptionReviewItem {
  result: PrescriptionResult
  herbKeySteps: Map<string, number>
}
