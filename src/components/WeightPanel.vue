<template>
  <div class="weight-panel">
    <h3 class="panel-title">砝码选择</h3>
    <p class="panel-tip">点击砝码添加到左侧砝码盘</p>
    <div class="weight-grid">
      <div
        v-for="weight in weights"
        :key="weight.id"
        class="weight-item"
        :class="{ 
          disabled: isWeightPlaced(weight.id),
          draggable: !isWeightPlaced(weight.id)
        }"
        :style="{ background: weight.color }"
        draggable="true"
        @click="handleWeightClick(weight)"
        @dragstart="handleDragStart($event, weight)"
        @dragend="handleDragEnd"
      >
        <span class="weight-name">{{ weight.name }}</span>
      </div>
    </div>

    <div class="placed-section">
      <h4 class="section-title">已放置砝码</h4>
      <div v-if="placedWeights.length === 0" class="empty-tip">
        暂无砝码
      </div>
      <div v-else class="placed-list">
        <div
          v-for="pw in placedWeights"
          :key="pw.weight.id"
          class="placed-item"
          :style="{ background: pw.weight.color }"
          @click="handleRemoveWeight(pw.weight.id)"
        >
          <span>{{ pw.weight.name }}</span>
          <span class="remove-icon">×</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { WEIGHTS } from '@/constants'
import type { Weight } from '@/types'

const emit = defineEmits<{
  (e: 'drag-start', weight: Weight): void
  (e: 'drag-end'): void
}>()

const scaleStore = useScaleStore()
const weights = WEIGHTS

const placedWeights = computed(() => scaleStore.placedWeights)

function isWeightPlaced(id: string): boolean {
  return scaleStore.placedWeightIds.includes(id)
}

function handleWeightClick(weight: Weight) {
  if (isWeightPlaced(weight.id)) {
    scaleStore.removeWeight(weight.id)
  } else {
    scaleStore.addWeight(weight, 'left')
  }
}

function handleRemoveWeight(id: string) {
  scaleStore.removeWeight(id)
}

function handleDragStart(event: DragEvent, weight: Weight) {
  if (isWeightPlaced(weight.id)) {
    event.preventDefault()
    return
  }
  if (event.dataTransfer) {
    event.dataTransfer.setData('weightId', weight.id)
    event.dataTransfer.effectAllowed = 'move'
  }
  emit('drag-start', weight)
}

function handleDragEnd() {
  emit('drag-end')
}
</script>

<style scoped>
.weight-panel {
  background: #FFF8DC;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(139, 69, 19, 0.1);
  border: 2px solid #DEB887;
}

.panel-title {
  font-size: 18px;
  color: #4A2C17;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.panel-tip {
  font-size: 12px;
  color: #8B7355;
  margin: 0 0 16px 0;
}

.weight-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.weight-item {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid #4A2C17;
  position: relative;
  user-select: none;
}

.weight-item:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.weight-item:active:not(.disabled) {
  transform: translateY(0);
}

.weight-item.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.weight-item.draggable {
  cursor: grab;
}

.weight-item.draggable:active {
  cursor: grabbing;
}

.weight-name {
  color: #FFF8DC;
  font-size: 13px;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.placed-section {
  border-top: 1px dashed #DEB887;
  padding-top: 16px;
}

.section-title {
  font-size: 14px;
  color: #6B4423;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.empty-tip {
  font-size: 12px;
  color: #B8860B;
  text-align: center;
  padding: 12px;
  background: #FAEBD7;
  border-radius: 6px;
}

.placed-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.placed-item {
  padding: 6px 12px;
  border-radius: 20px;
  color: #FFF8DC;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  border: 1px solid #4A2C17;
}

.placed-item:hover {
  opacity: 0.8;
}

.remove-icon {
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}
</style>
