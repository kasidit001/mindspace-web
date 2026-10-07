<script setup lang="ts">
// Hand-illustrated isometric skyline (pure SVG, no WebGL) — one building per
// course, varying height by lesson count, standing on a small plaza.
// Pure SVG + CSS: renders fine on the server, no per-frame JS loop, and
// every element's screen position is a percentage of the SVG's own
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

// Lit-window tint per level — pastel versions of LEVEL_COLOR, so the
// facade itself quietly encodes "this building is a Beginner/Intermediate/
// Advanced course" without needing a legend.
const WINDOW_COLOR: Record<CourseLevel, string> = {
  Beginner: '#9df2cf',
  Intermediate: '#c2c5ff',
  Advanced: '#edc0ff'
}

const GRASS = ['#7cb342', '#8bc34a', '#6fa83b']
const DIRT = ['#e0954f', '#d9814a', '#c97a3e']
const CLIFF_EAST = ['#cfa876', '#8b5e34']
const CLIFF_WEST = ['#b8925f', '#74491f']
const WALL_EAST = ['#5b6478', '#646d84']
const WALL_WEST = ['#434b5e', '#4a5265']
const ROOF_COLOR = '#2f3648'
const ACCENT = '#ec4899'

const HW = 46
const HH = 24
const CLIFF_BAND: [number, number] = [14, 18]
const MAX_BUILDINGS = 16
// Building height varies with lesson count (not a fixed/uniform skyline) —
// capped so one unusually long course doesn't tower absurdly over the rest.
const BASE_HEIGHT = 90
const PER_LESSON_HEIGHT = 9
const LESSON_CAP = 16

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

function lift(p: Point, amount: number): Point {
  return { x: p.x, y: p.y - amount }
}

function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/** A building sits on a footprint inset from its full ground tile, not
 *  flush with it — otherwise adjacent buildings' walls touch directly and
 *  the skyline reads as one fused block instead of several distinct
 *  towers with daylight between them. */
function footprint(tile: LandTile, scale: number): LandTile {
  const cx = (tile.top.x + tile.bottom.x) / 2
  const cy = (tile.top.y + tile.bottom.y) / 2
  const shrink = (p: Point): Point => ({ x: cx + (p.x - cx) * scale, y: cy + (p.y - cy) * scale })
  return { ...tile, top: shrink(tile.top), right: shrink(tile.right), bottom: shrink(tile.bottom), left: shrink(tile.left) }
}

const BUILDING_FOOTPRINT_SCALE = 0.68

