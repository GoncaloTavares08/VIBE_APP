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
        Schema::create('clubs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug', 100)->unique();
            $table->string('location')->nullable();
            $table->string('address', 500)->nullable();
            $table->string('city')->nullable();
            $table->integer('max_capacity')->default(800);
            $table->time('opening_time')->default('23:00:00');
            $table->time('closing_time')->default('06:00:00');
            $table->string('contact_phone', 50)->nullable();
            $table->string('language')->default('pt');
            $table->string('timezone')->default('lisbon');
            $table->boolean('dark_mode')->default(true);
            $table->json('notifications')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clubs');
    }
};
