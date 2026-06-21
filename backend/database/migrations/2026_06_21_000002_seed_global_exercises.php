<?php

use App\Models\Exercise;
use App\Models\MuscleGroup;
use Database\Seeders\ExerciseSeeder;
use Database\Seeders\MuscleGroupSeeder;
use Illuminate\Database\Migrations\Migration;

/**
 * Puebla el catálogo global de ejercicios (user_id = null) importado de PersonalFit,
 * asegurando antes que existan todos los grupos musculares (incl. Pantorrillas).
 *
 * Idempotente: updateOrCreate / firstOrCreate, así que `php artisan migrate` puede
 * correr sobre una BD ya en uso sin duplicar ni pisar lo que el usuario haya creado.
 */
return new class extends Migration {
    public function up(): void
    {
        foreach (MuscleGroupSeeder::data() as $g) {
            MuscleGroup::updateOrCreate(['name' => $g['name']], $g);
        }

        $groups = MuscleGroup::pluck('id', 'name');

        foreach (ExerciseSeeder::data() as $e) {
            $groupId = $groups[$e['muscle_group']] ?? null;
            if (!$groupId) {
                continue;
            }
            Exercise::firstOrCreate(
                ['user_id' => null, 'name' => $e['name']],
                ['muscle_group_id' => $groupId, 'unit' => 'kg'],
            );
        }
    }

    public function down(): void
    {
        $names = array_column(ExerciseSeeder::data(), 'name');
        Exercise::whereNull('user_id')->whereIn('name', $names)->delete();
    }
};
