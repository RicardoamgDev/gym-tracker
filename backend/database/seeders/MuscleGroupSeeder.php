<?php
namespace Database\Seeders;

use App\Models\MuscleGroup;
use Illuminate\Database\Seeder;

class MuscleGroupSeeder extends Seeder
{
    /**
     * Colores alineados con el sistema de diseño "atlético oscuro"
     * (frontend/src/theme/tokens.js -> MUSCLE_COLORS).
     */
    public static function data(): array
    {
        return [
            ['name' => 'Pecho',        'color' => '#fb7185'],
            ['name' => 'Espalda',      'color' => '#22d3ee'],
            ['name' => 'Piernas',      'color' => '#a78bfa'],
            ['name' => 'Hombros',      'color' => '#fb923c'],
            ['name' => 'Bíceps',       'color' => '#c084fc'],
            ['name' => 'Tríceps',      'color' => '#2dd4bf'],
            ['name' => 'Core',         'color' => '#facc15'],
            ['name' => 'Glúteos',      'color' => '#f472b6'],
            ['name' => 'Pantorrillas', 'color' => '#34d399'],
        ];
    }

    public function run(): void
    {
        foreach (self::data() as $g) {
            MuscleGroup::updateOrCreate(['name' => $g['name']], $g);
        }
    }
}
