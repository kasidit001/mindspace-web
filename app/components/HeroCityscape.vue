<script setup lang="ts">
// A real 3D cityscape (WebGL via three.js), one building per course,
// replacing the flat-SVG single tower: "a building" read fine for one
// course, but didn't read as a *city* of courses the way several do.
// Shares the same hand-rolled scene plumbing (~/composables/useThreeStage)
// and OrbitControls pattern as /map's skill-map — see that page for the
// house conventions this follows (canvas ref + watch-driven rebuild,
// raycast-for-hover/click, disposal on unmount).
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { MapPin } from '@lucide/vue'
import type { Course } from '~/types/course'
import type { CourseLevel } from '~/utils/courseLevel'

const { t } = useLanguage()
const props = defineProps<{ courses: Course[] }>()

const LEVEL_COLOR: Record<CourseLevel, number> = {
  Beginner: 0x10b981,
  Intermediate: 0x6366f1,
  Advanced: 0xa855f7
}
// Pastel per-level tint for lit windows — same legend-free trick the old
// SVG tower used: the facade itself encodes difficulty.
const LEVEL_WINDOW: Record<CourseLevel, string> = {
  Beginner: '#9df2cf',
  Intermediate: '#c2c5ff',
  Advanced: '#edc0ff'
}
const ROOF_COLOR = 0x2f3648
const ACCENT = 0xec4899

const containerEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

const selectedIndex = ref<number | null>(null)
const hoveredIndex = ref<number | null>(null)
const cardVisible = ref(false)
const cardScreenPos = ref({ left: '50%', top: '50%' })
// The building nearest the right edge would otherwise push the card past
// the hero panel's own rounded edge and get clipped — flip it to the left
// of the marker instead of asking the panel to allow overflow.
const cardFlipped = ref(false)

let dispose: (() => void) | null = null

function firstLessonId(course: Course): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}
function goToCourse(course: Course) {
  const lessonId = firstLessonId(course)
  navigateTo(lessonId ? `/courses/${lessonId}` : '/courses')
}

const selectedCourse = computed<Course | null>(() =>
  selectedIndex.value !== null ? props.courses[selectedIndex.value] ?? null : null
)

// Deterministic pseudo-random (not Math.random()) so layout/texture noise
// never differs between a rebuild and the next — same reasoning the old
// SVG hero's `hash()` had, just no longer an SSR-hydration concern now
// that this whole component only ever renders client-side.
function hash(i: number, salt: number): number {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return v - Math.floor(v)
}

/** A small lit-window grid, baked once per building as a CanvasTexture —
 *  far cheaper than real window geometry, and the lit/unlit pattern is a
 *  free bit of per-building texture variety. */
function buildWindowTexture(level: CourseLevel, seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#3a4152'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const cols = 3
  const rows = 8
  const cellW = canvas.width / cols
  const cellH = canvas.height / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = hash(r * cols + c, seed) > 0.35
      ctx.fillStyle = lit ? LEVEL_WINDOW[level] : '#2b3140'
      const pad = 2
      ctx.fillRect(c * cellW + pad, r * cellH + pad, cellW - pad * 2, cellH - pad * 2)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** A simple sidewalk-grid texture for the plaza ground, repeated across
 *  the whole circle rather than one texture per tile. */
function buildGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#343b4a'
  ctx.fillRect(0, 0, 128, 128)
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth = 2
  for (let i = 0; i <= 128; i += 32) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, 128)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(128, i)
    ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

interface BuildingEntry {
  group: THREE.Group
  box: THREE.Mesh
  marker: THREE.Mesh
  index: number
}

const MAX_BUILDINGS = 16

