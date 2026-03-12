<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    /**
     * Get all tasks for the logged-in user.
     * We now filter by 'user_name' string instead of 'user_id'.
     */
    public function index()
    {
        $userName = Auth::user()->name;
        
        $tasks = Task::where('user_name', $userName)->get();
        
        return response()->json($tasks);
    }

    /**
     * Store a new task.
     * We explicitly save the user's name into the database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'text' => 'required|string',
        ]);

        // We create the task and manually assign the logged-in user's name
        $task = Task::create([
            'user_name' => Auth::user()->name, 
            'text' => $request->text,
            'done' => false
        ]);

        return response()->json($task, 201);
    }

    /**
     * Update a task.
     * Security check now compares names instead of IDs.
     */
    public function update(Request $request, Task $task)
    {
        // Security check: Compare the strings
        if ($task->user_name !== Auth::user()->name) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->update($request->all());
        return response()->json($task);
    }
    
    /**
     * Delete a task.
     */
    public function destroy(Task $task)
    {
        // Security check: Compare the strings
        if ($task->user_name !== Auth::user()->name) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->delete();
        return response()->json(['message' => 'Deleted']);
    }
}