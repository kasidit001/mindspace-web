import * as THREE from 'three'

/**
 * Shared boilerplate for the two hand-rolled Three.js scenes in this app
 * (HeroConstellation, the /map skill-map) — scene/camera/renderer setup,
 * resize handling via ResizeObserver (not `window.resize`, since both
 * scenes live in a sized container, not the full viewport), and a single
 * teardown function. Deliberately NOT a generic 3D framework — just enough
 * shared plumbing that each component only has to write the geometry/scene
 * content that's actually specific to it.
 */
export function useThreeStage(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  opts?: { alpha?: boolean; fov?: number }
) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(opts?.fov ?? 50, 1, 0.1, 200)
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: opts?.alpha ?? true
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  function resize() {
    const w = Math.max(container.clientWidth, 1)
    const h = Math.max(container.clientHeight, 1)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  resize()

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  let rafId: number | null = null
  function loop(tick: (dt: number) => void) {
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      tick(dt)
      renderer.render(scene, camera)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
  }

  function dispose() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    resizeObserver.disconnect()
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material
      if (Array.isArray(material)) material.forEach((m) => m.dispose())
      else material?.dispose()
    })
    renderer.dispose()
  }

  return { scene, camera, renderer, resize, loop, dispose }
}

/** Respect the user's motion preference — freeze idle rotation/pulse, but
 * OrbitControls drag/zoom (direct user input) still works either way. */
export function prefersReducedMotion(): boolean {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
