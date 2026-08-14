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
        Schema::table('rp_challenges', function (Blueprint $table) {
            $table->date('start_date')->nullable()->after('reward');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rp_challenges', function (Blueprint $table) {
            $table->dropColumn('start_date');
        });
    }
};
