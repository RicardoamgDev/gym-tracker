<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('exercises', function (Blueprint $table) {
            $table->foreignId('user_id')->after('id')->constrained()->cascadeOnDelete();
        });
        Schema::table('workouts', function (Blueprint $table) {
            $table->foreignId('user_id')->after('id')->constrained()->cascadeOnDelete();
        });
    }
    public function down(): void {
        Schema::table('exercises', fn (Blueprint $t) => $t->dropConstrainedForeignId('user_id'));
        Schema::table('workouts', fn (Blueprint $t) => $t->dropConstrainedForeignId('user_id'));
    }
};
