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
        Schema::create('parents_infos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memberId')->constrained('members')->onDelete('cascade');
            $table->string('motherName')->nullable();
            $table->integer('motherAge')->nullable();
            $table->string('fatherName')->nullable();
            $table->integer('fatherAge')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parents_infos');
    }
};
