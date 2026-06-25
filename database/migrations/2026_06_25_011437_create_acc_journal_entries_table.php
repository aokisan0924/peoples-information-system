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
        Schema::create('acc_journal_entries', function (Blueprint $table) {
            $table->id();

            // Grouping — all lines for one payment share the same batch_reference
            $table->string('batch_reference')->index();          // e.g. CC-20240101-001234

            // Source
            $table->enum('source_type', ['membership', 'capital', 'savings', 'memcap'])->index();
            $table->unsignedBigInteger('memberId')->nullable()->index();
            $table->string('branch')->nullable();

            // Journal line
            $table->string('account_code', 20);
            $table->string('account_name', 200);
            $table->decimal('debit',  15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->string('particulars', 500)->nullable();
            $table->date('transaction_date');

            // Clerk workflow
            $table->enum('status', ['pending_review', 'approved', 'rejected'])->default('pending_review')->index();
            $table->unsignedBigInteger('reviewed_by')->nullable();   // admin user id
            $table->timestamp('reviewed_at')->nullable();
            $table->string('reviewer_notes', 500)->nullable();

            // Audit
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('memberId')->references('id')->on('members')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acc_journal_entries');
    }
};
