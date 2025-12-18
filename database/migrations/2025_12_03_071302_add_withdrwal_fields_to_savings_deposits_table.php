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
        Schema::table('savings_deposits', function (Blueprint $table) {
            $table->boolean('isWithdrawalRequest')->default(false);
            $table->string('withdrawalBankName')->nullable();
            $table->string('withdrawalAccountName')->nullable();
            $table->string('withdrawalAccountNumber')->nullable();
            $table->string('withdrawalRemarks')->nullable();
            $table->string('requestReference')->nullable();
            $table->timestamp('approvedAt')->nullable();
            $table->timestamp('rejectedAt')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('savings_deposits', function (Blueprint $table) {
            //
        });
    }
};
