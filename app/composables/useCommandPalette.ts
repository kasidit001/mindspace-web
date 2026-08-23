/** Shared open/closed state for the global Cmd+K command palette. */
export function useCommandPaletteOpen() {
  return useState('command-palette-open', () => false)
}
