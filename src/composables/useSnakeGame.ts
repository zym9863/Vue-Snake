import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import type { Snake, Food, Position, GameConfig, GameScore } from '../types/game'
import { Direction, GameState } from '../types/game'

const STORAGE_KEY = 'vue-snake-highest-score'

export function useSnakeGame() {
  const config: GameConfig = {
    gridSize: 20,
    canvasWidth: 600,
    canvasHeight: 400,
    initialSpeed: 150,
    speedIncrement: 5,
    maxSpeed: 80
  }

  const gameState = ref<GameState>(GameState.WAITING)
  const snake = reactive<Snake>({
    body: [{ x: 10, y: 10 }],
    direction: Direction.RIGHT
  })
  const food = reactive<Food>({
    position: { x: 15, y: 15 }
  })
  const score = reactive<GameScore>({
    current: 0,
    highest: parseInt(localStorage.getItem(STORAGE_KEY) || '0')
  })

  let gameLoop: number | null = null
  let lastMoveTime = 0
  
  const currentSpeed = computed(() => {
    const speedBonus = Math.floor(score.current / 50) * config.speedIncrement
    return Math.max(config.maxSpeed, config.initialSpeed - speedBonus)
  })

  const gridWidth = computed(() => Math.floor(config.canvasWidth / config.gridSize))
  const gridHeight = computed(() => Math.floor(config.canvasHeight / config.gridSize))

  function initGame() {
    snake.body = [{ x: Math.floor(gridWidth.value / 2), y: Math.floor(gridHeight.value / 2) }]
    snake.direction = Direction.RIGHT
    score.current = 0
    generateFood()
    gameState.value = GameState.WAITING
  }

  function startGame() {
    if (gameState.value === GameState.WAITING || gameState.value === GameState.GAME_OVER) {
      initGame()
    }
    gameState.value = GameState.PLAYING
    lastMoveTime = Date.now()
    startGameLoop()
  }

  function pauseGame() {
    if (gameState.value === GameState.PLAYING) {
      gameState.value = GameState.PAUSED
      stopGameLoop()
    } else if (gameState.value === GameState.PAUSED) {
      gameState.value = GameState.PLAYING
      lastMoveTime = Date.now()
      startGameLoop()
    }
  }

  function gameOver() {
    gameState.value = GameState.GAME_OVER
    stopGameLoop()
    if (score.current > score.highest) {
      score.highest = score.current
      localStorage.setItem(STORAGE_KEY, score.highest.toString())
    }
  }

  function generateFood() {
    let newPosition: Position
    do {
      newPosition = {
        x: Math.floor(Math.random() * gridWidth.value),
        y: Math.floor(Math.random() * gridHeight.value)
      }
    } while (isPositionOnSnake(newPosition))
    
    food.position = newPosition
  }

  function isPositionOnSnake(position: Position): boolean {
    return snake.body.some(segment => segment.x === position.x && segment.y === position.y)
  }

  function moveSnake() {
    if (gameState.value !== GameState.PLAYING) return

    const head = { ...snake.body[0] }
    
    switch (snake.direction) {
      case Direction.UP:
        head.y -= 1
        break
      case Direction.DOWN:
        head.y += 1
        break
      case Direction.LEFT:
        head.x -= 1
        break
      case Direction.RIGHT:
        head.x += 1
        break
    }

    if (isCollision(head)) {
      gameOver()
      return
    }

    snake.body.unshift(head)

    if (head.x === food.position.x && head.y === food.position.y) {
      score.current += 10
      generateFood()
    } else {
      snake.body.pop()
    }
  }

  function isCollision(head: Position): boolean {
    if (head.x < 0 || head.x >= gridWidth.value || head.y < 0 || head.y >= gridHeight.value) {
      return true
    }
    
    return snake.body.some(segment => segment.x === head.x && segment.y === head.y)
  }

  function changeDirection(newDirection: Direction) {
    if (gameState.value !== GameState.PLAYING) return
    
    const opposites = {
      [Direction.UP]: Direction.DOWN,
      [Direction.DOWN]: Direction.UP,
      [Direction.LEFT]: Direction.RIGHT,
      [Direction.RIGHT]: Direction.LEFT
    }
    
    if (opposites[snake.direction] !== newDirection) {
      snake.direction = newDirection
    }
  }

  function startGameLoop() {
    if (gameLoop) return
    
    function loop() {
      const now = Date.now()
      if (now - lastMoveTime >= currentSpeed.value) {
        moveSnake()
        lastMoveTime = now
      }
      
      if (gameState.value === GameState.PLAYING) {
        gameLoop = requestAnimationFrame(loop)
      }
    }
    
    gameLoop = requestAnimationFrame(loop)
  }

  function stopGameLoop() {
    if (gameLoop) {
      cancelAnimationFrame(gameLoop)
      gameLoop = null
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    
    switch (key) {
      case 'arrowup':
      case 'w':
        changeDirection(Direction.UP)
        break
      case 'arrowdown':
      case 's':
        changeDirection(Direction.DOWN)
        break
      case 'arrowleft':
      case 'a':
        changeDirection(Direction.LEFT)
        break
      case 'arrowright':
      case 'd':
        changeDirection(Direction.RIGHT)
        break
      case ' ':
        event.preventDefault()
        if (gameState.value === GameState.WAITING || gameState.value === GameState.GAME_OVER) {
          startGame()
        } else {
          pauseGame()
        }
        break
      case 'r':
        if (gameState.value === GameState.GAME_OVER) {
          startGame()
        }
        break
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyPress)
    initGame()
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyPress)
    stopGameLoop()
  })

  return {
    config,
    gameState,
    snake,
    food,
    score,
    currentSpeed,
    gridWidth,
    gridHeight,
    startGame,
    pauseGame,
    initGame,
    changeDirection
  }
}