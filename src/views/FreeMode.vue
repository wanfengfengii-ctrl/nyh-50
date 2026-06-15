<template>
  <div class="free-mode-page">
    <div class="page-header">
      <h2 class="page-title">自由练习模式</h2>
      <p class="page-desc">自由选择药材和砝码，练习传统药秤的使用方法</p>
    </div>

    <div class="main-content">
      <div class="left-panel">
        <WeightPanel @drag-start="handleDragStart" @drag-end="handleDragEnd" />
      </div>

      <div class="center-panel">
        <ScaleSimulation />
        <div class="tips">
          <n-alert type="info" :show-icon="true">
            <template #default>
              提示：点击左侧砝码可添加或移除，通过调整药材数量使秤杆达到平衡。
            </template>
          </n-alert>
        </div>
      </div>

      <div class="right-panel">
        <HerbPanel />
        <ControlPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { useGameStore } from '@/stores/game'
import ScaleSimulation from '@/components/ScaleSimulation.vue'
import WeightPanel from '@/components/WeightPanel.vue'
import HerbPanel from '@/components/HerbPanel.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import type { Weight } from '@/types'

const scaleStore = useScaleStore()
const gameStore = useGameStore()

function handleDragStart(weight: Weight) {
  console.log('Drag started:', weight.name)
}

function handleDragEnd() {
  console.log('Drag ended')
}

onMounted(() => {
  if (gameStore.pendingPractice) {
    const state = gameStore.pendingPractice
    scaleStore.reset()
    scaleStore.setTargetWeight(state.targetWeight)
    scaleStore.currentHerb = state.herb
    gameStore.pendingPractice = null
  } else {
    scaleStore.reset()
  }
})
</script>

<style scoped>
.free-mode-page {
  min-height: 100%;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  color: #4A2C17;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.page-desc {
  font-size: 14px;
  color: #8B7355;
  margin: 0;
}

.main-content {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
}

.left-panel {
  width: 260px;
  flex-shrink: 0;
}

.center-panel {
  flex: 0 0 auto;
}

.right-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tips {
  margin-top: 16px;
}
</style>
