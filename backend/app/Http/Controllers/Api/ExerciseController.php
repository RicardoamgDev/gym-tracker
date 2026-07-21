<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exercise;
use Illuminate\Http\Request;

class ExerciseController extends Controller
{
    public function index(Request $request)
    {
        // Solo los ejercicios del usuario. La plantilla global (user_id = null)
        // no se expone: se copia a cada usuario al registrarse.
        return Exercise::query()
            ->where('user_id', $request->user()->id)
            ->with('muscleGroup')
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
        $exercise = $request->user()->exercises()->create($data);
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
