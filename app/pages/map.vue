<script setup lang="ts">
// The "not just take a course every day" answer: every lesson across every
// course laid out as one explorable 3D path instead of a flat accordion
// list. Real data only — node state comes straight from useCourses() +
// the existing progress store, same as the sidebar tree. No new backend
// needed for this; streaks/achievements/playground would need one, which
// is why they're not attempted here.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RefreshCw, Unplug } from '@lucide/vue'
import type { Course, LessonSummary } from '~/types/course'

definePageMeta({ layout: 'course' })

const { data: courses, status, error, refresh, pending } = useCourses()
const progress = useProgressStore()
const { t, lang } = useLanguage()

const containerEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const tooltipEl = ref<HTMLDivElement | null>(null)

const hovered = ref<{ lesson: LessonSummary; course: Course } | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

let dispose: (() => void) | null = null

const ROW_SPACING = 2.3
const NODE_SPACING = 1.05
const COLOR_DONE = 0x10b981 // success-500
const COLOR_NEXT = 0x6366f1 // accent-500
const COLOR_UPCOMING = 0x9ca3af

interface NodeEntry {
  mesh: THREE.Mesh
  glow: THREE.Mesh | null
  lesson: LessonSummary
  course: Course
  state: 'done' | 'next' | 'upcoming'
  basePosition: THREE.Vector3
}

function buildScene(container: HTMLElement, canvas: HTMLCanvasElement, list: Course[]) {
  const stage = useThreeStage(canvas, container, { fov: 55, alpha: true })
  stage.camera.position.set(0, 3.2, 9)

  const controls = new OrbitControls(stage.camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 3
  controls.maxDistance = 22
  controls.target.set(0, 0, 0)

  const nodes: NodeEntry[] = []
  const nodeGroup = new THREE.Group()
  stage.scene.add(nodeGroup)

  list.forEach((course, rowIndex) => {
    const lessons = [...course.lessons].sort((a, b) => a.order - b.order)
    const z = (rowIndex - (list.length - 1) / 2) * ROW_SPACING

    // Which lesson is "up next" — the first not-completed one in order.
    const nextIndex = lessons.findIndex((l) => !progress.isCompleted(l.id))

    const rowPositions: THREE.Vector3[] = []

    lessons.forEach((lesson, i) => {
      const x = (i - (lessons.length - 1) / 2) * NODE_SPACING
      const y = Math.sin(i * 0.55 + rowIndex * 1.3) * 0.3
      const pos = new THREE.Vector3(x, y, z)
      rowPositions.push(pos)

      const done = progress.isCompleted(lesson.id)
      const state: NodeEntry['state'] = done ? 'done' : i === nextIndex ? 'next' : 'upcoming'
      const color = state === 'done' ? COLOR_DONE : state === 'next' ? COLOR_NEXT : COLOR_UPCOMING

      const geometry = new THREE.SphereGeometry(0.11, 20, 20)
      const material =
        state === 'upcoming'
          ? new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.6 })
          : new THREE.MeshBasicMaterial({ color })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(pos)
      nodeGroup.add(mesh)

      // Cheap "glow": a larger transparent additive sphere behind done/next
      // nodes — no post-processing pipeline needed for a subtle halo.
      let glow: THREE.Mesh | null = null
      if (state !== 'upcoming') {
        const glowGeom = new THREE.SphereGeometry(0.22, 16, 16)
        const glowMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
        glow = new THREE.Mesh(glowGeom, glowMat)
        glow.position.copy(pos)
        nodeGroup.add(glow)
      }

      nodes.push({ mesh, glow, lesson, course, state, basePosition: pos.clone() })
    })

    // Connect consecutive lessons in the course with a dim line.
    if (rowPositions.length > 1) {
      const lineGeom = new THREE.BufferGeometry().setFromPoints(rowPositions)
      const lineMat = new THREE.LineBasicMaterial({ color: 0x8a8f98, transparent: true, opacity: 0.35 })
      nodeGroup.add(new THREE.Line(lineGeom, lineMat))
    }
  })

  // Raycasting for hover + click.
  const raycaster = new THREE.Raycaster()
  const pointerNDC = new THREE.Vector2()
  let activeEntry: NodeEntry | null = null

  function entryAtPointer(clientX: number, clientY: number): NodeEntry | null {
    const rect = canvas.getBoundingClientRect()
    pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointerNDC, stage.camera)
    const hit = raycaster.intersectObjects(nodes.map((n) => n.mesh))[0]
    if (!hit) return null
    return nodes.find((n) => n.mesh === hit.object) ?? null
  }

  function onPointerMove(e: PointerEvent) {
    const entry = entryAtPointer(e.clientX, e.clientY)
    activeEntry = entry
    hovered.value = entry ? { lesson: entry.lesson, course: entry.course } : null
    tooltipPos.value = { x: e.clientX, y: e.clientY }
    canvas.style.cursor = entry ? 'pointer' : 'grab'
  }

  function onClick(e: PointerEvent) {
    const entry = entryAtPointer(e.clientX, e.clientY)
    if (entry) navigateTo(`/courses/${entry.lesson.id}`)
  }

  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('click', onClick)

  const reduceMotion = prefersReducedMotion()
  let elapsed = 0
  stage.loop((dt) => {
    elapsed += dt
    controls.update()

    for (const n of nodes) {
      const isHovered = n === activeEntry
      // Hover wins outright; otherwise "next up" nodes get a slow pulse
      // (a nudge toward what to do next, not a distraction) and everything
      // else sits still.
      const target = isHovered
        ? 1.4
        : n.state === 'next' && !reduceMotion
          ? 1 + Math.sin(elapsed * 2.4) * 0.18
          : 1
      const current = (n.mesh.userData.scale as number | undefined) ?? 1
      const next = current + (target - current) * 0.25
      n.mesh.userData.scale = next
      n.mesh.scale.setScalar(next)
      if (n.glow) n.glow.scale.setScalar(next)
    }
  })

  return () => {
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('click', onClick)
    controls.dispose()
    stage.dispose()
  }
}