function pts(...points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

type DrawItem =
  | { kind: 'top'; depth: number; points: string; color: string }
  | { kind: 'cliff'; depth: number; points: string; color: string }
  | { kind: 'rock'; depth: number; x: number; y: number; scale: number }
  | { kind: 'tree'; depth: number; x: number; y: number; scale: number }
  | { kind: 'wall'; depth: number; points: string; color: string; index: number }
  | { kind: 'roof'; depth: number; points: string; index: number }
  | { kind: 'window'; depth: number; x: number; y: number; color: string; delay: number }
  | { kind: 'marker'; depth: number; x: number; y: number; stickTo: Point; color: string; index: number }

/** Builds the tan+dark-brown strata for one plaza edge. */
function buildCliffBands(aTop: Point, bTop: Point, colors: string[], depth: number): DrawItem[] {
  const out: DrawItem[] = []
  let ya = aTop.y
  let yb = bTop.y
  CLIFF_BAND.forEach((h, i) => {
    const y1a = ya + h
    const y1b = yb + h
    out.push({
      kind: 'cliff',
      depth,
      points: pts({ x: aTop.x, y: ya }, { x: bTop.x, y: yb }, { x: bTop.x, y: y1b }, { x: aTop.x, y: y1a }),
      color: colors[i]!
    })
    ya = y1a
    yb = y1b
  })
  return out
}

function buildingHeight(course: Course): number {
  return BASE_HEIGHT + Math.min(course.lessons.length, LESSON_CAP) * PER_LESSON_HEIGHT
}

const buildingCount = computed(() => Math.min(props.courses.length, MAX_BUILDINGS))
const gridCols = computed(() => Math.max(1, Math.ceil(Math.sqrt(buildingCount.value))))
const gridRows = computed(() => Math.max(1, Math.ceil(buildingCount.value / gridCols.value)))
// A 1-tile plaza border all around the building grid.
const plazaCols = computed(() => gridCols.value + 2)
const plazaRows = computed(() => gridRows.value + 2)

const plazaTiles = computed<LandTile[]>(() => {
  const tiles: LandTile[] = []
  for (let row = 0; row < plazaRows.value; row++) {
    for (let col = 0; col < plazaCols.value; col++) {
      tiles.push(tileCorners(col, row))
    }
  }
  return tiles
})
const plazaByKey = computed(() => new Map(plazaTiles.value.map((t) => [`${t.col},${t.row}`, t])))

interface BuildingPlacement { tile: LandTile; course: Course; index: number; height: number; level: CourseLevel }

const buildings = computed<BuildingPlacement[]>(() => {
  const cols = gridCols.value
  return props.courses.slice(0, buildingCount.value).map((course, i) => {
    const gridCol = (i % cols) + 1
    const gridRow = Math.floor(i / cols) + 1
    const tile = plazaByKey.value.get(`${gridCol},${gridRow}`)!
    return { tile, course, index: i, height: buildingHeight(course), level: getCourseLevel(course) }
  })
})
const buildingTileKeys = computed(() => new Set(buildings.value.map((b) => `${b.tile.col},${b.tile.row}`)))

const tallestIndex = computed(() => {
  let best = 0
  let bestHeight = -1
  buildings.value.forEach((b) => {
    if (b.height > bestHeight) {
      bestHeight = b.height
      best = b.index
    }
  })
  return best
})

interface MarkerPoint { x: number; y: number }

const markerPoints = computed<MarkerPoint[]>(() =>
  buildings.value.map((b) => {
    const roofTop = lift(footprint(b.tile, BUILDING_FOOTPRINT_SCALE).top, b.height)
    return { x: roofTop.x, y: roofTop.y - 24 }
  })
)

function buildingItems(b: BuildingPlacement): DrawItem[] {
  const out: DrawItem[] = []
  const t = footprint(b.tile, BUILDING_FOOTPRINT_SCALE)
  const roofTop = lift(t.top, b.height)
  const roofRight = lift(t.right, b.height)
  const roofBottom = lift(t.bottom, b.height)
  const roofLeft = lift(t.left, b.height)

  const eastPts = [t.right, t.bottom, roofBottom, roofRight]
  const westPts = [t.bottom, t.left, roofLeft, roofBottom]

  out.push({ kind: 'wall', depth: t.depth + 0.1, points: pts(...eastPts), color: WALL_EAST[b.index % WALL_EAST.length]!, index: b.index })
  out.push({ kind: 'wall', depth: t.depth + 0.11, points: pts(...westPts), color: WALL_WEST[b.index % WALL_WEST.length]!, index: b.index })

  const windowRows = Math.max(2, Math.round(b.height / 26))
  const eastBottomMid = mid(t.right, t.bottom)
  const eastTopMid = mid(roofRight, roofBottom)
  const westBottomMid = mid(t.bottom, t.left)
  const westTopMid = mid(roofBottom, roofLeft)
  for (let r = 0; r < windowRows; r++) {
    const tt = (r + 0.6) / (windowRows + 0.3)
    const eastPoint = lerp(eastBottomMid, eastTopMid, tt)
    out.push({ kind: 'window', depth: t.depth + 0.5, x: eastPoint.x, y: eastPoint.y, color: WINDOW_COLOR[b.level], delay: hash(b.index, r, 30) * 2.4 })
    if (hash(b.index, r, 31) > 0.25) {
      const westPoint = lerp(westBottomMid, westTopMid, tt)
      out.push({ kind: 'window', depth: t.depth + 0.5, x: westPoint.x, y: westPoint.y, color: WINDOW_COLOR[b.level], delay: hash(b.index, r, 32) * 2.4 })
    }
  }

  out.push({ kind: 'roof', depth: t.depth + 0.4, points: pts(roofTop, roofRight, roofBottom, roofLeft), index: b.index })

  const marker = markerPoints.value[b.index]!
  out.push({
    kind: 'marker',
    depth: t.depth + 0.6,
    x: marker.x,
    y: marker.y,
    stickTo: roofTop,
    color: LEVEL_COLOR[b.level],
    index: b.index
  })

  return out
}

function firstLessonId(course: Course): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}

