<script setup lang="ts">
// Hand-illustrated isometric island (pure SVG, no WebGL) — a single
// landmass with a grass/dirt diamond-tile top, terraced into a few
// elevation levels (raised platforms get their own short cliff riser
// wherever a neighboring tile is lower), layered coastal cliffs at the
// true edge, tech-stack icon props instead of trees, scattered rocks, and
// a small detached chunk. Every course gets a pin; clicking one pins an
// info card above it. Pure SVG + CSS means this renders fine on the
// server (no <ClientOnly> needed) and needs no per-frame JS loop — the
// screen position of each element is a percentage of the SVG's own
// viewBox, so it stays correct across any container size for free.
import { MapPin } from '@lucide/vue'
import type { Course } from '~/types/course'
import type { CourseLevel } from '~/utils/courseLevel'
import { TECH_LOGOS, techLogoPlate, type TechLogoId } from '~/utils/techLogos'

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

// Each prop is the technology's official logo (vendored — see
// ~/utils/techLogos) on a small plaque. Sized generously past the typical
// number of icon slots on the map (see `ICON_TILE_COUNT` below) so every
// icon placed is actually unique instead of cycling back through a short list.
const TECH_ICONS: Array<{ id: TechLogoId; label: string }> = [
  { id: 'js', label: 'JavaScript' },
  { id: 'ts', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'node', label: 'Node.js' },
  { id: 'go', label: 'Go' },
  { id: 'docker', label: 'Docker' },
  { id: 'nuxt', label: 'Nuxt' },
  { id: 'vue', label: 'Vue' },
  { id: 'react', label: 'React' }
]

const GRID_COLS = 9
const GRID_ROWS = 7
const HW = 42
const HH = 21
const CLIFF_BAND = [16, 20]
// Height of one terrain step. Two steps above the base plane max — enough
// for visible raised platforms without the island reading as a tower.
const LEVEL_HEIGHT = 24

function hash(x: number, y: number, salt: number): number {
  const v = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453
  return v - Math.floor(v)
}

interface Point { x: number; y: number }
interface LandTile { col: number; row: number; depth: number; elevation: number; top: Point; right: Point; bottom: Point; left: Point }

function project(col: number, row: number): Point {
  return { x: (col - row) * HW, y: (col + row) * HH }
}

/** Block-quantized (2x2) so elevation forms small plateaus, not per-tile
 * noise — reads as deliberate raised platforms instead of static. */
function tileElevation(col: number, row: number): number {
  const h = hash(Math.floor(col / 2), Math.floor(row / 2), 20)
  if (h < 0.55) return 0
  if (h < 0.82) return 1
  return 2
}

function tileCorners(col: number, row: number, elevation: number): LandTile {
  const c = project(col, row)
  const y = c.y - elevation * LEVEL_HEIGHT
  return {
    col,
    row,
    depth: col + row,
    elevation,
    top: { x: c.x, y: y - HH },
    right: { x: c.x + HW, y },
    bottom: { x: c.x, y: y + HH },
    left: { x: c.x - HW, y }
  }
}

function tileCenter(tile: LandTile): Point {
  return { x: tile.top.x, y: tile.top.y + HH }
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
      tiles.push(tileCorners(col, row, tileElevation(col, row)))
    }
  }
  return tiles
}

type DrawItem =
  | { kind: 'top'; depth: number; points: string; color: string }
  | { kind: 'cliff'; depth: number; points: string; color: string }
  | { kind: 'icon'; depth: number; x: number; y: number; scale: number; icon: (typeof TECH_ICONS)[number] }
  | { kind: 'rock'; depth: number; x: number; y: number; scale: number }
  | { kind: 'marker'; depth: number; x: number; y: number; color: string; index: number }

/** Builds the tan+dark-brown strata for one cliff edge, from its two top
 * corners down through `heights` (one polygon per band). Coastal edges
 * pass [elevation*LEVEL_HEIGHT + CLIFF_BAND[0], CLIFF_BAND[1]] (a riser
 * fused into the tan band, so taller platforms just get a taller — not
 * differently-colored — coastline); internal steps between two tiles at
 * different elevations pass a single tan-only band. */
