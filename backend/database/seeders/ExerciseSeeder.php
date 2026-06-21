<?php

namespace Database\Seeders;

use App\Models\Exercise;
use App\Models\MuscleGroup;
use Illuminate\Database\Seeder;

class ExerciseSeeder extends Seeder
{
    /**
     * Catálogo de ejercicios globales (user_id = null), importado de PersonalFit.
     * Sin vídeo ni músculos secundarios (no existen esas columnas aquí).
     * El nombre del grupo debe coincidir con MuscleGroupSeeder.
     * Se usa tanto en el seed como en la migración de backfill.
     */
    public static function data(): array
    {
        return [
            // Pecho
            ['name' => 'Press de banca plano',        'muscle_group' => 'Pecho'],
            ['name' => 'Press de banca inclinado',     'muscle_group' => 'Pecho'],
            ['name' => 'Press de banca declinado',     'muscle_group' => 'Pecho'],
            ['name' => 'Aperturas con mancuernas',     'muscle_group' => 'Pecho'],
            ['name' => 'Fondos en paralelas',          'muscle_group' => 'Pecho'],

            // Espalda
            ['name' => 'Dominadas',                    'muscle_group' => 'Espalda'],
            ['name' => 'Remo con barra',               'muscle_group' => 'Espalda'],
            ['name' => 'Remo con mancuerna',           'muscle_group' => 'Espalda'],
            ['name' => 'Jalón al pecho',               'muscle_group' => 'Espalda'],
            ['name' => 'Peso muerto convencional',     'muscle_group' => 'Espalda'],
            ['name' => 'Hiperextensiones',             'muscle_group' => 'Espalda'],

            // Hombros
            ['name' => 'Press militar con barra',      'muscle_group' => 'Hombros'],
            ['name' => 'Press Arnold',                 'muscle_group' => 'Hombros'],
            ['name' => 'Elevaciones laterales',        'muscle_group' => 'Hombros'],
            ['name' => 'Elevaciones frontales',        'muscle_group' => 'Hombros'],
            ['name' => 'Pájaros',                      'muscle_group' => 'Hombros'],

            // Bíceps
            ['name' => 'Curl con barra',               'muscle_group' => 'Bíceps'],
            ['name' => 'Curl con mancuernas',          'muscle_group' => 'Bíceps'],
            ['name' => 'Curl martillo',                'muscle_group' => 'Bíceps'],
            ['name' => 'Curl concentrado',             'muscle_group' => 'Bíceps'],

            // Tríceps
            ['name' => 'Press francés',                'muscle_group' => 'Tríceps'],
            ['name' => 'Extensión en polea alta',      'muscle_group' => 'Tríceps'],
            ['name' => 'Patada de tríceps',            'muscle_group' => 'Tríceps'],
            ['name' => 'Fondos en banco',              'muscle_group' => 'Tríceps'],

            // Piernas
            ['name' => 'Sentadilla con barra',         'muscle_group' => 'Piernas'],
            ['name' => 'Sentadilla frontal',           'muscle_group' => 'Piernas'],
            ['name' => 'Prensa de piernas',            'muscle_group' => 'Piernas'],
            ['name' => 'Extensiones de cuádriceps',    'muscle_group' => 'Piernas'],
            ['name' => 'Curl femoral acostado',        'muscle_group' => 'Piernas'],
            ['name' => 'Zancadas',                     'muscle_group' => 'Piernas'],
            ['name' => 'Peso muerto rumano',           'muscle_group' => 'Piernas'],

            // Glúteos
            ['name' => 'Hip thrust con barra',         'muscle_group' => 'Glúteos'],
            ['name' => 'Patada de glúteo en polea',    'muscle_group' => 'Glúteos'],
            ['name' => 'Abducción de cadera',          'muscle_group' => 'Glúteos'],

            // Pantorrillas
            ['name' => 'Elevación de talones de pie',  'muscle_group' => 'Pantorrillas'],
            ['name' => 'Elevación de talones sentado', 'muscle_group' => 'Pantorrillas'],

            // Core
            ['name' => 'Plancha',                      'muscle_group' => 'Core'],
            ['name' => 'Crunch abdominal',             'muscle_group' => 'Core'],
            ['name' => 'Elevación de piernas',         'muscle_group' => 'Core'],
            ['name' => 'Rueda abdominal',              'muscle_group' => 'Core'],
        ];
    }

    public function run(): void
    {
        $groups = MuscleGroup::pluck('id', 'name');

        foreach (self::data() as $e) {
            $groupId = $groups[$e['muscle_group']] ?? null;
            if (!$groupId) {
                continue; // el grupo debe existir (MuscleGroupSeeder corre antes)
            }
            Exercise::firstOrCreate(
                ['user_id' => null, 'name' => $e['name']],
                ['muscle_group_id' => $groupId, 'unit' => 'kg'],
            );
        }
    }
}
