<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workout extends Model
{
    protected $fillable = ['user_id', 'date', 'duration_minutes', 'notes'];
    protected $casts = ['date' => 'date:Y-m-d'];

    public function sets(): HasMany
    {
        return $this->hasMany(WorkoutSet::class);
    }
}
