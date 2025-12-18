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
        Schema::create('password_reset_otps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('memberId');
            $table->string('otpToken', 100)->unique();
            $table->string('channel', 20);
            $table->string('destination');
            $table->string('otpCodeHashed');
            $table->boolean('isVerified')->default(false);
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('maxAttempts')->default(5);
            $table->timestamp('expiresAt');
            $table->timestamps();

            $table->foreign('memberId')->references('id')->on('members')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('password_reset_otps');
    }
};
