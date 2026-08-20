<?php

namespace Tests\Feature\Accounting;

use App\Models\AccBankRecord;
use App\Models\AccEWallet;
use App\Models\AccPettyCashFund;
use App\Models\AccPpeDepreciation;
use App\Models\Admin;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class GeneralLedgerBranchAttributionTest extends TestCase
{
    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);

        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');

        $this->createSchema();

        $this->admin = Admin::create([
            'name' => 'Main Office Admin',
            'email' => 'main-office@example.test',
            'password' => 'password',
            'role' => 'super-admin',
            'branch' => 'Main Office',
            'permissions' => [],
        ]);

        DB::table('acc_chart_of_account')->insert([
            ['accountCode' => '11110', 'accountName' => 'Cash on Hand', 'isActive' => true],
            ['accountCode' => '73160', 'accountName' => 'Operating Expense', 'isActive' => true],
        ]);
    }

    public function test_petty_cash_posting_uses_the_source_record_branch(): void
    {
        $record = AccPettyCashFund::create([
            'branch' => 'Cubao',
            'transactionDate' => '2026-08-20',
            'orNumber' => 'PC-001',
            'particulars' => 'Cubao petty cash',
            'debit' => 100,
            'credit' => 0,
            'is_posted' => false,
        ]);

        $this->actingAs($this->admin, 'admin')->post(
            route('admin.accounting.petty.journalize', $record->id),
            ['entries' => [['accountCode' => '73160', 'debit' => 100, 'credit' => 0]]]
        )->assertRedirect();

        $this->assertDatabaseHas('acc_general_ledgers', [
            'petty_cash_id' => $record->id,
            'branch' => 'Cubao',
        ]);
    }

    public function test_e_wallet_posting_uses_the_source_record_branch(): void
    {
        $record = AccEWallet::create([
            'branch' => 'Cubao',
            'transactionDate' => '2026-08-20',
            'referenceNo' => 'EW-001',
            'particulars' => 'Cubao e-wallet',
            'walletType' => 'GCash',
            'debit' => 100,
            'credit' => 0,
            'is_posted' => false,
        ]);

        $this->actingAs($this->admin, 'admin')->post(
            route('admin.accounting.ewallet.journalize', $record->id),
            ['entries' => [['accountCode' => '11110', 'debit' => 100, 'credit' => 0]]]
        )->assertRedirect();

        $this->assertDatabaseHas('acc_general_ledgers', [
            'e_wallet_id' => $record->id,
            'branch' => 'Cubao',
        ]);
    }

    public function test_bank_posting_uses_the_source_record_branch(): void
    {
        $record = AccBankRecord::create([
            'branch' => 'Cubao',
            'bank_account_code' => '11110',
            'transaction_date' => '2026-08-20',
            'reference_no' => 'BK-001',
            'particulars' => 'Cubao bank transaction',
            'debit' => 100,
            'credit' => 0,
            'is_journalized' => false,
        ]);

        $this->actingAs($this->admin, 'admin')->postJson(
            route('admin.accounting.bank.journalize', $record->id),
            ['entries' => [
                ['accountCode' => '11110', 'debit' => 100, 'credit' => 0],
                ['accountCode' => '73160', 'debit' => 0, 'credit' => 100],
            ]]
        )->assertOk();

        $this->assertDatabaseHas('acc_general_ledgers', [
            'bank_record_id' => $record->id,
            'branch' => 'Cubao',
        ]);
    }

    public function test_ppe_posting_uses_the_explicit_source_batch_branch(): void
    {
        AccPpeDepreciation::create([
            'branch' => 'Cubao',
            'category' => 'Transport Equipment',
            'date_acquired' => '2026-01-01',
            'particular' => 'Service vehicle',
            'amount' => 120000,
            'life_years' => 5,
        ]);

        $this->actingAs($this->admin, 'admin')->post(
            route('admin.accounting.ppe.journalize'),
            [
                'branch' => 'Cubao',
                'month' => '08',
                'year' => '2026',
                'type' => 'transport',
                'entries' => [['accountCode' => '73160', 'debit' => 2000, 'credit' => 0]],
            ]
        )->assertRedirect();

        $this->assertDatabaseHas('acc_general_ledgers', [
            'referenceNo' => 'DEPR-TRANS-2026-08',
            'branch' => 'Cubao',
        ]);
    }

    public function test_manual_adjustment_requires_and_uses_an_explicit_branch(): void
    {
        $this->actingAs($this->admin, 'admin')->post(
            route('admin.accounting.journal.store'),
            [
                'transactionDate' => '2026-08-20',
                'referenceNo' => 'ADJ-MISSING-BRANCH',
                'particulars' => 'Missing branch adjustment',
                'entries' => [
                    ['accountCode' => '73160', 'debit' => 100, 'credit' => 0],
                    ['accountCode' => '11110', 'debit' => 0, 'credit' => 100],
                ],
            ]
        )->assertSessionHasErrors('branch');

        $this->actingAs($this->admin, 'admin')->post(
            route('admin.accounting.journal.store'),
            [
                'branch' => 'Cubao',
                'transactionDate' => '2026-08-20',
                'referenceNo' => 'ADJ-001',
                'particulars' => 'Cubao adjustment',
                'entries' => [
                    ['accountCode' => '73160', 'debit' => 100, 'credit' => 0],
                    ['accountCode' => '11110', 'debit' => 0, 'credit' => 100],
                ],
            ]
        )->assertRedirect();

        $this->assertDatabaseHas('acc_general_ledgers', [
            'referenceNo' => 'ADJ-001',
            'branch' => 'Cubao',
        ]);
    }

    private function createSchema(): void
    {
        Schema::create('admins', function (Blueprint $table) {
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

        Schema::create('acc_chart_of_account', function (Blueprint $table) {
            $table->id();
            $table->string('accountCode')->unique();
            $table->string('accountName');
            $table->boolean('isActive')->default(true);
            $table->timestamps();
        });

        Schema::create('acc_petty_cash_funds', function (Blueprint $table) {
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

        Schema::create('acc_e_wallets', function (Blueprint $table) {
            $table->id();
            $table->string('branch');
            $table->date('transactionDate');
            $table->string('referenceNo')->nullable();
            $table->string('particulars');
            $table->string('walletType');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->boolean('is_posted')->default(false);
            $table->timestamps();
        });

        Schema::create('acc_bank_records', function (Blueprint $table) {
            $table->id();
            $table->string('branch');
            $table->string('bank_account_code');
            $table->date('transaction_date');
            $table->string('reference_no')->nullable();
            $table->string('particulars');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->boolean('is_journalized')->default(false);
            $table->timestamps();
        });

        Schema::create('acc_ppe_depreciations', function (Blueprint $table) {
            $table->id();
            $table->string('branch');
            $table->string('category');
            $table->date('date_acquired');
            $table->string('particular');
            $table->decimal('amount', 15, 2);
            $table->integer('life_years');
            $table->timestamps();
        });

        Schema::create('acc_general_ledgers', function (Blueprint $table) {
            $table->id();
            $table->string('branch');
            $table->string('referenceNo')->nullable();
            $table->unsignedBigInteger('memberId')->nullable();
            $table->string('accountCode');
            $table->string('accountName');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->text('particulars')->nullable();
            $table->dateTime('transactionDate');
            $table->unsignedBigInteger('petty_cash_id')->nullable();
            $table->unsignedBigInteger('e_wallet_id')->nullable();
            $table->unsignedBigInteger('bank_record_id')->nullable();
            $table->boolean('is_adjustment')->default(false);
            $table->timestamps();
        });
    }
}
