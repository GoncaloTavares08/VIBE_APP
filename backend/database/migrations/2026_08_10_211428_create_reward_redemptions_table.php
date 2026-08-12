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
        Schema::create('reward_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reward_id')->constrained('rewards')->cascadeOnDelete();
            $table->string('reward_name');
            $table->integer('points_spent');
            $table->enum('status', ['pending', 'used', 'expired'])->default('pending');
            $table->string('qr_code', 500)->unique();
            $table->foreignId('activated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('redeemed_at')->useCurrent();
            $table->dateTime('used_at')->nullable();
            $table->dateTime('expires_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reward_redemptions');
    }
};
