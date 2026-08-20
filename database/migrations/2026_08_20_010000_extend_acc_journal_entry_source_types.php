<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acc_journal_entries', function (Blueprint $table) {
            $table->enum('source_type', [
                'membership', 'capital', 'savings', 'memcap', 'loan',
                'petty_cash', 'ewallet', 'bank', 'ppe',
            ])->change();
            $table->unsignedBigInteger('source_record_id')->nullable()->after('source_type')->index();
        });
    }

    public function down(): void
    {
        DB::table('acc_journal_entries')
            ->whereIn('source_type', ['petty_cash', 'ewallet', 'bank', 'ppe'])
            ->delete();

        Schema::table('acc_journal_entries', function (Blueprint $table) {
            $table->dropColumn('source_record_id');
            $table->enum('source_type', ['membership', 'capital', 'savings', 'memcap', 'loan'])->change();
        });
    }
};
