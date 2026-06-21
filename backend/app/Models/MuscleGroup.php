<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MuscleGroup extends Model
{
    protected $fillable = ['name', 'color'];

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class);
    }
}
