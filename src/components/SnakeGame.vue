<template>
  <div class="snake-game">
    <div class="game-header">
      <h1>贪吃蛇游戏</h1>
      <div class="score-board">
        <div class="score-item">
          <span class="label">当前得分:</span>
          <span class="value">{{ score.current }}</span>
        </div>
        <div class="score-item">
          <span class="label">最高得分:</span>
          <span class="value">{{ score.highest }}</span>
        </div>
        <div class="speed-info">
          <span class="label">速度:</span>
          <span class="value">{{ Math.ceil((200 - currentSpeed) / 10) }}</span>
        </div>
      </div>
    </div>

    <div class="game-container">
      <canvas
        ref="canvas"
        :width="config.canvasWidth"
        :height="config.canvasHeight"
        class="game-canvas"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      ></canvas>
      
      <div v-if="gameState !== 'PLAYING'" class="game-overlay">
        <div class="overlay-content">
          <div v-if="gameState === 'WAITING'" class="waiting-screen">
            <h2>准备开始</h2>
            <p>按空格键开始游戏</p>
            <div class="controls-hint">
              <p>控制方式:</p>
              <p class="desktop-controls">WASD 或 方向键 控制移动</p>
              <p class="desktop-controls">空格键 暂停/继续</p>
              <p class="mobile-controls">滑动屏幕控制移动方向</p>
              <p class="mobile-controls">点击屏幕开始游戏</p>
            </div>
          </div>
          
          <div v-else-if="gameState === 'PAUSED'" class="paused-screen">
            <h2>游戏暂停</h2>
            <p>按空格键继续</p>
          </div>
          
          <div v-else-if="gameState === 'GAME_OVER'" class="game-over-screen">
            <h2>游戏结束</h2>
            <p>得分: {{ score.current }}</p>
            <p v-if="score.current === score.highest" class="new-record">🎉 新纪录!</p>
            <div class="restart-hint">
              <p>按空格键或R键重新开始</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="game-controls">
      <button
        @click="handleStartPause"
        :class="getButtonClass()"
        class="control-btn"
      >
        {{ getButtonText() }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useSnakeGame } from '../composables/useSnakeGame'
import { GameState, Direction } from '../types/game'

const canvas = ref<HTMLCanvasElement>()
const {
  config,
  gameState,
  snake,
  food,
  score,
  currentSpeed,
  startGame,
  pauseGame,
  changeDirection
} = useSnakeGame()

let ctx: CanvasRenderingContext2D | null = null

// 触摸控制相关变量
let touchStartX: number = 0
let touchStartY: number = 0
let touchEndX: number = 0
let touchEndY: number = 0

onMounted(async () => {
  await nextTick()
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    startAnimation()
  }
})

function startAnimation() {
  function animate() {
    draw()
    requestAnimationFrame(animate)
  }
  animate()
}

watch([snake, food, gameState], (newValues, oldValues) => {
  // 检查食物是否被吃掉（位置改变）
  if (oldValues && newValues[1].position.x !== oldValues[1].position.x || newValues[1].position.y !== oldValues[1].position.y) {
    // 在之前的食物位置创建粒子效果
    if (oldValues[1]) {
      createParticles(
        oldValues[1].position.x * config.gridSize,
        oldValues[1].position.y * config.gridSize,
        12,
        '#FFD700'
      )
    }
  }
  
  draw()
}, { deep: true })

function draw() {
  if (!ctx) return

  // 创建背景渐变
  const bgGradient = ctx.createLinearGradient(0, 0, config.canvasWidth, config.canvasHeight)
  bgGradient.addColorStop(0, '#0a0a0a')
  bgGradient.addColorStop(0.5, '#1a1a1a')
  bgGradient.addColorStop(1, '#0f0f0f')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight)

  drawGrid()
  drawFood()
  drawSnake()
  
  // 更新和绘制粒子效果
  updateParticles()
  drawParticles()
}

