<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exercise;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

class ExerciseController extends Controller
{
    public function index(Request $request)
    {
        // Solo los ejercicios del usuario. La plantilla global (user_id = null)
        // no se expone: se copia a cada usuario al registrarse.
        // withCount('sets') permite al frontend mostrar solo los ejercicios
        // que ya tienen registros (p. ej. en Progresión).
        return Exercise::query()
            ->where('user_id', $request->user()->id)
            ->with('muscleGroup')
            ->withCount('sets')
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'muscle_group_id' => 'required|exists:muscle_groups,id',
            'name'            => 'required|string|max:150',
            'unit'            => 'nullable|in:kg,lb',
        ]);
        $data['name'] = trim($data['name']);

        // Idempotente por nombre: un doble toque (o un reintento) devuelve el
        // mismo ejercicio en vez de crear un duplicado. El índice único
        // (user_id, name) cubre la carrera entre dos peticiones simultáneas.
        $existing = $request->user()->exercises()->where('name', $data['name'])->first();
        if ($existing) {
            return $existing->load('muscleGroup');
        }
        try {
            $exercise = $request->user()->exercises()->create($data);
        } catch (UniqueConstraintViolationException) {
            $exercise = $request->user()->exercises()->where('name', $data['name'])->firstOrFail();
        }
        return $exercise->load('muscleGroup');
    }

    public function destroy(Request $request, Exercise $exercise)
    {
        // Red de seguridad: la plantilla global no es borrable por nadie.
        abort_if($exercise->user_id === null, 403, 'Ejercicio de plantilla, no borrable.');
        abort_unless($exercise->user_id === $request->user()->id, 403);
        $exercise->delete();
        return response()->noContent();
    }
}
