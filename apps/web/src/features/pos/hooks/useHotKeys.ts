import { useEffect } from 'react'

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)

export function useHotkeys(
  handlers: Record<string, (e: KeyboardEvent) => void>,
  enabled = true,
  alwaysOn: string[] = ['F9', 'Escape'],
) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const fn = handlers[e.key]
      if (!fn || e.ctrlKey || e.metaKey || e.altKey) return
      if (isTyping(e.target) && !alwaysOn.includes(e.key)) return
      e.preventDefault()
      fn(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlers, enabled, alwaysOn])
}