function drawGrid() {
  if (!ctx) return
  
  ctx.strokeStyle = 'rgba(56, 239, 125, 0.1)'
  ctx.lineWidth = 0.5
  
  // 绘制垂直线
  for (let x = 0; x <= config.canvasWidth; x += config.gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, config.canvasHeight)
    ctx.stroke()
  }
  
  // 绘制水平线
  for (let y = 0; y <= config.canvasHeight; y += config.gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(config.canvasWidth, y)
    ctx.stroke()
  }
  
  // 添加交叉点发光效果
  ctx.fillStyle = 'rgba(56, 239, 125, 0.05)'
  for (let x = 0; x <= config.canvasWidth; x += config.gridSize) {
    for (let y = 0; y <= config.canvasHeight; y += config.gridSize) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawSnake() {
  if (!ctx) return
  
  snake.body.forEach((segment, index) => {
    const x = segment.x * config.gridSize
    const y = segment.y * config.gridSize
    const centerX = x + config.gridSize / 2
    const centerY = y + config.gridSize / 2
    const radius = config.gridSize / 2 - 1
    
    if (index === 0) {
      // 蛇头 - 创建发光的渐变效果
      const headGradient = ctx!.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      headGradient.addColorStop(0, '#66ff66')
      headGradient.addColorStop(0.7, '#4CAF50')
      headGradient.addColorStop(1, '#2E7D32')
      
      ctx!.fillStyle = headGradient
      ctx!.beginPath()
      ctx!.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx!.fill()
      
      // 蛇头内圈光晕
      const innerGradient = ctx!.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.6)
      innerGradient.addColorStop(0, 'rgba(102, 255, 102, 0.8)')
      innerGradient.addColorStop(1, 'rgba(102, 255, 102, 0)')
      ctx!.fillStyle = innerGradient
      ctx!.beginPath()
      ctx!.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2)
      ctx!.fill()
      
      // 添加蛇头边框
      ctx!.strokeStyle = '#66ff66'
      ctx!.lineWidth = 2
      ctx!.beginPath()
      ctx!.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx!.stroke()
      
    } else {
      // 蛇身 - 渐变色和发光效果
      const bodyGradient = ctx!.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      const alpha = Math.max(0.4, 1 - index * 0.05) // 越靠后越透明
      bodyGradient.addColorStop(0, `rgba(139, 195, 74, ${alpha})`)
      bodyGradient.addColorStop(0.7, `rgba(104, 159, 56, ${alpha * 0.8})`)
      bodyGradient.addColorStop(1, `rgba(69, 90, 42, ${alpha * 0.6})`)
      
      ctx!.fillStyle = bodyGradient
      ctx!.beginPath()
      ctx!.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2)
      ctx!.fill()
      
      // 蛇身内部高光
      ctx!.fillStyle = `rgba(179, 229, 94, ${alpha * 0.3})`
      ctx!.beginPath()
      ctx!.arc(centerX - 2, centerY - 2, radius * 0.4, 0, Math.PI * 2)
      ctx!.fill()
      
      // 蛇身边框
      ctx!.strokeStyle = `rgba(139, 195, 74, ${alpha * 0.7})`
      ctx!.lineWidth = 1
      ctx!.beginPath()
      ctx!.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2)
      ctx!.stroke()
    }
  })
}

