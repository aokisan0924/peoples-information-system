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
        Schema::table('password_reset_otps', function (Blueprint $table) {
            $table->string('purpose', 50)->default('reset')->after('memberId');    
            $table->index(['memberId', 'purpose']); // speeds up per-member+purpose cleanup
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('password_reset_otps', function (Blueprint $table) {
            // It is best practice to drop the index before dropping the column
            $table->dropIndex(['memberId', 'purpose']);
            $table->dropColumn('purpose');
        });
    }
};