function goToCourse(course: Course) {
  const lessonId = firstLessonId(course)
  navigateTo(lessonId ? `/courses/${lessonId}` : '/courses')
}

// Hand-illustrated prop density on the plaza border — deterministic (not
// random), scales naturally with however large the border ring is.
function plazaProp(tile: LandTile): 'rock' | 'tree' | null {
  const h = hash(tile.col, tile.row, 5)
  if (h > 0.88) return 'tree'
  if (h > 0.78) return 'rock'
  return null
}

const items = computed<DrawItem[]>(() => {
  const list: DrawItem[] = []

  plazaTiles.value.forEach((tile) => {
    const key = `${tile.col},${tile.row}`
    const isBuilding = buildingTileKeys.value.has(key)
    const isDirt = hash(tile.col, tile.row, 3) < 0.3
    const palette = isDirt ? DIRT : GRASS
    const color = palette[Math.floor(hash(tile.col, tile.row, 4) * palette.length)]!
    list.push({ kind: 'top', depth: tile.depth, points: pts(tile.top, tile.right, tile.bottom, tile.left), color })

    const east = plazaByKey.value.get(`${tile.col + 1},${tile.row}`)
    const west = plazaByKey.value.get(`${tile.col},${tile.row + 1}`)
    if (!east) list.push(...buildCliffBands(tile.right, tile.bottom, CLIFF_EAST, tile.depth - 0.1))
    if (!west) list.push(...buildCliffBands(tile.bottom, tile.left, CLIFF_WEST, tile.depth - 0.1))

    if (isBuilding) return
    const prop = plazaProp(tile)
    const center = { x: tile.top.x, y: tile.top.y + HH }
    if (prop === 'rock') {
      list.push({ kind: 'rock', depth: tile.depth + 0.2, x: center.x, y: center.y, scale: 0.85 + hash(tile.col, tile.row, 6) * 0.3 })
    } else if (prop === 'tree') {
      list.push({ kind: 'tree', depth: tile.depth + 0.2, x: center.x, y: center.y, scale: 0.85 + hash(tile.col, tile.row, 7) * 0.3 })
    }
  })

  buildings.value.forEach((b) => list.push(...buildingItems(b)))

  return list.sort((a, b) => a.depth - b.depth)
})

const tallestMarker = computed<Point>(() => {
  const tallest = buildings.value[tallestIndex.value]
  if (!tallest) return { x: 0, y: 0 }
  return lift(footprint(tallest.tile, BUILDING_FOOTPRINT_SCALE).top, tallest.height)
})

const bounds = computed(() => {
  const allX: number[] = []
  const allY: number[] = []
  plazaTiles.value.forEach((tile) => {
    ;[tile.top, tile.right, tile.bottom, tile.left].forEach((p) => {
      allX.push(p.x)
      allY.push(p.y + CLIFF_BAND[0] + CLIFF_BAND[1])
    })
  })
  markerPoints.value.forEach((m) => {
    allX.push(m.x)
    allY.push(m.y)
  })
  allY.push(tallestMarker.value.y - 34)
  const padTop = 20
  const padSide = 24
  const minX = Math.min(...allX) - padSide
  const maxX = Math.max(...allX) + padSide
  const minY = Math.min(...allY) - padTop
  const maxY = Math.max(...allY) + 10
  return { minX, minY, width: maxX - minX, height: maxY - minY }
})

