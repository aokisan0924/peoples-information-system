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
        Schema::create('acc_bank_records', function (Blueprint $table) {
            $table->id();
            $table->string('branch'); 
            $table->string('bank_account_code'); 
            $table->date('transaction_date');
            $table->string('reference_no')->nullable();
            $table->string('particulars');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->boolean('is_journalized')->default(false);
            $table->timestamps();
        });

        Schema::table('acc_general_ledgers', function (Blueprint $table) {
            $table->unsignedBigInteger('bank_record_id')->nullable()->after('petty_cash_id');
            $table->unsignedBigInteger('e_wallet_id')->nullable()->change()->after('bank_record_id');
            $table->foreign('bank_record_id')
                ->references('id')
                ->on('acc_bank_records')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('acc_general_ledgers', function (Blueprint $table) {
            $table->dropForeign(['bank_record_id']);
            $table->dropColumn('bank_record_id');
        });
        
        Schema::dropIfExists('acc_bank_records');
    }
};
