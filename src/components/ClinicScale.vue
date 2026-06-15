<template>
  <div class="scale-container">
    <div ref="canvasContainer" class="canvas-wrapper"></div>
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import Matter from 'matter-js'
import { useClinicStore } from '@/stores/clinic'
import { SCALE_BEAM_LENGTH, SCALE_PAN_WIDTH } from '@/constants'

const clinicStore = useClinicStore()
const canvasContainer = ref<HTMLDivElement | null>(null)

const leftWeight = computed(() => clinicStore.leftWeight)
const rightWeight = computed(() => clinicStore.rightWeight)
const currentHerb = computed(() => clinicStore.currentHerb)
const isBalanced = computed(() => clinicStore.isCurrentBalanced)

const balanceClass = computed(() => {
  if (!currentHerb.value) return 'neutral'
  if (isBalanced.value) return 'balanced'
  const diff = leftWeight.value - rightWeight.value
  if (Math.abs(diff) > currentHerb.value.allowedError * 3) return 'far'
  return 'close'
})

const balanceText = computed(() => {
  if (!currentHerb.value) return '等待配药'
  if (isBalanced.value) return '平衡！'
  const diff = leftWeight.value - rightWeight.value
  if (Math.abs(diff) < 0.05) return '接近平衡'
  return diff > 0 ? '砝码偏重' : '药材偏重'
})

let engine: Matter.Engine
let render: Matter.Render
let runner: Matter.Runner
let beam: Matter.Body
let leftPan: Matter.Body
let rightPan: Matter.Body
let pivotConstraint: Matter.Constraint
let leftRope: Matter.Constraint
let rightRope: Matter.Constraint
let leftPanConstraint: Matter.Constraint
let rightPanConstraint: Matter.Constraint

const CANVAS_WIDTH = 700
const CANVAS_HEIGHT = 450
const PIVOT_X = CANVAS_WIDTH / 2
const PIVOT_Y = 100
const BEAM_WIDTH = SCALE_BEAM_LENGTH
const BEAM_HEIGHT = 12
const ROPE_LENGTH = 120
const PAN_WIDTH = SCALE_PAN_WIDTH
const PAN_HEIGHT = 20

function initPhysics() {
  if (!canvasContainer.value) return

  engine = Matter.Engine.create()
  engine.gravity.y = 1

  render = Matter.Render.create({
    element: canvasContainer.value,
    engine: engine,
    options: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      wireframes: false,
      background: 'transparent'
    }
  })

  runner = Matter.Runner.create()
  Matter.Runner.run(runner, engine)
  Matter.Render.run(render)

  createScale()
}

