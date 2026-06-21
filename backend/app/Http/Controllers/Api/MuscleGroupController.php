<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MuscleGroup;
use Illuminate\Http\Request;

class MuscleGroupController extends Controller
{
    public function index()
    {
        return MuscleGroup::orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'  => 'required|string|max:100|unique:muscle_groups,name',
            'color' => 'nullable|string|max:9',
        ]);
        return MuscleGroup::create($data);
    }
}
