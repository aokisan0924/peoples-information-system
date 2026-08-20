<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->string('calculation_version', 40)->nullable()->after('loanReference')->index();
            $table->decimal('annual_interest_rate', 14, 12)->nullable()->after('calculation_version');
            $table->json('calculation_snapshot')->nullable()->after('annual_interest_rate');
            $table->timestamp('release_date')->nullable()->after('calculation_snapshot');
        });

        Schema::table('loan_amortization_schedules', function (Blueprint $table) {
            $table->enum('status', ['unpaid', 'partial', 'paid', 'overdue'])->default('unpaid')->change();
            $table->decimal('openingBalance', 15, 2)->default(0)->after('dueDate');
            $table->decimal('principalDue', 15, 2)->default(0)->after('amountDue');
            $table->decimal('interestDue', 15, 2)->default(0)->after('principalDue');
            $table->decimal('closingBalance', 15, 2)->default(0)->after('interestDue');
            $table->decimal('principalPaid', 15, 2)->default(0)->after('amountPaid');
            $table->decimal('interestPaid', 15, 2)->default(0)->after('principalPaid');
            $table->unique(['loanId', 'installmentNumber'], 'loan_schedule_period_unique');
        });
    }

    public function down(): void
    {
        Schema::table('loan_amortization_schedules', function (Blueprint $table) {
            $table->enum('status', ['unpaid', 'paid', 'overdue'])->default('unpaid')->change();
            $table->dropUnique('loan_schedule_period_unique');
            $table->dropColumn(['openingBalance', 'principalDue', 'interestDue', 'closingBalance', 'principalPaid', 'interestPaid']);
        });
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['calculation_version', 'annual_interest_rate', 'calculation_snapshot', 'release_date']);
        });
    }
};
