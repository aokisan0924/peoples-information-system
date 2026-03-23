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
            $table->string('referenceNo')->index();
            $table->unsignedBigInteger('memberId');

            $table->string('accountCode');
            $table->string('accountName');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);

            $table->text('particulars')->nullable();
            $table->timestamp('transactionDate');
            $table->timestamps();

            $table->foreign('memberId')->references('id')->on('members')->onDelete('cascade');
        });
    }

    /**php
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acc_bank_records');
    }
};
