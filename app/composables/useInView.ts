// Scroll-triggered reveal, used to animate the dossier bar charts growing in
// once they're actually visible (the reference's benchmark bars climb as
// the scene plays, not sitting pre-filled from the first frame). Returns a
// template ref to attach plus a boolean that flips true once, the first time
// the element crosses the threshold — never flips back on scroll-away, so a
// bar doesn't re-animate every time someone scrolls past it twice.
export function useInView(threshold = 0.4) {
  const target = ref<HTMLElement | null>(null)
  const isInView = ref(false)

  if (import.meta.client) {
    let observer: IntersectionObserver | null = null

    watch(target, (el) => {
      observer?.disconnect()
      if (!el || isInView.value) return
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            isInView.value = true
            observer?.disconnect()
          }
        },
        { threshold }
      )
      observer.observe(el)
    }, { immediate: true })

    onBeforeUnmount(() => observer?.disconnect())
  }

  return { target, isInView }
}