function drawFood() {
  if (!ctx) return
  
  const x = food.position.x * config.gridSize
  const y = food.position.y * config.gridSize
  const centerX = x + config.gridSize / 2
  const centerY = y + config.gridSize / 2
  const radius = config.gridSize / 2 - 2
  
  // 创建脉冲效果
  const time = Date.now() * 0.005
  const pulseRadius = radius + Math.sin(time) * 2
  
  // 外层光晕
  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius + 6)
  glowGradient.addColorStop(0, 'rgba(255, 87, 34, 0.8)')
  glowGradient.addColorStop(0.5, 'rgba(255, 87, 34, 0.4)')
  glowGradient.addColorStop(1, 'rgba(255, 87, 34, 0)')
  ctx.fillStyle = glowGradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, pulseRadius + 6, 0, Math.PI * 2)
  ctx.fill()
  
  // 主体食物
  const foodGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius)
  foodGradient.addColorStop(0, '#ffab40')
  foodGradient.addColorStop(0.4, '#FF5722')
  foodGradient.addColorStop(0.8, '#D32F2F')
  foodGradient.addColorStop(1, '#B71C1C')
  
  ctx.fillStyle = foodGradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
  ctx.fill()
  
  // 内部高光
  const highlightGradient = ctx.createRadialGradient(
    centerX - 3, centerY - 3, 0, 
    centerX - 3, centerY - 3, radius * 0.5
  )
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
  highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = highlightGradient
  ctx.beginPath()
  ctx.arc(centerX - 3, centerY - 3, radius * 0.5, 0, Math.PI * 2)
  ctx.fill()
  
  // 边框
  ctx.strokeStyle = '#ffab40'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
  ctx.stroke()
  
  // 添加闪烁的星星效果
  if (Math.sin(time * 3) > 0.5) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI / 2) + time * 0.5
      const sparkX = centerX + Math.cos(angle) * (radius + 8)
      const sparkY = centerY + Math.sin(angle) * (radius + 8)
      ctx.beginPath()
      ctx.arc(sparkX, sparkY, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function handleStartPause() {
  if (gameState.value === GameState.WAITING || gameState.value === GameState.GAME_OVER) {
    startGame()
  } else {
    pauseGame()
  }
}

function getButtonText() {
  switch (gameState.value) {
    case GameState.WAITING:
      return '开始游戏'
    case GameState.PLAYING:
      return '暂停'
    case GameState.PAUSED:
      return '继续'
    case GameState.GAME_OVER:
      return '重新开始'
    default:
      return '开始游戏'
  }
}

function getButtonClass() {
  switch (gameState.value) {
    case GameState.PLAYING:
      return 'pause'
    case GameState.GAME_OVER:
      return 'restart'
    default:
      return 'start'
  }
}

// 粒子系统
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

const particles: Particle[] = []

function createParticles(x: number, y: number, count: number = 8, color: string = '#FFD700') {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5
    const speed = 2 + Math.random() * 3
    particles.push({
      x: x + config.gridSize / 2,
      y: y + config.gridSize / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 60,
      maxLife: 60,
      color,
      size: 2 + Math.random() * 2
    })
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i]
    particle.x += particle.vx
    particle.y += particle.vy
    particle.life--
    particle.size *= 0.98
    
    if (particle.life <= 0) {
      particles.splice(i, 1)
    }
  }
}

function drawParticles() {
  if (!ctx) return
  
  particles.forEach(particle => {
    const alpha = particle.life / particle.maxLife
    ctx!.globalAlpha = alpha
    ctx!.fillStyle = particle.color
    ctx!.beginPath()
    ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx!.fill()
  })
  ctx!.globalAlpha = 1
}

// 触摸控制函数
function handleTouchStart(event: TouchEvent) {
  event.preventDefault()
  const touch = event.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
}

function handleTouchMove(event: TouchEvent) {
  event.preventDefault()
}

function handleTouchEnd(event: TouchEvent) {
  event.preventDefault()
  const touch = event.changedTouches[0]
  touchEndX = touch.clientX  
  touchEndY = touch.clientY
  
  handleTouchGesture()
}

function handleTouchGesture() {
  const deltaX = touchEndX - touchStartX
  const deltaY = touchEndY - touchStartY
  const minSwipeDistance = 30
  
  // 如果游戏未开始，触摸启动游戏
  if (gameState.value === GameState.WAITING || gameState.value === GameState.GAME_OVER) {
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      startGame()
      return
    }
  }
  
  // 如果游戏暂停，触摸继续游戏
  if (gameState.value === GameState.PAUSED) {
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      pauseGame()
      return
    }
  }
  
  // 手势控制方向
  if (gameState.value === GameState.PLAYING) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (deltaX > minSwipeDistance) {
        changeDirection(Direction.RIGHT)
      } else if (deltaX < -minSwipeDistance) {
        changeDirection(Direction.LEFT)
      }
    } else {
      // 垂直滑动
      if (deltaY > minSwipeDistance) {
        changeDirection(Direction.DOWN)
      } else if (deltaY < -minSwipeDistance) {
        changeDirection(Direction.UP)
      }
    }
  }
}
</script>

