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
        Schema::create('time_deposit_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('timeDepositId');
            $table->decimal('amount', 12, 2);
            $table->date('withdrawnDate');
            $table->string('remarks', 255)->nullable();
            $table->timestamps();

            $table->foreign('timeDepositId')
                ->references('id')
                ->on('time_deposits')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('time_deposit_withdrawals');
    }
};
