// src/lib/GameState.ts

export const GAME_STATE = {
  IDLE: 'idle',
  SHOOTING: 'shooting',
  SETTLED: 'settled',
  BRACELET: 'bracelet'
} as const

export type GameStateType = typeof GAME_STATE[keyof typeof GAME_STATE]

export const SHOOT_DIRECTION = {
  LEFT: 'left',
  RIGHT: 'right'
} as const

export type ShootDirectionType = typeof SHOOT_DIRECTION[keyof typeof SHOOT_DIRECTION]

export interface PlateBead {
  id: string
  name: string
  color: string
  radius: number
  price: number
  image?: string
  category?: string
  subType?: string
}

export class GameState {
  state: GameStateType = GAME_STATE.IDLE
  plateBeads: PlateBead[] = []
  braceletBeads: PlateBead[] = []
  shootCount: number = 0
  shootDirection: ShootDirectionType = SHOOT_DIRECTION.LEFT

  getState(): GameStateType {
    return this.state
  }

  setState(newState: GameStateType): void {
    this.state = newState
  }

  addBeadToPlate(bead: PlateBead): void {
    this.plateBeads.push(bead)
    this.shootCount++
    this.shootDirection = this.shootCount % 2 === 0
      ? SHOOT_DIRECTION.RIGHT
      : SHOOT_DIRECTION.LEFT
  }

  getPlateBeadCount(): number {
    return this.plateBeads.length
  }

  canStringBracelet(): boolean {
    return this.plateBeads.length >= 10
  }

  stringBracelet(): void {
    this.braceletBeads = [...this.plateBeads]
    this.plateBeads = []
    this.state = GAME_STATE.BRACELET
  }

  addBeadToBracelet(bead: PlateBead): void {
    this.braceletBeads.push(bead)
  }

  removeBeadFromBracelet(index: number): void {
    this.braceletBeads.splice(index, 1)
  }

  getBraceletBeads(): PlateBead[] {
    return this.braceletBeads
  }

  reset(): void {
    this.state = GAME_STATE.IDLE
    this.plateBeads = []
    this.braceletBeads = []
    this.shootCount = 0
    this.shootDirection = SHOOT_DIRECTION.LEFT
  }
}
