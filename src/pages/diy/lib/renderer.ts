/**
 * Canvas 渲染器
 * 负责绘制盘子、珠子、手串
 * 从参考项目 diy_shouchuang/utils/renderer.js 移植
 */

export class Renderer {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  canvas: any
  plateImage: HTMLImageElement | null = null
  beadImageCache: Map<string, HTMLImageElement> = new Map()

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, canvas: any) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.canvas = canvas
  }

  /**
   * 设置盘子背景图片
   */
  setPlateImage(image: HTMLImageElement): void {
    this.plateImage = image
  }

  /**
   * 加载珠子图片
   */
  loadBeadImage(imageUrl: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      if (!imageUrl) {
        resolve(null)
        return
      }

      // 检查缓存
      if (this.beadImageCache.has(imageUrl)) {
        resolve(this.beadImageCache.get(imageUrl)!)
        return
      }

      const image = this.canvas.createImage()
      image.onload = () => {
        this.beadImageCache.set(imageUrl, image)
        resolve(image)
      }
      image.onerror = () => {
        console.error('珠子图片加载失败:', imageUrl)
        resolve(null)
      }
      image.src = imageUrl
    })
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  drawPlate(cx: number, cy: number, radius: number): void {
    const ctx = this.ctx

    // 如果有背景图片，绘制图片
    if (this.plateImage) {
      ctx.save()

      // 计算图片绘制位置和大小，保持图片居中
      const imageSize = radius * 2.2 // 图片大小比盘子稍大
      const x = cx - imageSize / 2
      const y = cy - imageSize / 2

      ctx.drawImage(this.plateImage, x, y, imageSize, imageSize)

      ctx.restore()
    } else {
      // 如果图片未加载，显示一个简单的背景色
      ctx.save()

      // 绘制一个浅色背景
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(210, 180, 140, 0.3)'
      ctx.fill()

      ctx.restore()
    }
  }

  drawBead(x: number, y: number, radius: number, color: string, angle: number = 0, imageUrl?: string): void {
    const ctx = this.ctx

    try {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // 如果有图片，绘制图片
      if (imageUrl && this.beadImageCache.has(imageUrl)) {
        const image = this.beadImageCache.get(imageUrl)!
        // 裁剪圆形图片
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(image, -radius, -radius, radius * 2, radius * 2)
      } else {
        // 没有图片，使用颜色填充
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }

      // 添加光泽效果
      ctx.beginPath()
      ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fill()

      ctx.restore()
    } catch (e) {
      try { ctx.restore() } catch (e2) {}
    }
  }

  drawBraceletWithAngles(
    beads: Array<{ color: string; radius: number; _placeholder?: boolean; imageUrl?: string; diameter?: number }>,
    cx: number,
    cy: number,
    angles: number[],
    draggedBeadPos: { index: number; x: number; y: number } | null,
    defaultBeadRadius: number,
    beadScale: number = 3
  ): void {
    const count = beads.length
    if (count === 0 || !angles || angles.length !== count) return

    // 计算每个珠子的半径
    const getBeadRadius = (bead: any) => {
      if (bead.diameter) return (bead.diameter / 2) * beadScale
      if (bead.radius) return bead.radius * beadScale
      return defaultBeadRadius
    }

    // 计算每个珠子的位置，考虑珠子大小
    const beadPositions: Array<{ x: number; y: number; radius: number }> = []

    if (count === 1) {
      // 只有一个珠子，放在中心
      beadPositions.push({ x: cx, y: cy, radius: getBeadRadius(beads[0]) })
    } else {
      // 计算手串的总周长（所有珠子直径之和）
      const totalBeadDiameter = beads.reduce((sum, bead) => sum + getBeadRadius(bead) * 2, 0)

      // 计算手串的半径（基于周长）
      const braceletRadius = totalBeadDiameter / (2 * Math.PI)

      // 计算每个珠子占据的角度
      let currentAngle = -Math.PI / 2 // 从顶部开始

      beads.forEach((bead, index) => {
        const beadRadius = getBeadRadius(bead)

        if (draggedBeadPos && index === draggedBeadPos.index) {
          beadPositions.push({ x: draggedBeadPos.x, y: draggedBeadPos.y, radius: beadRadius })
        } else {
          // 计算珠子中心的位置
          const x = cx + Math.cos(currentAngle) * braceletRadius
          const y = cy + Math.sin(currentAngle) * braceletRadius
          beadPositions.push({ x, y, radius: beadRadius })

          // 计算下一个珠子的角度偏移（基于当前珠子和下一个珠子的半径）
          const nextIndex = (index + 1) % count
          const nextRadius = getBeadRadius(beads[nextIndex])
          const angleOffset = (beadRadius + nextRadius) / braceletRadius

          // 如果是最后一个珠子，不需要更新角度
          if (index < count - 1) {
            currentAngle += angleOffset
          }
        }
      })
    }

    // 绘制珠子
    beads.forEach((bead, index) => {
      const pos = beadPositions[index]
      const rotation = angles[index] + Math.PI / 2

      if (bead._placeholder) {
        const ctx = this.ctx
        ctx.save()
        ctx.translate(pos.x, pos.y)
        ctx.beginPath()
        ctx.arc(0, 0, pos.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(160, 130, 100, 0.2)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(160, 130, 100, 0.4)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()
      } else {
        this.drawBead(pos.x, pos.y, pos.radius, bead.color, rotation, bead.imageUrl)
      }
    })
  }

  drawBraceletWithPositions(
    beads: Array<{ color: string; radius: number; _placeholder?: boolean; imageUrl?: string; diameter?: number }>,
    beadPositions: Array<{ x: number; y: number; radius: number }>,
    draggedBeadPos: { index: number; x: number; y: number } | null
  ): void {
    const count = beads.length
    if (count === 0 || beadPositions.length !== count) return

    beads.forEach((bead, index) => {
      let x: number, y: number
      if (draggedBeadPos && index === draggedBeadPos.index) {
        x = draggedBeadPos.x
        y = draggedBeadPos.y
      } else {
        x = beadPositions[index].x
        y = beadPositions[index].y
      }
      const radius = beadPositions[index].radius

      if (bead._placeholder) {
        const ctx = this.ctx
        ctx.save()
        ctx.translate(x, y)
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(160, 130, 100, 0.2)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(160, 130, 100, 0.4)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()
      } else {
        this.drawBead(x, y, radius, bead.color, 0, bead.imageUrl)
      }
    })
  }
}
