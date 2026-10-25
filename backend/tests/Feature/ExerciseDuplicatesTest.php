<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\MuscleGroup;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ExerciseDuplicatesTest extends TestCase
{
    use RefreshDatabase;

    public function test_crear_dos_veces_el_mismo_nombre_devuelve_el_mismo_ejercicio(): void
    {
        $user = User::factory()->create();
        $group = MuscleGroup::firstOrCreate(['name' => 'Pecho']);
        $payload = ['name' => 'Press raro ', 'muscle_group_id' => $group->id, 'unit' => 'kg'];

        $a = $this->actingAs($user)->postJson('/api/exercises', $payload)->assertSuccessful()->json('id');
        $b = $this->actingAs($user)->postJson('/api/exercises', $payload)->assertSuccessful()->json('id');

        $this->assertSame($a, $b);
        $this->assertSame(1, Exercise::where('user_id', $user->id)->where('name', 'Press raro')->count());
    }

    public function test_la_migracion_fusiona_duplicados_y_sus_series(): void
    {
        $user = User::factory()->create();
        $group = MuscleGroup::firstOrCreate(['name' => 'Pecho']);

        // Simula el estado previo: sin índice único y con duplicados.
        Schema::table('exercises', fn (Blueprint $t) => $t->dropUnique(['user_id', 'name']));
        $ids = collect(range(1, 3))->map(fn () => DB::table('exercises')->insertGetId([
            'user_id' => $user->id, 'muscle_group_id' => $group->id,
            'name' => 'Press dup', 'unit' => 'kg', 'created_at' => now(), 'updated_at' => now(),
        ]));

        $w1 = $user->workouts()->create(['date' => '2026-10-01']);
        $w2 = $user->workouts()->create(['date' => '2026-10-08']);
        $w1->sets()->create(['exercise_id' => $ids[0], 'set_number' => 1, 'reps' => 8, 'weight' => 60]);
        $w1->sets()->create(['exercise_id' => $ids[1], 'set_number' => 2, 'reps' => 8, 'weight' => 60]);
        $w2->sets()->create(['exercise_id' => $ids[2], 'set_number' => 1, 'reps' => 6, 'weight' => 65]);

        (require database_path('migrations/2026_10_25_000001_merge_duplicate_exercises.php'))->up();

        $this->assertSame([$ids[0]], Exercise::where('name', 'Press dup')->pluck('id')->all());
        $this->assertSame(3, DB::table('workout_sets')->where('exercise_id', $ids[0])->count());
    }
}
