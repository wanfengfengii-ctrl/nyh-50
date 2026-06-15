import type { Weight, Herb, ChallengeQuestion, Prescription } from '@/types'

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
      { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' },
      { id: 'w2', weight: 2, name: '2钱', color: '#D2691E' },
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
      { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' },
      { id: 'w2', weight: 2, name: '2钱', color: '#D2691E' }
    ]
  },
  {
    id: 4,
    targetWeight: 7,
    herbName: '枸杞',
    herbUnitWeight: 0.5,
    timeLimit: 60,
    bestSolution: [
      { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' },
      { id: 'w2', weight: 2, name: '2钱', color: '#D2691E' }
    ]
  },
  {
    id: 5,
    targetWeight: 50,
    herbName: '甘草',
    herbUnitWeight: 1,
    timeLimit: 150,
    bestSolution: [
      { id: 'w6', weight: 50, name: '5两', color: '#4A2C17' }
    ]
  }
]

export const PRESCRIPTIONS: Prescription[] = [
  {
    id: 1,
    name: '当归补血汤',
    description: '经典补血方剂，补气生血',
    timeLimit: 300,
    herbs: [
      {
        id: 'p1h1',
        herbId: 'h1',
        herbName: '当归',
        unitWeight: 0.5,
        color: '#8B7355',
        targetWeight: 8,
        allowedError: 0.2,
        completed: false,
        herbCount: 0,
        placedWeights: [],
        finalError: 0,
        score: 0
      },
      {
        id: 'p1h2',
        herbId: 'h2',
        herbName: '黄芪',
        unitWeight: 0.3,
        color: '#D4A574',
        targetWeight: 15,
        allowedError: 0.3,
        completed: false,
        herbCount: 0,
        placedWeights: [],
        finalError: 0,
        score: 0
      }
    ]
  },
  {
    id: 2,
    name: '四君子汤',
    description: '健脾益气基础方',
    timeLimit: 400,
    herbs: [
      {
        id: 'p2h1',
        herbId: 'h3',
        herbName: '人参',
        unitWeight: 1,
        color: '#F5DEB3',
        targetWeight: 10,
        allowedError: 0.2,
        completed: false,
        herbCount: 0,
        placedWeights: [],
        finalError: 0,
        score: 0
      },
      {
        id: 'p2h2',
        herbId: 'h2',
        herbName: '黄芪',
        unitWeight: 0.3,
        color: '#D4A574',
        targetWeight: 12,
        allowedError: 0.2,
        completed: false,
        herbCount: 0,
        placedWeights: [],
        finalError: 0,
        score: 0
      },
      {
        id: 'p2h3',
        herbId: 'h5',
        herbName: '甘草',
        unitWeight: 0.2,
        color: '#DAA520',
        targetWeight: 6,
        allowedError: 0.15,
        completed: false,
        herbCount: 0,
        placedWeights: [],
        finalError: 0,
        score: 0
      }
    ]
  },
  {
    id: 3,
    name: '杞菊地黄丸加减',
    description: '滋肾养肝明目方剂',
    timeLimit: 500,
    herbs: [
      {
        id: 'p3h1',
        herbId: 'h4',
        herbName: '枸杞',
        unitWeight: 0.1,
        color: '#DC143C',
        targetWeight: 7,
        allowedError: 0.15,
        completed: false,
        herbCount: 0,
        placedWeights: [],
        finalError: 0,
        score: 0
      },
      {
        id: 'p3h2',
        herbId: 'h1',
        herbName: '当归',
        unitWeight: 0.5,
        color: '#8B7355',
        targetWeight: 12,
        allowedError: 0.2,
        completed: false,
        herbCount: 0,
        placedWeights: [],
        finalError: 0,
        score: 0
      },
      {
        id: 'p3h3',
        herbId: 'h5',
        herbName: '甘草',
        unitWeight: 0.2,
        color: '#DAA520',
        targetWeight: 5,
        allowedError: 0.15,
        completed: false,
        herbCount: 0,
        placedWeights: [],
        finalError: 0,
        score: 0
      },
      {
        id: 'p3h4',
        herbId: 'h3',
        herbName: '人参',
        unitWeight: 1,
        color: '#F5DEB3',
        targetWeight: 8,
        allowedError: 0.2,
        completed: false,
        herbCount: 0,
        placedWeights: [],
        finalError: 0,
        score: 0
      }
    ]
  }
]

export const ALLOWED_ERROR = 0.1
export const SCALE_BEAM_LENGTH = 400
export const SCALE_PAN_WIDTH = 120