function buildCliffBands(aTop: Point, bTop: Point, heights: number[], colors: string[], depth: number): DrawItem[] {
  const out: DrawItem[] = []
  let y0a = aTop.y
  let y0b = bTop.y
  heights.forEach((h, i) => {
    const y1a = y0a + h
    const y1b = y0b + h
    out.push({
      kind: 'cliff',
      depth,
      points: pts({ x: aTop.x, y: y0a }, { x: bTop.x, y: y0b }, { x: bTop.x, y: y1b }, { x: aTop.x, y: y1a }),
      color: colors[i]!
    })
    y0a = y1a
    y0b = y1b
  })
  return out
}

const land = buildLandMask()
const landByKey = new Map(land.map((t) => [`${t.col},${t.row}`, t]))
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

function seededShuffle<T>(arr: T[], salt: number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(hash(i, salt, 41) * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

// One unique icon per slot, assigned once up front (not per-tile hash) —
// picking independently per tile risked duplicates whenever two tiles'
// hashes landed near the same TECH_ICONS index. Shuffle the eligible
// tiles, then hand out icons 1:1 from the start of TECH_ICONS so no icon
// repeats unless there are literally more icon slots than icons defined.
const ICON_TILE_COUNT = Math.min(TECH_ICONS.length, 8)
const decorableTiles = land.filter((t) => !markerTileKeys.has(`${t.col},${t.row}`))
const iconTiles = seededShuffle(decorableTiles, 11).slice(0, ICON_TILE_COUNT)
const iconAssignment = new Map(iconTiles.map((t, i) => [`${t.col},${t.row}`, TECH_ICONS[i]!]))

function firstLessonId(course: Course): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}

function goToCourse(course: Course) {
  const lessonId = firstLessonId(course)
  navigateTo(lessonId ? `/courses/${lessonId}` : '/courses')
}

// Tech icons link to the course browser, not a deep link per technology —
// every course this platform actually has today is TypeScript content
// (see the roadmap note in mindspace-web's history), so a Python/Go/Docker
// icon has no matching course page to send someone to yet. Sending it
// somewhere real (course list) beats a fabricated per-tech URL that 404s.
function goToCourses() {
  navigateTo('/courses')
}

const items = computed<DrawItem[]>(() => {
  const list: DrawItem[] = []

  land.forEach((tile) => {
    const isDirt = hash(tile.col, tile.row, 3) < 0.3
    const palette = isDirt ? DIRT : GRASS
    const color = palette[Math.floor(hash(tile.col, tile.row, 4) * palette.length)]!
    list.push({ kind: 'top', depth: tile.depth, points: pts(tile.top, tile.right, tile.bottom, tile.left), color })

    const east = landByKey.get(`${tile.col + 1},${tile.row}`)
    const west = landByKey.get(`${tile.col},${tile.row + 1}`)

    if (!east) {
      list.push(...buildCliffBands(
        tile.right, tile.bottom,
        [tile.elevation * LEVEL_HEIGHT + CLIFF_BAND[0]!, CLIFF_BAND[1]!],
        CLIFF_EAST,
        tile.depth - 0.1
      ))
    } else if (east.elevation < tile.elevation) {
      list.push(...buildCliffBands(
        tile.right, tile.bottom,
        [(tile.elevation - east.elevation) * LEVEL_HEIGHT],
        [CLIFF_EAST[0]!],
        tile.depth - 0.1
      ))
    }
    if (!west) {
      list.push(...buildCliffBands(
        tile.bottom, tile.left,
        [tile.elevation * LEVEL_HEIGHT + CLIFF_BAND[0]!, CLIFF_BAND[1]!],
        CLIFF_WEST,
        tile.depth - 0.1
      ))
    } else if (west.elevation < tile.elevation) {
      list.push(...buildCliffBands(
        tile.bottom, tile.left,
        [(tile.elevation - west.elevation) * LEVEL_HEIGHT],
        [CLIFF_WEST[0]!],
        tile.depth - 0.1
      ))
    }

    const key = `${tile.col},${tile.row}`
    if (markerTileKeys.has(key)) return
    const center = tileCenter(tile)
    const assignedIcon = iconAssignment.get(key)
    if (assignedIcon) {
      list.push({
        kind: 'icon',
        depth: tile.depth + 0.3,
        x: center.x,
        y: center.y,
        scale: 0.85 + hash(tile.col, tile.row, 6) * 0.35,
        icon: assignedIcon
      })
    } else if (hash(tile.col, tile.row, 5) > 0.92) {
      list.push({
        kind: 'rock',
        depth: tile.depth + 0.2,
        x: center.x,
        y: center.y,
        scale: 0.8 + hash(tile.col, tile.row, 9) * 0.5
      })
    }
  })

  markerTiles.forEach((tile, i) => {
    const course = props.courses[i]
    if (!course) return
    const center = tileCenter(tile)
    list.push({
      kind: 'marker',
      depth: tile.depth + 0.5,
      x: center.x,
      y: center.y,
      color: LEVEL_COLOR[getCourseLevel(course)],
      index: i
    })
  })

  return list.sort((a, b) => a.depth - b.depth)
})

// Small detached chunk, separated from the main landmass — matches the
// reference's broken-off rock piece near the bottom. Gets the same cliff
// treatment as a boundary tile (all four sides are "coastline" here).
const chunkTile = tileCorners(0, 0, 0)
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
    const drop = t.elevation * LEVEL_HEIGHT + CLIFF_BAND[0]! + CLIFF_BAND[1]!
    ;[t.top, t.right, t.bottom, t.left].forEach((p) => {
      allX.push(p.x)
      allY.push(p.y + drop)
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
  const p = tileCenter(tile)
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
const selectedGlowCenter = computed<Point | null>(() => {
  if (selectedIndex.value === null) return null
  const tile = markerTiles[selectedIndex.value]
  return tile ? tileCenter(tile) : null
})

// Soft background clouds, hand-placed (not hashed) for a considered
// composition — a couple tucked behind the island, a couple drifting
// past the edges. Positioned via cx/cy on the ellipses themselves so the
// wrapping <g> has no `transform` attribute for the CSS drift animation
// to conflict with (see the icon-bob comment in <style> for why that
// matters here).
const CLOUDS = [
  { x: -210, y: -85, scale: 1.15, drift: '22s', opacity: 0.5 },
  { x: 150, y: -100, scale: 0.9, drift: '28s', opacity: 0.45 },
  { x: 300, y: -20, scale: 0.7, drift: '19s', opacity: 0.55 },
  { x: -290, y: 40, scale: 0.65, drift: '25s', opacity: 0.4 }
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
        <!-- Directional-light sheen, layered over the flat tile-top and
             cliff-band fills below rather than replacing them with a
             per-color gradient (one reusable overlay instead of a gradient
             def per palette color) — a soft highlight top-left fading to
             nothing, like a single sun angled over the whole island. -->
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

      <!-- Soft blurred bloom behind the selected tile's outline — the
           "radiating light" half of the reference's highlight, separate
           from the crisp white outline drawn later (with the tiles). -->
      <ellipse
        v-if="selectedGlowCenter"
        :cx="selectedGlowCenter.x"
        :cy="selectedGlowCenter.y"
        :rx="HW * 0.9"
        :ry="HH * 0.9"
        fill="white"
        filter="url(#mapGlowBlur)"
        class="tile-glow-pulse"
        opacity="0.5"
      />

      <!-- Background clouds — drawn first so they always sit behind the
           island. Each is 3 overlapping ellipses (a classic flat-illustration
           cloud silhouette); the drift animation only moves the <g>, which
           has no positioning `transform` attribute of its own. -->
      <g v-for="(cloud, ci) in CLOUDS" :key="`cloud${ci}`" class="cloud-drift" :style="{ animationDuration: cloud.drift }">
        <g :transform="`translate(${cloud.x}, ${cloud.y}) scale(${cloud.scale})`" :opacity="cloud.opacity">
          <ellipse cx="0" cy="0" rx="30" ry="16" fill="white" />
          <ellipse cx="-22" cy="6" rx="18" ry="11" fill="white" />
          <ellipse cx="24" cy="7" rx="20" ry="12" fill="white" />
        </g>
      </g>

      <ellipse :cx="0" :cy="(GRID_COLS + GRID_ROWS) * HH + CLIFF_BAND[0] + CLIFF_BAND[1] + 22" :rx="GRID_COLS * HW * 0.55" ry="16" fill="black" opacity="0.16" />
      <ellipse
        :cx="chunkOffset.x"
        :cy="chunkOffset.y + HH + CLIFF_BAND[0] + CLIFF_BAND[1] + 14"
        :rx="HW * 1.6"
        ry="10"
        fill="black"
        opacity="0.15"
      />

      <template v-for="(band, i) in chunkEastBands" :key="`ce${i}`">
        <polygon :points="band.points" :fill="band.color" />
        <polygon :points="band.points" fill="url(#cliffShade)" />
      </template>
      <template v-for="(band, i) in chunkWestBands" :key="`cw${i}`">
        <polygon :points="band.points" :fill="band.color" />
        <polygon :points="band.points" fill="url(#cliffShade)" />
      </template>
      <polygon :points="chunkPoints" :fill="GRASS[0]" />
      <polygon :points="chunkPoints" fill="url(#lightSheen)" />

      <template v-for="(item, i) in items" :key="i">
        <template v-if="item.kind === 'top' || item.kind === 'cliff'">
          <polygon :points="item.points" :fill="item.color" />
          <polygon :points="item.points" :fill="item.kind === 'top' ? 'url(#lightSheen)' : 'url(#cliffShade)'" />
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

        <g
          v-else-if="item.kind === 'icon'"
          :transform="`translate(${item.x}, ${item.y}) scale(${item.scale})`"
          role="link"
          tabindex="0"
          :aria-label="`Browse ${item.icon.label} courses`"
          style="cursor: pointer"
          @click="goToCourses"
          @keydown.enter="goToCourses"
        >
          <ellipse cx="0" cy="1" rx="13" ry="4.5" fill="black" opacity="0.2" />
          <g class="icon-bob">
            <rect x="-2.5" y="-13" width="5" height="13" fill="#5b6472" rx="1.2" />
            <!-- Badge "sits" on a short post like the course pins — a
                 3D-block plaque (drop shadow + border) rather than a flat
                 sticker, so it reads as a prop standing on the tile. Sized
                 well past the label's own footprint (41x31, vs. a ~16pt
                 label) specifically for legibility at map scale — a
                 previous, tighter size read as illegible noise. Whole
                 group is clickable (role="link", not an <a> — SVG <a>
                 forces a full page reload; a click handler calling
                 navigateTo() gets the same SPA transition NuxtLink would
                 give an HTML element). -->
            <rect x="-20.5" y="-43" width="41" height="31" rx="7" fill="black" opacity="0.18" />
            <rect x="-19.5" y="-44" width="41" height="31" rx="7" :fill="techLogoPlate(item.icon.id)" stroke="white" stroke-width="2" stroke-opacity="0.55" />
            <!-- The official logo, fitted (preserveAspectRatio "meet") into a
                 33x23 box centered on the plaque, so wide marks (Go) and tall
                 ones (Node) both fit without distortion. Static vendored
                 markup, so v-html is safe. -->
            <svg
              x="-15.5"
              y="-40"
              width="33"
              height="23"
              :viewBox="`0 0 ${TECH_LOGOS[item.icon.id].width} ${TECH_LOGOS[item.icon.id].height}`"
              preserveAspectRatio="xMidYMid meet"
              v-html="TECH_LOGOS[item.icon.id].body"
            />
          </g>
        </g>

        <g v-else-if="item.kind === 'rock'" :transform="`translate(${item.x}, ${item.y}) scale(${item.scale})`">
          <ellipse cx="0" cy="3" rx="10" ry="3" fill="black" opacity="0.14" />
          <ellipse cx="-4" cy="-3" rx="7" ry="5.5" fill="#7c8598" />
          <ellipse cx="5" cy="-1" rx="5.5" ry="4.5" fill="#8b93a7" />
          <ellipse cx="0" cy="-4.5" rx="3.5" ry="2.5" fill="#a3aabb" />
          <ellipse cx="-2" cy="-5.5" rx="1.6" ry="1" fill="white" opacity="0.35" />
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
        {{ t('landing.startCourse') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Inner <g> only — the outer <g> carries the positioning
   translate+scale, same split as .cloud-drift/.tile-glow-pulse, so this
   transform animation can't collide with it. */
.icon-bob {
  animation: icon-bob 3.2s ease-in-out infinite;
}
@keyframes icon-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1.5px); }
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

/* The outer <g> per cloud carries this class and has no positioning
   `transform` attribute (each cloud's own translate/scale lives on the
   inner <g>), so animating `transform: translateX` here is safe. */
.cloud-drift {
  animation-name: cloud-drift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes cloud-drift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(18px); }
}
</style>
