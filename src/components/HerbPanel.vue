<template>
  <div class="herb-panel">
    <h3 class="panel-title">药材称量</h3>

    <div class="herb-select">
      <label class="field-label">选择药材</label>
      <n-select
        v-model:value="selectedHerbId"
        :options="herbOptions"
        size="medium"
        @update:value="handleHerbChange"
      />
    </div>

    <div class="herb-info">
      <span class="info-label">单味重量：</span>
      <span class="info-value">{{ currentHerb.unitWeight }} 钱</span>
    </div>

    <div class="count-control">
      <label class="field-label">药材数量</label>
      <div class="count-wrapper">
        <n-button
          circle
          size="medium"
          type="default"
          @click="decreaseCount"
          :disabled="herbCount <= 0"
        >
          -
        </n-button>
        <n-input-number
          v-model:value="herbCountNum"
          size="medium"
          :min="0"
          :max="999"
          class="count-input"
          @update:value="handleCountChange"
        />
        <n-button
          circle
          size="medium"
          type="default"
          @click="increaseCount"
        >
          +
        </n-button>
      </div>
    </div>

    <div class="weight-display">
      <span class="display-label">当前药材总重：</span>
      <span class="display-value">{{ totalWeight.toFixed(2) }} 钱</span>
    </div>

    <div class="target-section">
      <label class="field-label">目标重量</label>
      <n-input-number
        v-model:value="targetWeightNum"
        size="medium"
        :min="0.1"
        :max="100"
        :step="0.1"
        class="target-input"
        @update:value="handleTargetChange"
      />
      <span class="unit">钱</span>
    </div>

    <div class="error-display" :class="errorClass">
      <div class="error-label">误差</div>
      <div class="error-value">{{ errorDisplay }}</div>
      <div class="error-percent">{{ errorPercentDisplay }}</div>
    </div>

    <div class="balance-status" :class="{ balanced: isBalanced }">
      <n-icon size="20" :component="isBalanced ? CheckmarkCircleOutline : AlertCircleOutline" />
      <span>{{ isBalanced ? '秤杆平衡！' : '未达到平衡' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useScaleStore } from '@/stores/scale'
import { HERBS } from '@/constants'
import { CheckmarkCircleOutline, AlertCircleOutline } from '@vicons/ionicons5'

const scaleStore = useScaleStore()

const selectedHerbId = ref(scaleStore.currentHerb.id)
const herbCountNum = ref(scaleStore.herbCount)
const targetWeightNum = ref(scaleStore.targetWeight)

const herbOptions = HERBS.map(h => ({
  label: h.name,
  value: h.id
}))

const currentHerb = computed(() => {
  return HERBS.find(h => h.id === selectedHerbId.value) || HERBS[0]
})

const herbCount = computed(() => scaleStore.herbCount)
const totalWeight = computed(() => scaleStore.rightWeight)
const isBalanced = computed(() => scaleStore.isBalanced)

const errorDisplay = computed(() => {
  const err = scaleStore.error
  const sign = err > 0 ? '+' : ''
  return `${sign}${err.toFixed(2)} 钱`
})

const errorPercentDisplay = computed(() => {
  return `(${scaleStore.errorPercentage.toFixed(1)}%)`
})

const errorClass = computed(() => {
  const percent = scaleStore.errorPercentage
  if (percent <= 1) return 'error-good'
  if (percent <= 5) return 'error-warning'
  return 'error-bad'
})

function handleHerbChange() {
  const herb = HERBS.find(h => h.id === selectedHerbId.value)
  if (herb) {
    scaleStore.setCurrentHerb(herb)
  }
}

function handleCountChange(value: number | null) {
  if (value !== null && value >= 0) {
    scaleStore.setHerbCount(Math.floor(value))
  }
}

function handleTargetChange(value: number | null) {
  if (value !== null && value > 0) {
    scaleStore.setTargetWeight(value)
  }
}

function increaseCount() {
  scaleStore.setHerbCount(scaleStore.herbCount + 1)
}

function decreaseCount() {
  if (scaleStore.herbCount > 0) {
    scaleStore.setHerbCount(scaleStore.herbCount - 1)
  }
}

watch(() => scaleStore.herbCount, (val) => {
  herbCountNum.value = val
})

watch(() => scaleStore.targetWeight, (val) => {
  targetWeightNum.value = val
})
</script>

<style scoped>
.herb-panel {
  background: #F5FFFA;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(85, 107, 47, 0.1);
  border: 2px solid #90EE90;
}

.panel-title {
  font-size: 18px;
  color: #2E8B57;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.field-label {
  display: block;
  font-size: 13px;
  color: #556B2F;
  margin-bottom: 8px;
  font-weight: 500;
}

.herb-select {
  margin-bottom: 16px;
}

.herb-info {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #F0FFF0;
  border-radius: 8px;
  margin-bottom: 16px;
}

.info-label {
  font-size: 13px;
  color: #6B8E23;
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: #2E8B57;
  margin-left: auto;
}

.count-control {
  margin-bottom: 16px;
}

.count-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.count-input {
  flex: 1;
  min-width: 80px;
}

.weight-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #E8F5E9;
  border-radius: 8px;
  margin-bottom: 16px;
}

.display-label {
  font-size: 13px;
  color: #556B2F;
}

.display-value {
  font-size: 18px;
  font-weight: bold;
  color: #2E8B57;
}

.target-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.target-section .field-label {
  margin-bottom: 0;
  flex-shrink: 0;
}

.target-input {
  flex: 1;
  min-width: 80px;
}

.unit {
  font-size: 13px;
  color: #556B2F;
  flex-shrink: 0;
}

.error-display {
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 12px;
}

.error-good {
  background: #E8F5E9;
  border: 1px solid #90EE90;
}

.error-warning {
  background: #FFF8DC;
  border: 1px solid #F0E68C;
}

.error-bad {
  background: #FFF0F5;
  border: 1px solid #FFB6C1;
}

.error-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.error-good .error-label {
  color: #2E8B57;
}

.error-warning .error-label {
  color: #B8860B;
}

.error-bad .error-label {
  color: #CD5C5C;
}

.error-value {
  font-size: 20px;
  font-weight: bold;
}

.error-good .error-value {
  color: #2E8B57;
}

.error-warning .error-value {
  color: #DAA520;
}

.error-bad .error-value {
  color: #DC143C;
}

.error-percent {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.balance-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: #F5F5F5;
  color: #999;
  font-size: 14px;
  font-weight: 500;
}

.balance-status.balanced {
  background: #E8F5E9;
  color: #2E8B57;
}
</style>
