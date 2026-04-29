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
        Schema::table('acc_petty_cash_funds', function (Blueprint $table) {
            $table->string('branch')->index()->after('id'); // e.g., 'Main', 'Cubao', 'Fort Magsaysay'
        });
        Schema::table('acc_general_ledgers', function (Blueprint $table) {
            $table->string('branch')->index()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('acc_petty_cash_funds', function (Blueprint $table) {
            $table->dropColumn('branch'); //
        });
        Schema::table('acc_general_ledgers', function (Blueprint $table) {
            $table->dropColumn('branch'); //
        });
    }
};
