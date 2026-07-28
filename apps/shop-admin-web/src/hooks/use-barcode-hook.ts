import { useEffect, useRef } from "react"

const DEFAULT_MAX_INTERVAL_MS = 30
const DEFAULT_MIN_LENGTH = 3

type UseBarcodeHookOptions = {
  onScan: (code: string) => void
  /** Max ms between keystrokes before they're no longer considered part of the same scan. */
  maxIntervalMs?: number
  /** Minimum scanned code length required to fire onScan. */
  minLength?: number
  /**
   * When true, keystrokes recognized as part of a scan are prevented from
   * reaching whatever element has focus (e.g. a text input).
   *
   * Caveat: the very first keystroke of a burst can't be classified until a
   * second keystroke arrives fast enough after it, so it may still land in a
   * focused field. Every subsequent character, plus the closing Enter, is
   * suppressed.
   */
  preventDefault?: boolean
}

export function useBarcodeScanner({
  onScan,
  maxIntervalMs = DEFAULT_MAX_INTERVAL_MS,
  minLength = DEFAULT_MIN_LENGTH,
  preventDefault = false,
}: UseBarcodeHookOptions) {
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    let buffer = ""
    let lastKeyTime = 0

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey) return

      const now = performance.now()
      const elapsed = now - lastKeyTime
      const isContinuation = elapsed <= maxIntervalMs
      lastKeyTime = now

      if (!isContinuation) {
        buffer = ""
      }

      if (event.key === "Enter") {
        const code = buffer
        buffer = ""
        if (code.length >= minLength) {
          if (preventDefault) event.preventDefault()
          onScanRef.current(code)
        }
        return
      }

      if (event.key.length === 1) {
        if (preventDefault && isContinuation) event.preventDefault()
        buffer += event.key
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [maxIntervalMs, minLength, preventDefault])
}
