<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    public function index() {
        return response()->json(Task::where('user_name', Auth::user()->name)->get());
    }

    public function store(Request $request) {
        $request->validate(['text' => 'required|string']);
        $task = Task::create([
            'user_name' => Auth::user()->name, 
            'text' => $request->text,
            'done' => false
        ]);
        return response()->json($task, 201);
    }

    public function update(Request $request, Task $task) {
        if ($task->user_name !== Auth::user()->name) return response()->json(['message' => 'Unauthorized'], 403);
        $task->update($request->all());
        return response()->json($task);
    }
    
    public function destroy(Task $task) {
        if ($task->user_name !== Auth::user()->name) return response()->json(['message' => 'Unauthorized'], 403);
        // Move to history by adding deletedAt timestamp
        $task->update(['deletedAt' => now()->toDateTimeString()]);
        return response()->json(['message' => "Task moved to history"]);
    }

    public function clearHistory() {
        // Permanently delete from DB
        Task::where('user_name', Auth::user()->name)
            ->where(function ($q) { $q->whereNotNull('completedAt')->orWhereNotNull('deletedAt'); })
            ->delete();
        return response()->json(['message' => 'History cleared']);
    }
}