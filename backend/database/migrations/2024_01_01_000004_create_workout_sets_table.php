<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('workout_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('set_number')->default(1);
            $table->unsignedSmallInteger('reps');
            $table->decimal('weight', 6, 2)->default(0);
            $table->decimal('rpe', 3, 1)->nullable(); // 1.0 - 10.0
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('workout_sets'); }
};
