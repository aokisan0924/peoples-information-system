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
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memberId')->constrained('members')->onDelete('cascade');

            // Input fields
            $table->string('loanReference')->unique();
            $table->decimal('netProceeds', 15, 2)->default(0);
            $table->integer('termYears')->default(1);
            $table->unsignedTinyInteger('advanceInterestMonths')->default(2);

            // Computed fields
            $table->decimal('serviceFee', 15, 2)->default(0);
            $table->decimal('insurance', 15, 2)->default(0);
            $table->decimal('advanceInterest', 15, 2);
            $table->decimal('loanAmount', 15, 2)->default(0);
            $table->decimal('monthlyAmortization', 15, 2)->default(0);
            $table->decimal('gross', 15, 2)->default(0);
            $table->decimal('income', 15, 2);
            $table->decimal('percentIncome', 8, 4);
            $table->decimal('effectiveInterestRate', 8, 6);
            $table->decimal('monthlyInterestRate', 8, 6);
            $table->integer('numberOfPayments');

            // Loan status
            $table->enum('status', ['Pending', 'Approved', 'Released', 'Completed', 'Declined'])->default('Pending');
            $table->timestamps();
            $table->index(['memberId', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
