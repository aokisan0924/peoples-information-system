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
        Schema::create('member_transactions', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('memberId')->index();
            $table->string('module', 50);
            $table->string('transactionType', 50);
            $table->string('description', 255)->nullable();
            $table->string('referenceNumber', 100)->nullable();
            $table->unsignedBigInteger('sourceId')->nullable();
            $table->decimal('debit', 18, 2)->default(0);
            $table->decimal('credit', 18, 2)->default(0);
            $table->dateTime('transactionDate')->index();
            $table->string('status', 30)->default('posted');
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_transactions');
    }
};
