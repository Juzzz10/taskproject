<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
// Models imported here to fix IDE squiggly lines
use App\Models\User;
use App\Models\Task;

/*

*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    // Logout requires being logged in
    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
});

/*

*/
Route::middleware('auth:sanctum')->prefix('tasks')->group(function () {
    // Basic CRUD
    Route::get('/', [TaskController::class, 'index']);           // GET /api/tasks
    Route::post('/', [TaskController::class, 'store']);         // POST /api/tasks
    Route::put('/{task}', [TaskController::class, 'update']);    // PUT /api/tasks/{id}
    Route::delete('/{task}', [TaskController::class, 'destroy']); // DELETE /api/tasks/{id}
    
    // Bulk History Action
    Route::delete('/history/clear', [TaskController::class, 'clearHistory']); // DELETE /api/tasks/history/clear
});

/*

*/
Route::prefix('admin')->group(function () {
    
    // Get every single user registered
    Route::get('/users', function() { 
        return User::all(); 
    });

    // Get every single task created by everyone
    Route::get('/tasks', function() { 
        return Task::all(); 
    });
});