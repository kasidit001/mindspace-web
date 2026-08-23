/** Shared open/closed state for the AI chat drawer, so other UI (e.g. the
 *  command palette) can open it programmatically. */
export function useChatDrawerOpen() {
  return useState('chat-drawer-open', () => false)
}
