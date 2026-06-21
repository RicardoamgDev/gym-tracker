<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permite ejercicios "globales" (catálogo compartido) con user_id = NULL.
 * Los ejercicios propios de cada usuario siguen llevando su user_id.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
        Schema::table('exercises', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        // Reasigna los ejercicios globales a un usuario para no violar NOT NULL.
        $firstUserId = \DB::table('users')->min('id');
        if ($firstUserId) {
            \DB::table('exercises')->whereNull('user_id')->update(['user_id' => $firstUserId]);
        } else {
            \DB::table('exercises')->whereNull('user_id')->delete();
        }

        Schema::table('exercises', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
        Schema::table('exercises', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
