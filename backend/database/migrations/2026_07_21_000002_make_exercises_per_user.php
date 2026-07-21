<?php

use App\Models\Exercise;
use App\Models\User;
use App\Models\Workout;
use App\Models\WorkoutSet;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Los ejercicios pasan a ser privados de cada usuario.
 *
 * La plantilla global (user_id = null) se conserva en la tabla pero deja de
 * mostrarse: sirve para sembrar el catálogo de cada usuario nuevo.
 *
 * Para los usuarios que ya existen:
 *   1. Se les copia la plantilla (omitiendo nombres que ya tengan).
 *   2. Las series de sus entrenamientos que apuntaban a un ejercicio global
 *      se repuntan a su copia, para no perder el historial.
 *
 * Idempotente: se puede volver a ejecutar sin duplicar ni romper nada.
 */
return new class extends Migration
{
    public function up(): void
    {
        $globals = Exercise::whereNull('user_id')->get();
        if ($globals->isEmpty()) {
            return;
        }
        $globalIds = $globals->pluck('id')->all();

        User::query()->orderBy('id')->chunk(50, function ($users) use ($globals, $globalIds) {
            foreach ($users as $user) {
                DB::transaction(function () use ($user, $globals, $globalIds) {
                    // 1. copia de la plantilla (respetando lo que el usuario ya tenga)
                    $own = Exercise::where('user_id', $user->id)
                        ->pluck('id', 'name')->all();

                    foreach ($globals as $tpl) {
                        if (!array_key_exists($tpl->name, $own)) {
                            $own[$tpl->name] = Exercise::create([
                                'user_id'         => $user->id,
                                'muscle_group_id' => $tpl->muscle_group_id,
                                'name'            => $tpl->name,
                                'unit'            => $tpl->unit,
                            ])->id;
                        }
                    }

                    // 2. repuntar las series que apuntaban a la plantilla global
                    $workoutIds = Workout::where('user_id', $user->id)->pluck('id');
                    if ($workoutIds->isEmpty()) {
                        return;
                    }

                    WorkoutSet::whereIn('workout_id', $workoutIds)
                        ->whereIn('exercise_id', $globalIds)
                        ->get()
                        ->each(function ($set) use ($globals, $own) {
                            $tpl = $globals->firstWhere('id', $set->exercise_id);
                            if ($tpl && isset($own[$tpl->name])) {
                                $set->update(['exercise_id' => $own[$tpl->name]]);
                            }
                        });
                });
            }
        });
    }

    public function down(): void
    {
        // No se revierte: volver atrás implicaría decidir qué copia de cada
        // usuario es "la buena" y podría romper el historial de entrenamientos.
    }
};
