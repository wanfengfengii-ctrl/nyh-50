<template>
  <div class="mentor-review-container">
    <div class="profile-section">
      <n-card class="profile-card" :bordered="false">
        <div class="profile-header">
          <div class="avatar-wrapper">
            <div class="avatar-circle">
              <span class="avatar-emoji">{{ profile.avatar }}</span>
            </div>
            <div class="level-badge">Lv.{{ profile.level }}</div>
          </div>
          <div class="profile-info">
            <div class="name-row">
              <h2 class="apprentice-name">{{ profile.name }}</h2>
              <n-tag :type="titleTagType" size="large" round>{{ profile.title }}</n-tag>
            </div>
            <div class="exp-section">
              <div class="exp-label">
                <span>经验值</span>
                <span class="exp-text">{{ profile.totalXP }} / {{ nextLevelXP }}</span>
              </div>
              <n-progress type="line" :percentage="expPercentage" :color="'#CD853F'" :rail-color="'#F5DEB3'" :height="10" />
            </div>
            <div class="stats-row">
              <div class="stat-item">
                <n-icon :component="CheckmarkCircleOutline" size="16" />
                <span>完成会话：{{ profile.completedSessions }}</span>
              </div>
              <div class="stat-item">
                <n-icon :component="TrophyOutline" size="16" />
                <span>平均得分：{{ avgScore }}%</span>
              </div>
              <div class="stat-item">
                <n-icon :component="TimeOutline" size="16" />
                <span>总用时：{{ formatTime(profile.totalTimeSpent) }}</span>
              </div>
            </div>
          </div>
          <div class="unlock-info">
            <n-alert type="info" :show-icon="true" class="unlock-alert">
              <template #header>当前解锁难度</template>
              <div class="unlock-list">
                <div v-for="diff in unlockedDifficulties" :key="diff.unlockLevel + '_u'" class="unlock-item unlocked">
                  <n-icon :component="CheckmarkCircleOutline" size="14" />
                  <span>{{ diff.label }}</span>
                </div>
                <div v-for="diff in lockedDifficulties" :key="diff.unlockLevel + '_l'" class="unlock-item locked">
                  <n-icon :component="SadOutline" size="14" />
                  <span>{{ diff.label }}（等级{{ diff.unlockLevel }}）</span>
                </div>
              </div>
            </n-alert>
          </div>
        </div>
      </n-card>
    </div>

    <div class="content-grid">
      <div class="left-column">
        <n-card title="技能熟练度" :bordered="false" class="skills-card">
          <template #header-extra>
            <n-tag size="small" type="info">共{{ profile.skills.length }}项技能</n-tag>
          </template>
          <div class="skills-list">
            <div v-for="(skill, idx) in profile.skills" :key="idx" class="skill-item">
              <div class="skill-header">
                <span class="skill-name">{{ skill.name }}</span>
                <span class="skill-level">Lv.{{ skill.level }} ({{ skill.xp }}/{{ skill.nextLevelXP }})</span>
              </div>
              <div class="skill-progress-row">
                <n-progress 
                  type="line" 
                  :percentage="getSkillPercentage(skill)" 
                  :color="getSkillColor(skill.level)"
                  :rail-color="'#F5F0E8'"
                  :height="8"
                  :show-indicator="false"
                />
                <div class="skill-bar">
                  <div v-for="i in 10" :key="i" 
                    class="skill-segment" 
                    :class="{ filled: i <= skill.level }">
                  </div>
                </div>
              </div>
              <div class="skill-desc">{{ skill.description }}</div>
            </div>
          </div>
        </n-card>

        <n-card title="成就墙" :bordered="false" class="achievements-card">
          <template #header-extra>
            <n-tag size="small" type="success">{{ unlockedAchievements.length }}/{{ profile.achievements.length }}</n-tag>
          </template>
          <div class="achievements-grid">
            <div v-for="achievement in profile.achievements" :key="achievement.id" 
              class="achievement-item" :class="{ unlocked: achievement.unlocked }">
              <div class="achievement-icon">
                <n-icon size="28" :component="getAchievementIcon(achievement.id)" />
              </div>
              <div class="achievement-info">
                <div class="achievement-name">{{ achievement.name }}</div>
                <div class="achievement-desc">{{ achievement.description }}</div>
                <div v-if="achievement.unlocked && achievement.unlockedAt" class="achievement-date">
                  解锁于 {{ formatDate(achievement.unlockedAt) }}
                </div>
                <div v-else class="achievement-progress">
                  进度：{{ achievement.progress || 0 }}/{{ achievement.maxProgress || 1 }}
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <div class="right-column">
        <n-card title="历史教学会话" :bordered="false" class="sessions-card">
          <template #header-extra>
            <n-button size="small" @click="clearSessions" :disabled="!sessions.length">
              <template #icon>
                <n-icon :component="RefreshOutline" />
              </template>
              清空记录
            </n-button>
          </template>
          
          <div v-if="!sessions.length" class="empty-state">
            <n-empty description="暂无历史会话记录" />
          </div>

          <div v-else class="sessions-list">
            <div v-for="(session, index) in sortedSessions" :key="index" 
              class="session-item" :class="{ active: selectedSessionIndex === index }"
              @click="selectSession(index)">
              <div class="session-header">
                <div class="session-title">
                  <n-tag :type="getDifficultyTagType(session.difficulty)" size="small" round>
                    {{ getDifficultyLabel(session.difficulty) }}
                  </n-tag>
                  <span class="prescription-name">{{ session.prescriptionName }}</span>
                </div>
                <div class="session-score" :class="getScoreClass(session.scorePercentage)">
                  {{ Math.round(session.scorePercentage) }}分
                </div>
              </div>
              <div class="session-meta">
                <span><n-icon :component="TimeOutline" size="12" /> {{ formatTime(session.totalTime) }}</span>
                <span><n-icon :component="TrophyOutline" size="12" /> +{{ session.xpEarned }} XP</span>
                <span><n-icon :component="TimeOutline" size="12" /> {{ formatDate(session.endTime) }}</span>
              </div>
              <div v-if="selectedSessionIndex === index" class="session-detail">
                <n-divider style="margin: 12px 0" />
                <div class="herb-results">
                  <div v-for="(herb, hIdx) in session.herbResults" :key="hIdx" class="herb-result-item">
                    <div class="herb-result-header">
                      <span class="herb-name">{{ herb.herbName }}（{{ herb.targetWeight }}g）</span>
                      <span class="herb-score">{{ herb.score }}分</span>
                    </div>
                    <div class="herb-breakdown">
                      <span v-for="(step, sIdx) in getStepResultsAsArray(herb.stepResults)" :key="sIdx" class="step-badge">
                        {{ getStepName(step.stepId) }}: {{ step.score }}/{{ step.maxScore }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="session.summary" class="session-summary">
                  <n-divider style="margin: 12px 0" />
                  <h4 class="summary-title">
                    <n-icon :component="BookOutline" size="16" /> 教学总结
                  </h4>
                  <div class="summary-section">
                    <n-tag type="success" size="small">亮点</n-tag>
                    <p>{{ session.summary.highlights.join('；') || '无' }}</p>
                  </div>
                  <div class="summary-section">
                    <n-tag type="warning" size="small">待改进</n-tag>
                    <p>{{ session.summary.weakPoints.join('；') || '无' }}</p>
                  </div>
                  <div class="summary-section">
                    <n-tag type="info" size="small">建议</n-tag>
                    <p>{{ session.summary.suggestions.join('；') || '无' }}</p>
                  </div>
                  <div class="summary-section">
                    <n-tag type="primary" size="small">评语</n-tag>
                    <p class="teacher-comment">「{{ session.summary.overallComment }}」</p>
                  </div>
                </div>
                <div class="session-actions">
                  <n-button type="primary" size="small" @click="goToMentor">
                    <template #icon>
                      <n-icon :component="PlayOutline" />
                    </template>
                    再次练习
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMentorStore } from '@/stores/mentor'
import { MENTOR_STEPS, MENTOR_DIFFICULTY_CONFIG } from '@/constants'
import { XP_PER_LEVEL } from '@/constants'
import type { MentorDifficulty, ApprendiceSkillRecord, MentorStepResult } from '@/types'
import {
  CheckmarkCircleOutline,
  TimeOutline,
  BookOutline,
  PlayOutline,
  TrophyOutline,
  ScaleOutline,
  AlertCircleOutline,
  SadOutline,
  RefreshOutline
} from '@vicons/ionicons5'
import {
  NCard, NTag, NProgress, NAlert, NEmpty, NDivider, NButton, NIcon
} from 'naive-ui'

