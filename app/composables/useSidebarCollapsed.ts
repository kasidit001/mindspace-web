/** Shared "sidebar collapsed" state — hides the course sidebar (even on
 *  desktop) and lets the reading column widen to fill the freed space.
 *  Shared (not local to the layout) because the lesson page needs it too,
 *  to pick its max-width. */
export function useSidebarCollapsed() {
  return useState('sidebar-collapsed', () => false)
}
