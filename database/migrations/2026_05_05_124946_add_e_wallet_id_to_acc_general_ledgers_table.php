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
            $table->foreignId('e_wallet_id')->nullable()->constrained('acc_e_wallets')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('acc_general_ledgers', function (Blueprint $table) {
            $table->dropForeign(['e_wallet_id']);
            $table->dropColumn('e_wallet_id');
        });
    }
};
