<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type');                        // e.g. 'withdrawal_request'
            $table->string('title');
            $table->text('message');
            $table->string('linkUrl')->nullable();         // where admin should go
            $table->unsignedBigInteger('relatedId')->nullable(); // e.g. SavingsDeposit id
            $table->boolean('isRead')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};