function buildScene(container: HTMLElement, canvas: HTMLCanvasElement, list: Course[]) {
  const stage = useThreeStage(canvas, container, { fov: 45, alpha: true })
  stage.scene.fog = new THREE.Fog(0x0b0712, 13, 30)

  const n = Math.min(list.length, MAX_BUILDINGS)
  const cols = Math.ceil(Math.sqrt(n))
  const spacing = 2.5

  stage.scene.add(new THREE.HemisphereLight(0x8899cc, 0x15101f, 1.15))
  const sun = new THREE.DirectionalLight(0xffffff, 1.1)
  sun.position.set(6, 10, 4)
  stage.scene.add(sun)
  stage.scene.add(new THREE.AmbientLight(0xffffff, 0.12))

  const groundTexture = buildGroundTexture()
  groundTexture.repeat.set(cols * 2, cols * 2)
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(cols * spacing * 1.15, 48),
    new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 1 })
  )
  ground.rotation.x = -Math.PI / 2
  stage.scene.add(ground)

  const buildings: BuildingEntry[] = []
  let tallestIndex = 0
  let tallestHeight = 0

  list.slice(0, n).forEach((course, i) => {
    const level = getCourseLevel(course)
    const lessonCount = Math.max(1, course.lessons.length)
    const height = 1.3 + Math.min(lessonCount, 20) * 0.2

    const row = Math.floor(i / cols)
    const col = i % cols
    const gx = (col - (cols - 1) / 2) * spacing + (hash(i, 50) - 0.5) * 0.5
    const gz = (row - (cols - 1) / 2) * spacing + (hash(i, 51) - 0.5) * 0.5
    const width = 0.76 + hash(i, 52) * 0.3
    const depth = 0.76 + hash(i, 53) * 0.3

    const sideMat = new THREE.MeshStandardMaterial({ map: buildWindowTexture(level, i), roughness: 0.75 })
    const topMat = new THREE.MeshStandardMaterial({ color: ROOF_COLOR, roughness: 0.9 })
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      [sideMat, sideMat, topMat, topMat, sideMat, sideMat]
    )
    box.position.set(0, height / 2, 0)

    const group = new THREE.Group()
    group.position.set(gx, 0, gz)
    group.add(box)

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshStandardMaterial({
        color: LEVEL_COLOR[level],
        emissive: LEVEL_COLOR[level],
        emissiveIntensity: 0.6
      })
    )
    marker.position.set(0, height + 0.35, 0)
    group.add(marker)

    stage.scene.add(group)
    buildings.push({ group, box, marker, index: i })

    if (height > tallestHeight) {
      tallestHeight = height
      tallestIndex = i
    }
  })

  // A small flagpole on the tallest building only — one focal flourish
  // rather than repeating it everywhere.
  const tallest = buildings[tallestIndex]
  if (tallest) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0xcbd0dc })
    )
    pole.position.set(0, tallestHeight + 0.2, 0)
    tallest.group.add(pole)
    const flag = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.18, 3),
      new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 0.4 })
    )
    flag.rotation.z = Math.PI / 2
    flag.position.set(0.1, tallestHeight + 0.38, 0)
    tallest.group.add(flag)
  }

  const radius = Math.max(cols * spacing * 1.15, 4)
  stage.camera.position.set(radius * 0.55, radius * 0.52, radius * 0.75)

  const controls = new OrbitControls(stage.camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enableZoom = false
  controls.enablePan = false
  controls.minPolarAngle = Math.PI * 0.18
  controls.maxPolarAngle = Math.PI * 0.46
  controls.target.set(0, tallestHeight * 0.3, 0)

  const reduceMotion = prefersReducedMotion()
  controls.autoRotate = !reduceMotion
  controls.autoRotateSpeed = 0.6
  // Pause the idle spin while a visitor is actually dragging, resume a
  // couple seconds after they let go — same spirit as /map not fighting
  // the user's own input.
  let resumeTimer: ReturnType<typeof setTimeout> | undefined
  controls.addEventListener('start', () => {
    controls.autoRotate = false
  })
  controls.addEventListener('end', () => {
    if (reduceMotion) return
    clearTimeout(resumeTimer)
    resumeTimer = setTimeout(() => {
      controls.autoRotate = true
    }, 2200)
  })

  const raycaster = new THREE.Raycaster()
  const pointerNDC = new THREE.Vector2()

  function entryAtPointer(clientX: number, clientY: number): BuildingEntry | null {
    const rect = canvas.getBoundingClientRect()
    pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointerNDC, stage.camera)
    const hit = raycaster.intersectObjects(buildings.map((b) => b.box))[0]
    if (!hit) return null
    return buildings.find((b) => b.box === hit.object) ?? null
  }

  function onPointerMove(e: PointerEvent) {
    const entry = entryAtPointer(e.clientX, e.clientY)
    hoveredIndex.value = entry?.index ?? null
    canvas.style.cursor = entry ? 'pointer' : 'grab'
  }
  function onClick(e: PointerEvent) {
    const entry = entryAtPointer(e.clientX, e.clientY)
    if (entry) selectedIndex.value = entry.index
  }
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('click', onClick)

  const projected = new THREE.Vector3()
  stage.loop(() => {
    controls.update()

    for (const b of buildings) {
      const isActive = b.index === hoveredIndex.value || b.index === selectedIndex.value
      const target = isActive ? 1.6 : 1
      const current = (b.marker.userData.scale as number | undefined) ?? 1
      const next = current + (target - current) * 0.25
      b.marker.userData.scale = next
      b.marker.scale.setScalar(next)
    }

    const selected = selectedIndex.value !== null ? buildings[selectedIndex.value] : null
    if (selected) {
      stage.scene.updateMatrixWorld(true)
      stage.camera.updateMatrixWorld(true)
      projected.setFromMatrixPosition(selected.marker.matrixWorld)
      projected.project(stage.camera)
      const rect = container.getBoundingClientRect()
      cardScreenPos.value = {
        left: `${((projected.x + 1) / 2) * rect.width}px`,
        top: `${((1 - projected.y) / 2) * rect.height}px`
      }
      cardFlipped.value = projected.x > 0.1
      cardVisible.value = projected.z < 1
    } else {
      cardVisible.value = false
    }
  })

  return () => {
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('click', onClick)
    clearTimeout(resumeTimer)
    controls.dispose()
    stage.dispose()
  }
}

