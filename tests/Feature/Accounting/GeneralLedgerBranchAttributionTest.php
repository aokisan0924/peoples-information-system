<?php

namespace Tests\Feature\Accounting;

use App\Models\AccBankRecord;
use App\Models\AccEWallet;
use App\Models\AccPettyCashFund;
use App\Models\AccPpeDepreciation;
use App\Models\Admin;
use App\Models\Loan;
use App\Models\Member;
use App\Http\Controllers\Api\PayMongoController;
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
            ['accountCode' => '11205', 'accountName' => 'Cash in Bank - PayMongo', 'isActive' => true],
            ['accountCode' => '30020', 'accountName' => 'Subscribed Share Capital', 'isActive' => true],
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

    public function test_loan_release_queues_the_members_branch_not_the_releasing_admins(): void
    {
        $member = $this->createMember('Cubao Satellite Office');
        DB::table('branch_services')->insert([
            'memberId' => $member->id,
            'branchService' => 'ACTIVE MILITARY',
        ]);

        $loan = Loan::create([
            'memberId' => $member->id,
            'loanReference' => 'LOAN-CUBAO-001',
            'loanType' => 'Regular Loan',
            'status' => 'Approved',
            'downloadsAcknowledged' => true,
            'termYears' => 1,
            'advanceInterestMonths' => 0,
            'monthlyAmortization' => 100,
            'journal_entries' => [
                ['accountCode' => '11110', 'accountName' => 'Cash on Hand', 'debit' => 100, 'credit' => 0],
                ['accountCode' => '30020', 'accountName' => 'Loan Receivable', 'debit' => 0, 'credit' => 100],
            ],
        ]);

        foreach (['signedApplication', 'releaseVoucher', 'borrowerPhoto', 'scannedCheck', 'authorityToDeduct', 'dataPrivacyConsent', 'disclosureStatement'] as $type) {
            DB::table('post_approval_documents')->insert([
                'loanId' => $loan->id,
                'docsType' => $type,
                'originalName' => "{$type}.pdf",
                'mimeType' => 'application/pdf',
                'size' => 1,
                'disk' => 'local',
                'path' => "tests/{$type}.pdf",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->actingAs($this->admin, 'admin')->postJson(
            route('admin.loan.release', $loan->loanReference)
        )->assertOk();

        $this->assertDatabaseCount('acc_journal_entries', 2);
        $this->assertDatabaseHas('acc_journal_entries', [
            'batch_reference' => $loan->loanReference,
            'branch' => 'Cubao Satellite Office',
            'status' => 'pending_review',
        ]);
        $this->assertDatabaseMissing('acc_journal_entries', [
            'batch_reference' => $loan->loanReference,
            'branch' => 'Main Office',
        ]);
    }

    public function test_loan_release_rejects_a_member_without_an_office_branch(): void
    {
        $member = $this->createMember(null);
        $loan = Loan::create([
            'memberId' => $member->id,
            'loanReference' => 'LOAN-NO-BRANCH',
            'status' => 'Approved',
            'downloadsAcknowledged' => true,
            'termYears' => 1,
            'monthlyAmortization' => 100,
            'journal_entries' => [
                ['accountCode' => '11110', 'accountName' => 'Cash on Hand', 'debit' => 100, 'credit' => 0],
            ],
        ]);

        $this->actingAs($this->admin, 'admin')->postJson(
            route('admin.loan.release', $loan->loanReference)
        )->assertStatus(422)
            ->assertJsonPath('message', "Set the member's office branch before releasing this loan.");

        $this->assertDatabaseCount('acc_journal_entries', 0);
        $this->assertDatabaseHas('loans', [
            'id' => $loan->id,
            'status' => 'Approved',
        ]);
    }

    public function test_paymongo_share_capital_posting_uses_the_members_office_branch(): void
    {
        $member = $this->createMember('Fort Magsaysay Satellite Office');

        $this->invokePayMongoShareCapitalPosting($member->id, 500, 'PAYMONGO-001');

        $this->assertDatabaseCount('acc_general_ledgers', 2);
        $this->assertDatabaseHas('acc_general_ledgers', [
            'referenceNo' => 'PAYMONGO-001',
            'memberId' => $member->id,
            'branch' => 'Fort Magsaysay Satellite Office',
            'accountCode' => '11205',
        ]);
    }

    public function test_paymongo_share_capital_posting_rejects_a_member_without_an_office_branch(): void
    {
        $member = $this->createMember(null);
        DB::table('capital_contributions')->insert([
            'memberId' => $member->id,
            'amount' => 500,
            'reference_number' => 'PAYMONGO-NO-BRANCH',
            'is_paid' => false,
            'status' => 'Pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $this->invokePayMongoDatabaseUpdate('capital', 'PAYMONGO-NO-BRANCH', 500);
            $this->fail('Expected PayMongo posting to reject a member without an office branch.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString(
                "Member {$member->id} must have an office branch",
                $exception->getMessage()
            );
        }

        $this->assertDatabaseHas('capital_contributions', [
            'reference_number' => 'PAYMONGO-NO-BRANCH',
            'is_paid' => false,
            'status' => 'Pending',
        ]);
        $this->assertDatabaseCount('acc_general_ledgers', 0);
    }

    private function createMember(?string $branch): Member
    {
        return Member::create([
            'firstName' => 'Branch',
            'lastName' => 'Member',
            'email' => uniqid('member-', true) . '@example.test',
            'password' => 'password',
            'branch' => $branch,
        ]);
    }

    private function invokePayMongoShareCapitalPosting(int $memberId, float $amount, string $reference): void
    {
        $controller = app(PayMongoController::class);
        $method = new \ReflectionMethod($controller, 'recordShareCapitalJournalEntry');
        $method->invoke($controller, $memberId, $amount, $reference);
    }

    private function invokePayMongoDatabaseUpdate(string $type, string $reference, float $amount): void
    {
        $controller = app(PayMongoController::class);
        $method = new \ReflectionMethod($controller, 'processDatabaseUpdate');
        $method->invoke($controller, $type, $reference, $amount);
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

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('firstName');
            $table->string('lastName');
            $table->string('email')->nullable();
            $table->string('password');
            $table->string('branch')->nullable();
            $table->string('accountStatus')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('branch_services', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('memberId');
            $table->string('branchService')->nullable();
            $table->string('subBranch')->nullable();
            $table->timestamps();
        });

        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('memberId');
            $table->string('loanReference')->unique();
            $table->string('loanType')->nullable();
            $table->string('status');
            $table->boolean('downloadsAcknowledged')->default(false);
            $table->integer('termYears')->default(1);
            $table->integer('advanceInterestMonths')->default(0);
            $table->decimal('monthlyAmortization', 15, 2)->default(0);
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->json('journal_entries')->nullable();
            $table->timestamps();
        });

        Schema::create('post_approval_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('loanId');
            $table->string('docsType');
            $table->string('originalName');
            $table->string('mimeType');
            $table->unsignedBigInteger('size');
            $table->string('disk');
            $table->string('path');
            $table->timestamps();
        });

        Schema::create('capital_contributions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('memberId');
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('reference_number')->nullable();
            $table->boolean('is_paid')->default(false);
            $table->string('status')->default('Pending');
            $table->dateTime('paid_at')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->timestamps();
        });

        Schema::create('membership_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('memberId');
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('reference_number')->nullable();
            $table->boolean('is_paid')->default(false);
            $table->string('status')->default('Pending');
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('acc_journal_entries', function (Blueprint $table) {
            $table->id();
            $table->string('batch_reference');
            $table->string('source_type');
            $table->unsignedBigInteger('memberId')->nullable();
            $table->string('branch');
            $table->string('account_code');
            $table->string('account_name');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->string('particulars')->nullable();
            $table->date('transaction_date');
            $table->string('status')->default('pending_review');
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('reviewer_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('loan_amortization_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('loanId');
            $table->integer('installmentNumber');
            $table->date('dueDate');
            $table->decimal('amountDue', 15, 2);
            $table->string('status');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('member_notification', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('memberId');
            $table->string('title');
            $table->text('message');
            $table->string('type');
            $table->boolean('isRead')->default(false);
            $table->string('linkUrl')->nullable();
            $table->json('metaJson')->nullable();
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