function markerScreenPercent(index: number) {
  const p = markerPoints.value[index]
  if (!p) return { left: '50%', top: '50%' }
  const b = bounds.value
  return {
    left: `${((p.x - b.minX) / b.width) * 100}%`,
    top: `${((p.y - b.minY) / b.height) * 100}%`
  }
}

// A building near the plaza's right edge would otherwise push the card
// past the hero panel's own rounded edge and clip — flip it to the left
// of the marker instead.
function isMarkerOnRightSide(index: number): boolean {
  const p = markerPoints.value[index]
  if (!p) return false
  const b = bounds.value
  return (p.x - b.minX) / b.width > 0.62
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

const cardFlipped = computed(() => selectedIndex.value !== null && isMarkerOnRightSide(selectedIndex.value))

const selectedGlowCenter = computed<Point | null>(() => {
  if (selectedIndex.value === null) return null
  return markerPoints.value[selectedIndex.value] ?? null
})

const CLOUDS = [
  { x: -230, y: -60, scale: 1.15, drift: '22s', opacity: 0.5 },
  { x: 170, y: -80, scale: 0.9, drift: '28s', opacity: 0.45 },
  { x: 260, y: 10, scale: 0.7, drift: '19s', opacity: 0.55 },
  { x: -280, y: 60, scale: 0.65, drift: '25s', opacity: 0.4 }
]
</script>

<template>
  <div class="relative h-full min-h-[24rem] w-full select-none">
    <svg
      :viewBox="`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`"
      class="block h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="mapGlowBlur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <linearGradient id="lightSheen" x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stop-color="white" stop-opacity="0.4" />
          <stop offset="55%" stop-color="white" stop-opacity="0.08" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="cliffShade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="white" stop-opacity="0.14" />
          <stop offset="45%" stop-color="white" stop-opacity="0" />
          <stop offset="100%" stop-color="black" stop-opacity="0.16" />
        </linearGradient>
      </defs>

      <ellipse
        v-if="selectedGlowCenter"
        :cx="selectedGlowCenter.x"
        :cy="selectedGlowCenter.y"
        rx="16"
        ry="12"
        fill="white"
        filter="url(#mapGlowBlur)"
        class="tile-glow-pulse"
        opacity="0.5"
      />

      <g v-for="(cloud, ci) in CLOUDS" :key="`cloud${ci}`" class="cloud-drift" :style="{ animationDuration: cloud.drift }">
        <g :transform="`translate(${cloud.x}, ${cloud.y}) scale(${cloud.scale})`" :opacity="cloud.opacity">
          <ellipse cx="0" cy="0" rx="30" ry="16" fill="white" />
          <ellipse cx="-22" cy="6" rx="18" ry="11" fill="white" />
          <ellipse cx="24" cy="7" rx="20" ry="12" fill="white" />
        </g>
      </g>

      <ellipse :cx="(bounds.minX + bounds.minX + bounds.width) / 2" :cy="bounds.minY + bounds.height - 4" :rx="bounds.width * 0.42" ry="14" fill="black" opacity="0.16" />

      <template v-for="(item, i) in items" :key="i">
        <template v-if="item.kind === 'top' || item.kind === 'cliff'">
          <polygon :points="item.points" :fill="item.color" />
          <polygon :points="item.points" :fill="item.kind === 'top' ? 'url(#lightSheen)' : 'url(#cliffShade)'" />
        </template>

        <g v-else-if="item.kind === 'rock'" :transform="`translate(${item.x}, ${item.y}) scale(${item.scale})`">
          <ellipse cx="0" cy="3" rx="10" ry="3" fill="black" opacity="0.14" />
          <ellipse cx="-4" cy="-3" rx="7" ry="5.5" fill="#7c8598" />
          <ellipse cx="5" cy="-1" rx="5.5" ry="4.5" fill="#8b93a7" />
          <ellipse cx="0" cy="-4.5" rx="3.5" ry="2.5" fill="#a3aabb" />
          <ellipse cx="-2" cy="-5.5" rx="1.6" ry="1" fill="white" opacity="0.35" />
        </g>

        <g v-else-if="item.kind === 'tree'" :transform="`translate(${item.x}, ${item.y}) scale(${item.scale})`">
          <ellipse cx="0" cy="2" rx="9" ry="3" fill="black" opacity="0.14" />
          <rect x="-2" y="-10" width="4" height="11" fill="#7a5230" rx="1" />
          <ellipse cx="0" cy="-16" rx="11" ry="9" fill="#4c8c3f" />
          <ellipse cx="-4" cy="-19" rx="6" ry="5" fill="#5da04c" />
          <ellipse cx="5" cy="-14" rx="5" ry="4.5" fill="#5da04c" />
        </g>

        <polygon
          v-else-if="item.kind === 'wall'"
          :points="item.points"
          :fill="item.color"
          :opacity="hoveredIndex === item.index || selectedIndex === item.index ? 1 : 0.94"
          style="cursor: pointer; transition: opacity 120ms ease-out"
          @mouseenter="hoveredIndex = item.index"
          @mouseleave="hoveredIndex = null"
          @click="selectedIndex = item.index"
        />
        <polygon
          v-if="item.kind === 'wall' && (hoveredIndex === item.index || selectedIndex === item.index)"
          :points="item.points"
          fill="white"
          :opacity="selectedIndex === item.index ? 0.16 : 0.08"
          style="pointer-events: none"
        />

        <template v-else-if="item.kind === 'roof'">
          <polygon :points="item.points" :fill="ROOF_COLOR" style="cursor: pointer" @click="selectedIndex = item.index" />
          <polygon :points="item.points" fill="url(#lightSheen)" style="pointer-events: none" />
        </template>

        <circle
          v-else-if="item.kind === 'window'"
          :cx="item.x"
          :cy="item.y"
          r="2"
          :fill="item.color"
          class="window-twinkle"
          :style="{ animationDelay: `${item.delay}s` }"
        />

        <g v-else-if="item.kind === 'marker'">
          <line :x1="item.stickTo.x" :y1="item.stickTo.y" :x2="item.x" :y2="item.y" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.9" />
          <circle
            :cx="item.x"
            :cy="item.y"
            :r="hoveredIndex === item.index || selectedIndex === item.index ? 8 : 6.5"
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

      <!-- Rooftop flagpole — one flourish on the tallest building only,
           swaying gently; the one spot of pure brand-accent color in the
           whole illustration. -->
      <g :transform="`translate(${tallestMarker.x}, ${tallestMarker.y})`">
        <line x1="0" y1="0" x2="0" y2="-22" stroke="#cbd0dc" stroke-width="2" stroke-linecap="round" />
        <g class="flag-sway" style="transform-origin: 0px -22px;">
          <polygon points="0,-22 14,-18 0,-14" :fill="ACCENT" />
        </g>
      </g>
    </svg>

    <div
      v-if="selectedCourse"
      class="pointer-events-none absolute z-10 w-48 -translate-y-1/2 rounded-xl bg-white p-3 text-left shadow-2xl shadow-black/30"
      :class="cardFlipped ? '-translate-x-[calc(100%+16px)]' : 'translate-x-4'"
      :style="markerScreenPercent(selectedIndex!)"
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

<style scoped>
.window-twinkle {
  animation: window-twinkle 3.6s ease-in-out infinite;
}
@keyframes window-twinkle {
  0%, 100% { opacity: 0.75; }
  50% { opacity: 1; }
}

.tile-glow-pulse {
  animation: tile-glow 2s ease-in-out infinite;
}
@keyframes tile-glow {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

.cloud-drift {
  animation-name: cloud-drift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes cloud-drift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(18px); }
}

.flag-sway {
  animation: flag-sway 2.6s ease-in-out infinite;
}
@keyframes flag-sway {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-6deg); }
}
</style>
