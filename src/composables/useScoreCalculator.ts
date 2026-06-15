export interface ScoreWeights {
  priorityJudgment?: number
  prescriptionSelection?: number
  weighingAccuracy?: number
  speedEfficiency?: number
}

export interface ScoreOptions {
  perfectThreshold?: number
  goodThreshold?: number
  maxScore?: number
}

export function calculateWeighingScore(
  error: number,
  targetWeight: number,
  allowedError: number,
  options: ScoreOptions = {}
): number {
  const { perfectThreshold = 0.1, maxScore = 100 } = options
  const absError = Math.abs(error)

  if (absError <= allowedError * perfectThreshold) {
    return maxScore
  }

  if (absError <= allowedError) {
    const errorRatio = absError / allowedError
    return Math.round(maxScore - errorRatio * 30)
  }

  if (targetWeight > 0) {
    const errorRatio = absError / targetWeight
    return Math.max(0, Math.round(maxScore * (1 - errorRatio * 2)))
  }

  return 0
}

export function calculateStepScore(
  isCorrect: boolean,
  maxScore: number,
  options: { partialRatio?: number } = {}
): number {
  const { partialRatio = 0.6 } = options
  return isCorrect ? maxScore : Math.round(maxScore * partialRatio)
}

export function calculateSpeedScore(
  timeUsed: number,
  totalTime: number,
  options: ScoreOptions = {}
): number {
  const { maxScore = 100 } = options

  if (totalTime <= 0) return maxScore

  const timeRatio = timeUsed / totalTime

  if (timeRatio < 0.5) return maxScore
  if (timeRatio < 0.8) return 80
  if (timeRatio < 1.0) return 60
  return 40
}

export function calculateWeightedScore(
  scores: Partial<Record<keyof ScoreWeights, number>>,
  weights: ScoreWeights
): number {
  let totalWeight = 0
  let weightedSum = 0

  for (const key of Object.keys(weights) as (keyof ScoreWeights)[]) {
    const weight = weights[key] || 0
    const score = scores[key] || 0
    if (weight > 0) {
      totalWeight += weight
      weightedSum += score * (weight / 100)
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum * (100 / totalWeight)) : 0
}

export function getRatingFromScore(
  scorePercentage: number,
  ratingConfig: Record<string, { minScore: number; label: string }>
): string {
  const sortedRatings = Object.entries(ratingConfig).sort(
    (a, b) => b[1].minScore - a[1].minScore
  )

  for (const [key, config] of sortedRatings) {
    if (scorePercentage >= config.minScore) {
      return key
    }
  }

  return sortedRatings[sortedRatings.length - 1]?.[0] || 'D'
}

export function calculateXP(
  scorePercentage: number,
  baseXP: number,
  multiplier: number = 1
): number {
  return Math.round((scorePercentage / 100) * baseXP * multiplier)
}

export function isPerfectWeighing(
  error: number,
  allowedError: number,
  perfectRatio: number = 0.1
): boolean {
  return Math.abs(error) <= allowedError * perfectRatio
}

export function useScoreCalculator() {
  return {
    calculateWeighingScore,
    calculateStepScore,
    calculateSpeedScore,
    calculateWeightedScore,
    getRatingFromScore,
    calculateXP,
    isPerfectWeighing
  }
}
