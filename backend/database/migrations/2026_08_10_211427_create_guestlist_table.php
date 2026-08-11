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
        Schema::create('guestlist', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('rp_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['confirmed', 'checked_in', 'expired'])->default('confirmed');
            $table->string('qr_code', 100)->unique();
            $table->dateTime('checked_in_at')->nullable();
            $table->timestamps();
            
            $table->unique(['event_id', 'client_id'], 'unique_event_client');
            $table->index(['client_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guestlist');
    }
};
