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
        Schema::create('acc_ppe_depreciations', function (Blueprint $table) {
            $table->id();
            $table->string('branch')->default('Main Office');
            $table->string('category');
            $table->date('date_acquired');
            $table->string('particular');
            $table->decimal('amount', 15, 2);
            $table->integer('life_years');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acc_ppe_depreciations');
    }
};
