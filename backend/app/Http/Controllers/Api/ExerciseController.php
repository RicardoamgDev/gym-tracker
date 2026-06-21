<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exercise;
use Illuminate\Http\Request;

class ExerciseController extends Controller
{
    public function index(Request $request)
    {
        // Catálogo global (user_id null) + ejercicios propios del usuario.
        return Exercise::query()
            ->where(function ($q) use ($request) {
                $q->whereNull('user_id')->orWhere('user_id', $request->user()->id);
            })
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
        // Solo se pueden borrar ejercicios propios; los del catálogo global son de solo lectura.
        abort_if($exercise->user_id === null, 403, 'Los ejercicios del catálogo no se pueden borrar.');
        abort_unless($exercise->user_id === $request->user()->id, 403);
        $exercise->delete();
        return response()->noContent();
    }
}
