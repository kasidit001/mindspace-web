<script setup lang="ts">
// A quiet Three.js layer behind the hero's island illustration — small
// drifting glow-dust plus a loose constellation of a few larger nodes with
// connecting lines, echoing the real course-network visual on /map without
// competing with it. Purely decorative/ambient (no raycasting, no click
// handling — HeroGameMap's pins own all the interaction in this hero), so
// pointer-events stay off and it never intercepts a click meant for a pin.
import * as THREE from 'three'

const containerEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

let dispose: (() => void) | null = null

// accent-400 / accent-300 / ai-400 / ai-300 — the same indigo/violet pair
// the hero's own gradient and glow blobs already use.
const PARTICLE_COLORS = [0x818cf8, 0xa5b4fc, 0xc084fc, 0xd8b4fe]
const NODE_COUNT = 6
const DUST_COUNT = 90

function buildScene(container: HTMLElement, canvas: HTMLCanvasElement) {
  const stage = useThreeStage(canvas, container, { fov: 45, alpha: true })
  stage.camera.position.set(0, 0, 6)

  const group = new THREE.Group()
  stage.scene.add(group)

  // Fine glow-dust: a soft, mostly-static field of small additive points
  // filling the volume behind the island — depth and atmosphere, nothing
  // that reads as "content" on its own.
  const dustPositions = new Float32Array(DUST_COUNT * 3)
  const dustColors = new Float32Array(DUST_COUNT * 3)
  const tmpColor = new THREE.Color()
  for (let i = 0; i < DUST_COUNT; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 9
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 6
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1
    tmpColor.set(PARTICLE_COLORS[i % PARTICLE_COLORS.length])
    tmpColor.toArray(dustColors, i * 3)
  }
  const dustGeom = new THREE.BufferGeometry()
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  dustGeom.setAttribute('color', new THREE.BufferAttribute(dustColors, 3))
  const dustMat = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const dust = new THREE.Points(dustGeom, dustMat)
  group.add(dust)

  // A handful of larger constellation nodes, loosely connected — a faint
  // preview of the real course network on /map, sitting behind the island.
  interface NodeEntry { mesh: THREE.Mesh; glow: THREE.Mesh; basePos: THREE.Vector3; phase: number }
  const nodes: NodeEntry[] = []
  const nodePositions: THREE.Vector3[] = []
  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = (i / NODE_COUNT) * Math.PI * 2
    const radius = 2.6 + Math.sin(i * 1.7) * 0.6
    const pos = new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.3) * 1.1,
      Math.sin(angle) * radius * 0.4 - 1.5
    )
    nodePositions.push(pos)

    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length]
    const geometry = new THREE.SphereGeometry(0.05, 12, 12)
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(pos)
    group.add(mesh)

    const glowGeom = new THREE.SphereGeometry(0.16, 12, 12)
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const glow = new THREE.Mesh(glowGeom, glowMat)
    glow.position.copy(pos)
    group.add(glow)

    nodes.push({ mesh, glow, basePos: pos.clone(), phase: i * 1.1 })
  }

  // Connect each node to its neighbor — a loose ring, not a dense web.
  const lineGeom = new THREE.BufferGeometry().setFromPoints([...nodePositions, nodePositions[0]])
  const lineMat = new THREE.LineBasicMaterial({ color: 0xa5b4fc, transparent: true, opacity: 0.22 })
  group.add(new THREE.Line(lineGeom, lineMat))

  const reduceMotion = prefersReducedMotion()
  let elapsed = 0
  stage.loop((dt) => {
    elapsed += dt
    if (!reduceMotion) {
      group.rotation.y += dt * 0.05
      dust.rotation.y -= dt * 0.02
      for (const n of nodes) {
        n.mesh.position.y = n.basePos.y + Math.sin(elapsed * 0.6 + n.phase) * 0.12
        n.glow.position.y = n.mesh.position.y
      }
    }
  })

  return () => stage.dispose()
}

watch(
  [containerEl, canvasEl],
  ([container, canvas]) => {
    dispose?.()
    dispose = null
    if (!container || !canvas) return
    dispose = buildScene(container, canvas)
  },
  { immediate: true }
)

onBeforeUnmount(() => dispose?.())
</script>

<template>
  <div ref="containerEl" class="pointer-events-none absolute inset-0" aria-hidden="true">
    <ClientOnly>
      <canvas ref="canvasEl" class="block h-full w-full" />
    </ClientOnly>
  </div>
</template>
