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

export type GameMode = 'free' | 'challenge' | 'review'

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
