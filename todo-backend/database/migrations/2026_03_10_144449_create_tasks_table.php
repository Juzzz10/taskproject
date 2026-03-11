<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            // This links the task to a user
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); 
            $table->string('text');
            $table->boolean('done')->default(false);
            $table->string('completedAt')->nullable();
            $table->string('deletedAt')->nullable();
            $table->timestamps(); // This creates created_at and updated_at columns
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};