const router = useRouter()
const mentorStore = useMentorStore()

const selectedSessionIndex = ref<number | null>(null)

const profile = computed(() => mentorStore.apprenticeProfile)
const sessions = computed(() => mentorStore.sessionHistory)
const sortedSessions = computed(() => [...sessions.value].sort((a, b) => 
  b.endTime - a.endTime
))

const nextLevelXP = computed(() => (profile.value.level + 1) * XP_PER_LEVEL)
const expPercentage = computed(() => {
  const current = profile.value.totalXP
  const prev = profile.value.level * XP_PER_LEVEL
  const next = nextLevelXP.value
  return Math.min(100, Math.max(0, ((current - prev) / (next - prev)) * 100))
})

const avgScore = computed(() => {
  if (!sessions.value.length) return 0
  const total = sessions.value.reduce((sum, s) => sum + s.scorePercentage, 0)
  return Math.round(total / sessions.value.length)
})

const unlockedDifficulties = computed(() => 
  Object.values(MENTOR_DIFFICULTY_CONFIG).filter(d => profile.value.level >= d.unlockLevel)
)
const lockedDifficulties = computed(() => 
  Object.values(MENTOR_DIFFICULTY_CONFIG).filter(d => profile.value.level < d.unlockLevel)
)

const unlockedAchievements = computed(() => 
  profile.value.achievements.filter(a => a.unlocked)
)

