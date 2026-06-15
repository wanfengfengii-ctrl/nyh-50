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

export type GameMode = 'free' | 'challenge' | 'review' | 'prescription' | 'prescription-review' | 'mentor' | 'mentor-review' | 'clinic' | 'clinic-review'

export type UrgencyLevel = 'mild' | 'moderate' | 'severe' | 'critical'

export type ClinicPhase = 
  | 'select_order'
  | 'judge_priority'
  | 'select_prescription'
  | 'weighing'
  | 'submit'
  | 'result'

export type ClinicRating = 'S' | 'A' | 'B' | 'C' | 'D'

export interface Symptom {
  id: string
  name: string
  description: string
}

export interface ClinicOrder {
  id: string
  patientName: string
  patientAge: number
  patientGender: '男' | '女'
  symptoms: Symptom[]
  urgencyLevel: UrgencyLevel
  correctPriority: number
  correctPrescriptionId: number
  diseaseName: string
  prescriptionRequirement: string
  caseDescription: string
  timeLimit: number
  createdAt: number
}

export interface ClinicPriorityJudgment {
  selectedPriority: number | null
  isCorrect: boolean | null
  timeSpent: number
}

export interface ClinicPrescriptionSelection {
  selectedPrescriptionId: number | null
  isCorrect: boolean | null
  timeSpent: number
}

export interface ClinicHerbResult {
  herbId: string
  herbName: string
  targetWeight: number
  finalWeight: number
  finalError: number
  allowedError: number
  score: number
  isPerfect: boolean
  skipped: boolean
  timeSpent: number
}

export interface ClinicSessionResult {
  id: string
  order: ClinicOrder
  startTime: number
  endTime: number
  totalTime: number
  totalScore: number
  maxScore: number
  scorePercentage: number
  priorityJudgment: ClinicPriorityJudgment
  prescriptionSelection: ClinicPrescriptionSelection
  herbResults: ClinicHerbResult[]
  skippedCount: number
  perfectCount: number
  averageError: number
  rating: ClinicRating
  xpEarned: number
  skillsImproved: string[]
  caseReview: ClinicCaseReview
}

export interface ClinicCaseReview {
  summary: string
  correctDecision: string
  userDecision: string
  decisionAnalysis: string
  highlights: string[]
  weakPoints: string[]
  suggestions: string[]
  knowledgePoints: string[]
}

export interface ClinicHistoryRecord {
  id: string
  timestamp: number
  type: 'priority_judge' | 'prescription_select' | 'add_weight' | 'remove_weight' | 'adjust_herb' | 'switch_herb' | 'complete_herb' | 'submit'
  description: string
  details?: Record<string, any>
}

export type MentorStepType = 
  | 'select_prescription'
  | 'identify_herb'
  | 'select_weights'
  | 'adjust_herb_count'
  | 'judge_balance'
  | 'submit_result'

export type MentorDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type MentorFeedbackLevel = 'success' | 'warning' | 'error' | 'info'

export interface MentorStep {
  id: MentorStepType
  title: string
  instruction: string
  hint: string
  maxScore: number
  allowedSkip: boolean
  skipPenalty: number
  minCompletionScore: number
  autoAdvance?: boolean
}

export interface MentorStepResult {
  stepId: MentorStepType
  completed: boolean
  skipped: boolean
  score: number
  maxScore: number
  attempts: number
  timeSpent: number
  feedbacks: MentorFeedback[]
  startTimestamp: number
  endTimestamp?: number
}

export interface MentorFeedback {
  id: number
  timestamp: number
  level: MentorFeedbackLevel
  title: string
  message: string
  suggestion?: string
  relatedAction?: string
}

export interface MentorHerbQuestion {
  herbId: string
  herbName: string
  color: string
  unitWeight: number
  targetWeight: number
  allowedError: number
  description: string
  question: string
  options: string[]
  correctOptionIndex: number
  correctWeightCombination: Weight[]
}

export interface MentorBalanceQuestion {
  leftWeight: number
  rightWeight: number
  allowedError: number
  targetWeight: number
  question: string
  options: { label: string; value: 'over' | 'under' | 'balanced' }[]
  correctValue: 'over' | 'under' | 'balanced'
}

export interface ApprendiceSkillRecord {
  id: string
  name: string
  level: number
  maxLevel: number
  xp: number
  nextLevelXP: number
  description: string
  icon: string
}

