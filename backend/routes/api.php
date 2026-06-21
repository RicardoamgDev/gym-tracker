<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExerciseController;
use App\Http\Controllers\Api\MuscleGroupController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\WorkoutController;
use Illuminate\Support\Facades\Route;

// Públicas
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Protegidas con Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);

    Route::get('muscle-groups', [MuscleGroupController::class, 'index']);
    Route::post('muscle-groups', [MuscleGroupController::class, 'store']);

    Route::get('exercises', [ExerciseController::class, 'index']);
    Route::post('exercises', [ExerciseController::class, 'store']);
    Route::delete('exercises/{exercise}', [ExerciseController::class, 'destroy']);

    Route::apiResource('workouts', WorkoutController::class);

    Route::prefix('stats')->group(function () {
        Route::get('progression', [StatsController::class, 'progression']);
        Route::get('weekly-volume', [StatsController::class, 'weeklyVolume']);
        Route::get('muscle-distribution', [StatsController::class, 'muscleDistribution']);
        Route::get('calendar', [StatsController::class, 'calendar']);
    });
});
