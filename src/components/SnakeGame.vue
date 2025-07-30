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
      ></canvas>
      
      <div v-if="gameState !== 'PLAYING'" class="game-overlay">
        <div class="overlay-content">
          <div v-if="gameState === 'WAITING'" class="waiting-screen">
            <h2>准备开始</h2>
            <p>按空格键开始游戏</p>
            <div class="controls-hint">
              <p>控制方式:</p>
              <p>WASD 或 方向键 控制移动</p>
              <p>空格键 暂停/继续</p>
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
import { GameState } from '../types/game'

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
  initGame
} = useSnakeGame()

let ctx: CanvasRenderingContext2D | null = null

onMounted(async () => {
  await nextTick()
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    draw()
  }
})

watch([snake, food, gameState], () => {
  draw()
}, { deep: true })

function draw() {
  if (!ctx) return

  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight)

  drawGrid()
  drawFood()
  drawSnake()
}

function drawGrid() {
  if (!ctx) return
  
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  
  for (let x = 0; x <= config.canvasWidth; x += config.gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, config.canvasHeight)
    ctx.stroke()
  }
  
  for (let y = 0; y <= config.canvasHeight; y += config.gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(config.canvasWidth, y)
    ctx.stroke()
  }
}

function drawSnake() {
  if (!ctx) return
  
  snake.body.forEach((segment, index) => {
    const x = segment.x * config.gridSize
    const y = segment.y * config.gridSize
    
    if (index === 0) {
      ctx.fillStyle = '#4CAF50'
      ctx.fillRect(x + 1, y + 1, config.gridSize - 2, config.gridSize - 2)
      
      ctx.fillStyle = '#2E7D32'
      ctx.fillRect(x + 4, y + 4, config.gridSize - 8, config.gridSize - 8)
    } else {
      ctx.fillStyle = '#8BC34A'
      ctx.fillRect(x + 2, y + 2, config.gridSize - 4, config.gridSize - 4)
    }
  })
}

function drawFood() {
  if (!ctx) return
  
  const x = food.position.x * config.gridSize
  const y = food.position.y * config.gridSize
  
  ctx.fillStyle = '#FF5722'
  ctx.beginPath()
  ctx.arc(
    x + config.gridSize / 2,
    y + config.gridSize / 2,
    config.gridSize / 2 - 2,
    0,
    Math.PI * 2
  )
  ctx.fill()
  
  ctx.fillStyle = '#D32F2F'
  ctx.beginPath()
  ctx.arc(
    x + config.gridSize / 2,
    y + config.gridSize / 2,
    config.gridSize / 3 - 2,
    0,
    Math.PI * 2
  )
  ctx.fill()
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
</script>

<style scoped>
.snake-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
}

.game-header {
  text-align: center;
  margin-bottom: 20px;
}

.game-header h1 {
  margin: 0 0 20px 0;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
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
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
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
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
}

.game-canvas {
  display: block;
  background: #1a1a1a;
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.overlay-content {
  text-align: center;
  color: white;
}

.waiting-screen h2,
.paused-screen h2,
.game-over-screen h2 {
  font-size: 2rem;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.waiting-screen p,
.paused-screen p,
.game-over-screen p {
  font-size: 1.2rem;
  margin: 10px 0;
}

.controls-hint {
  margin-top: 30px;
  opacity: 0.8;
}

.controls-hint p {
  font-size: 1rem;
  margin: 5px 0;
}

.new-record {
  color: #FFD700;
  font-weight: bold;
  font-size: 1.4rem !important;
  animation: glow 1s ease-in-out infinite alternate;
}

@keyframes glow {
  from { text-shadow: 0 0 5px #FFD700; }
  to { text-shadow: 0 0 20px #FFD700, 0 0 30px #FFD700; }
}

.restart-hint {
  margin-top: 20px;
}

.game-controls {
  display: flex;
  gap: 15px;
}

.control-btn {
  padding: 12px 30px;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.control-btn.start {
  background: linear-gradient(45deg, #4CAF50, #8BC34A);
  color: white;
}

.control-btn.pause {
  background: linear-gradient(45deg, #FF9800, #FFC107);
  color: white;
}

.control-btn.restart {
  background: linear-gradient(45deg, #F44336, #FF5722);
  color: white;
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.control-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .snake-game {
    padding: 10px;
  }
  
  .game-header h1 {
    font-size: 2rem;
  }
  
  .score-board {
    gap: 15px;
  }
  
  .game-canvas {
    max-width: 100%;
    height: auto;
  }
}
</style>