export interface ApprenticeProfile {
  id: string
  name: string
  avatar: string
  totalXP: number
  level: number
  title: string
  unlockedDifficulties: MentorDifficulty[]
  completedSessions: number
  totalScore: number
  perfectSessions: number
  totalTimeSpent: number
  skills: ApprendiceSkillRecord[]
  achievements: ApprenticeAchievement[]
  unlockedPrescriptions: number[]
  createdAt: number
  lastActiveAt: number
}

export interface ApprenticeAchievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
  progress?: number
  maxProgress?: number
}

export interface MentorSessionResult {
  id: string
  prescriptionId: number
  prescriptionName: string
  difficulty: MentorDifficulty
  startTime: number
  endTime: number
  totalTime: number
  totalScore: number
  maxScore: number
  scorePercentage: number
  herbResults: MentorHerbResult[]
  stepResults: MentorStepResult[]
  allFeedbacks: MentorFeedback[]
  skippedCount: number
  errorCount: number
  xpEarned: number
  skillsImproved: string[]
  replayData: MentorReplayFrame[]
  summary: MentorSessionSummary
}

export interface MentorHerbResult {
  herbId: string
  herbName: string
  targetWeight: number
  finalWeight: number
  finalError: number
  allowedError: number
  placedWeights: Weight[]
  herbCount: number
  score: number
  isPerfect: boolean
  stepResults: Record<string, MentorStepResult>
}

export interface MentorReplayFrame {
  timestamp: number
  stepId: MentorStepType
  action: string
  placedWeights: Weight[]
  herbCount: number
  leftWeight: number
  rightWeight: number
  error: number
  currentHerbId?: string
  feedback?: MentorFeedback
}

export interface MentorSessionSummary {
  highlights: string[]
  weakPoints: string[]
  suggestions: string[]
  nextGoals: string[]
  difficultyRecommendation: MentorDifficulty
  overallComment: string
}

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

export interface WeighingState {
  placedWeights: Weight[]
  herbCount: number
  currentHerb: Herb | PrescriptionHerb | null
  targetWeight: number
  allowedError: number
  usedWeightIds: Set<string>
}

export interface WeighingComputed {
  leftWeight: number
  rightWeight: number
  error: number
  isBalanced: boolean
  errorPercentage: number
  placedWeightIds: string[]
  availableWeights: Weight[]
}

export interface WeighingActions {
  addWeight: (weight: Weight) => boolean
  removeWeight: (weightId: string) => boolean
  setHerbCount: (count: number) => boolean
  setCurrentHerb: (herb: Herb | PrescriptionHerb) => void
  setTargetWeight: (weight: number) => void
  setAllowedError: (error: number) => void
  markWeightsUsed: (weights: Weight[]) => void
  resetWeighing: () => void
}

export interface HistoryRecordBase {
  id: number | string
  timestamp: number
  type: string
  description: string
  leftWeight: number
  rightWeight: number
  error: number
  herbCount: number
  placedWeights: Weight[]
}

export interface StepFlowState<TStepId extends string = string> {
  currentStepIndex: number
  steps: StepDefinition<TStepId>[]
  stepResults: Record<TStepId, StepResult>
}

export interface StepDefinition<TStepId extends string = string> {
  id: TStepId
  title: string
  instruction: string
  hint?: string
  maxScore: number
  allowedSkip: boolean
  skipPenalty: number
  minCompletionScore: number
  autoAdvance?: boolean
}

export interface StepResult {
  stepId: string
  completed: boolean
  skipped: boolean
  score: number
  maxScore: number
  attempts: number
  timeSpent: number
  feedbacks: any[]
  startTimestamp: number
  endTimestamp?: number
}

export interface HerbWeighingResult {
  herbId: string
  herbName: string
  targetWeight: number
  finalWeight: number
  finalError: number
  allowedError: number
  placedWeights: Weight[]
  herbCount: number
  score: number
  isPerfect: boolean
  timeSpent: number
  completed: boolean
  skipped: boolean
}

export interface PersistenceOptions<T> {
  storageKey: string
  defaultValue: T
  serialize?: (value: T) => string
  deserialize?: (str: string) => T
}

export type TimerMode = 'countdown' | 'countup'

export interface TimerState {
  timeRemaining: number
  timeElapsed: number
  isRunning: boolean
  isPaused: boolean
  mode: TimerMode
  totalTime: number
}
