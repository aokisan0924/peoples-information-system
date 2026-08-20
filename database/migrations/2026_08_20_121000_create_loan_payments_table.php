<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->string('batch_reference')->unique();
            $table->string('reference_number')->nullable();
            $table->date('payment_date');
            $table->decimal('amount', 15, 2);
            $table->decimal('principal_amount', 15, 2);
            $table->decimal('interest_amount', 15, 2);
            $table->json('allocation_snapshot');
            $table->foreignId('received_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('acc_journal_entries', function (Blueprint $table) {
            $table->enum('source_type', [
                'membership', 'capital', 'savings', 'memcap', 'loan', 'loan_payment',
                'petty_cash', 'ewallet', 'bank', 'ppe',
            ])->change();
        });
    }

    public function down(): void
    {
        DB::table('acc_journal_entries')->where('source_type', 'loan_payment')->delete();
        Schema::table('acc_journal_entries', function (Blueprint $table) {
            $table->enum('source_type', [
                'membership', 'capital', 'savings', 'memcap', 'loan',
                'petty_cash', 'ewallet', 'bank', 'ppe',
            ])->change();
        });
        Schema::dropIfExists('loan_payments');
    }
};
