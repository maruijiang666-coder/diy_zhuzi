// src/lib/Renderer.ts

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private canvas: any
  private imageCache: Record<string, any> = {}

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, canvas?: any) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.canvas = canvas
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  drawPlate(cx: number, cy: number, radius: number): void {
    const ctx = this.ctx
    const entry = this.imageCache['plate_bg']

    ctx.save()

    if (entry && entry.ready && entry.image) {
      const r = radius * 1.05
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(entry.image, cx - r, cy - r, r * 2, r * 2)
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 3
      ctx.shadowOffsetY = 3

      const gradient = ctx.createRadialGradient(
        cx - radius * 0.3, cy - radius * 0.3, 0,
        cx, cy, radius
      )
      gradient.addColorStop(0, '#D2B48C')
      gradient.addColorStop(0.7, '#C4A882')
      gradient.addColorStop(1, '#8B7355')

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.strokeStyle = '#A0522D'
      ctx.lineWidth = 3
      ctx.stroke()
    }

    ctx.restore()
  }

  drawBead(x: number, y: number, radius: number, color: string, angle: number = 0, image?: string): void {
    const ctx = this.ctx
    const entry = image ? this.imageCache[image] : null

    try {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      if (entry && entry.ready && entry.offscreen) {
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.clip()
        ctx.shadowColor = 'transparent'
        ctx.drawImage(entry.offscreen, -radius, -radius, radius * 2, radius * 2)
      } else {
        ctx.beginPath()
        ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fill()
      }

      ctx.restore()
    } catch (e) {
      try { ctx.restore() } catch (e2) {}
    }
  }

  drawBracelet(beads: any[], cx: number, cy: number, radius: number): void {
    const count = beads.length
    if (count === 0) return

    const beadRadius = beads[0].radius || 15
    const tightRadius = count > 1 ? beadRadius / Math.sin(Math.PI / count) : 0

    beads.forEach((bead, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2
      const x = cx + Math.cos(angle) * tightRadius
      const y = cy + Math.sin(angle) * tightRadius
      const rotation = angle + Math.PI / 2
      this.drawBead(x, y, beadRadius, bead.color, rotation, bead.image)
    })
  }

  drawBraceletWithAngles(
    beads: any[],
    cx: number,
    cy: number,
    angles: number[],
    draggedBeadPos: { index: number; x: number; y: number } | null,
    beadRadius: number
  ): void {
    const count = beads.length
    if (count === 0 || !angles || angles.length !== count) return

    if (beadRadius === undefined) beadRadius = (beads[0].radius || 5) * 3
    const tightRadius = count > 1 ? beadRadius / Math.sin(Math.PI / count) : 0

    beads.forEach((bead, index) => {
      let x: number, y: number
      if (draggedBeadPos && index === draggedBeadPos.index) {
        x = draggedBeadPos.x
        y = draggedBeadPos.y
      } else {
        x = cx + Math.cos(angles[index]) * tightRadius
        y = cy + Math.sin(angles[index]) * tightRadius
      }
      const rotation = angles[index] + Math.PI / 2

      if (bead._placeholder) {
        const ctx = this.ctx
        ctx.save()
        ctx.translate(x, y)
        ctx.beginPath()
        ctx.arc(0, 0, beadRadius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(160, 130, 100, 0.2)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(160, 130, 100, 0.4)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()
      } else {
        this.drawBead(x, y, beadRadius, bead.color, rotation, bead.image)
      }
    })
  }
}