<style scoped>
.snake-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 25%, #2d1b69 50%, #11998e 75%, #38ef7d 100%);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
  min-height: 100vh;
  color: white;
  position: relative;
  overflow: hidden;
}

.snake-game::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(56, 239, 125, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(17, 153, 142, 0.1) 0%, transparent 50%);
  pointer-events: none;
  animation: floatingGlow 6s ease-in-out infinite alternate;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes floatingGlow {
  0% { transform: translate(0px, 0px) scale(1); opacity: 0.7; }
  100% { transform: translate(10px, -10px) scale(1.05); opacity: 0.9; }
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.game-header h1 {
  margin: 0 0 25px 0;
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(45deg, #fff, #38ef7d, #11998e, #fff);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleGlow 3s ease-in-out infinite alternate, gradientShift 6s ease infinite;
  text-shadow: 0 0 30px rgba(56, 239, 125, 0.5);
  letter-spacing: 2px;
}

@keyframes titleGlow {
  0% { filter: drop-shadow(0 0 5px rgba(56, 239, 125, 0.5)); }
  100% { filter: drop-shadow(0 0 20px rgba(56, 239, 125, 0.8)); }
}

.score-board {
  display: flex;
  gap: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.score-item, .speed-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 15px 25px;
  border-radius: 15px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.score-item::before,
.speed-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(56, 239, 125, 0.2), transparent);
  transition: left 0.5s ease;
}

.score-item:hover::before,
.speed-info:hover::before {
  left: 100%;
}

.score-item:hover,
.speed-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(56, 239, 125, 0.2);
  border-color: rgba(56, 239, 125, 0.3);
}

.label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 5px;
}

.value {
  font-size: 1.4rem;
  font-weight: bold;
}

