export interface Position {
  x: number
  y: number
}

export interface Snake {
  body: Position[]
  direction: Direction
}

export interface Food {
  position: Position
}

export const Direction = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT'
} as const

export type Direction = typeof Direction[keyof typeof Direction]

export const GameState = {
  WAITING: 'WAITING',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
} as const

export type GameState = typeof GameState[keyof typeof GameState]

export interface GameScore {
  current: number
  highest: number
}

export interface GameConfig {
  gridSize: number
  canvasWidth: number
  canvasHeight: number
  initialSpeed: number
  speedIncrement: number
  maxSpeed: number
}