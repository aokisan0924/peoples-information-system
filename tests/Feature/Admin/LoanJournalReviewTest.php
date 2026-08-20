<?php

namespace Tests\Feature\Admin;

use App\Models\Admin;
use App\Models\Loan;
use App\Models\Member;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LoanJournalReviewTest extends TestCase
{
    private Admin $accountingAdmin;

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

        $this->accountingAdmin = Admin::create([
            'name' => 'Accounting Reviewer',
            'email' => 'reviewer@example.test',
            'password' => 'password',
            'role' => 'accounting-clerk',
            'branch' => 'Main Office',
            'permissions' => ['manage_accounting', 'process_loans'],
        ]);
    }

    public function test_released_loan_can_be_reviewed_edited_and_posted_to_the_general_ledger(): void
    {
        $loan = $this->releaseLoan('LOAN-REVIEW-001', 'Cubao Satellite Office');

        $this->assertDatabaseCount('acc_journal_entries', 2);
        $this->assertDatabaseHas('acc_journal_entries', [
            'batch_reference' => $loan->loanReference,
            'source_type' => 'loan',
            'branch' => 'Cubao Satellite Office',
            'status' => 'pending_review',
        ]);
        $this->assertDatabaseCount('acc_general_ledgers', 0);

        $this->actingAs($this->accountingAdmin, 'admin')
            ->get(route('admin.accounting.journal-entries.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Accounting/JournalEntryIndex')
                ->has('batches.data', 1)
                ->where('batches.data.0.batch_reference', $loan->loanReference)
                ->where('batches.data.0.branch', 'Cubao Satellite Office')
                ->where('batches.data.0.amount', 100)
            );

        $this->actingAs($this->accountingAdmin, 'admin')
            ->get(route('admin.accounting.journal-entries.show', $loan->loanReference))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Accounting/JournalEntryReview')
                ->where('batchReference', $loan->loanReference)
                ->has('lines', 2)
                ->where('totalDebit', 100)
                ->where('totalCredit', 100)
                ->where('isBalanced', true)
                ->where('batchStatus', 'pending_review')
            );

        $debitLine = DB::table('acc_journal_entries')
            ->where('batch_reference', $loan->loanReference)
            ->where('debit', '>', 0)
            ->first();

        $this->actingAs($this->accountingAdmin, 'admin')
            ->postJson(route('admin.accounting.journal-entries.update-line', $loan->loanReference), [
                'line_id' => $debitLine->id,
                'account_code' => $debitLine->account_code,
                'account_name' => 'Reviewed Cash Account',
                'debit' => 100,
                'credit' => 0,
                'particulars' => 'Reviewed loan release',
            ])
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('isBalanced', true);

        $this->actingAs($this->accountingAdmin, 'admin')
            ->postJson(route('admin.accounting.journal-entries.approve', $loan->loanReference), [
                'notes' => 'Documents and accounts verified.',
            ])
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseCount('acc_general_ledgers', 2);
        $this->assertDatabaseHas('acc_general_ledgers', [
            'referenceNo' => $loan->loanReference,
            'branch' => 'Cubao Satellite Office',
            'memberId' => $loan->memberId,
            'accountCode' => $debitLine->account_code,
            'accountName' => 'Reviewed Cash Account',
            'debit' => 100,
            'credit' => 0,
        ]);
        $this->assertDatabaseHas('acc_general_ledgers', [
            'referenceNo' => $loan->loanReference,
            'branch' => 'Cubao Satellite Office',
            'memberId' => $loan->memberId,
            'debit' => 0,
            'credit' => 100,
        ]);

        $postedDebit = DB::table('acc_general_ledgers')
            ->where('referenceNo', $loan->loanReference)
            ->where('debit', '>', 0)
            ->first();
        $reviewedDebit = DB::table('acc_journal_entries')->find($debitLine->id);
        $this->assertSame($reviewedDebit->particulars, $postedDebit->particulars);
        $this->assertSame(
            substr($reviewedDebit->transaction_date, 0, 10),
            substr($postedDebit->transactionDate, 0, 10)
        );

        $approvedLines = DB::table('acc_journal_entries')
            ->where('batch_reference', $loan->loanReference)
            ->get();
        $this->assertCount(2, $approvedLines);
        foreach ($approvedLines as $line) {
            $this->assertSame('approved', $line->status);
            $this->assertSame($this->accountingAdmin->id, $line->reviewed_by);
            $this->assertNotNull($line->reviewed_at);
            $this->assertSame('Documents and accounts verified.', $line->reviewer_notes);
        }

        $this->actingAs($this->accountingAdmin, 'admin')
            ->postJson(route('admin.accounting.journal-entries.approve', $loan->loanReference))
            ->assertNotFound();
        $this->assertDatabaseCount('acc_general_ledgers', 2);
    }

    public function test_rejection_requires_notes_and_never_posts_to_the_general_ledger(): void
    {
        $loan = $this->releaseLoan('LOAN-REJECT-001', 'Fort Magsaysay Satellite Office');

        $this->actingAs($this->accountingAdmin, 'admin')
            ->postJson(route('admin.accounting.journal-entries.reject', $loan->loanReference))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('notes');

        $this->assertDatabaseHas('acc_journal_entries', [
            'batch_reference' => $loan->loanReference,
            'status' => 'pending_review',
        ]);

        $this->actingAs($this->accountingAdmin, 'admin')
            ->postJson(route('admin.accounting.journal-entries.reject', $loan->loanReference), [
                'notes' => 'Supporting voucher is incomplete.',
            ])
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseMissing('acc_journal_entries', [
            'batch_reference' => $loan->loanReference,
            'status' => 'pending_review',
        ]);
        $this->assertDatabaseHas('acc_journal_entries', [
            'batch_reference' => $loan->loanReference,
            'status' => 'rejected',
            'reviewed_by' => $this->accountingAdmin->id,
            'reviewer_notes' => 'Supporting voucher is incomplete.',
        ]);
        $this->assertDatabaseCount('acc_general_ledgers', 0);
    }

    public function test_loan_release_remains_blocked_when_the_member_has_no_office_branch(): void
    {
        $member = $this->createMember(null);
        $loan = Loan::create([
            'memberId' => $member->id,
            'loanReference' => 'LOAN-NULL-BRANCH',
            'loanType' => 'Regular Loan',
            'status' => 'Approved',
            'downloadsAcknowledged' => true,
            'termYears' => 1,
            'monthlyAmortization' => 100,
            'journal_entries' => [
                ['accountCode' => '11110', 'accountName' => 'Cash on Hand', 'debit' => 100, 'credit' => 0],
                ['accountCode' => '13110', 'accountName' => 'Loans Receivable', 'debit' => 0, 'credit' => 100],
            ],
        ]);

        $this->actingAs($this->accountingAdmin, 'admin')
            ->postJson(route('admin.loan.release', $loan->loanReference))
            ->assertUnprocessable()
            ->assertJsonPath('message', "Set the member's office branch before releasing this loan.");

        $this->assertDatabaseCount('acc_journal_entries', 0);
        $this->assertDatabaseHas('loans', ['id' => $loan->id, 'status' => 'Approved']);
    }

    private function releaseLoan(string $reference, string $branch): Loan
    {
        $member = $this->createMember($branch);
        DB::table('branch_services')->insert([
            'memberId' => $member->id,
            'branchService' => 'ACTIVE MILITARY',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $loan = Loan::create([
            'memberId' => $member->id,
            'loanReference' => $reference,
            'loanType' => 'Regular Loan',
            'status' => 'Approved',
            'downloadsAcknowledged' => true,
            'termYears' => 1,
            'advanceInterestMonths' => 0,
            'monthlyAmortization' => 100,
            'journal_entries' => [
                ['accountCode' => '11110', 'accountName' => 'Cash on Hand', 'debit' => 100, 'credit' => 0],
                ['accountCode' => '13110', 'accountName' => 'Loans Receivable', 'debit' => 0, 'credit' => 100],
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

        $this->actingAs($this->accountingAdmin, 'admin')
            ->postJson(route('admin.loan.release', $loan->loanReference))
            ->assertOk();

        return $loan->fresh();
    }

    private function createMember(?string $branch): Member
    {
        return Member::create([
            'firstName' => 'Queue',
            'lastName' => 'Member',
            'username' => uniqid('PMPC-'),
            'email' => uniqid('queue-', true) . '@example.test',
            'password' => 'password',
            'branch' => $branch,
            'accountStatus' => 'regular',
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

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('firstName');
            $table->string('lastName');
            $table->string('username')->nullable();
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
            $table->unsignedBigInteger('source_record_id')->nullable();
            $table->unsignedBigInteger('memberId')->nullable();
            $table->string('branch')->nullable();
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
    }
}