.game-container {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  margin-bottom: 30px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.game-container:hover {
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(56, 239, 125, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.game-canvas {
  display: block;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  border: 2px solid rgba(56, 239, 125, 0.2);
  transition: border-color 0.3s ease;
}

.game-canvas:hover {
  border-color: rgba(56, 239, 125, 0.4);
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(45, 27, 105, 0.9));
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(15px);
  animation: overlayFadeIn 0.5s ease-out;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(15px);
  }
}

.overlay-content {
  text-align: center;
  color: white;
  transform: scale(0.9);
  animation: contentSlideIn 0.6s ease-out 0.2s both;
}

@keyframes contentSlideIn {
  from {
    transform: scale(0.9) translateY(20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.waiting-screen h2,
.paused-screen h2,
.game-over-screen h2 {
  font-size: 2.5rem;
  margin-bottom: 25px;
  background: linear-gradient(45deg, #fff, #38ef7d, #11998e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titlePulse 2s ease-in-out infinite alternate;
  text-shadow: 0 0 20px rgba(56, 239, 125, 0.3);
}

@keyframes titlePulse {
  from {
    filter: drop-shadow(0 0 10px rgba(56, 239, 125, 0.5));
    transform: scale(1);
  }
  to {
    filter: drop-shadow(0 0 20px rgba(56, 239, 125, 0.8));
    transform: scale(1.02);
  }
}

.waiting-screen p,
.paused-screen p,
.game-over-screen p {
  font-size: 1.3rem;
  margin: 15px 0;
  opacity: 0;
  animation: textFadeIn 0.8s ease-out 0.5s both;
}

@keyframes textFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.controls-hint {
  margin-top: 30px;
  opacity: 0;
  animation: textFadeIn 1s ease-out 0.8s both;
}

.controls-hint p {
  font-size: 1rem;
  margin: 8px 0;
  animation: none;
  opacity: 1;
}

.desktop-controls {
  display: block;
}

.mobile-controls {
  display: none;
}

.new-record {
  color: #FFD700;
  font-weight: bold;
  font-size: 1.6rem !important;
  animation: recordGlow 1s ease-in-out infinite alternate, recordBounce 0.6s ease-out;
}

@keyframes recordGlow {
  from { 
    text-shadow: 0 0 5px #FFD700, 0 0 10px #FFD700; 
    transform: scale(1);
  }
  to { 
    text-shadow: 0 0 20px #FFD700, 0 0 30px #FFD700, 0 0 40px #FFD700; 
    transform: scale(1.05);
  }
}

@keyframes recordBounce {
  0% { transform: scale(0.8) rotate(-5deg); opacity: 0; }
  50% { transform: scale(1.1) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.restart-hint {
  margin-top: 25px;
  opacity: 0;
  animation: textFadeIn 1s ease-out 1s both;
}

.game-controls {
  display: flex;
  gap: 15px;
}

.control-btn {
  padding: 15px 35px;
  font-size: 1.2rem;
  font-weight: bold;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transform: translateY(0);
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.control-btn:hover::before {
  left: 100%;
  transition: left 0.8s ease;
}

.control-btn.start {
  background: linear-gradient(45deg, #4CAF50, #8BC34A, #66BB6A);
  color: white;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
}

.control-btn.start:hover {
  background: linear-gradient(45deg, #66BB6A, #4CAF50, #8BC34A);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.6);
}

.control-btn.start:active {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.8);
}

.control-btn.pause {
  background: linear-gradient(45deg, #FF9800, #FFC107, #FFB74D);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.4);
}

.control-btn.pause:hover {
  background: linear-gradient(45deg, #FFB74D, #FF9800, #FFC107);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(255, 152, 0, 0.6);
}

.control-btn.pause:active {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.8);
}

.control-btn.restart {
  background: linear-gradient(45deg, #F44336, #FF5722, #FF7043);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
}

.control-btn.restart:hover {
  background: linear-gradient(45deg, #FF7043, #F44336, #FF5722);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(244, 67, 54, 0.6);
}

.control-btn.restart:active {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.8);
}

.control-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(56, 239, 125, 0.3);
}

@media (max-width: 768px) {
  .snake-game {
    padding: 15px 10px;
  }
  
  .game-header h1 {
    font-size: 2.2rem;
    margin-bottom: 20px;
  }
  
  .score-board {
    gap: 15px;
    flex-direction: column;
  }
  
  .score-item, .speed-info {
    padding: 12px 20px;
  }
  
  .game-container {
    margin-bottom: 25px;
    border-radius: 15px;
  }
  
  .game-canvas {
    max-width: 100%;
    height: auto;
  }
  
  .control-btn {
    padding: 12px 25px;
    font-size: 1rem;
    border-radius: 25px;
  }
  
  .overlay-content {
    padding: 0 20px;
  }
  
  .waiting-screen h2,
  .paused-screen h2,
  .game-over-screen h2 {
    font-size: 2rem;
  }
  
  .waiting-screen p,
  .paused-screen p,
  .game-over-screen p {
    font-size: 1.1rem;
  }
  
  .desktop-controls {
    display: none;
  }
  
  .mobile-controls {
    display: block;
  }
}

@media (max-width: 480px) {
  .snake-game {
    padding: 10px 5px;
  }
  
  .game-header h1 {
    font-size: 1.8rem;
  }
  
  .score-board {
    gap: 10px;
  }
  
  .score-item, .speed-info {
    padding: 10px 15px;
    font-size: 0.9rem;
  }
  
  .label {
    font-size: 0.8rem;
  }
  
  .value {
    font-size: 1.2rem;
  }
  
  .control-btn {
    padding: 10px 20px;
    font-size: 0.9rem;
    letter-spacing: 1px;
  }
  
  .waiting-screen h2,
  .paused-screen h2,
  .game-over-screen h2 {
    font-size: 1.6rem;
  }
  
  .waiting-screen p,
  .paused-screen p,
  .game-over-screen p {
    font-size: 1rem;
  }
  
  .controls-hint p {
    font-size: 0.9rem;
  }
  
  .new-record {
    font-size: 1.3rem !important;
  }
}
</style>