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
        Schema::create('rp_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rp_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewer_user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('rating'); // In model check between 1 and 5
            $table->text('comment')->nullable();
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
            $table->dateTime('created_at')->useCurrent();
            
            $table->unique(['rp_user_id', 'reviewer_user_id', 'event_id'], 'unique_review');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rp_reviews');
    }
};
