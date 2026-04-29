<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('acc_bank_records', 'acc_general_ledgers');
    }

    public function down(): void
    {
        Schema::rename('acc_general_ledgers', 'acc_bank_records');
    }
};