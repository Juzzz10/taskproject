<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Models\User;
use App\Models\Task;



Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Moving this HERE makes it accessible to Postman without a token
Route::get('/all-users', function() {
    return User::all();
});

Route::get('/all-tasks', function() {
    return Task::all();
});


Route::middleware('auth:sanctum')->group(function () {
    // Task CRUD
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
    
    // Bulk Actions
    Route::delete('/tasks-clear-history', [TaskController::class, 'clearHistory']);
    
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
});