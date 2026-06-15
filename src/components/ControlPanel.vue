<template>
  <div class="control-panel">
    <div class="control-row">
      <n-button
        type="default"
        size="medium"
        :disabled="!canUndo"
        @click="handleUndo"
      >
        <template #icon>
          <n-icon :component="ArrowUndoOutline" />
        </template>
        撤销
      </n-button>
      <n-button
        type="default"
        size="medium"
        :disabled="!canRedo"
        @click="handleRedo"
      >
        <template #icon>
          <n-icon :component="ArrowRedoOutline" />
        </template>
        重做
      </n-button>
      <n-button
        type="warning"
        size="medium"
        @click="handleReset"
      >
        <template #icon>
          <n-icon :component="RefreshOutline" />
        </template>
        重置
      </n-button>
    </div>

    <div class="history-section">
      <div class="history-header">
        <span class="history-title">操作历史</span>
        <span class="history-count">共 {{ historyCount }} 步</span>
      </div>
      <div class="history-list" ref="historyListRef">
        <div
          v-for="(record, index) in history"
          :key="record.id"
          class="history-item"
          :class="{ 
            active: index === historyIndex,
            'max-error': isMaxErrorStep(index) 
          }"
          @click="jumpToStep(index)"
        >
          <div class="step-num">第 {{ index + 1 }} 步</div>
          <div class="step-desc">{{ record.description }}</div>
          <div class="step-error" :class="getErrorClass(record.error)">
            {{ formatError(record.error) }}
          </div>
          <div v-if="isMaxErrorStep(index)" class="max-error-badge">
            最大误差
          </div>
        </div>
        <div v-if="history.length === 0" class="empty-history">
          暂无操作记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { ArrowUndoOutline, ArrowRedoOutline, RefreshOutline } from '@vicons/ionicons5'

const props = defineProps<{
  showMaxError?: boolean
  maxErrorStepIndex?: number
}>()

const scaleStore = useScaleStore()
const historyListRef = ref<HTMLDivElement | null>(null)

const canUndo = computed(() => scaleStore.canUndo)
const canRedo = computed(() => scaleStore.canRedo)
const history = computed(() => scaleStore.history)
const historyIndex = computed(() => scaleStore.historyIndex)
const historyCount = computed(() => history.value.length)

const maxErrorStep = computed(() => {
  if (props.showMaxError && props.maxErrorStepIndex !== undefined) {
    return props.maxErrorStepIndex
  }
  return scaleStore.getMaxErrorStep()
})

function isMaxErrorStep(index: number): boolean {
  return props.showMaxError && index === maxErrorStep.value
}

function handleUndo() {
  scaleStore.undo()
}

function handleRedo() {
  scaleStore.redo()
}

function handleReset() {
  scaleStore.reset()
}

function jumpToStep(index: number) {
  while (scaleStore.historyIndex > index) {
    scaleStore.undo()
  }
  while (scaleStore.historyIndex < index) {
    scaleStore.redo()
  }
}

function formatError(error: number): string {
  const sign = error > 0 ? '+' : ''
  return `${sign}${error.toFixed(2)}`
}

function getErrorClass(error: number): string {
  const absError = Math.abs(error)
  if (absError <= 0.1) return 'error-good'
  if (absError <= 1) return 'error-warning'
  return 'error-bad'
}

watch(() => scaleStore.historyIndex, () => {
  nextTick(() => {
    if (historyListRef.value && historyIndex.value >= 0) {
      const items = historyListRef.value.querySelectorAll('.history-item')
      const currentItem = items[historyIndex.value]
      if (currentItem) {
        currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  })
})
</script>

<style scoped>
.control-panel {
  background: #F8F8FF;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #E6E6FA;
}

.control-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.control-row :deep(.n-button) {
  flex: 1;
}

.history-section {
  border-top: 1px solid #E6E6FA;
  padding-top: 12px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #483D8B;
}

.history-count {
  font-size: 12px;
  color: #9370DB;
}

.history-list {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: #F0F0F0;
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #C0C0C0;
  border-radius: 3px;
}

.history-item {
  position: relative;
  padding: 8px 10px;
  background: #FFF;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #EEE;
}

.history-item:hover {
  background: #F5F5FF;
  border-color: #DDA0DD;
}

.history-item.active {
  background: #E6E6FA;
  border-color: #9370DB;
}

.history-item.max-error {
  background: #FFF0F5;
  border-color: #FFB6C1;
}

.history-item.max-error.active {
  background: #FFE4E1;
  border-color: #F08080;
}

.step-num {
  font-size: 11px;
  color: #999;
  margin-bottom: 2px;
}

.history-item.active .step-num {
  color: #7B68EE;
  font-weight: 500;
}

.step-desc {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
}

.step-error {
  font-size: 12px;
  font-weight: 600;
}

.error-good {
  color: #2E8B57;
}

.error-warning {
  color: #DAA520;
}

.error-bad {
  color: #DC143C;
}

.max-error-badge {
  position: absolute;
  top: 4px;
  right: 8px;
  font-size: 10px;
  padding: 2px 6px;
  background: #FF6B6B;
  color: #FFF;
  border-radius: 10px;
  font-weight: 500;
}

.empty-history {
  text-align: center;
  padding: 20px;
  color: #BBB;
  font-size: 13px;
}
</style>
