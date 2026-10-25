<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fusiona los ejercicios duplicados de cada usuario (creados por tocar
 * varias veces "Crear") y luego impide nuevos duplicados con un índice único.
 *
 * Por cada grupo (user_id, name) se conserva el ejercicio más antiguo; las
 * series de los demás se repuntan a él y los sobrantes se borran. Así el
 * historial queda unido bajo un solo ejercicio.
 *
 * La comparación de nombres usa la collation de la columna (en MySQL
 * utf8mb4_unicode_ci: sin distinguir mayúsculas ni acentos), la misma que
 * aplicará el índice único, para que este no falle al crearse.
 *
 * Idempotente: si no hay duplicados no hace nada.
 */
return new class extends Migration
{
    public function up(): void
    {
        $groups = DB::table('exercises')
            ->whereNotNull('user_id')
            ->select('user_id', DB::raw('MIN(name) as dup_name'))
            ->groupBy('user_id', 'name')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($groups as $g) {
            DB::transaction(function () use ($g) {
                $ids = DB::table('exercises')
                    ->where('user_id', $g->user_id)
                    ->where('name', $g->dup_name)
                    ->orderBy('id')
                    ->pluck('id');

                $keep = $ids->shift();
                if ($ids->isEmpty()) {
                    return;
                }

                DB::table('workout_sets')
                    ->whereIn('exercise_id', $ids)
                    ->update(['exercise_id' => $keep]);

                DB::table('exercises')->whereIn('id', $ids)->delete();
            });
        }

        Schema::table('exercises', function (Blueprint $table) {
            $table->unique(['user_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'name']);
        });
        // La fusión no se revierte: no se sabe qué series venían de cada copia.
    }
};