watch(
  [courses, containerEl, canvasEl],
  ([list, container, canvas]) => {
    dispose?.()
    dispose = null
    if (!list || !list.length || !container || !canvas) return
    dispose = buildScene(container, canvas, list)
  },
  { immediate: true }
)

onBeforeUnmount(() => dispose?.())
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="border-b border-divider px-6 py-5 dark:border-divider-dark">
      <h1 class="font-display text-2xl font-bold tracking-tight">{{ t('map.title') }}</h1>
      <p class="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">{{ t('map.subtitle') }}</p>

      <!-- Legend doubles as a state key and an accessible text fallback for
           what's otherwise a purely visual color code. -->
      <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2.5 rounded-full bg-success-500" aria-hidden="true" />
          {{ t('map.legendDone') }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2.5 rounded-full bg-accent-500" aria-hidden="true" />
          {{ t('map.legendNext') }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2.5 rounded-full border border-zinc-400 dark:border-zinc-500" aria-hidden="true" />
          {{ t('map.legendUpcoming') }}
        </span>
        <NuxtLink to="/courses" class="ml-auto text-accent-700 hover:underline dark:text-accent-400">
          {{ t('map.listViewLink') }}
        </NuxtLink>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="status === 'pending'" class="flex flex-1 items-center justify-center">
      <div class="size-8 animate-pulse rounded-full bg-accent-500/30" />
    </div>

    <div v-else-if="error" class="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <Unplug :size="32" :stroke-width="1.75" class="text-critical-500 dark:text-critical-400" aria-hidden="true" />
      <p class="mt-3 font-medium text-zinc-800 dark:text-zinc-100">{{ t('map.loadError') }}</p>
      <button
        type="button"
        class="mt-4 flex items-center gap-1.5 rounded-md border border-divider px-3 py-1.5 text-sm font-medium text-zinc-600 hover:border-accent-600 hover:text-accent-700 disabled:opacity-50 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-accent-400 dark:hover:text-accent-400"
        :disabled="pending"
        @click="refresh()"
      >
        <RefreshCw :size="14" :stroke-width="1.75" />
        {{ t('sidebar.reconnect') }}
      </button>
    </div>

    <p v-else-if="!courses?.length" class="flex flex-1 items-center justify-center text-sm text-zinc-500">
      {{ t('map.noCourses') }}
    </p>

    <!-- The 3D canvas fills the rest of the page. Client-only: no WebGL
         during SSR, and the loading skeleton above already covers that gap. -->
    <div v-else ref="containerEl" class="relative flex-1 overflow-hidden">
      <ClientOnly>
        <canvas ref="canvasEl" class="h-full w-full cursor-grab active:cursor-grabbing" />
      </ClientOnly>

      <div
        v-if="hovered"
        ref="tooltipEl"
        class="card pointer-events-none fixed z-20 max-w-xs -translate-x-1/2 -translate-y-[calc(100%+14px)] px-3 py-2 text-xs"
        :style="{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }"
      >
        <p class="font-medium text-zinc-900 dark:text-white">
          {{ pickLocalized(hovered.lesson.titleEn, hovered.lesson.titleTh, lang) }}
        </p>
        <p class="mt-0.5 text-zinc-500 dark:text-zinc-400">{{ hovered.course.title }}</p>
      </div>
    </div>
  </div>
</template>
