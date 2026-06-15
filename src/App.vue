<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            <n-icon size="28" :component="ScaleOutline" />
          </div>
          <div class="logo-text">
            <h1 class="app-title">传统药秤训练台</h1>
            <p class="app-subtitle">传承中医药文化 · 掌握称量技艺</p>
          </div>
        </div>

        <nav class="app-nav">
          <n-button
            v-for="tab in tabs"
            :key="tab.path"
            :type="currentRoute === tab.path ? 'primary' : 'default'"
            :ghost="currentRoute !== tab.path"
            size="large"
            @click="goTo(tab.path)"
          >
            <template #icon>
              <n-icon :component="tab.icon" />
            </template>
            {{ tab.label }}
          </n-button>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <footer class="app-footer">
      <p>传统药秤砝码组合训练台 · 弘扬中医药文化</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ScaleOutline, 
  PlayOutline, 
  TrophyOutline, 
  BookOutline,
  CheckmarkCircleOutline,
  RefreshOutline
} from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()

const currentRoute = computed(() => route.path)

const tabs = [
  { path: '/free', label: '自由练习', icon: PlayOutline },
  { path: '/challenge', label: '限时挑战', icon: TrophyOutline },
  { path: '/prescription', label: '处方配伍', icon: RefreshOutline },
  { path: '/review', label: '错题复盘', icon: BookOutline },
  { path: '/prescription-review', label: '处方复盘', icon: CheckmarkCircleOutline }
]

function goTo(path: string) {
  router.push(path)
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #FFF8DC 0%, #FAEBD7 50%, #F5DEB3 100%);
}

.app-header {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%);
  box-shadow: 0 4px 20px rgba(139, 69, 19, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-icon {
  width: 52px;
  height: 52px;
  background: rgba(255, 248, 220, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF8DC;
  border: 2px solid rgba(255, 248, 220, 0.3);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 22px;
  color: #FFF8DC;
  margin: 0;
  font-weight: 700;
  letter-spacing: 1px;
}

.app-subtitle {
  font-size: 12px;
  color: rgba(255, 248, 220, 0.7);
  margin: 2px 0 0 0;
  letter-spacing: 0.5px;
}

.app-nav {
  display: flex;
  gap: 10px;
}

.app-nav :deep(.n-button) {
  font-weight: 500;
}

.app-main {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.app-footer {
  text-align: center;
  padding: 20px;
  color: #8B7355;
  font-size: 13px;
  border-top: 1px solid rgba(139, 69, 19, 0.1);
}

.app-footer p {
  margin: 0;
}
</style>
