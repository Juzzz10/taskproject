<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = ['text', 'done', 'completedAt', 'deletedAt', 'user_id'];

    // Relationship: A task belongs to one user
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}