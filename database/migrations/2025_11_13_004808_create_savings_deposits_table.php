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
        Schema::create('savings_deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memberId')->constrained('members')->onDelete('cascade');
            $table->string('transactionType', 20);
            $table->decimal('amount', 14, 2);
            $table->string('referenceNumber', 120)->nullable();
            $table->string('status', 30)->default('pending'); 
            $table->boolean('isPaid')->default(false);
            $table->date('paidAt')->nullable();

            $table->timestamps();
            $table->index(['memberId', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('savings_deposits');
    }
};
