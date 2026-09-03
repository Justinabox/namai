import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Scene,
  Vector2,
  Vector3,
} from 'three'
import { createNoise2D } from 'simplex-noise'
import alea from 'alea'

/**
 * Chunked contour terrain, ported from the Lumin scene in ThreeJSPlayground.
 *
 * A 2D simplex field is sampled on a grid; only samples that land inside one of
 * a few narrow value bands become cubes, which is what turns the noise into
 * stacked contour lines rather than a solid surface. Chunks are generated on
 * demand around a moving centre and dropped once they fall out of range.
 *
 * Differences from the original: no Tres/reactivity (a plain Scene is passed
 * in), chunk builds are queued so a frame never generates more than one, and
 * everything it allocates can be disposed.
 */

type Chunk = { mesh: InstancedMesh }

/** Height of the contour band a noise value falls into, or null for the gaps. */
function bandHeight(noise: number): number | null {
  if (noise > 0.87 && noise < 0.9) return 2
  if (noise > 0.77 && noise < 0.8) return 1.5
  if (noise > 0.57 && noise < 0.6) return 1
  if (noise > 0.37 && noise < 0.4) return 0.5
  if (noise > 0.17 && noise < 0.2) return 0
  return null
}

export type TerrainOptions = {
  seed?: string
  /** Grid samples per world unit. */
  segments?: number
  /** Noise frequency. */
  scale?: number
  /** Samples per chunk edge. */
  chunkSize?: number
  /** How far from the centre, in world units, chunks are kept. */
  range?: number
  /** Cube grey at the lowest and highest contour band, 0 to 1. */
  shade?: [number, number]
  /**
   * Cube edge as a fraction of the sample spacing. The original scene built its
   * box from the default segment count while spacing used the configured one,
   * so cubes came out half size with air between them. That accident is the
   * look, so it is the default here.
   */
  fill?: number
}

export class NoiseTerrain {
  private noise2D: (x: number, y: number) => number
  private scene: Scene
  private chunks = new Map<string, Chunk>()
  private queue: Vector2[] = []

  private segments: number
  private scale: number
  private chunkSize: number
  private range: number
  private shade: [number, number]

  private geometry: BoxGeometry
  private material: MeshLambertMaterial
  private center = new Vector2(0, 0)

  constructor(scene: Scene, options: TerrainOptions = {}) {
    const {
      seed = 'mineral-of-seed',
      segments = 16,
      scale = 0.15,
      chunkSize = 48,
      range = 7,
      shade = [0.45, 1],
      fill = 0.5,
    } = options

    this.scene = scene
    this.noise2D = createNoise2D(alea(seed))
    this.segments = segments
    this.scale = scale
    this.chunkSize = chunkSize
    this.range = range
    this.shade = shade

    const size = fill / segments
    this.geometry = new BoxGeometry(size, size, size)
    this.material = new MeshLambertMaterial()
  }

  private key(chunk: Vector2) {
    return `${chunk.x},${chunk.y}`
  }

  /** Chunk coordinates covering the kept range around the current centre. */
  private bounds() {
    const toChunk = (v: number) => Math.floor(v / this.chunkSize)
    return {
      minX: toChunk((this.center.x - this.range) * this.segments),
      maxX: toChunk((this.center.x + this.range) * this.segments),
      minY: toChunk((this.center.y - this.range) * this.segments),
      maxY: toChunk((this.center.y + this.range) * this.segments),
    }
  }

  /**
   * Recomputes which chunks should exist. Missing ones are queued nearest
   * first; chunks outside the range are disposed immediately.
   */
  updateCenter(center: Vector2) {
    this.center.copy(center)
    const { minX, maxX, minY, maxY } = this.bounds()

    for (const [key, chunk] of this.chunks) {
      const [x, y] = key.split(',').map(Number)
      if (x! < minX || x! > maxX || y! < minY || y! > maxY) {
        this.scene.remove(chunk.mesh)
        chunk.mesh.dispose()
        this.chunks.delete(key)
      }
    }

    const wanted: Vector2[] = []
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const chunk = new Vector2(x, y)
        if (this.chunks.has(this.key(chunk))) continue
        wanted.push(chunk)
      }
    }

    const cx = (this.center.x * this.segments) / this.chunkSize
    const cy = (this.center.y * this.segments) / this.chunkSize
    wanted.sort(
      (a, b) =>
        (a.x - cx) ** 2 + (a.y - cy) ** 2 - ((b.x - cx) ** 2 + (b.y - cy) ** 2),
    )
    this.queue = wanted
  }

  /** Builds up to `budget` queued chunks. Call once per frame. */
  processQueue(budget = 1) {
    for (let i = 0; i < budget; i++) {
      const next = this.queue.shift()
      if (!next) return
      if (this.chunks.has(this.key(next))) continue
      this.buildChunk(next)
    }
  }

  /** True while chunks are still pending, so a caller can prime before showing. */
  get pending() {
    return this.queue.length
  }

  private buildChunk(chunk: Vector2) {
    const startX = chunk.x * this.chunkSize
    const startY = chunk.y * this.chunkSize
    const [dark, light] = this.shade

    const positions: Vector3[] = []
    const colors: Color[] = []

    for (let x = startX; x < startX + this.chunkSize; x++) {
      for (let y = startY; y < startY + this.chunkSize; y++) {
        const noise =
          (this.noise2D(
            (x / this.segments) * this.scale,
            (y / this.segments) * this.scale,
          ) +
            1) /
          2

        const height = bandHeight(noise)
        if (height === null) continue

        positions.push(new Vector3(x / this.segments, height, y / this.segments))
        // Higher contours burn brighter, so the bands separate against the dark.
        colors.push(new Color().setScalar(dark + (light - dark) * (height / 2)))
      }
    }

    const mesh = new InstancedMesh(this.geometry, this.material, positions.length)
    mesh.frustumCulled = false

    const matrix = new Matrix4()
    positions.forEach((position, index) => {
      mesh.setMatrixAt(index, matrix.makeTranslation(position.x, position.y, position.z))
      mesh.setColorAt(index, colors[index]!)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

    this.chunks.set(this.key(chunk), { mesh })
    this.scene.add(mesh)
  }

  dispose() {
    for (const chunk of this.chunks.values()) {
      this.scene.remove(chunk.mesh)
      chunk.mesh.dispose()
    }
    this.chunks.clear()
    this.queue = []
    this.geometry.dispose()
    this.material.dispose()
  }
}
