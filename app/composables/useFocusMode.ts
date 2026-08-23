/** Shared "focus mode" state: hides the course sidebar (even on desktop) so
 *  the reader can concentrate on lesson content without distraction. */
export function useFocusMode() {
  return useState('focus-mode', () => false)
}
