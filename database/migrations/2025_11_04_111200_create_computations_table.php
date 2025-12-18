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
        Schema::create('computations', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category')->default('ACTIVE_PENSIONER_V1'); // e.g., ACTIVE_PENSIONER
            $table->unsignedSmallInteger('termMonths');              // 12,24,36,48,60

            // Editable formulas (strings)
            $table->text('annualRateFormula');                       // e.g., '0.09' / '0.0878'
            $table->text('monthlyRateFormula')->default('annualInterestRate/12');
            $table->text('serviceFeeFormula');                       // e.g., 'netProceeds*0.121'
            $table->text('insuranceFormula')->default('(netProceeds/1000)*terms');
            $table->text('advanceInterestFormula')->default('monthlyInterestRate*netProceeds*advanceInterestMonths');
            $table->text('effectiveRateFormula')->nullable();        // e.g., '(1+annualInterestRate/terms)^terms-1'

            $table->boolean('isActive')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('computations');
    }
};
