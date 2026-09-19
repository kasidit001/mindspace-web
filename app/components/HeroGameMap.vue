<script setup lang="ts">
// Hand-illustrated isometric island (pure SVG, no WebGL) — matches the
// reference's flat-illustration style (Riau/Tesso Nilo map): a single
// landmass with a grass/dirt diamond-tile top, layered cliff sides only at
// the coastline, scattered trees/rocks, and a small detached chunk. Every
// course gets a pin; clicking one pins an info card above it, same
// interaction as before. Pure SVG + CSS means this renders fine on the
// server (no <ClientOnly> needed) and needs no per-frame JS loop — the
// screen position of each element is a percentage of the SVG's own
// viewBox, so it stays correct across any container size for free.
import { MapPin } from '@lucide/vue'
import type { Course } from '~/types/course'
import type { CourseLevel } from '~/utils/courseLevel'

const { t } = useLanguage()

const props = defineProps<{ courses: Course[] }>()

const selectedIndex = ref<number | null>(null)
const hoveredIndex = ref<number | null>(null)

const LEVEL_COLOR: Record<CourseLevel, string> = {
  Beginner: '#10b981',
  Intermediate: '#6366f1',
  Advanced: '#a855f7'
}

const GRASS = ['#7cb342', '#8bc34a', '#6fa83b']
const DIRT = ['#e0954f', '#d9814a', '#c97a3e']
const CLIFF_EAST = ['#cfa876', '#8b5e34']
const CLIFF_WEST = ['#b8925f', '#74491f']
const TREE_GREENS = ['#2f7d4f', '#3fa066', '#256842']

const GRID_COLS = 9
const GRID_ROWS = 7
const HW = 42
const HH = 21
const CLIFF_BAND = [16, 20]

function hash(x: number, y: number, salt: number): number {
  const v = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453
  return v - Math.floor(v)
}

interface Point { x: number; y: number }
interface LandTile { col: number; row: number; depth: number; top: Point; right: Point; bottom: Point; left: Point }

function project(col: number, row: number): Point {
  return { x: (col - row) * HW, y: (col + row) * HH }
}

function tileCorners(col: number, row: number): LandTile {
  const c = project(col, row)
  return {
    col,
    row,
    depth: col + row,
    top: { x: c.x, y: c.y - HH },
    right: { x: c.x + HW, y: c.y },
    bottom: { x: c.x, y: c.y + HH },
    left: { x: c.x - HW, y: c.y }
  }
}

function pts(...points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

/** Organic outline: elliptical mask with hash-jittered, eroded edges. */
function buildLandMask(): LandTile[] {
  const tiles: LandTile[] = []
  const cx = (GRID_COLS - 1) / 2
  const cy = (GRID_ROWS - 1) / 2
  const rx = GRID_COLS / 2
  const ry = GRID_ROWS / 2

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const dx = (col - cx) / rx
      const dy = (row - cy) / ry
      const dist = Math.sqrt(dx * dx + dy * dy)
      const jitter = (hash(col, row, 1) - 0.5) * 0.3
      if (dist > 1 + jitter) continue
      if (dist > 0.82 && hash(col, row, 2) < 0.3) continue
      tiles.push(tileCorners(col, row))
    }
  }
  return tiles
}

type DrawItem =
  | { kind: 'top'; depth: number; points: string; color: string }
  | { kind: 'cliff'; depth: number; points: string; color: string }
  | { kind: 'tree'; depth: number; x: number; y: number; scale: number; color: string }
  | { kind: 'rock'; depth: number; x: number; y: number }
  | { kind: 'marker'; depth: number; x: number; y: number; color: string; index: number }

const land = buildLandMask()
const landKeys = new Set(land.map((t) => `${t.col},${t.row}`))
const interior = land.filter((t) => {
  const cx = (GRID_COLS - 1) / 2
  const cy = (GRID_ROWS - 1) / 2
  return Math.hypot(t.col - cx, t.row - cy) < Math.min(GRID_COLS, GRID_ROWS) * 0.32
})

