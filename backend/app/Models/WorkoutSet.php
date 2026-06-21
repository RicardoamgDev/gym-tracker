<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutSet extends Model
{
    protected $fillable = ['workout_id', 'exercise_id', 'set_number', 'reps', 'weight', 'rpe'];
    protected $casts = ['weight' => 'float', 'rpe' => 'float'];

    protected $appends = ['volume'];

    public function getVolumeAttribute(): float
    {
        return $this->reps * $this->weight;
    }

    public function workout(): BelongsTo
    {
        return $this->belongsTo(Workout::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
