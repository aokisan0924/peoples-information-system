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
        Schema::create('time_deposits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('memberId');
            $table->decimal('principal', 12, 2);
            $table->integer('termYears');           // 1–5
            $table->integer('creditedYears')->default(0); // track processed years
            $table->decimal('interestRate', 5, 2);  // stored as % per year (e.g. 6.30)
            $table->date('startDate');
            $table->date('maturityDate');
            $table->decimal('maturityValue', 12, 2); // current or projected value
            $table->timestamps();

            $table->foreign('memberId')
                ->references('id')
                ->on('members')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('time_deposits');
    }
};
