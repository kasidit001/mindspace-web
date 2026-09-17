<script setup lang="ts">
// Decorative 3D backdrop for the landing hero: a slowly-turning constellation
// of points (fibonacci-sphere distribution, nearest-neighbor edges), in the
// same yellow/green terminal palette as the rest of the site. Purely
// atmospheric — aria-hidden, pointer-events-none, no interaction — and it
// establishes the visual language the /map skill-map later makes literal
// and functional (real lessons as nodes, real progress as connections).
import * as THREE from 'three'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const containerEl = ref<HTMLDivElement | null>(null)
let dispose: (() => void) | null = null

const ACCENT = 0xfff066 // accent-400
const AI = 0x00ff66 // ai-400
const EDGE_DISTANCE = 1.7
const POINT_COUNT = 90

// Fibonacci-sphere distribution: evenly spread points over a sphere without
// the pole-clustering a naive random lat/long scatter would produce.
function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = goldenAngle * i
    points.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius))
  }
  return points
}

onMounted(() => {
  if (!canvasEl.value || !containerEl.value) return

  const stage = useThreeStage(canvasEl.value, containerEl.value, { fov: 45 })
  stage.camera.position.set(0, 0, 6.5)

  const group = new THREE.Group()
  stage.scene.add(group)

  const nodePositions = fibonacciSphere(POINT_COUNT, 3.1)

  // Points cloud — most nodes are dim terminal-green, a handful are the
  // brighter accent yellow, echoing the two brand colors without either
  // one dominating.
  const pointsGeometry = new THREE.BufferGeometry().setFromPoints(nodePositions)
  const colors = new Float32Array(POINT_COUNT * 3)
  const accentColor = new THREE.Color(ACCENT)
  const aiColor = new THREE.Color(AI)
  for (let i = 0; i < POINT_COUNT; i++) {
    const c = i % 5 === 0 ? accentColor : aiColor
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.075,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true
  })
  group.add(new THREE.Points(pointsGeometry, pointsMaterial))

  // Edges — connect nearby nodes only, so it reads as a constellation
  // rather than a solid wireframe ball.
  const edgePositions: number[] = []
  for (let i = 0; i < nodePositions.length; i++) {
    for (let j = i + 1; j < nodePositions.length; j++) {
      if (nodePositions[i].distanceTo(nodePositions[j]) < EDGE_DISTANCE) {
        edgePositions.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z)
        edgePositions.push(nodePositions[j].x, nodePositions[j].y, nodePositions[j].z)
      }
    }
  }
  const edgeGeometry = new THREE.BufferGeometry()
  edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3))
  const edgeMaterial = new THREE.LineBasicMaterial({ color: AI, transparent: true, opacity: 0.12 })
  group.add(new THREE.LineSegments(edgeGeometry, edgeMaterial))

  const reduceMotion = prefersReducedMotion()
  let mouseX = 0
  function onPointerMove(e: PointerEvent) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1
  }
  window.addEventListener('pointermove', onPointerMove)

  stage.loop((dt) => {
    if (!reduceMotion) {
      group.rotation.y += dt * 0.06
      group.rotation.x += dt * 0.012
    }
    // Gentle parallax toward the cursor, independent of the idle spin.
    stage.camera.position.x += (mouseX * 0.6 - stage.camera.position.x) * 0.03
    stage.camera.lookAt(0, 0, 0)
  })

  dispose = () => {
    window.removeEventListener('pointermove', onPointerMove)
    stage.dispose()
  }
})

onBeforeUnmount(() => dispose?.())
</script>

<template>
  <div ref="containerEl" class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <canvas ref="canvasEl" class="h-full w-full" />
  </div>
</template>
