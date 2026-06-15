<template>
  <div class="weight-panel">
    <h3 class="panel-title">砝码选择</h3>
    <p class="panel-tip">点击砝码添加到左侧砝码盘</p>
    <div class="weight-grid">
      <div
        v-for="weight in weights"
        :key="weight.id"
        class="weight-item"
        :class="{ disabled: isWeightPlaced(weight.id) }"
        :style="{ background: weight.color }"
        @click="handleWeightClick(weight)"
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
          :key="pw.id"
          class="placed-item"
          :style="{ background: pw.color }"
          @click="handleRemoveWeight(pw.id)"
        >
          <span>{{ pw.name }}</span>
          <span class="remove-icon">×</span>
        </div>
      </div>
      <div v-if="placedWeights.length > 0" class="placed-summary">
        <span>共 {{ placedWeights.length }} 个</span>
        <span class="summary-total">
          总重：<strong>{{ totalPlacedWeight.toFixed(1) }} 钱</strong>
        </span>
      </div>
    </div>

    <div class="tips-section">
      <n-alert type="info" :show-icon="true" size="small">
        <template #default>
          提示：砝码在各味药材之间独立使用，切换药材时砝码会自动还原。
        </template>
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePrescriptionStore } from '@/stores/prescription'
import { WEIGHTS } from '@/constants'
import type { Weight } from '@/types'

const prescriptionStore = usePrescriptionStore()
const weights = WEIGHTS

const placedWeights = computed(() => prescriptionStore.getPlacedWeights())

const totalPlacedWeight = computed(() => 
  placedWeights.value.reduce((sum, w) => sum + w.weight, 0)
)

function isWeightPlaced(id: string): boolean {
  return prescriptionStore.placedWeightIds.includes(id)
}

function handleWeightClick(weight: Weight) {
  if (isWeightPlaced(weight.id)) {
    prescriptionStore.removeWeight(weight.id)
  } else {
    prescriptionStore.addWeight(weight)
  }
}

function handleRemoveWeight(id: string) {
  prescriptionStore.removeWeight(id)
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
  margin-bottom: 12px;
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

.placed-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(139, 69, 19, 0.08);
  border-radius: 8px;
  font-size: 12px;
  color: #6B4423;
}

.summary-total strong {
  color: #8B4513;
  font-size: 14px;
}

.tips-section {
  margin-top: 16px;
}
</style>