function pickMarkerTiles(total: number): LandTile[] {
  if (total === 0 || interior.length === 0) return []
  const cx = (GRID_COLS - 1) / 2
  const cy = (GRID_ROWS - 1) / 2
  const byAngle = [...interior].sort(
    (a, b) => Math.atan2(a.row - cy, a.col - cx) - Math.atan2(b.row - cy, b.col - cx)
  )
  return Array.from({ length: total }, (_, i) => byAngle[Math.floor((i * byAngle.length) / total)]!)
}

const markerTiles = pickMarkerTiles(props.courses.length)
const markerTileKeys = new Set(markerTiles.map((t) => `${t.col},${t.row}`))

function firstLessonId(course: Course): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}

function goToCourse(course: Course) {
  const lessonId = firstLessonId(course)
  navigateTo(lessonId ? `/courses/${lessonId}` : '/courses')
}

const items = computed<DrawItem[]>(() => {
  const list: DrawItem[] = []

  land.forEach((tile) => {
    const isDirt = hash(tile.col, tile.row, 3) < 0.3
    const palette = isDirt ? DIRT : GRASS
    const color = palette[Math.floor(hash(tile.col, tile.row, 4) * palette.length)]!
    list.push({ kind: 'top', depth: tile.depth, points: pts(tile.top, tile.right, tile.bottom, tile.left), color })

    const hasEast = landKeys.has(`${tile.col + 1},${tile.row}`)
    const hasWest = landKeys.has(`${tile.col},${tile.row + 1}`)
    if (!hasEast) {
      let y0 = tile.right.y
      let y0b = tile.bottom.y
      CLIFF_BAND.forEach((band, i) => {
        const y1 = y0 + band
        const y1b = y0b + band
        list.push({
          kind: 'cliff',
          depth: tile.depth - 0.1,
          points: pts({ x: tile.right.x, y: y0 }, { x: tile.bottom.x, y: y0b }, { x: tile.bottom.x, y: y1b }, { x: tile.right.x, y: y1 }),
          color: CLIFF_EAST[i]!
        })
        y0 = y1
        y0b = y1b
      })
    }
    if (!hasWest) {
      let y0 = tile.bottom.y
      let y0l = tile.left.y
      CLIFF_BAND.forEach((band, i) => {
        const y1 = y0 + band
        const y1l = y0l + band
        list.push({
          kind: 'cliff',
          depth: tile.depth - 0.1,
          points: pts({ x: tile.bottom.x, y: y0 }, { x: tile.left.x, y: y0l }, { x: tile.left.x, y: y1l }, { x: tile.bottom.x, y: y1 }),
          color: CLIFF_WEST[i]!
        })
        y0 = y1
        y0l = y1l
      })
    }

    const key = `${tile.col},${tile.row}`
    if (markerTileKeys.has(key)) return
    const deco = hash(tile.col, tile.row, 5)
    if (deco < 0.22) {
      list.push({
        kind: 'tree',
        depth: tile.depth + 0.3,
        x: tile.top.x + (tile.bottom.x - tile.top.x) / 2,
        y: tile.top.y + HH,
        scale: 0.75 + hash(tile.col, tile.row, 6) * 0.55,
        color: TREE_GREENS[Math.floor(hash(tile.col, tile.row, 7) * TREE_GREENS.length)]!
      })
    } else if (deco > 0.94) {
      list.push({ kind: 'rock', depth: tile.depth + 0.2, x: project(tile.col, tile.row).x, y: project(tile.col, tile.row).y })
    }
  })

  markerTiles.forEach((tile, i) => {
    const course = props.courses[i]
    if (!course) return
    list.push({
      kind: 'marker',
      depth: tile.depth + 0.5,
      x: project(tile.col, tile.row).x,
      y: project(tile.col, tile.row).y,
      color: LEVEL_COLOR[getCourseLevel(course)],
      index: i
    })
  })

  return list.sort((a, b) => a.depth - b.depth)
})

