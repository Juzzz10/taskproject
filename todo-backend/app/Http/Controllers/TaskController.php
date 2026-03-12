<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    /**
     * Get all tasks for the logged-in user.
     */
    public function index()
    {
        $userName = Auth::user()->name;
        $tasks = Task::where('user_name', $userName)->get();
        return response()->json($tasks);
    }

    /**
     * Store a new task.
     */
    public function store(Request $request)
    {
        $request->validate([
            'text' => 'required|string',
        ]);

        $task = Task::create([
            'user_name' => Auth::user()->name, 
            'text' => $request->text,
            'done' => false
        ]);

        return response()->json($task, 201);
    }

    /**
     * Update a task (Edit text, Toggle check, or move to Finished/Deleted).
     */
    public function update(Request $request, Task $task)
    {
        if ($task->user_name !== Auth::user()->name) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->update($request->all());
        return response()->json($task);
    }
    
    /**
     * Delete a single task.
     */
    public function destroy(Task $task)
    {
        if ($task->user_name !== Auth::user()->name) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->delete();
        return response()->json(['message' => 'Deleted']);
    }

    /**
     * PERMANENTLY CLEAR HISTORY
     * Deletes all tasks that are marked as Finished OR Deleted.
     */
    public function clearHistory()
    {
        $userName = Auth::user()->name;

        // Find tasks belonging to this user that have completedAt OR deletedAt
        Task::where('user_name', $userName)
            ->where(function ($query) {
                $query->whereNotNull('completedAt')
                      ->orWhereNotNull('deletedAt');
            })
            ->delete();

        return response()->json(['message' => 'History cleared successfully']);
    }
}