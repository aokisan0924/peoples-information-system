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
        Schema::table('loans', function (Blueprint $table) {
            $table->string('billing_status', 50)->nullable()->after('status');
            $table->timestamp('billed_at')->nullable()->after('billing_status');
            $table->unsignedBigInteger('billed_by')->nullable()->after('billed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['billing_status', 'billed_at', 'billed_by']);
        });
    }
};
