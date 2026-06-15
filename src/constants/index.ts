import type { 
  Weight, 
  Herb, 
  ChallengeQuestion, 
  Prescription,
  MentorStep,
  MentorDifficulty,
  MentorHerbQuestion,
  ApprenticeAchievement,
  ApprendiceSkillRecord
} from '@/types'

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

export const MENTOR_STEPS: MentorStep[] = [
  {
    id: 'select_prescription',
    title: '第一步：选择处方',
    instruction: '请根据难度等级选择一张适合的处方，仔细阅读处方说明和药材组成。',
    hint: '新手推荐从"当归补血汤"开始，只有两味药材，适合入门练习。',
    maxScore: 50,
    allowedSkip: false,
    skipPenalty: 0,
    minCompletionScore: 50,
    autoAdvance: true
  },
  {
    id: 'identify_herb',
    title: '第二步：识别药材',
    instruction: '仔细观察当前药材的名称、颜色、单味重量和目标重量，回答药材识别问题。',
    hint: '注意观察药材的颜色特征和单位重量，这对后续称量很重要。',
    maxScore: 100,
    allowedSkip: true,
    skipPenalty: 30,
    minCompletionScore: 60,
    autoAdvance: true
  },
  {
    id: 'select_weights',
    title: '第三步：选择砝码',
    instruction: '根据目标重量，从砝码库中选择合适的砝码组合放到左侧砝码盘。',
    hint: '优先使用大砝码，再用小砝码调整。比如7钱可以用5钱+2钱。',
    maxScore: 150,
    allowedSkip: true,
    skipPenalty: 50,
    minCompletionScore: 80,
    autoAdvance: false
  },
  {
    id: 'adjust_herb_count',
    title: '第四步：调整药量',
    instruction: '增减右侧药材数量，使药材总重量尽量接近左侧砝码总重量。',
    hint: '观察秤杆的倾斜方向，左侧重则加药，右侧重则减药。',
    maxScore: 150,
    allowedSkip: true,
    skipPenalty: 50,
    minCompletionScore: 80,
    autoAdvance: false
  },
  {
    id: 'judge_balance',
    title: '第五步：判断平衡',
    instruction: '观察秤杆状态，判断当前天平是否已经达到平衡状态（误差在允许范围内）。',
    hint: '误差小于允许值即为平衡，不要追求绝对完美，传统称量讲究"适中即可"。',
    maxScore: 100,
    allowedSkip: true,
    skipPenalty: 30,
    minCompletionScore: 60,
    autoAdvance: true
  },
  {
    id: 'submit_result',
    title: '第六步：提交结果',
    instruction: '确认操作无误后，提交当前药材的称量结果，系统会进行综合评分。',
    hint: '提交后无法修改，请仔细检查砝码组合和药材数量再确认。',
    maxScore: 50,
    allowedSkip: false,
    skipPenalty: 0,
    minCompletionScore: 50,
    autoAdvance: false
  }
]

export const MENTOR_DIFFICULTY_CONFIG: Record<MentorDifficulty, {
  label: string
  description: string
  unlockLevel: number
  timeMultiplier: number
  errorMultiplier: number
  scoreMultiplier: number
  xpMultiplier: number
  color: string
}> = {
  beginner: {
    label: '入门学徒',
    description: '适合完全新手，时间充裕，允许误差大，有详细提示',
    unlockLevel: 0,
    timeMultiplier: 2.0,
    errorMultiplier: 1.5,
    scoreMultiplier: 1.0,
    xpMultiplier: 1.0,
    color: '#2E8B57'
  },
  intermediate: {
    label: '药剂学徒',
    description: '适合有基础者，标准时间和误差，需要一定熟练度',
    unlockLevel: 5,
    timeMultiplier: 1.3,
    errorMultiplier: 1.0,
    scoreMultiplier: 1.3,
    xpMultiplier: 1.5,
    color: '#4169E1'
  },
  advanced: {
    label: '坐堂郎中',
    description: '适合熟练者，时间紧张，误差要求高，无额外提示',
    unlockLevel: 15,
    timeMultiplier: 1.0,
    errorMultiplier: 0.7,
    scoreMultiplier: 1.6,
    xpMultiplier: 2.0,
    color: '#8B4513'
  },
  expert: {
    label: '国医圣手',
    description: '大师级挑战，时间极短，误差极小，考验真功夫',
    unlockLevel: 30,
    timeMultiplier: 0.7,
    errorMultiplier: 0.5,
    scoreMultiplier: 2.0,
    xpMultiplier: 3.0,
    color: '#B8860B'
  }
}

