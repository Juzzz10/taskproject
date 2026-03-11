<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // <--- Make sure this is here

class TaskController extends Controller
{
    public function index()
    {
        // This ensures we only get tasks for the user associated with the token
        return response()->json(Auth::user()->tasks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'text' => 'required|string',
        ]);

        // This automatically sets the user_id for the new task
        $task = Auth::user()->tasks()->create([
            'text' => $request->text,
            'done' => false
        ]);

        return response()->json($task, 201);
    }

    public function update(Request $request, Task $task)
    {
        // Security check
        if ($task->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->update($request->all());
        return response()->json($task);
    }
    
    public function destroy(Task $task)
    {
        if ($task->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $task->delete();
        return response()->json(['message' => 'Deleted']);
    }
}