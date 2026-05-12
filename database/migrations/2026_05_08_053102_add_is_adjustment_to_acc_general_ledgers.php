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
        Schema::table('acc_general_ledgers', function (Blueprint $table) {
            $table->boolean('is_adjustment')->default(false)->after('branch');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('acc_general_ledgers', function (Blueprint $table) {
            $table->dropColumn('is_adjustment');
        });
    }
};
