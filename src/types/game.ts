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

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum GameState {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

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