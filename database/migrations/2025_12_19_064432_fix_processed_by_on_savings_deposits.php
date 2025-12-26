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
        Schema::table('savings_deposits', function (Blueprint $table) {
            // 1. Drop the incorrect foreign key that points to 'users'
            // The constraint name usually follows the pattern: table_column_foreign
            $table->dropForeign(['processed_by']);

            // 2. Add the correct foreign key pointing to 'admins'
            // NOTE: Ensure your admin table name is actually 'admins'. 
            $table->foreign('processed_by')
                ->references('id')
                ->on('admins') 
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('savings_deposits', function (Blueprint $table) {
            $table->dropForeign(['processed_by']);
            $table->foreign('processed_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }
};
