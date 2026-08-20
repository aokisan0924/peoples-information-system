<?php

namespace Tests\Feature\Admin;

use App\Models\Admin;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MemberCreationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'services.semaphore.api_key' => null,
        ]);

        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');

        Schema::create('admins', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role');
            $table->string('branch')->nullable();
            $table->json('permissions')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('members', function (Blueprint $table): void {
            $table->id();
            $table->string('username')->nullable();
            $table->string('firstName');
            $table->string('lastName');
            $table->date('dob');
            $table->unsignedInteger('age');
            $table->string('gender');
            $table->string('civilStatus');
            $table->string('nationality');
            $table->string('email')->unique();
            $table->string('contact');
            $table->text('fullAddress');
            $table->string('branch')->nullable();
            $table->string('password');
            $table->timestamps();
        });

        Schema::create('acc_petty_cash_funds', function (Blueprint $table): void {
            $table->id();
            $table->string('branch');
            $table->date('transactionDate');
            $table->string('orNumber')->nullable();
            $table->string('particulars');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->boolean('is_posted')->default(false);
            $table->timestamps();
        });

        Schema::create('capital_contributions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('memberId');
            $table->string('transactionType', 20);
            $table->decimal('amount', 15, 2);
            $table->string('reference_number');
            $table->boolean('is_paid')->default(false);
            $table->string('status');
            $table->timestamp('paid_at')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->timestamps();
        });
    }

    public function test_admin_member_creation_computes_age_and_persists_required_profile_fields(): void
    {
        Mail::fake();
        Carbon::setTestNow('2026-08-20 10:40:38');

        $admin = Admin::create([
            'name' => 'Main Office Admin',
            'email' => 'admin@example.test',
            'password' => 'password',
            'role' => 'super-admin',
            'branch' => 'Main Office',
            'permissions' => [],
        ]);

        $response = $this->actingAs($admin, 'admin')->postJson(route('admin.members.store'), [
            'lastName' => 'Sapla',
            'firstName' => 'Jeffrae',
            'dob' => '1999-09-24',
            'email' => 'jeffrae@example.test',
            'gender' => 'Male',
            'contact' => '09065084057',
            'civilStatus' => 'Single',
            'nationality' => 'Filipino',
            'fullAddress' => 'Quezon City, Philippines',
            'membershipFee' => 0,
            'shareCapital' => 5000,
            'savingsDeposit' => 0,
            'paymentMethod' => 'cash',
            'referenceNumber' => 'OR-1001',
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'warnings' => [],
        ]);

        $this->assertDatabaseHas('members', [
            'firstName' => 'Jeffrae',
            'age' => 26,
            'civilStatus' => 'Single',
            'nationality' => 'Filipino',
            'fullAddress' => 'Quezon City, Philippines',
            'branch' => 'Main Office',
        ]);

        $this->assertDatabaseHas('acc_petty_cash_funds', [
            'branch' => 'Main Office',
            'orNumber' => 'OR-1001',
            'is_posted' => false,
        ]);

        $this->assertDatabaseHas('capital_contributions', [
            'memberId' => 1,
            'transactionType' => 'deposit',
            'amount' => 5000,
            'reference_number' => 'OR-1001',
        ]);

        Carbon::setTestNow();
    }

    public function test_admin_without_a_branch_cannot_create_a_member(): void
    {
        $admin = Admin::create([
            'name' => 'Unassigned Admin',
            'email' => 'unassigned@example.test',
            'password' => 'password',
            'role' => 'super-admin',
            'branch' => null,
            'permissions' => [],
        ]);

        $this->actingAs($admin, 'admin')->postJson(route('admin.members.store'), [
            'lastName' => 'Legacy',
            'firstName' => 'Member',
            'dob' => '1990-01-01',
            'email' => 'legacy@example.test',
            'gender' => 'Female',
            'contact' => '09170000000',
            'civilStatus' => 'Single',
            'nationality' => 'Filipino',
            'fullAddress' => 'Manila',
            'membershipFee' => 0,
            'shareCapital' => 0,
            'savingsDeposit' => 0,
            'paymentMethod' => 'cash',
            'referenceNumber' => 'OR-1002',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Your admin account must have an office branch before registering a member.');

        $this->assertDatabaseCount('members', 0);
    }
}
