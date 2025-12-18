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
        Schema::create('registration_otps', function (Blueprint $table) {
            $table->id();
            $table->string('otpToken')->unique();
            $table->string('phoneNumber');
            $table->string('otpCodeHashed');
            $table->json('formData');
            $table->boolean('isVerified')->default(false);
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('maxAttempts')->default(5);
            $table->timestamp('expiresAt');
            $table->timestamps();

            $table->index('phoneNumber');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registration_otps');
    }
};
