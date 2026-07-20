// src/lib/PhysicsEngine.ts

export class PhysicsEngine {
  engine: any = null
  world: any = null
  plateBodies: any[] = []
  beadBodies: any[] = []
  private Matter: any = null

  init(Matter: any): void {
    this.Matter = Matter
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 }
    })
    this.world = this.engine.world
  }

  createPlate(cx: number, cy: number, radius: number): void {
    const Matter = this.Matter
    const segments = 32
    const bodies: any[] = []

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2
      const angle2 = ((i + 1) / segments) * Math.PI * 2

      const x1 = cx + Math.cos(angle1) * radius
      const y1 = cy + Math.sin(angle1) * radius
      const x2 = cx + Math.cos(angle2) * radius
      const y2 = cy + Math.sin(angle2) * radius

      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2
      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
      const angle = Math.atan2(y2 - y1, x2 - x1)

      const segment = Matter.Bodies.rectangle(midX, midY, length, 5, {
        isStatic: true,
        angle: angle,
        render: { visible: false }
      })

      bodies.push(segment)
    }

    const bottom = Matter.Bodies.rectangle(cx, cy + radius - 10, radius * 1.5, 10, {
      isStatic: true,
      render: { visible: false }
    })

    bodies.push(bottom)
    this.plateBodies = bodies
    Matter.World.add(this.world, bodies)
  }

  shootBead(x: number, y: number, angle: number, speed: number, radius: number): any {
    const Matter = this.Matter

    const bead = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.5,
      friction: 0.15,
      frictionAir: 0.05,
      density: 0.003,
      render: { visible: false }
    })

    Matter.Body.setVelocity(bead, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    })

    this.beadBodies.push(bead)
    Matter.World.add(this.world, bead)

    return bead
  }

  update(delta: number): void {
    this.Matter.Engine.update(this.engine, delta)
  }

  getBeadPositions(): Array<{ x: number; y: number; angle: number }> {
    return this.beadBodies.map(body => ({
      x: body.position.x,
      y: body.position.y,
      angle: body.angle
    }))
  }

  areBeadsSettled(): boolean {
    if (this.beadBodies.length === 0) return true
    return this.beadBodies.every(body => {
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2)
      return speed < 0.5
    })
  }

  clearBeads(): void {
    this.beadBodies.forEach(body => {
      this.Matter.World.remove(this.world, body)
    })
    this.beadBodies = []
  }

  destroy(): void {
    this.Matter.World.clear(this.world)
    this.Matter.Engine.clear(this.engine)
  }
}