// Small detached chunk, separated from the main landmass — matches the
// reference's broken-off rock piece near the bottom. Gets the same cliff
// treatment as a boundary tile (all four sides are "coastline" here).
const chunkTile = tileCorners(0, 0)
const chunkOffset = { x: GRID_COLS * 0.42 * (HW * 2), y: GRID_ROWS * 0.58 * (HH * 2) + 46 }
const chunkTop = { x: chunkTile.top.x + chunkOffset.x, y: chunkTile.top.y + chunkOffset.y }
const chunkRight = { x: chunkTile.right.x + chunkOffset.x, y: chunkTile.right.y + chunkOffset.y }
const chunkBottom = { x: chunkTile.bottom.x + chunkOffset.x, y: chunkTile.bottom.y + chunkOffset.y }
const chunkLeft = { x: chunkTile.left.x + chunkOffset.x, y: chunkTile.left.y + chunkOffset.y }
const chunkPoints = pts(chunkTop, chunkRight, chunkBottom, chunkLeft)

function cliffBandPoints(a: Point, b: Point, bandStart: number, bandEnd: number): string {
  return pts({ x: a.x, y: a.y + bandStart }, { x: b.x, y: b.y + bandStart }, { x: b.x, y: b.y + bandEnd }, { x: a.x, y: a.y + bandEnd })
}
let chunkY0 = 0
const chunkEastBands = CLIFF_BAND.map((band, i) => {
  const p = cliffBandPoints(chunkRight, chunkBottom, chunkY0, chunkY0 + band)
  chunkY0 += band
  return { points: p, color: CLIFF_EAST[i]! }
})
chunkY0 = 0
const chunkWestBands = CLIFF_BAND.map((band, i) => {
  const p = cliffBandPoints(chunkBottom, chunkLeft, chunkY0, chunkY0 + band)
  chunkY0 += band
  return { points: p, color: CLIFF_WEST[i]! }
})

const bounds = computed(() => {
  const allX: number[] = []
  const allY: number[] = []
  land.forEach((t) => {
    ;[t.top, t.right, t.bottom, t.left].forEach((p) => {
      allX.push(p.x)
      allY.push(p.y + CLIFF_BAND[0]! + CLIFF_BAND[1]!)
    })
  })
  allX.push(chunkOffset.x - HW, chunkOffset.x + HW)
  allY.push(chunkOffset.y - HH, chunkOffset.y + HH + CLIFF_BAND[0]! + CLIFF_BAND[1]!)
  const padTop = 90
  const padSide = 40
  const minX = Math.min(...allX) - padSide
  const maxX = Math.max(...allX) + padSide
  const minY = Math.min(...allY) - padTop
  const maxY = Math.max(...allY) + 10
  return { minX, minY, width: maxX - minX, height: maxY - minY }
})

function markerScreenPercent(index: number) {
  const tile = markerTiles[index]
  if (!tile) return { left: '50%', top: '50%' }
  const p = project(tile.col, tile.row)
  const b = bounds.value
  return {
    left: `${((p.x - b.minX) / b.width) * 100}%`,
    top: `${((p.y - b.minY) / b.height) * 100}%`
  }
}

onMounted(() => {
  if (props.courses.length > 0) selectedIndex.value = 0
})

watch(() => props.courses, () => {
  if (props.courses.length > 0 && selectedIndex.value === null) selectedIndex.value = 0
})

const selectedCourse = computed<Course | null>(() =>
  selectedIndex.value !== null ? props.courses[selectedIndex.value] ?? null : null
)

// White-outlined glow diamond under the selected pin's tile — the same
// "you are here" highlight as the reference's Plant-a-Tree callout.
const selectedGlowPoints = computed<string | null>(() => {
  if (selectedIndex.value === null) return null
  const tile = markerTiles[selectedIndex.value]
  if (!tile) return null
  return pts(tile.top, tile.right, tile.bottom, tile.left)
})
</script>

