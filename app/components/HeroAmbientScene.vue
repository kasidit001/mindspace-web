<script setup lang="ts">
// A Three.js constellation layer behind the hero's island illustration —
// dense glow-dust, a full web of connected nodes with size hierarchy, and
// cursor parallax that tilts the whole scene toward the pointer. Meant to
// be a real focal point (not just ambient texture), in the same
// indigo/violet palette as the hero's own gradient — echoing the real
// course-network visual on /map. Purely decorative (no raycasting/click
// handling — HeroGameMap's pins still own all the click interaction in
// this hero), so pointer-events stay off the canvas itself; the parallax
// listens on window instead so it doesn't block clicks reaching the pins.
import * as THREE from 'three'

const containerEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

let dispose: (() => void) | null = null

// accent-400 / accent-300 / ai-400 / ai-300 — the same indigo/violet pair
// the hero's own gradient and glow blobs already use.
const PARTICLE_COLORS = [0x818cf8, 0xa5b4fc, 0xc084fc, 0xd8b4fe]
const NODE_COUNT = 16
const HERO_NODE_EVERY = 4 // every 4th node is a larger "hero" node
const DUST_COUNT = 220
const EXTRA_LINKS = 7 // cross-links beyond the base ring, for a fuller web

function buildScene(container: HTMLElement, canvas: HTMLCanvasElement) {
  const stage = useThreeStage(canvas, container, { fov: 45, alpha: true })
  const baseCameraPos = new THREE.Vector3(0, 0, 6)
  stage.camera.position.copy(baseCameraPos)

  const group = new THREE.Group()
  stage.scene.add(group)

  // Dense glow-dust filling the volume around/behind the island — real
  // atmosphere rather than a faint sprinkle.
  const dustPositions = new Float32Array(DUST_COUNT * 3)
  const dustColors = new Float32Array(DUST_COUNT * 3)
  const tmpColor = new THREE.Color()
  for (let i = 0; i < DUST_COUNT; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 11
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 7
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1
    tmpColor.set(PARTICLE_COLORS[i % PARTICLE_COLORS.length])
    tmpColor.toArray(dustColors, i * 3)
  }
  const dustGeom = new THREE.BufferGeometry()
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  dustGeom.setAttribute('color', new THREE.BufferAttribute(dustColors, 3))
  const dustMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const dust = new THREE.Points(dustGeom, dustMat)
  group.add(dust)

  // A full constellation of nodes — a few larger "hero" nodes mixed with
  // many smaller ones, for real visual hierarchy instead of a flat scatter.
  interface NodeEntry { mesh: THREE.Mesh; glow: THREE.Mesh; basePos: THREE.Vector3; phase: number }
  const nodes: NodeEntry[] = []
  const nodePositions: THREE.Vector3[] = []
  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = (i / NODE_COUNT) * Math.PI * 2
    const radius = 2.8 + Math.sin(i * 1.7) * 0.9
    const pos = new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.3) * 1.6,
      Math.sin(angle) * radius * 0.45 - 1.5
    )
    nodePositions.push(pos)

    const isHero = i % HERO_NODE_EVERY === 0
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length]
    const radiusSize = isHero ? 0.09 : 0.045
    const geometry = new THREE.SphereGeometry(radiusSize, 16, 16)
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(pos)
    group.add(mesh)

    const glowGeom = new THREE.SphereGeometry(isHero ? 0.28 : 0.15, 16, 16)
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: isHero ? 0.35 : 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const glow = new THREE.Mesh(glowGeom, glowMat)
    glow.position.copy(pos)
    group.add(glow)

    nodes.push({ mesh, glow, basePos: pos.clone(), phase: i * 1.1 })
  }

  // Base ring connecting consecutive nodes, plus a handful of cross-links
  // between non-adjacent nodes so it reads as a real web, not just a loop.
  const linePositions: THREE.Vector3[] = [...nodePositions, nodePositions[0]]
  for (let i = 0; i < EXTRA_LINKS; i++) {
    const a = Math.floor((i * 2.7) % NODE_COUNT)
    const b = Math.floor((a + 3 + i) % NODE_COUNT)
    linePositions.push(nodePositions[a], nodePositions[b])
  }
  const lineGeom = new THREE.BufferGeometry().setFromPoints(linePositions)
  const lineMat = new THREE.LineBasicMaterial({ color: 0xa5b4fc, transparent: true, opacity: 0.28 })
  group.add(new THREE.LineSegments(lineGeom, lineMat))

  // Cursor parallax: the group tilts toward the pointer, clamped to a
  // natural max so it never over-rotates when the cursor is far away.
  // Listens on window (not the canvas, which stays pointer-events:none)
  // so it never intercepts clicks meant for the island's pins.
  const pointerTarget = { x: 0, y: 0 }
  function onPointerMove(e: PointerEvent) {
    const rect = container.getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
    pointerTarget.x = Math.max(-1.3, Math.min(1.3, nx))
    pointerTarget.y = Math.max(-1.3, Math.min(1.3, ny))
  }
  window.addEventListener('pointermove', onPointerMove)

  const reduceMotion = prefersReducedMotion()
  let elapsed = 0
  let parallaxX = 0
  let parallaxY = 0
  stage.loop((dt) => {
    elapsed += dt

    if (!reduceMotion) {
      parallaxX += (pointerTarget.x - parallaxX) * 0.04
      parallaxY += (pointerTarget.y - parallaxY) * 0.04
      group.rotation.y = elapsed * 0.05 + parallaxX * 0.35
      group.rotation.x = -parallaxY * 0.2
      stage.camera.position.x = baseCameraPos.x + parallaxX * 0.4
      stage.camera.position.y = baseCameraPos.y - parallaxY * 0.25
      stage.camera.lookAt(0, 0, -1)
      dust.rotation.y -= dt * 0.02

      for (const n of nodes) {
        n.mesh.position.y = n.basePos.y + Math.sin(elapsed * 0.6 + n.phase) * 0.14
        n.glow.position.y = n.mesh.position.y
      }
    }
  })

  return () => {
    window.removeEventListener('pointermove', onPointerMove)
    stage.dispose()
  }
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
