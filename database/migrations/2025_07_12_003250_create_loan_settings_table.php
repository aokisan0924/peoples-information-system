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
        Schema::create('loan_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('term')->unique(); 
            $table->decimal('annual_interest_rate', 5, 4);
            $table->decimal('service_fee_rate', 5, 4);
            $table->decimal('insurance_rate_per_1000', 8, 2);
            $table->unsignedTinyInteger('advance_interest_months');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_settings');
    }
};
