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
        Schema::create('afp_infos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memberId')->constrained('members')->onDelete('cascade');
            $table->string('afpsn')->nullable();
            $table->string('rank')->nullable();
            $table->string('designation')->nullable();
            $table->string('afpId')->nullable();
            $table->string('presentAssignment')->nullable();
            $table->string('controlNo')->nullable();
            $table->integer('yearsInService')->nullable();
            $table->date('cadEnlistment')->nullable();
            $table->date('retirementDate')->nullable();
            $table->date('pensionDate')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('afp_infos');
    }
};
