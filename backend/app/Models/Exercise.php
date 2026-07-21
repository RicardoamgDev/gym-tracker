<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exercise extends Model
{
    protected $fillable = ['user_id', 'muscle_group_id', 'name', 'unit'];

    public function muscleGroup(): BelongsTo
    {
        return $this->belongsTo(MuscleGroup::class);
    }

    public function sets(): HasMany
    {
        return $this->hasMany(WorkoutSet::class);
    }

    /**
     * Copia la plantilla global (user_id = null) al usuario indicado.
     * Los ejercicios globales NUNCA se muestran: sirven solo de plantilla
     * para que cada usuario arranque con un catálogo propio y editable.
     *
     * Idempotente: omite los nombres que el usuario ya tenga.
     */
    public static function copyCatalogTo(int $userId): int
    {
        $own = static::where('user_id', $userId)->pluck('name')->all();
        $copied = 0;

        static::whereNull('user_id')->get()->each(function ($tpl) use ($userId, $own, &$copied) {
            if (in_array($tpl->name, $own, true)) {
                return;
            }
            static::create([
                'user_id'         => $userId,
                'muscle_group_id' => $tpl->muscle_group_id,
                'name'            => $tpl->name,
                'unit'            => $tpl->unit,
            ]);
            $copied++;
        });

        return $copied;
    }
}
