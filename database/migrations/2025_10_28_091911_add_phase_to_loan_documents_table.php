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
        Schema::table('loan_documents', function (Blueprint $table) {
            $table->string('phase', 20)->default('pre')->after('loanId');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loan_documents', function (Blueprint $table) {
            $table->dropColumn('phase');
        });
    }
};
