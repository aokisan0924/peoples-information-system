<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acc_bank_records', function (Blueprint $table) {
            $table->unsignedBigInteger('memberId')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('acc_bank_records', function (Blueprint $table) {
            $table->unsignedBigInteger('memberId')->nullable(false)->change();
        });
    }
};