function createScale() {
  const world = engine.world

  const base = Matter.Bodies.rectangle(PIVOT_X, PIVOT_Y + 180, 200, 30, {
    isStatic: true,
    render: {
      fillStyle: '#8B4513'
    }
  })

  const pillar = Matter.Bodies.rectangle(PIVOT_X, PIVOT_Y + 80, 20, 160, {
    isStatic: true,
    render: {
      fillStyle: '#A0522D'
    }
  })

  const pivot = Matter.Bodies.circle(PIVOT_X, PIVOT_Y, 8, {
    isStatic: true,
    render: {
      fillStyle: '#DAA520'
    }
  })

  beam = Matter.Bodies.rectangle(PIVOT_X, PIVOT_Y, BEAM_WIDTH, BEAM_HEIGHT, {
    render: {
      fillStyle: '#DEB887',
      strokeStyle: '#8B4513',
      lineWidth: 2
    },
    density: 0.001
  })

  pivotConstraint = Matter.Constraint.create({
    pointA: { x: PIVOT_X, y: PIVOT_Y },
    bodyB: beam,
    pointB: { x: 0, y: 0 },
    stiffness: 0.9,
    length: 0,
    render: {
      visible: false
    }
  })

  leftPan = Matter.Bodies.rectangle(
    PIVOT_X - BEAM_WIDTH / 2 + PAN_WIDTH / 2,
    PIVOT_Y + ROPE_LENGTH,
    PAN_WIDTH,
    PAN_HEIGHT,
    {
      render: {
        fillStyle: '#D2B48C',
        strokeStyle: '#8B4513',
        lineWidth: 2
      }
    }
  )

  rightPan = Matter.Bodies.rectangle(
    PIVOT_X + BEAM_WIDTH / 2 - PAN_WIDTH / 2,
    PIVOT_Y + ROPE_LENGTH,
    PAN_WIDTH,
    PAN_HEIGHT,
    {
      render: {
        fillStyle: '#D2B48C',
        strokeStyle: '#8B4513',
        lineWidth: 2
      }
    }
  )

  leftRope = Matter.Constraint.create({
    bodyA: beam,
    pointA: { x: -BEAM_WIDTH / 2 + 20, y: 0 },
    bodyB: leftPan,
    pointB: { x: -PAN_WIDTH / 2 + 10, y: -PAN_HEIGHT / 2 },
    stiffness: 0.8,
    length: ROPE_LENGTH - 10,
    render: {
      strokeStyle: '#8B4513',
      lineWidth: 2
    }
  })

  const leftRope2 = Matter.Constraint.create({
    bodyA: beam,
    pointA: { x: -BEAM_WIDTH / 2 + 20, y: 0 },
    bodyB: leftPan,
    pointB: { x: PAN_WIDTH / 2 - 10, y: -PAN_HEIGHT / 2 },
    stiffness: 0.8,
    length: ROPE_LENGTH - 10,
    render: {
      strokeStyle: '#8B4513',
      lineWidth: 2
    }
  })

  rightRope = Matter.Constraint.create({
    bodyA: beam,
    pointA: { x: BEAM_WIDTH / 2 - 20, y: 0 },
    bodyB: rightPan,
    pointB: { x: -PAN_WIDTH / 2 + 10, y: -PAN_HEIGHT / 2 },
    stiffness: 0.8,
    length: ROPE_LENGTH - 10,
    render: {
      strokeStyle: '#8B4513',
      lineWidth: 2
    }
  })

  const rightRope2 = Matter.Constraint.create({
    bodyA: beam,
    pointA: { x: BEAM_WIDTH / 2 - 20, y: 0 },
    bodyB: rightPan,
    pointB: { x: PAN_WIDTH / 2 - 10, y: -PAN_HEIGHT / 2 },
    stiffness: 0.8,
    length: ROPE_LENGTH - 10,
    render: {
      strokeStyle: '#8B4513',
      lineWidth: 2
    }
  })

  leftPanConstraint = Matter.Constraint.create({
    bodyA: leftPan,
    pointB: { x: PIVOT_X - BEAM_WIDTH / 2 + PAN_WIDTH / 2, y: PIVOT_Y + ROPE_LENGTH + 30 },
    stiffness: 0.001,
    length: 30,
    render: {
      visible: false
    }
  })

  rightPanConstraint = Matter.Constraint.create({
    bodyA: rightPan,
    pointB: { x: PIVOT_X + BEAM_WIDTH / 2 - PAN_WIDTH / 2, y: PIVOT_Y + ROPE_LENGTH + 30 },
    stiffness: 0.001,
    length: 30,
    render: {
      visible: false
    }
  })

  Matter.Composite.add(world, [
    base,
    pillar,
    pivot,
    beam,
    pivotConstraint,
    leftPan,
    rightPan,
    leftRope,
    leftRope2,
    rightRope,
    rightRope2,
    leftPanConstraint,
    rightPanConstraint
  ])

  const leftWall = Matter.Bodies.rectangle(
    PIVOT_X - BEAM_WIDTH / 2 + PAN_WIDTH / 2 - PAN_WIDTH / 2 - 5,
    PIVOT_Y + ROPE_LENGTH - 30,
    10,
    80,
    {
      isStatic: true,
      isSensor: true,
      render: { visible: false }
    }
  )

  const rightWall = Matter.Bodies.rectangle(
    PIVOT_X + BEAM_WIDTH / 2 - PAN_WIDTH / 2 + PAN_WIDTH / 2 + 5,
    PIVOT_Y + ROPE_LENGTH - 30,
    10,
    80,
    {
      isStatic: true,
      isSensor: true,
      render: { visible: false }
    }
  )

  Matter.Composite.add(world, [leftWall, rightWall])
}

