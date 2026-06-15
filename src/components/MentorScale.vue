<template>
  <div class="scale-container">
    <div class="canvas-wrapper">
      <svg viewBox="0 0 700 450" class="scale-svg">
        <defs>
          <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F5DEB3" />
            <stop offset="100%" stop-color="#DEB887" />
          </linearGradient>
        </defs>

        <rect x="250" y="280" width="200" height="30" rx="6" fill="#8B4513" />
        <rect x="340" y="100" width="20" height="180" rx="3" fill="#A0522D" />
        <circle cx="350" cy="100" r="10" fill="#DAA520" />

        <g :transform="beamTransform">
          <rect x="150" y="94" width="400" height="12" rx="4" fill="url(#beamGrad)" stroke="#8B4513" stroke-width="2" />

          <line x1="175" y1="100" x2="210" y2="200" stroke="#8B4513" stroke-width="2" />
          <line x1="175" y1="100" x2="290" y2="200" stroke="#8B4513" stroke-width="2" />

          <rect x="190" y="200" width="120" height="18" rx="4" fill="#D2B48C" stroke="#8B4513" stroke-width="2" />

          <g v-for="(pw, idx) in leftWeightVisual" :key="'lw'+idx">
            <rect
              :x="200 + (idx % 3) * 30 - 15"
              :y="185 - Math.floor(idx / 3) * 22 - pw.size"
              :width="pw.size"
              :height="pw.size * 0.8"
              rx="3"
              :fill="pw.color"
              stroke="#4A2C17"
              stroke-width="1.5"
            />
          </g>

          <line x1="525" y1="100" x2="410" y2="200" stroke="#8B4513" stroke-width="2" />
          <line x1="525" y1="100" x2="490" y2="200" stroke="#8B4513" stroke-width="2" />

          <rect x="390" y="200" width="120" height="18" rx="4" fill="#D2B48C" stroke="#8B4513" stroke-width="2" />

          <g v-for="(h, idx) in rightHerbVisual" :key="'rh'+idx">
            <circle
              :cx="410 + (idx % 4) * 22"
              :cy="190 - Math.floor(idx / 4) * 14 - h.size"
              :r="h.size / 2"
              :fill="herbColor"
              stroke="#654321"
              stroke-width="1"
            />
          </g>
        </g>
      </svg>
    </div>
    <div class="scale-info">
      <div class="side-info left">
        <span class="label">砝码盘</span>
        <span class="weight">{{ leftWeight.toFixed(1) }} 钱</span>
      </div>
      <div class="balance-indicator" :class="balanceClass">
        <div class="indicator-bar"></div>
        <span class="indicator-text">{{ balanceText }}</span>
      </div>
      <div class="side-info right">
        <span class="label">药材盘</span>
        <span class="weight">{{ rightWeight.toFixed(1) }} 钱</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMentorStore } from '@/stores/mentor'
import type { Weight } from '@/types'

const mentorStore = useMentorStore()

const leftWeight = computed(() => mentorStore.leftWeight)
const rightWeight = computed(() => mentorStore.rightWeight)
const currentHerb = computed(() => mentorStore.currentHerb)
const isBalanced = computed(() => mentorStore.isCurrentBalanced)

const herbColor = computed(() => currentHerb.value?.color || '#8B7355')

const beamAngle = computed(() => {
  if (!currentHerb.value) return 0
  const diff = leftWeight.value - rightWeight.value
  const allowed = currentHerb.value.allowedError
  if (Math.abs(diff) <= allowed) return 0
  const maxAngle = 12
  const angle = (diff / 30) * maxAngle
  return Math.max(-maxAngle, Math.min(maxAngle, angle))
})

const beamTransform = computed(() => `rotate(${beamAngle.value}, 350, 100)`)

const balanceClass = computed(() => {
  if (!currentHerb.value) return 'neutral'
  if (isBalanced.value) return 'balanced'
  const diff = Math.abs(leftWeight.value - rightWeight.value)
  if (diff <= currentHerb.value.allowedError * 2) return 'close'
  return 'far'
})

const balanceText = computed(() => {
  if (!currentHerb.value) return '等待配药'
  if (isBalanced.value) return '平衡！'
  const diff = leftWeight.value - rightWeight.value
  if (Math.abs(diff) < 0.05) return '接近平衡'
  return diff > 0 ? '砝码偏重' : '药材偏重'
})

const leftWeightVisual = computed(() => {
  const result: { size: number; color: string }[] = []
  const weights: Weight[] = [...mentorStore.placedWeights]
  weights.forEach(pw => {
    result.push({
      size: Math.min(30 + pw.weight * 1.5, 44),
      color: pw.color
    })
  })
  return result
})

const rightHerbVisual = computed(() => {
  const result: { size: number }[] = []
  const count = Math.min(mentorStore.currentHerbCount, 20)
  for (let i = 0; i < count; i++) {
    result.push({ size: 14 })
  }
  return result
})
</script>

<style scoped>
.scale-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.canvas-wrapper {
  width: 700px;
  max-width: 100%;
  border-radius: 12px;
  background: linear-gradient(180deg, #FDF5E6 0%, #FAEBD7 100%);
  box-shadow: 0 4px 20px rgba(139, 69, 19, 0.15);
  overflow: hidden;
}

.scale-svg {
  width: 100%;
  height: auto;
  display: block;
}

.scale-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 700px;
  padding: 16px 40px;
  margin-top: 12px;
  box-sizing: border-box;
}

.side-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.side-info .label {
  font-size: 14px;
  color: #8B4513;
  font-weight: 500;
}

.side-info .weight {
  font-size: 20px;
  font-weight: bold;
  color: #4A2C17;
}

.left .weight {
  color: #D2691E;
}

.right .weight {
  color: #556B2F;
}

.balance-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.balance-indicator.neutral {
  background: #F5F5F5;
}

.balance-indicator.balanced {
  background: #E8F5E9;
  animation: glow 1.5s ease-in-out infinite;
}

.balance-indicator.close {
  background: #FFF8DC;
}

.balance-indicator.far {
  background: #FFF0F5;
}

.indicator-bar {
  width: 60px;
  height: 4px;
  border-radius: 2px;
  background: #999;
  transition: all 0.3s ease;
}

.balance-indicator.balanced .indicator-bar {
  background: #2E8B57;
  width: 80px;
}

.balance-indicator.close .indicator-bar {
  background: #DAA520;
  width: 50px;
}

.balance-indicator.far .indicator-bar {
  background: #DC143C;
  width: 40px;
}

.indicator-text {
  font-size: 12px;
  font-weight: 600;
}

.balance-indicator.balanced .indicator-text {
  color: #2E8B57;
}

.balance-indicator.close .indicator-text {
  color: #B8860B;
}

.balance-indicator.far .indicator-text {
  color: #DC143C;
}

.balance-indicator.neutral .indicator-text {
  color: #666;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(46, 139, 87, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(46, 139, 87, 0);
  }
}
</style>
