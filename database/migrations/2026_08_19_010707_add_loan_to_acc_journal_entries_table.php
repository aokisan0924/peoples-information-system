<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('acc_journal_entries', function (Blueprint $table) {
            $table->enum('source_type', ['membership', 'capital', 'savings', 'memcap', 'loan'])
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('acc_journal_entries')->where('source_type', 'loan')->delete();

        Schema::table('acc_journal_entries', function (Blueprint $table) {
            $table->enum('source_type', ['membership', 'capital', 'savings', 'memcap'])
                ->change();
        });
    }
};
