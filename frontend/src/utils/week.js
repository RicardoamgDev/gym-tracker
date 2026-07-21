import dayjs from 'dayjs'

// Lunes 00:00 de la semana en curso (sin depender de plugins de locale)
export function startOfWeek(ref = dayjs()) {
  const d = dayjs(ref).startOf('day')
  return d.subtract((d.day() + 6) % 7, 'day')
}

// ¿La fecha cae en la semana actual (lunes → domingo)?
export function isThisWeek(date) {
  const start = startOfWeek()
  const end = start.add(7, 'day')
  const d = dayjs(date)
  return !d.isBefore(start) && d.isBefore(end)
}

// Volumen total de una sesión: Σ reps × peso
export function workoutVolume(w) {
  return Math.round((w.sets || []).reduce((s, x) => s + Number(x.reps) * Number(x.weight), 0))
}

// Agrupa las series por ejercicio conservando el orden de aparición
export function groupByExercise(sets) {
  const out = []
  for (const s of sets) {
    let g = out.find(x => x.exercise_id === s.exercise_id)
    if (!g) {
      g = { exercise_id: s.exercise_id, name: s.exercise_name, muscle: s.muscle, sets: [] }
      out.push(g)
    }
    g.sets.push(s)
  }
  return out
}
