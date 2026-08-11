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
        Schema::create('event_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('liker_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('liked_id')->constrained('users')->cascadeOnDelete();
            $table->enum('action', ['like', 'pass'])->default('like');
            $table->boolean('is_match')->default(false);
            $table->timestamps();
            
            $table->unique(['event_id', 'liker_id', 'liked_id'], 'unique_like');
            $table->index('is_match');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_likes');
    }
};
