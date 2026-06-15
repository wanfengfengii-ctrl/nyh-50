import type { Weight, Herb, ChallengeQuestion } from '@/types'

export const WEIGHTS: Weight[] = [
  { id: 'w1', weight: 1, name: '1钱', color: '#CD853F' },
  { id: 'w2', weight: 2, name: '2钱', color: '#D2691E' },
  { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' },
  { id: 'w4', weight: 10, name: '1两', color: '#A0522D' },
  { id: 'w5', weight: 20, name: '2两', color: '#6B4423' },
  { id: 'w6', weight: 50, name: '5两', color: '#4A2C17' }
]

export const HERBS: Herb[] = [
  { id: 'h1', name: '当归', unitWeight: 0.5, color: '#8B7355' },
  { id: 'h2', name: '黄芪', unitWeight: 0.3, color: '#D4A574' },
  { id: 'h3', name: '人参', unitWeight: 1, color: '#F5DEB3' },
  { id: 'h4', name: '枸杞', unitWeight: 0.1, color: '#DC143C' },
  { id: 'h5', name: '甘草', unitWeight: 0.2, color: '#DAA520' }
]

export const CHALLENGE_QUESTIONS: ChallengeQuestion[] = [
  {
    id: 1,
    targetWeight: 8,
    herbName: '当归',
    herbUnitWeight: 0.5,
    timeLimit: 60,
    bestSolution: [
      { id: 'w2', weight: 5, name: '5钱', color: '#8B4513' },
      { id: 'w3', weight: 2, name: '2钱', color: '#D2691E' },
      { id: 'w1', weight: 1, name: '1钱', color: '#CD853F' }
    ]
  },
  {
    id: 2,
    targetWeight: 15,
    herbName: '黄芪',
    herbUnitWeight: 0.3,
    timeLimit: 90,
    bestSolution: [
      { id: 'w4', weight: 10, name: '1两', color: '#A0522D' },
      { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' }
    ]
  },
  {
    id: 3,
    targetWeight: 27,
    herbName: '人参',
    herbUnitWeight: 1,
    timeLimit: 120,
    bestSolution: [
      { id: 'w5', weight: 20, name: '2两', color: '#6B4423' },
      { id: 'w4', weight: 5, name: '5钱', color: '#8B4513' },
      { id: 'w2', weight: 2, name: '2钱', color: '#D2691E' }
    ]
  },
  {
    id: 4,
    targetWeight: 3.7,
    herbName: '枸杞',
    herbUnitWeight: 0.1,
    timeLimit: 60,
    bestSolution: [
      { id: 'w3', weight: 2, name: '2钱', color: '#D2691E' },
      { id: 'w2', weight: 1, name: '1钱', color: '#CD853F' }
    ]
  },
  {
    id: 5,
    targetWeight: 42,
    herbName: '甘草',
    herbUnitWeight: 0.2,
    timeLimit: 150,
    bestSolution: [
      { id: 'w6', weight: 50, name: '5两', color: '#4A2C17' }
    ]
  }
]

export const ALLOWED_ERROR = 0.1
export const SCALE_BEAM_LENGTH = 400
export const SCALE_PAN_WIDTH = 120
