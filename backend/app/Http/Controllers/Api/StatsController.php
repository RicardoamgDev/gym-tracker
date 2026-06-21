<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function progression(Request $request)
    {
        $request->validate(['exercise_id' => 'required|exists:exercises,id']);

        return DB::table('workout_sets as ws')
            ->join('workouts as w', 'w.id', '=', 'ws.workout_id')
            ->where('w.user_id', $request->user()->id)
            ->where('ws.exercise_id', $request->exercise_id)
            ->groupBy('w.date')
            ->orderBy('w.date')
            ->selectRaw('w.date as date')
            ->selectRaw('MAX(ws.weight) as max_weight')
            ->selectRaw('SUM(ws.reps * ws.weight) as volume')
            ->selectRaw('ROUND(AVG(ws.rpe), 1) as avg_rpe')
            ->get();
    }

    public function weeklyVolume(Request $request)
    {
        return DB::table('workout_sets as ws')
            ->join('workouts as w', 'w.id', '=', 'ws.workout_id')
            ->where('w.user_id', $request->user()->id)
            ->groupBy('week')
            ->orderBy('week')
            ->selectRaw("DATE_FORMAT(w.date, '%x-W%v') as week")
            ->selectRaw('SUM(ws.reps * ws.weight) as volume')
            ->selectRaw('COUNT(ws.id) as total_sets')
            ->get();
    }

    public function muscleDistribution(Request $request)
    {
        return DB::table('workout_sets as ws')
            ->join('workouts as w', 'w.id', '=', 'ws.workout_id')
            ->join('exercises as e', 'e.id', '=', 'ws.exercise_id')
            ->join('muscle_groups as mg', 'mg.id', '=', 'e.muscle_group_id')
            ->where('w.user_id', $request->user()->id)
            ->groupBy('mg.id', 'mg.name', 'mg.color')
            ->orderByDesc('volume')
            ->selectRaw('mg.name as muscle_group')
            ->selectRaw('mg.color as color')
            ->selectRaw('SUM(ws.reps * ws.weight) as volume')
            ->selectRaw('COUNT(ws.id) as total_sets')
            ->get();
    }

    public function calendar(Request $request)
    {
        return DB::table('workouts as w')
            ->leftJoin('workout_sets as ws', 'ws.workout_id', '=', 'w.id')
            ->where('w.user_id', $request->user()->id)
            ->groupBy('w.date')
            ->orderBy('w.date')
            ->selectRaw('w.date as date')
            ->selectRaw('COALESCE(SUM(ws.reps * ws.weight), 0) as volume')
            ->selectRaw('COUNT(ws.id) as total_sets')
            ->get();
    }
}