function updateScaleBalance() {
  if (!beam || !engine || !currentHerb.value) return

  const diff = leftWeight.value - rightWeight.value
  const maxAngle = 0.5
  const allowed = currentHerb.value.allowedError

  let targetAngle = 0
  if (Math.abs(diff) > allowed) {
    targetAngle = (diff / 50) * maxAngle
    targetAngle = Math.max(-maxAngle, Math.min(maxAngle, targetAngle))
  }

  const currentAngle = beam.angle
  const newAngle = currentAngle + (targetAngle - currentAngle) * 0.08
  Matter.Body.setAngle(beam, newAngle)
}

let weightBodies: Matter.Body[] = []
let herbBodies: Matter.Body[] = []

function updateWeights() {
  const world = engine.world
  
  weightBodies.forEach(body => Matter.Composite.remove(world, body))
  weightBodies = []
  herbBodies.forEach(body => Matter.Composite.remove(world, body))
  herbBodies = []

  const leftPlaced = clinicStore.getPlacedWeights()
  const rightHerbCount = clinicStore.currentHerbCount
  const herbUnitWeight = currentHerb.value?.unitWeight || 0.5
  const herbColor = currentHerb.value?.color || '#8B7355'

  leftPlaced.forEach((pw, index) => {
    const weightSize = Math.min(30 + pw.weight * 2, 50)
    const weightBody = Matter.Bodies.rectangle(
      PIVOT_X - BEAM_WIDTH / 2 + PAN_WIDTH / 2 + (index % 3 - 1) * 25,
      PIVOT_Y + ROPE_LENGTH - 30 - Math.floor(index / 3) * 25,
      weightSize,
      weightSize * 0.8,
      {
        render: {
          fillStyle: pw.color,
          strokeStyle: '#4A2C17',
          lineWidth: 2
        },
        density: 0.001
      }
    )
    weightBodies.push(weightBody)
    Matter.Composite.add(world, weightBody)
  })

  const herbStackCount = Math.min(rightHerbCount, 20)
  
  for (let i = 0; i < herbStackCount; i++) {
    const herbSize = 15
    const herbBody = Matter.Bodies.circle(
      PIVOT_X + BEAM_WIDTH / 2 - PAN_WIDTH / 2 + (i % 4 - 1.5) * 18,
      PIVOT_Y + ROPE_LENGTH - 20 - Math.floor(i / 4) * 12,
      herbSize / 2,
      {
        render: {
          fillStyle: herbColor,
          strokeStyle: '#654321',
          lineWidth: 1
        },
        density: 0.0005
      }
    )
    herbBodies.push(herbBody)
    Matter.Composite.add(world, herbBody)
  }
}

let animationFrame: number

function animate() {
  updateScaleBalance()
  animationFrame = requestAnimationFrame(animate)
}

watch(
  () => [clinicStore.placedWeights.length, clinicStore.currentHerbCount],
  () => {
    updateWeights()
  },
  { deep: true }
)

watch(
  () => clinicStore.currentHerb,
  () => {
    updateWeights()
  }
)

onMounted(() => {
  initPhysics()
  updateWeights()
  animate()
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  if (runner) {
    Matter.Runner.stop(runner)
  }
  if (render) {
    Matter.Render.stop(render)
    if (render.canvas) {
      render.canvas.remove()
    }
  }
  if (engine) {
    Matter.Engine.clear(engine)
  }
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
  height: 450px;
  border-radius: 12px;
  background: linear-gradient(180deg, #FDF5E6 0%, #FAEBD7 100%);
  box-shadow: 0 4px 20px rgba(139, 69, 19, 0.15);
  overflow: hidden;
}

.scale-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 700px;
  padding: 16px 40px;
  margin-top: 12px;
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