export const MENTOR_HERB_QUESTIONS: Record<string, MentorHerbQuestion[]> = {
  p1h1: [{
    herbId: 'h1',
    herbName: '当归',
    color: '#8B7355',
    unitWeight: 0.5,
    targetWeight: 8,
    allowedError: 0.2,
    description: '当归为伞形科植物当归的干燥根，味甘、辛，性温。归肝、心、脾经。',
    question: '处方中要求称量当归8钱，单味当归约重0.5钱，请问大约需要多少味当归？',
    options: ['约8味', '约12味', '约16味', '约20味'],
    correctOptionIndex: 2,
    correctWeightCombination: [
      { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' },
      { id: 'w2', weight: 2, name: '2钱', color: '#D2691E' },
      { id: 'w1', weight: 1, name: '1钱', color: '#CD853F' }
    ]
  }],
  p1h2: [{
    herbId: 'h2',
    herbName: '黄芪',
    color: '#D4A574',
    unitWeight: 0.3,
    targetWeight: 15,
    allowedError: 0.3,
    description: '黄芪为豆科植物蒙古黄芪的干燥根，味甘，性微温。归脾、肺经。',
    question: '处方中要求称量黄芪15钱，单味黄芪约重0.3钱，请问大约需要多少味黄芪？',
    options: ['约25味', '约35味', '约50味', '约60味'],
    correctOptionIndex: 2,
    correctWeightCombination: [
      { id: 'w4', weight: 10, name: '1两', color: '#A0522D' },
      { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' }
    ]
  }],
  p2h1: [{
    herbId: 'h3',
    herbName: '人参',
    color: '#F5DEB3',
    unitWeight: 1,
    targetWeight: 10,
    allowedError: 0.2,
    description: '人参为五加科植物人参的干燥根和根茎，味甘、微苦，性微温。',
    question: '处方中要求称量人参10钱，单味人参约重1钱，请问最佳砝码组合是什么？',
    options: ['10个1钱砝码', '2个5钱砝码', '1个1两(10钱)砝码', '5钱+2钱+2钱+1钱'],
    correctOptionIndex: 2,
    correctWeightCombination: [
      { id: 'w4', weight: 10, name: '1两', color: '#A0522D' }
    ]
  }],
  p2h2: [{
    herbId: 'h2',
    herbName: '黄芪',
    color: '#D4A574',
    unitWeight: 0.3,
    targetWeight: 12,
    allowedError: 0.2,
    description: '黄芪补气升阳，固表止汗，利水消肿，为补气要药。',
    question: '称量黄芪12钱，以下哪个砝码组合最准确高效？',
    options: ['1两+1钱+1钱', '5钱+5钱+2钱', '1两+2钱', '2两(减去部分)'],
    correctOptionIndex: 2,
    correctWeightCombination: [
      { id: 'w4', weight: 10, name: '1两', color: '#A0522D' },
      { id: 'w2', weight: 2, name: '2钱', color: '#D2691E' }
    ]
  }],
  p2h3: [{
    herbId: 'h5',
    herbName: '甘草',
    color: '#DAA520',
    unitWeight: 0.2,
    targetWeight: 6,
    allowedError: 0.15,
    description: '甘草为豆科植物甘草的干燥根和根茎，味甘，性平。补脾益气，调和诸药。',
    question: '甘草在方剂中常作为使药，其作用是什么？',
    options: ['清热解毒', '补脾益气', '调和诸药、缓和药性', '缓急止痛'],
    correctOptionIndex: 2,
    correctWeightCombination: [
      { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' },
      { id: 'w1', weight: 1, name: '1钱', color: '#CD853F' }
    ]
  }],
  p3h1: [{
    herbId: 'h4',
    herbName: '枸杞',
    color: '#DC143C',
    unitWeight: 0.1,
    targetWeight: 7,
    allowedError: 0.15,
    description: '枸杞为茄科植物宁夏枸杞的干燥成熟果实，味甘，性平。滋补肝肾，益精明目。',
    question: '枸杞颜色红润，粒小体轻，单味约0.1钱。要称7钱枸杞约需多少粒？',
    options: ['约35粒', '约50粒', '约70粒', '约100粒'],
    correctOptionIndex: 2,
    correctWeightCombination: [
      { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' },
      { id: 'w2', weight: 2, name: '2钱', color: '#D2691E' }
    ]
  }],
  p3h2: [{
    herbId: 'h1',
    herbName: '当归',
    color: '#8B7355',
    unitWeight: 0.5,
    targetWeight: 12,
    allowedError: 0.2,
    description: '当归补血活血，调经止痛，润肠通便，被誉为"血中圣药"。',
    question: '当归身偏于补血，当归尾偏于活血，全当归的功效是什么？',
    options: ['补血为主', '活血为主', '补血活血、和血调经', '润肠通便'],
    correctOptionIndex: 2,
    correctWeightCombination: [
      { id: 'w4', weight: 10, name: '1两', color: '#A0522D' },
      { id: 'w2', weight: 2, name: '2钱', color: '#D2691E' }
    ]
  }],
  p3h3: [{
    herbId: 'h5',
    herbName: '甘草',
    color: '#DAA520',
    unitWeight: 0.2,
    targetWeight: 5,
    allowedError: 0.15,
    description: '甘草被誉为"国老"，能调和百药，使方剂更加和谐。',
    question: '称取5钱甘草，以下哪个砝码组合最佳？',
    options: ['5个1钱', '1个5钱砝码', '2钱+2钱+1钱', '1两减5钱'],
    correctOptionIndex: 1,
    correctWeightCombination: [
      { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' }
    ]
  }],
  p3h4: [{
    herbId: 'h3',
    herbName: '人参',
    color: '#F5DEB3',
    unitWeight: 1,
    targetWeight: 8,
    allowedError: 0.2,
    description: '人参大补元气，复脉固脱，补脾益肺，生津养血，安神益智。',
    question: '野生人参称为"野山参"，园参经过特殊加工后称为"红参"，红参的特点是什么？',
    options: ['药性偏凉，滋阴降火', '药性偏温，补气力强，适合阳虚者', '性平，健脾益气', '味苦，清热解毒'],
    correctOptionIndex: 1,
    correctWeightCombination: [
      { id: 'w3', weight: 5, name: '5钱', color: '#8B4513' },
      { id: 'w2', weight: 2, name: '2钱', color: '#D2691E' },
      { id: 'w1', weight: 1, name: '1钱', color: '#CD853F' }
    ]
  }]
}

export const INITIAL_SKILLS: ApprendiceSkillRecord[] = [
  {
    id: 'herb_identification',
    name: '药材辨识',
    level: 0,
    maxLevel: 10,
    xp: 0,
    nextLevelXP: 100,
    description: '识别药材名称、性状、功效的能力',
    icon: '📖'
  },
  {
    id: 'weight_selection',
    name: '砝码选配',
    level: 0,
    maxLevel: 10,
    xp: 0,
    nextLevelXP: 100,
    description: '快速选择最优砝码组合的能力',
    icon: '⚖️'
  },
  {
    id: 'balance_judgment',
    name: '平衡判断',
    level: 0,
    maxLevel: 10,
    xp: 0,
    nextLevelXP: 100,
    description: '准确判断天平平衡状态的能力',
    icon: '🎯'
  },
  {
    id: 'dosage_precision',
    name: '剂量精准',
    level: 0,
    maxLevel: 10,
    xp: 0,
    nextLevelXP: 100,
    description: '精细控制药材数量和剂量的能力',
    icon: '🎯'
  },
  {
    id: 'speed_efficiency',
    name: '称量效率',
    level: 0,
    maxLevel: 10,
    xp: 0,
    nextLevelXP: 100,
    description: '快速完成称量操作的能力',
    icon: '⚡'
  },
  {
    id: 'knowledge_mastery',
    name: '方剂知识',
    level: 0,
    maxLevel: 10,
    xp: 0,
    nextLevelXP: 100,
    description: '对方剂组成、功效、配伍的理解',
    icon: '📚'
  }
]

export const INITIAL_ACHIEVEMENTS: ApprenticeAchievement[] = [
  {
    id: 'first_prescription',
    name: '初入药行',
    description: '完成第一张处方的学习',
    icon: '🌱',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'perfect_herb',
    name: '分毫不差',
    description: '单味药材称量误差为0，获得满分',
    icon: '💯',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'five_perfect',
    name: '精益求精',
    description: '累计完成5次满分称量',
    icon: '⭐',
    unlocked: false,
    maxProgress: 5,
    progress: 0
  },
  {
    id: 'herb_expert',
    name: '本草达人',
    description: '正确识别所有药材，无错误',
    icon: '🌿',
    unlocked: false,
    maxProgress: 5,
    progress: 0
  },
  {
    id: 'speed_demon',
    name: '眼明手快',
    description: '在规定时间一半内完成处方',
    icon: '⚡',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'no_skip',
    name: '脚踏实地',
    description: '完成一次无跳步的完整教学',
    icon: '👣',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'ten_sessions',
    name: '勤勉学徒',
    description: '累计完成10次教学课程',
    icon: '📚',
    unlocked: false,
    maxProgress: 10,
    progress: 0
  },
  {
    id: 'unlock_intermediate',
    name: '小有所成',
    description: '解锁"药剂学徒"难度',
    icon: '🔓',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'unlock_advanced',
    name: '登堂入室',
    description: '解锁"坐堂郎中"难度',
    icon: '🏆',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'unlock_expert',
    name: '国医圣手',
    description: '解锁"国医圣手"难度',
    icon: '👑',
    unlocked: false,
    maxProgress: 1,
    progress: 0
  },
  {
    id: 'all_prescriptions',
    name: '博览群方',
    description: '完成所有处方的学习',
    icon: '📜',
    unlocked: false,
    maxProgress: 3,
    progress: 0
  }
]

export const APPRENTICE_TITLES: { level: number; title: string }[] = [
  { level: 0, title: '草药门外汉' },
  { level: 3, title: '药铺小跑堂' },
  { level: 5, title: '入门小学徒' },
  { level: 10, title: '勤勉药剂徒' },
  { level: 15, title: '熟手抓药郎' },
  { level: 20, title: '坐堂小学医' },
  { level: 25, title: '杏林好郎中' },
  { level: 30, title: '名医之高徒' },
  { level: 40, title: '济世之名医' },
  { level: 50, title: '国医之圣手' }
]

export const XP_PER_LEVEL = 500
export const VOICE_ENABLED_DEFAULT = true
