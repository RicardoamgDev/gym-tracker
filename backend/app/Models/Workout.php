<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workout extends Model
{
    protected $fillable = [
        'user_id', 'name', 'date', 'started_at', 'ended_at', 'duration_minutes', 'notes',
    ];

    protected $casts = [
        'date'       => 'date:Y-m-d',
        'started_at' => 'datetime',
        'ended_at'   => 'datetime',
    ];

    public function sets(): HasMany
    {
        return $this->hasMany(WorkoutSet::class);
    }
}
