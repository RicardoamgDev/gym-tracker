<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkoutController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->workouts()
            ->with('sets.exercise.muscleGroup')
            ->orderByDesc('date')->get();
    }

    public function show(Request $request, Workout $workout)
    {
        $this->authorizeOwner($request, $workout);
        return $workout->load('sets.exercise.muscleGroup');
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $workout = DB::transaction(function () use ($request, $data) {
            $workout = $request->user()->workouts()->create([
                'name'             => $data['name'] ?? null,
                'date'             => $data['date'],
                'started_at'       => $data['started_at'] ?? null,
                'ended_at'         => $data['ended_at'] ?? null,
                'duration_minutes' => $data['duration_minutes'] ?? null,
                'notes'            => $data['notes'] ?? null,
            ]);
            $this->syncSets($workout, $data['sets']);
            return $workout;
        });

        return $workout->load('sets.exercise.muscleGroup');
    }

    public function update(Request $request, Workout $workout)
    {
        $this->authorizeOwner($request, $workout);
        $data = $this->validateData($request);

        DB::transaction(function () use ($workout, $data) {
            $workout->update([
                'name'             => $data['name'] ?? null,
                'date'             => $data['date'],
                'started_at'       => $data['started_at'] ?? null,
                'ended_at'         => $data['ended_at'] ?? null,
                'duration_minutes' => $data['duration_minutes'] ?? null,
                'notes'            => $data['notes'] ?? null,
            ]);
            $workout->sets()->delete();
            $this->syncSets($workout, $data['sets']);
        });

        return $workout->load('sets.exercise.muscleGroup');
    }

    public function destroy(Request $request, Workout $workout)
    {
        $this->authorizeOwner($request, $workout);
        $workout->delete();
        return response()->noContent();
    }

    private function authorizeOwner(Request $request, Workout $workout): void
    {
        abort_unless($workout->user_id === $request->user()->id, 403);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name'                 => 'nullable|string|max:120',
            'date'                 => 'required|date',
            'started_at'           => 'nullable|date',
            'ended_at'             => 'nullable|date|after_or_equal:started_at',
            'duration_minutes'     => 'nullable|integer|min:0|max:1440',
            'notes'                => 'nullable|string',
            'sets'                 => 'required|array|min:1',
            'sets.*.exercise_id'   => 'required|exists:exercises,id',
            'sets.*.set_number'    => 'nullable|integer|min:1',
            'sets.*.reps'          => 'required|integer|min:1',
            'sets.*.weight'        => 'nullable|numeric|min:0',
            'sets.*.rpe'           => 'nullable|numeric|min:1|max:10',
        ]);
    }

    private function syncSets(Workout $workout, array $sets): void
    {
        foreach ($sets as $i => $set) {
            $workout->sets()->create([
                'exercise_id' => $set['exercise_id'],
                'set_number'  => $set['set_number'] ?? ($i + 1),
                'reps'        => $set['reps'],
                'weight'      => $set['weight'] ?? 0,
                'rpe'         => $set['rpe'] ?? null,
            ]);
        }
    }
}
