<?php

namespace Tests\Feature\Accounting;

use App\Models\Admin;
use App\Models\Loan;
use App\Models\Member;
use App\Services\LoanCalculator;
use App\Services\LoanAccountingService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class LoanPaymentWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');
        $this->createSchema();
    }

    public function test_partial_payment_stays_partial_and_queues_principal_and_interest(): void
    {
        $admin = Admin::create([
            'name' => 'Collector', 'email' => 'collector@example.test', 'password' => 'password',
            'role' => 'super-admin', 'branch' => 'Main Office', 'permissions' => ['manage_accounting'],
        ]);
        $member = Member::create([
            'firstName' => 'Payment', 'lastName' => 'Member', 'email' => 'member@example.test',
            'password' => 'password', 'branch' => 'Cubao', 'accountStatus' => 'regular',
        ]);
        $calculation = (new LoanCalculator())->calculate(25_000, 12);
        $loan = Loan::create([
            'memberId' => $member->id, 'loanReference' => 'LOAN-PAY-001', 'loanType' => 'New',
            'status' => 'Released', 'termYears' => 1, 'numberOfPayments' => 12,
            'loanAmount' => $calculation['loanAmount'], 'netProceeds' => $calculation['netProceeds'],
            'monthlyAmortization' => $calculation['monthlyAmortization'],
            'monthlyInterestRate' => $calculation['monthlyInterestRate'],
            'calculation_version' => LoanCalculator::VERSION, 'calculation_snapshot' => $calculation,
        ]);
        DB::table('loan_amortization_schedules')->insert([
            'loanId' => $loan->id, 'installmentNumber' => 1, 'dueDate' => '2026-09-20',
            'openingBalance' => 10_000, 'amountDue' => 4_000, 'principalDue' => 3_375,
            'interestDue' => 625, 'closingBalance' => 6_625, 'amountPaid' => 0,
            'principalPaid' => 0, 'interestPaid' => 0, 'status' => 'unpaid',
            'createdAt' => now(), 'updatedAt' => now(),
        ]);

        $response = $this->actingAs($admin, 'admin')->postJson(route('admin.accounting.loans.post-amortization'), [
            'loanId' => $loan->id, 'installmentNumber' => 1, 'amountPaid' => 2_000,
            'referenceNumber' => 'OR-1001', 'paymentDate' => '2026-09-20',
        ]);

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseHas('loan_amortization_schedules', [
            'loanId' => $loan->id, 'installmentNumber' => 1, 'status' => 'partial',
            'amountPaid' => 2_000, 'interestPaid' => 625, 'principalPaid' => 1_375,
        ]);
        $this->assertDatabaseHas('loan_payments', [
            'loan_id' => $loan->id, 'amount' => 2_000, 'interest_amount' => 625, 'principal_amount' => 1_375,
        ]);
        $this->assertDatabaseCount('acc_journal_entries', 3);
        $this->assertDatabaseHas('acc_journal_entries', [
            'source_type' => 'loan_payment', 'branch' => 'Cubao', 'account_code' => '40110',
            'credit' => 625, 'status' => 'pending_review',
        ]);
    }

    public function test_authoritative_release_journal_is_generated_from_snapshot_and_balances(): void
    {
        $member = Member::create([
            'firstName' => 'Release', 'lastName' => 'Member', 'email' => 'release@example.test',
            'password' => 'password', 'branch' => 'Fort Magsaysay', 'accountStatus' => 'regular',
        ]);
        $calculation = (new LoanCalculator())->calculate(155_836.50, 60, null, 300);
        $loan = Loan::create([
            'memberId' => $member->id, 'loanReference' => 'LOAN-RELEASE-001', 'loanType' => 'New',
            'status' => 'Approved', 'termYears' => 5, 'numberOfPayments' => 60,
            'loanAmount' => $calculation['loanAmount'], 'netProceeds' => $calculation['netProceeds'],
            'monthlyAmortization' => $calculation['monthlyAmortization'],
            'monthlyInterestRate' => $calculation['monthlyInterestRate'],
            'serviceFee' => $calculation['serviceFee'], 'insurance' => $calculation['insurance'],
            'advanceInterest' => $calculation['advanceInterest'],
            'calculation_version' => LoanCalculator::VERSION, 'calculation_snapshot' => $calculation,
        ]);

        app(LoanAccountingService::class)->enqueueRelease($loan->load('member'));

        $lines = DB::table('acc_journal_entries')->where('batch_reference', $loan->loanReference)->get();
        $this->assertCount(7, $lines);
        $this->assertEqualsWithDelta($lines->sum('debit'), $lines->sum('credit'), 0.001);
        $this->assertSame(192_693.39, (float) $lines->sum('debit'));
        $this->assertTrue($lines->every(fn ($line) => $line->branch === 'Fort Magsaysay'));
        $this->assertTrue($lines->every(fn ($line) => $line->status === 'pending_review'));
    }

    private function createSchema(): void
    {
        Schema::create('admins', function (Blueprint $t) {
            $t->id(); $t->string('name'); $t->string('email'); $t->string('password'); $t->string('role');
            $t->string('branch')->nullable(); $t->json('permissions')->nullable(); $t->rememberToken(); $t->timestamps();
        });
        Schema::create('members', function (Blueprint $t) {
            $t->id(); $t->string('firstName'); $t->string('lastName'); $t->string('email')->nullable();
            $t->string('password'); $t->string('branch')->nullable(); $t->string('accountStatus')->nullable();
            $t->rememberToken(); $t->timestamps();
        });
        Schema::create('loans', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('memberId'); $t->string('loanReference'); $t->string('loanType')->nullable();
            $t->string('status'); $t->integer('termYears'); $t->integer('numberOfPayments');
            $t->decimal('loanAmount', 15, 2); $t->decimal('netProceeds', 15, 2); $t->decimal('monthlyAmortization', 15, 2);
            $t->decimal('serviceFee', 15, 2)->default(0); $t->decimal('insurance', 15, 2)->default(0);
            $t->decimal('advanceInterest', 15, 2)->default(0); $t->integer('advanceInterestMonths')->default(2);
            $t->decimal('monthlyInterestRate', 14, 12); $t->string('calculation_version')->nullable();
            $t->json('calculation_snapshot')->nullable(); $t->timestamps();
        });
        Schema::create('loan_amortization_schedules', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('loanId'); $t->integer('installmentNumber'); $t->date('dueDate');
            $t->decimal('openingBalance', 15, 2); $t->decimal('amountDue', 15, 2); $t->decimal('principalDue', 15, 2);
            $t->decimal('interestDue', 15, 2); $t->decimal('closingBalance', 15, 2); $t->decimal('amountPaid', 15, 2)->default(0);
            $t->decimal('principalPaid', 15, 2)->default(0); $t->decimal('interestPaid', 15, 2)->default(0);
            $t->string('status'); $t->date('paidAt')->nullable(); $t->string('referenceNumber')->nullable();
            $t->timestamp('createdAt')->nullable(); $t->timestamp('updatedAt')->nullable();
        });
        Schema::create('loan_payments', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('loan_id'); $t->string('batch_reference'); $t->string('reference_number')->nullable();
            $t->date('payment_date'); $t->decimal('amount', 15, 2); $t->decimal('principal_amount', 15, 2);
            $t->decimal('interest_amount', 15, 2); $t->json('allocation_snapshot'); $t->unsignedBigInteger('received_by')->nullable(); $t->timestamps();
        });
        Schema::create('acc_chart_of_account', function (Blueprint $t) {
            $t->id(); $t->string('accountCode'); $t->string('accountName'); $t->timestamps();
        });
        DB::table('acc_chart_of_account')->insert([
            ['accountCode' => '11110', 'accountName' => 'Cash on Hand - Upi', 'created_at' => now(), 'updated_at' => now()],
            ['accountCode' => '11211', 'accountName' => 'Loan Receivables - Short Term', 'created_at' => now(), 'updated_at' => now()],
            ['accountCode' => '40110', 'accountName' => 'Interest Income from Loans', 'created_at' => now(), 'updated_at' => now()],
        ]);
        Schema::create('acc_journal_entries', function (Blueprint $t) {
            $t->id(); $t->string('batch_reference'); $t->string('source_type'); $t->unsignedBigInteger('source_record_id')->nullable();
            $t->unsignedBigInteger('memberId')->nullable(); $t->string('branch'); $t->string('account_code'); $t->string('account_name');
            $t->decimal('debit', 15, 2); $t->decimal('credit', 15, 2); $t->string('particulars')->nullable();
            $t->date('transaction_date'); $t->string('status'); $t->unsignedBigInteger('reviewed_by')->nullable();
            $t->timestamp('reviewed_at')->nullable(); $t->string('reviewer_notes')->nullable(); $t->timestamps(); $t->softDeletes();
        });
    }
}
