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
        Schema::create('post_approval_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loanId')->constrained('loans')->cascadeOnDelete();
            $table->enum('docsType', ['signedApplication','releaseVoucher','borrowerPhoto','scannedCheck']);
            $table->string('originalName');
            $table->string('mimeType');
            $table->unsignedBigInteger('size');
            $table->string('disk')->default('local');
            $table->string('path');
            $table->timestamps();
            $table->unique(['loanId','docsType']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_approval_documents');
    }
};
