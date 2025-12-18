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
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('username')->nullable();
            $table->string('firstName');
            $table->string('lastName');
            $table->string('middleName')->nullable();
            $table->string('suffix')->nullable();
            $table->string('nickname')->nullable();
            $table->date('dob');
            $table->string('religion')->nullable();
            $table->integer('age');
            $table->string('gender');
            $table->string('civilStatus');
            $table->string('nationality');
            $table->string('email')->unique();
            $table->string('contact');
            $table->text('fullAddress');
            $table->string('region')->nullable();
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->string('barangay')->nullable();
            $table->string('profileImage')->nullable();
            $table->string('signaturePath')->nullable();
            $table->string('password');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
