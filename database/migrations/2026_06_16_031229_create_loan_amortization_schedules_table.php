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
        Schema::create('loan_amortization_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loanId')->constrained('loans')->onDelete('cascade');
            
            $table->integer('installmentNumber');
            $table->date('dueDate');
            $table->decimal('amountDue', 15, 2);
            
            $table->enum('status', ['unpaid', 'paid', 'overdue'])->default('unpaid');
            $table->decimal('amountPaid', 15, 2)->nullable();
            $table->date('paidAt')->nullable();
            $table->string('referenceNumber')->nullable();
            
            // Explicit camelCase timestamps
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();

            $table->index(['loanId', 'status']);
            $table->index('dueDate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_amortization_schedules');
    }
};
