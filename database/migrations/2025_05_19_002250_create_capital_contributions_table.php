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
        Schema::create('capital_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memberId')->constrained('members')->onDelete('cascade');
            $table->decimal('amount', 10, 2)->default(1000.00);
            $table->string('reference_number')->nullable();
            $table->boolean('is_paid')->default(false);
            $table->string('status')->default('Pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('capital_contributions');
    }
};
