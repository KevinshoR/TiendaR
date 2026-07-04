import { useEffect, useRef, useState } from 'react'

/**
 * Hook de scroll-reveal: detecta cuándo un elemento entra en el viewport
 * y devuelve un ref + boolean de visibilidad, para animar secciones al hacer scroll.
 */
export function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, visible]
}

/** Clases de transición usadas por todas las secciones con reveal */
export const revealClass = (v) =>
  `transition-all duration-700 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`