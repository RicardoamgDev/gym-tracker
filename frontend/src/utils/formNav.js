/**
 * Enter = pasar al siguiente campo del formulario.
 * En el último campo no hace nada, así el formulario se envía como siempre.
 *
 * Uso: <Form onKeyDown={focusNextOnEnter} ...>
 */
export function focusNextOnEnter(e) {
  if (e.key !== 'Enter' || e.shiftKey) return

  const el = e.target
  // En un textarea, Enter debe seguir insertando salto de línea
  if (el.tagName === 'TEXTAREA') return

  const form = el.closest('form')
  if (!form) return

  const focusables = Array.from(
    form.querySelectorAll(
      'input:not([type="hidden"]):not([disabled]):not([readonly])',
    ),
  ).filter(n => n.offsetParent !== null)

  const i = focusables.indexOf(el)
  if (i === -1) return

  const next = focusables[i + 1]
  if (!next) return // último campo -> submit normal

  e.preventDefault()
  next.focus()
  if (typeof next.select === 'function') next.select()
}
