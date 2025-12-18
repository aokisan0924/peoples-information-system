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
        Schema::create('member_notification', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('memberId');
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('system'); // transaction, loan, announcement, system
            $table->boolean('isRead')->default(false);
            $table->string('linkUrl')->nullable();     // where "View" should go
            $table->json('metaJson')->nullable();      // extra info (optional)
            $table->timestamps();

            $table->index('memberId');
            $table->index('type');
            $table->index('isRead');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_notification');
    }
};
