import { View, Canvas, Button } from '@tarojs/components'
import type { GameStateType } from '../../lib/GameState'
import { GAME_STATE } from '../../lib/GameState'
import './index.scss'

interface PlateCanvasProps {
  canvasRef: any
  state: GameStateType
  canString: boolean
  onWristSizeClick: () => void
  onToolboxClick: () => void
  onSave: () => void
  onPurchase: () => void
  onStringBracelet: () => void
  onDisband: () => void
  onTouchStart: (e: any) => void
  onTouchMove: (e: any) => void
  onTouchEnd: () => void
  disabled?: boolean
}

export default function PlateCanvas({
  canvasRef,
  state,
  canString,
  onWristSizeClick,
  onToolboxClick,
  onSave,
  onPurchase,
  onStringBracelet,
  onDisband,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  disabled,
}: PlateCanvasProps) {
  return (
    <View className="plate-canvas">
      <Canvas
        type="2d"
        id="plateCanvas"
        canvasId="plateCanvas"
        className="plate-canvas__canvas"
        ref={canvasRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* 左下角 - 手围设置 + 工具箱 */}
      <View className="plate-canvas__bottom-left">
        <Button className="plate-canvas__btn" onClick={onWristSizeClick}>手围设置</Button>
        <Button className="plate-canvas__btn" onClick={onToolboxClick}>工具箱</Button>
      </View>

      {/* 右上角 - 保存 + 购买 */}
      <View className="plate-canvas__top-right">
        <Button className="plate-canvas__btn" onClick={onSave} disabled={disabled}>保存</Button>
        <Button className="plate-canvas__btn plate-canvas__btn--primary" onClick={onPurchase} disabled={disabled}>购买</Button>
      </View>

      {/* 右下角 - 串手串/打散 */}
      <View className="plate-canvas__bottom-right">
        {canString && state !== GAME_STATE.BRACELET && (
          <Button className="plate-canvas__btn plate-canvas__btn--string" onClick={onStringBracelet}>串手串</Button>
        )}
        {state === GAME_STATE.BRACELET && (
          <Button className="plate-canvas__btn plate-canvas__btn--disband" onClick={onDisband}>打散</Button>
        )}
      </View>
    </View>
  )
}
