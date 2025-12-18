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
        Schema::table('capital_contributions', function (Blueprint $table) {
            $table->string('transactionType', 20)->after('memberId');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('capital_contributions', function (Blueprint $table) {
            $table->dropColumn('transactionType');
        });
    }
};
