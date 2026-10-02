<script setup lang="ts">
// The reference video's own closing shot: an abstract, non-literal 3D
// shape (a radial fan of thin blades) slowly rotating, grayscale — a quiet
// closing "mark" rather than another data-bearing scene. Purely
// decorative, same pattern as HeroAmbientScene.vue (useThreeStage, no
// raycasting, pointer-events off).
import * as THREE from 'three'

const containerEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

let dispose: (() => void) | null = null

const BLADE_COUNT = 48

function buildScene(container: HTMLElement, canvas: HTMLCanvasElement) {
  const stage = useThreeStage(canvas, container, { fov: 40, alpha: true })
  stage.camera.position.set(0, 0, 7)

  const group = new THREE.Group()
  stage.scene.add(group)

  // Thin elongated planes arranged radially, each tilted slightly so the
  // whole shape reads as a faceted fan/blade cluster rather than a flat
  // pinwheel — grayscale only, this is texture/mood, not a data chart.
  const bladeGeom = new THREE.PlaneGeometry(0.22, 3.2)
  for (let i = 0; i < BLADE_COUNT; i++) {
    const t = i / BLADE_COUNT
    const angle = t * Math.PI * 2
    const shade = 0.55 + 0.35 * Math.sin(t * Math.PI * 6)
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(shade, shade, shade),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    const blade = new THREE.Mesh(bladeGeom, material)
    blade.position.set(Math.cos(angle) * 1.1, Math.sin(angle) * 1.1, Math.sin(t * Math.PI * 4) * 0.6)
    blade.rotation.z = angle + Math.PI / 2
    blade.rotation.y = Math.sin(t * Math.PI * 3) * 0.5
    group.add(blade)
  }

  const reduceMotion = prefersReducedMotion()
  stage.loop((dt) => {
    if (!reduceMotion) {
      group.rotation.z += dt * 0.08
      group.rotation.x = Math.sin(performance.now() * 0.0002) * 0.15
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
