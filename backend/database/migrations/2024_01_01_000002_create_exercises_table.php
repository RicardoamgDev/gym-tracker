<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('muscle_group_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('unit', 5)->default('kg'); // kg | lb
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('exercises'); }
};
