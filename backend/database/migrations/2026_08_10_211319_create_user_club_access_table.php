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
        Schema::create('user_club_access', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->string('role', 50)->default('CLIENT');
            $table->integer('points')->default(0);
            $table->dateTime('joined_at')->useCurrent();
            $table->foreignId('team_leader_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->unique(['user_id', 'club_id'], 'unique_user_club');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_club_access');
    }
};