watch(
  [() => props.courses, containerEl, canvasEl],
  ([list, container, canvas]) => {
    dispose?.()
    dispose = null
    if (!list?.length || !container || !canvas) return
    dispose = buildScene(container, canvas, list)
    if (selectedIndex.value === null) selectedIndex.value = 0
  },
  { immediate: true }
)

onBeforeUnmount(() => dispose?.())
</script>

<template>
  <div ref="containerEl" class="relative h-full min-h-[24rem] w-full select-none">
    <ClientOnly>
      <canvas ref="canvasEl" class="h-full w-full cursor-grab touch-none active:cursor-grabbing" />
      <template #fallback>
        <div class="flex h-full w-full items-center justify-center">
          <div class="size-8 animate-pulse rounded-full bg-accent-500/30" />
        </div>
      </template>
    </ClientOnly>

    <div
      v-if="selectedCourse && cardVisible"
      class="pointer-events-none absolute z-10 w-48 -translate-y-1/2 rounded-xl bg-white p-3 text-left shadow-2xl shadow-black/30"
      :class="cardFlipped ? '-translate-x-[calc(100%+16px)]' : 'translate-x-4'"
      :style="cardScreenPos"
    >
      <div
        class="absolute top-1/2 h-3 w-3 -translate-y-1.5 rotate-45 bg-white"
        :class="cardFlipped ? 'left-full -translate-x-1.5' : 'right-full translate-x-1.5'"
        aria-hidden="true"
      />
      <span class="flex size-7 items-center justify-center rounded-full bg-ai-50">
        <MapPin :size="14" :stroke-width="2" class="text-ai-600" />
      </span>
      <p class="font-display mt-2 text-[13px] font-bold leading-snug text-zinc-900">{{ selectedCourse.title }}</p>
      <p class="mt-1 line-clamp-1 text-xs text-zinc-500">
        {{ selectedCourse.lessons.length }} {{ t(selectedCourse.lessons.length === 1 ? 'common.lesson' : 'common.lessons') }}
      </p>
      <button
        type="button"
        class="pointer-events-auto mt-2.5 w-full rounded-md bg-zinc-900 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
        @click="goToCourse(selectedCourse)"
      >
        {{ t('landing.startCourse') }}
      </button>
    </div>
  </div>
</template>
