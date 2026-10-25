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

// Sesiones anteriores en las que aparece un ejercicio, de la más reciente a la
// más antigua, con solo sus series. excludeId omite la sesión que se edita.
export function exerciseHistory(workouts, exerciseId, excludeId = null) {
  return workouts
    .filter(w => w.id !== excludeId)
    .map(w => ({
      id: w.id,
      date: w.date,
      started_at: w.started_at,
      name: w.name,
      sets: (w.sets || [])
        .filter(s => s.exercise_id === exerciseId)
        .sort((a, b) => a.set_number - b.set_number)
        .map(s => ({ weight: Number(s.weight ?? 0), reps: Number(s.reps), rpe: s.rpe == null ? null : Number(s.rpe) })),
    }))
    .filter(w => w.sets.length > 0)
    .sort((a, b) => dayjs(b.started_at || b.date).valueOf() - dayjs(a.started_at || a.date).valueOf())
}

// Mejor serie histórica (mayor peso; a igual peso, más reps)
export function bestSet(sessions) {
  let best = null
  for (const w of sessions) {
    for (const s of w.sets) {
      if (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) {
        best = { ...s, date: w.date }
      }
    }
  }
  return best
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