<template>
  <div class="relative h-full min-h-[24rem] w-full select-none">
    <svg
      :viewBox="`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`"
      class="block h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse :cx="0" :cy="(GRID_COLS + GRID_ROWS) * HH + CLIFF_BAND[0] + CLIFF_BAND[1] + 22" :rx="GRID_COLS * HW * 0.55" ry="16" fill="black" opacity="0.16" />
      <ellipse
        :cx="chunkOffset.x"
        :cy="chunkOffset.y + HH + CLIFF_BAND[0] + CLIFF_BAND[1] + 14"
        :rx="HW * 1.6"
        ry="10"
        fill="black"
        opacity="0.15"
      />

      <polygon v-for="(band, i) in chunkEastBands" :key="`ce${i}`" :points="band.points" :fill="band.color" />
      <polygon v-for="(band, i) in chunkWestBands" :key="`cw${i}`" :points="band.points" :fill="band.color" />
      <polygon :points="chunkPoints" :fill="GRASS[0]" />

      <template v-for="(item, i) in items" :key="i">
        <template v-if="item.kind === 'top' || item.kind === 'cliff'">
          <polygon :points="item.points" :fill="item.color" />
          <polygon
            v-if="item.kind === 'top' && selectedGlowPoints === item.points"
            :points="item.points"
            fill="white"
            fill-opacity="0.3"
            stroke="white"
            stroke-width="2.5"
            class="tile-glow-pulse"
          />
        </template>

        <g v-else-if="item.kind === 'tree'" :transform="`translate(${item.x}, ${item.y}) scale(${item.scale})`">
          <g class="tree-sway">
            <rect x="-2" y="-11" width="4" height="11" fill="#6b4a2b" rx="1" />
            <circle cx="-6" cy="-26" r="9" :fill="item.color" opacity="0.92" />
            <circle cx="7" cy="-25" r="8" :fill="item.color" opacity="0.92" />
            <circle cx="0" cy="-32" r="11" :fill="item.color" />
          </g>
        </g>

        <g v-else-if="item.kind === 'rock'" :transform="`translate(${item.x}, ${item.y})`">
          <ellipse cx="-4" cy="-3" rx="7" ry="5.5" fill="#8b93a7" />
          <ellipse cx="5" cy="-1" rx="5.5" ry="4.5" fill="#a3aabb" />
        </g>

        <g v-else-if="item.kind === 'marker'">
          <line :x1="item.x" :y1="item.y - 8" :x2="item.x" :y2="item.y - 26" stroke="white" stroke-width="2.5" stroke-linecap="round" />
          <circle
            :cx="item.x"
            :cy="item.y - 32"
            :r="hoveredIndex === item.index || selectedIndex === item.index ? 9 : 7.5"
            :fill="item.color"
            stroke="white"
            stroke-width="2"
            class="marker-dot"
            style="cursor: pointer; transition: r 150ms ease-out"
            @mouseenter="hoveredIndex = item.index"
            @mouseleave="hoveredIndex = null"
            @click="selectedIndex = item.index"
          />
        </g>
      </template>
    </svg>

    <div
      v-if="selectedCourse"
      class="pointer-events-none absolute z-10 w-60 -translate-x-1/2 -translate-y-[calc(100%+30px)] rounded-2xl bg-white p-4 text-left shadow-2xl shadow-black/30"
      :style="markerScreenPercent(selectedIndex!)"
    >
      <!-- The card itself ignores pointer events (only the button below
           re-enables them) — on a compact map, this card can visually sit
           on top of a neighboring pin, and without this a user couldn't
           click that pin to switch selection until closing this one first. -->
      <div class="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-white" aria-hidden="true" />
      <span class="flex size-9 items-center justify-center rounded-full bg-ai-50">
        <MapPin :size="16" :stroke-width="2" class="text-ai-600" />
      </span>
      <p class="font-display mt-2.5 text-sm font-bold leading-snug text-zinc-900">{{ selectedCourse.title }}</p>
      <p class="mt-1 line-clamp-1 text-xs text-zinc-500">
        {{ selectedCourse.lessons.length }} {{ t(selectedCourse.lessons.length === 1 ? 'common.lesson' : 'common.lessons') }}
      </p>
      <button
        type="button"
        class="pointer-events-auto mt-3 w-full rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        @click="goToCourse(selectedCourse)"
      >
        {{ t('landing.tryItYourself') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.tree-sway {
  animation: tree-sway 3.5s ease-in-out infinite;
}
@keyframes tree-sway {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(1.5deg); }
}

/* Opacity-only pulse — no `transform` here on purpose: this polygon has no
   positioning transform attribute of its own (it's plain `points`), but a
   sibling <g> elsewhere in this file was once broken by exactly this kind
   of CSS transform silently overriding an SVG transform attribute, so
   keeping every decorative animation opacity-only avoids that class of bug
   entirely. */
.tile-glow-pulse {
  animation: tile-glow 2s ease-in-out infinite;
}
@keyframes tile-glow {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
</style>