const titleTagType = computed(() => {
  const level = profile.value.level
  if (level >= 40) return 'success'
  if (level >= 20) return 'warning'
  if (level >= 10) return 'info'
  return 'default'
})

function selectSession(index: number) {
  selectedSessionIndex.value = selectedSessionIndex.value === index ? null : index
}

function getStepResultsAsArray(record: Record<string, MentorStepResult>): MentorStepResult[] {
  return Object.values(record)
}

function getSkillPercentage(skill: ApprendiceSkillRecord): number {
  return Math.min(100, (skill.xp / skill.nextLevelXP) * 100)
}

function getSkillColor(level: number): string {
  if (level >= 8) return '#22c55e'
  if (level >= 5) return '#f59e0b'
  if (level >= 3) return '#3b82f6'
  return '#8B4513'
}

function getDifficultyLabel(diff: MentorDifficulty): string {
  return MENTOR_DIFFICULTY_CONFIG[diff]?.label || diff
}

function getDifficultyTagType(diff: MentorDifficulty): 'default' | 'info' | 'warning' | 'error' | 'success' {
  switch (diff) {
    case 'beginner': return 'default'
    case 'intermediate': return 'info'
    case 'advanced': return 'warning'
    case 'expert': return 'error'
    default: return 'default'
  }
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

function getAchievementIcon(id: string) {
  const iconMap: Record<string, any> = {
    'first_prescription': RefreshOutline,
    'perfect_herb': CheckmarkCircleOutline,
    'high_accuracy': ScaleOutline,
    'no_skip': BookOutline,
    'fast_pace': TimeOutline,
    'full_session': TrophyOutline,
    'skill_master': AlertCircleOutline,
    'level_10': BookOutline,
    'level_30': TrophyOutline,
    'herb_expert': BookOutline,
    'balance_master': ScaleOutline
  }
  return iconMap[id] || CheckmarkCircleOutline
}

function formatTime(seconds: number): string {
  if (!seconds) return '0秒'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}时${m}分${s}秒`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function formatDate(dateNum: number): string {
  const d = new Date(dateNum)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getStepName(stepId: string): string {
  const step = MENTOR_STEPS.find(s => s.id === stepId)
  return step?.title || stepId
}

function clearSessions() {
  if (confirm('确定要清空所有历史会话记录吗？此操作不可恢复。')) {
    mentorStore.clearSessionHistory()
    selectedSessionIndex.value = null
  }
}

function goToMentor() {
  router.push('/mentor')
}
</script>

<style scoped>
.mentor-review-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-section .profile-card {
  background: linear-gradient(135deg, #FFFAF0 0%, #FFF8DC 100%);
}

.profile-header {
  display: grid;
  grid-template-columns: auto 1fr 320px;
  gap: 24px;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
}

.avatar-circle {
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #FFF;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
  overflow: hidden;
}

.avatar-emoji {
  font-size: 48px;
}

.level-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: linear-gradient(135deg, #CD853F, #8B4513);
  color: #FFF8DC;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid #FFF;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.apprentice-name {
  margin: 0;
  font-size: 24px;
  color: #5D4037;
  font-weight: 700;
}

.exp-section {
  margin-bottom: 12px;
}

.exp-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  color: #8B7355;
}

.exp-text {
  font-weight: 600;
  color: #8B4513;
}

.stats-row {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #8B7355;
}

.unlock-alert {
  background: rgba(255, 248, 220, 0.8);
}

.unlock-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.unlock-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.unlock-item.unlocked {
  color: #2e7d32;
}

.unlock-item.locked {
  color: #999;
  opacity: 0.7;
}

.content-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 20px;
}

.left-column, .right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skill-item {
  padding: 12px;
  background: #FFFAF0;
  border-radius: 10px;
  border: 1px solid rgba(139, 69, 19, 0.08);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.skill-name {
  font-weight: 600;
  color: #5D4037;
}

.skill-level {
  color: #8B7355;
  font-size: 12px;
}

.skill-progress-row {
  margin-bottom: 6px;
}

.skill-bar {
  display: flex;
  gap: 2px;
  margin-top: 6px;
}

.skill-segment {
  flex: 1;
  height: 4px;
  background: #EEE;
  border-radius: 2px;
}

.skill-segment.filled {
  background: linear-gradient(90deg, #CD853F, #8B4513);
}

.skill-desc {
  font-size: 12px;
  color: #A0896C;
  margin-top: 6px;
  line-height: 1.5;
}

.achievements-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.achievement-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: #FAFAFA;
  border: 1px solid #EEE;
  opacity: 0.6;
  filter: grayscale(0.6);
}

.achievement-item.unlocked {
  background: linear-gradient(135deg, #FFF9E6, #FFF3CC);
  border-color: #FFD700;
  opacity: 1;
  filter: none;
}

.achievement-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EFEFEF;
  border-radius: 10px;
  color: #999;
  flex-shrink: 0;
}

.achievement-item.unlocked .achievement-icon {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #FFF;
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  margin-bottom: 2px;
}

.achievement-desc {
  font-size: 12px;
  color: #777;
  line-height: 1.4;
  margin-bottom: 4px;
}

.achievement-date {
  font-size: 11px;
  color: #CD853F;
}

.achievement-progress {
  font-size: 11px;
  color: #999;
}

.empty-state {
  padding: 40px 0;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 700px;
  overflow-y: auto;
  padding-right: 4px;
}

.session-item {
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(139, 69, 19, 0.1);
  background: #FFFCF5;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  border-color: #CD853F;
  background: #FFF8DC;
}

.session-item.active {
  border-color: #8B4513;
  background: #FFF8DC;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.12);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.session-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.prescription-name {
  font-weight: 600;
  color: #5D4037;
  font-size: 15px;
}

.session-score {
  font-weight: 700;
  font-size: 18px;
  padding: 2px 10px;
  border-radius: 8px;
}

.session-score.excellent {
  background: #d4edda;
  color: #155724;
}

.session-score.good {
  background: #cce5ff;
  color: #004085;
}

.session-score.pass {
  background: #fff3cd;
  color: #856404;
}

.session-score.fail {
  background: #f8d7da;
  color: #721c24;
}

.session-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8B7355;
}

.session-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.herb-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.herb-result-item {
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.herb-result-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}

.herb-name {
  font-weight: 600;
  color: #5D4037;
}

.herb-score {
  font-weight: 600;
  color: #8B4513;
}

.herb-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.step-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: #F5F0E8;
  color: #8B7355;
  border-radius: 4px;
}

.session-summary {
  margin-top: 10px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #5D4037;
}

.summary-section {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.summary-section p {
  margin: 0;
  font-size: 13px;
  color: #5D4037;
  line-height: 1.6;
  flex: 1;
}

.teacher-comment {
  font-style: italic;
  color: #8B4513 !important;
  padding: 8px 12px;
  background: rgba(205, 133, 63, 0.1);
  border-left: 3px solid #CD853F;
  border-radius: 0 6px 6px 0;
}

.session-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-header {
    grid-template-columns: auto 1fr;
  }
  
  .unlock-info {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .mentor-review-container {
    padding: 16px;
  }
  
  .profile-header {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .avatar-wrapper {
    justify-self: center;
  }
  
  .stats-row {
    justify-content: center;
  }
}
</style>
