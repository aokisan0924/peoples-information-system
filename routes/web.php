<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminComputationController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminProfileController;
use App\Http\Controllers\Admin\LoanController;
use App\Http\Controllers\Admin\MemberController;
use App\Http\Controllers\Admin\MemberDataController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SavingsDepositController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\ClientContributionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\MemberAuthController;
use App\Http\Controllers\MemberRegistrationController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClientTransactionHistoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\ShareCapitalController;
use App\Http\Controllers\Admin\TimeDepositController;
use App\Http\Controllers\Api\PayMongoController;
use App\Http\Controllers\Auth\MemberPasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\ClientLoanController;
use App\Http\Controllers\ClientNotificationController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LoanInformationController;
use App\Http\Controllers\MemberPaymentStatusController;
use App\Http\Controllers\MemberSettingsController;
use App\Http\Controllers\PettyCashController;
use App\Http\Controllers\PublicCalculatorController;
use App\Http\Controllers\SavingsDepositController as publicSavingsDepositController;
use App\Http\Controllers\ShareCapitalCalculatorController;
use App\Http\Controllers\TimeDepositCalculatorController;
use App\Http\Middleware\AdminMiddleware;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// =========================================================================
// 1. PUBLIC ROUTES
// =========================================================================

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::prefix('about')->group(function () {
    Route::get('/pmpc', fn() => Inertia::render('About'))->name('about.pmpc');
    Route::get('/board-of-directors', fn() => Inertia::render('BoardMembers'))->name('about.board');
    Route::get('/management', fn() => Inertia::render('Management'))->name('about.management');
});

Route::get('/member-benefit', fn() => Inertia::render('Membership'));
Route::get('/products-services', fn() => Inertia::render('ProductsAndServices'));
Route::get('/gallery', fn() => Inertia::render('Gallery'))->name('gallery');

Route::get('/contact', [ContactController::class, 'showContactPage'])->name('contact');
Route::post('/contact/send', [ContactController::class, 'send']);

// Calculators & Public Info
Route::get('/calculator', [PublicCalculatorController::class, 'publicCalculatorIndex']);
Route::post('/calculator/active-pensioner-v1', [PublicCalculatorController::class, 'activePensionerV1'])->name('public.calculator.activePensionerV1');

Route::get('/loan-information', [LoanInformationController::class, 'showLoanInfo'])->name('loan-information');

Route::get('/savings-deposit', [publicSavingsDepositController::class, 'showSavingsDeposit']);
Route::post('/savings-deposit/calculate', [publicSavingsDepositController::class, 'calculateSavings'])->name('savings-deposit.calculate');

Route::get('/share-capital', [ShareCapitalCalculatorController::class, 'showShareCapital']);
Route::post('/share-capital/calculate', [ShareCapitalCalculatorController::class, 'calculate'])->name('share-capital.calculate');

Route::get('/time-deposit', [TimeDepositCalculatorController::class, 'showTimeDeposit']);
Route::post('/time-deposit/calculate', [TimeDepositCalculatorController::class, 'calculate'])->name('time-deposit.calculate');

Route::get('/petty-cash', [PettyCashController::class, 'showPettyCash']);
Route::post('/petty-cash/calculate', [PettyCashController::class, 'calculate'])->name('petty-cash.calculate');

Route::get('st-peter-life-plan', fn() => Inertia::render('StPeterPlan'));

// Registration Routes
Route::get('/register', [RegisterController::class, 'showForm'])->name('member.register');
Route::post('/register/send-otp', [RegisterController::class, 'sendOtp'])->name('register.sendOtp')->middleware('throttle:5,1');
Route::post('/register/verify-otp', [RegisterController::class, 'verifyOtp'])->name('register.verifyOtp')->middleware('throttle:10,1');
Route::post('/register/resend-otp', [RegisterController::class, 'resendOtp'])->name('register.resendOtp')->middleware('throttle:1,30'); 
Route::post('/member/register', [MemberRegistrationController::class, 'store'])->name('member.store');

// Forgot password (OTP-based)
Route::get('/password/forgot', [MemberPasswordResetController::class, 'showForgotForm']) ->name('member.password.forgot');
Route::post('/password/forgot/send-otp', [MemberPasswordResetController::class, 'sendResetOtp']) ->name('member.password.sendOtp')->middleware('throttle:3,1');
Route::post('/password/forgot/verify', [MemberPasswordResetController::class, 'verifyResetOtp'])->name('member.password.verifyOtp')->middleware('throttle:5,1');

// Login
Route::get('/login', fn () => Inertia::render('Auth/Login', [
    'canResetPassword' => false,
    'status' => session('status'),
]))->name('login');

Route::post('/login', [MemberAuthController::class, 'memberLogin'])->name('member.login.post');

// =========================================================================
// 2. CLIENT / MEMBER PORTAL
// =========================================================================
Route::middleware('auth:member')->prefix('client')->name('member.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/capital-total', [DashboardController::class, 'getCapitalTotal'])->name('capital.total');
    Route::get('/capital-chart', [DashboardController::class, 'getCapitalChartData'])->name('capital.chart');

    // Profile Data
    Route::get('/profile-data', [ClientController::class, 'showMemberProfile'])->name('show');
    Route::post('/update-basic-info', [ClientController::class, 'updateBasicInfo'])->name('update-basic-info');
    Route::post('/update-branch-service', [ClientController::class, 'updateBranchService'])->name('update-branch-service');
    Route::post('/update-identification-info', [ClientController::class, 'updateIdentificationInfo'])->name('update-identification-info');
    Route::post('/update-afp-info', [ClientController::class, 'updateAfpInfo'])->name('update-afp-info');
    Route::post('/update-spouse-info', [ClientController::class, 'updateSpouseInfo'])->name('update-spouse-info');
    Route::post('/update-parents-info', [ClientController::class, 'updateParentsInfo'])->name('update-parents-info');
    Route::post('/update-emergency-info', [ClientController::class, 'updateEmergencyInfo'])->name('update-emergency-info');
    Route::post('/update-dependents-info', [ClientController::class, 'updateDependents'])->name('update-dependents-info');

    Route::post('/profile/photo', [ClientController::class, 'updateProfilePhoto'])->name('updateProfilePhoto');
    Route::get('/profile/photo/show', [ClientController::class, 'showProfilePhoto'])->name('showProfilePhoto');

    // Notifications
    Route::get('/notifications', [ClientNotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/list', [ClientNotificationController::class, 'list']);
    Route::post('/notifications/{id}/read', [ClientNotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [ClientNotificationController::class, 'markAllAsRead']);

    // Transactions
    Route::get('/recent-transactions', [ClientTransactionHistoryController::class, 'getTransactionHistory'])->name('transactions.history');
    Route::get('/transactions', [ClientTransactionHistoryController::class, 'index'])->name('transactions.index');

    // Products & Checkout
    Route::get('/capital-contribution', [ClientContributionController::class, 'shareCapitalData'])->name('share-capital-data');
    Route::post('/paymongo/capital-checkout', [PayMongoController::class, 'createCapitalCheckout'])->name('paymongo.capitalCheckout');

    Route::get('/savings-deposit', [publicSavingsDepositController::class, 'memberIndex'])->name('savings.index');
    Route::post('/savings/withdrawal-request', [publicSavingsDepositController::class, 'createWithdrawalRequest'])->name('savings.withdrawal');
    Route::post('/paymongo/savings-checkout', [PayMongoController::class, 'createSavingsCheckout'])->name('paymongo.savingsCheckout');
    
    Route::get('/time-deposit', [TimeDepositCalculatorController::class, 'showClientTimeDeposit'])->name('time-deposit');

    // Loans
    Route::get('/loans', [ClientLoanController::class, 'index'])->name('loans.index');
    Route::get('/api/loans', [ClientLoanController::class, 'list'])->name('loans.list');
    Route::post('/api/loans/compute', [ClientLoanController::class, 'compute'])->name('loans.compute');
    Route::post('/api/loans/submit', [ClientLoanController::class, 'submit'])->name('loans.submit');

    Route::get('/api/loans/{loanReference}', [ClientLoanController::class, 'showDetailJson'])->name('loans.show.json');
    Route::get('/loans/{loanReference}/requirements', [ClientLoanController::class, 'showRequirements'])->name('loans.requirements');
    Route::post('/loans/{loanReference}/requirements', [ClientLoanController::class, 'uploadRequirements'])->name('loans.requirements.upload');
    Route::post('/loans/{loanReference}/requirements/submit', [ClientLoanController::class, 'submitForEvaluation'])->name('loans.requirements.submit');

    // Paymongo
    Route::post('/paymongo/membership-checkout', [PayMongoController::class, 'createMembershipCheckout'])->name('paymongo.membershipCheckout');
    
    // Payments
    Route::get('/payment-status', [MemberPaymentStatusController::class, 'showPaymentStatus'])->name('payment-status');
    Route::get('/payment/success', [PaymentController::class, 'success']);
    Route::get('/payment/failure', [PaymentController::class, 'failure']);
    Route::get('/payment/cancel', [PaymentController::class, 'cancel']);

    // Settings
    Route::get('/settings/password', [MemberSettingsController::class, 'edit'])->name('settings');
    Route::post('/settings/password', [MemberSettingsController::class, 'update'])->name('settings.update');

    Route::post('/logout', [MemberAuthController::class, 'memberLogout'])->name('logout');
});

// PayMongo Webhook
Route::post('/paymongo/webhook', [PayMongoController::class, 'webhook'])->withoutMiddleware(VerifyCsrfToken::class)->name('paymongo.webhook');

// =========================================================================
// 3. ADMIN PORTAL (GRANULAR PERMISSIONS SYSTEM)
// =========================================================================
Route::prefix('admin')->name('admin.')->group(function () {

    // --- GUEST ADMIN ROUTES ---
    Route::get('/login', [AdminAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AdminAuthController::class, 'login'])->name('login.post');
    Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');

    // 2FA VERIFICATION
    Route::get('/2fa', [AdminAuthController::class, 'show2faForm'])->name('2fa.form');
    Route::post('/2fa', [AdminAuthController::class, 'verify2fa'])->name('2fa.verify');

    // --- AUTHENTICATED ADMIN ROUTES ---
    Route::middleware('auth:admin')->group(function () {

        // 1. Dashboard & Security
        Route::get('/dashboard', [AdminDashboardController::class, 'showDashboard'])->name('dashboard');
        
        Route::get('/2fa/setup', [AdminAuthController::class, 'show2faSetup'])->name('2fa.setup');
        Route::post('/2fa/setup', [AdminAuthController::class, 'store2faSetup'])->name('2fa.setup.store');

        // 2. Profile Management
        Route::get('/profile', [AdminProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [AdminProfileController::class, 'update'])->name('profile.update');
        Route::put('/password', [AdminProfileController::class, 'updatePassword'])->name('password.update');

        // GROUP A: SUPER ADMIN ONLY
        Route::middleware(['auth:admin', 'role:super-admin'])->group(function () {
            Route::get('/create-user', [AdminUserController::class, 'create'])->name('create-user');
            Route::post('/create-user', [AdminUserController::class, 'store'])->name('store-user');
            Route::patch('/update-user/{id}', [AdminUserController::class, 'update'])->name('update-user');

            Route::get('/settings', [SettingController::class, 'showSettingPage'])->name('settings');

            Route::get('/loan-settings', [AdminComputationController::class, 'showLoanSettings'])->name('loan-settings.index');
            Route::get('/computations', [AdminComputationController::class, 'computationList'])->name('computations.list');
            Route::post('/computations', [AdminComputationController::class, 'storeComputation'])->name('computations.store-computation');
            Route::put('/computations/{id}', [AdminComputationController::class, 'updateComputation'])->name('computations.update-computation');
            Route::get('/computations/{id}/set-active', [AdminComputationController::class, 'setActive'])->name('computations.set-active');
            Route::delete('/computations/{id}', [AdminComputationController::class, 'destroyComputation'])->name('computations.destroy-computation');
        });

        // GROUP B: REPORTS
        Route::middleware('can_access:view_reports')->group(function () {
            Route::get('/reports', [ReportController::class, 'index'])->name('reports');
            Route::get('/reports/{report}/download', [ReportController::class, 'download'])->name('reports.download');
        });

        // GROUP C: LOAN MANAGEMENT
        Route::middleware('can_access:view_loans')->group(function () {
            Route::get('/loans', [LoanController::class, 'showLoanPage'])->name('loans');
            Route::get('/loans/{loanReference}', [LoanController::class, 'showLoanDetails'])->name('loans.showLoan');

            Route::get('/loans/{loanReference}/documents/{documentId}/preview', [LoanController::class, 'previewPreApprovalDocuments'])->whereNumber('documentId')->name('loans.preDocuments.preview');
            Route::get('/admin/loans/{loanReference}/post-documents/{documentId}/preview',[LoanController::class, 'previewPostApprovalDocument'])->name('loans.postDocuments.preview');
            Route::get('/loans/{loanReference}/download/application', [LoanController::class, 'downloadapplication'])->name('loan.download.application');
            Route::get('/loans/{loanReference}/download/release-voucher', [LoanController::class, 'downloadReleaseVoucher'])->name('loan.download.releaseVoucher');
            Route::get('/loans/{loanReference}/download/ledger', [LoanController::class, 'downloadLedger'])->name('loan.download.ledger');

            Route::get('/api/loans', [LoanController::class, 'apiList'])->name('api.loans.index'); 
            Route::get('/api/loans/{loanReference}/details', [LoanController::class, 'apiDetails'])->name('api.loans.details');
        });

        Route::middleware('can_access:process_loans')->group(function () {
            Route::post('/compute-loan', [LoanController::class, 'compute']);
            Route::post('/submit-loan', [LoanController::class, 'storeLoan']);
            Route::post('/recompute-loan', [LoanController::class, 'recompute'])->name('loan.recompute');

            Route::post('/loans/{loanReference}/approve', [LoanController::class, 'approve'])->name('loan.approve');
            Route::post('/loans/{loanReference}/decline', [LoanController::class, 'decline'])->name('loan.decline');
            Route::post('/loans/{loanReference}/release', [LoanController::class, 'release'])->name('loan.release');
            Route::post('/loans/{loanReference}/complete', [LoanController::class, 'complete'])->name('loan.complete');

            Route::post('/loans/{loanReference}/post-approval-docs', [LoanController::class, 'storePostApprovalDocs'])->name('loans.postApprovalDocs.store');
            Route::post('/loans/{loanReference}/documents', [LoanController::class, 'storePreApprovalDocuments'])->name('loans.documents.store');
            Route::post('/loans/{loanReference}/ack-downloads', [LoanController::class, 'acknowledgeDownloads'])->name('loan.ackDownloads');
        });

        // GROUP D: MEMBERS (FIXED ROUTES: Replaced {encrypted} with {id})
        Route::middleware('can_access:manage_members')->prefix('/members')->name('members.')->group(function () {
            Route::get('/', [MemberController::class, 'showMemberPage'])->name('index');
            
            // FIXED: Use {id} instead of {encrypted}
            Route::get('/profile/{id}', [MemberController::class, 'showMemberDetail'])->name('show-member');
            
            Route::get('/{id}/loan-details/{loanReference}', [MemberController::class, 'apiMemberLoanDetails'])->name('loan-details');
            Route::get('/api/members/search', [LoanController::class, 'apiSearchMembers'])->name('api.members.search'); 

            // Actions - Fixed update routes to use {id}
            Route::post('/{id}/update-basic-info', [MemberController::class, 'updateBasicInfo'])->name('update-basic-info');
            Route::post('/{id}/update-branch-service', [MemberController::class, 'updateBranchService'])->name('update-branch-service');
            Route::post('/{id}/update-afp-info', [MemberController::class, 'updateAfpInfo'])->name('update-afp-info');
            Route::post('/{id}/update-spouse-info', [MemberController::class, 'updateSpouseInfo'])->name('update-spouse-info');
            Route::post('/{id}/update-parents-info', [MemberController::class, 'updateParentsInfo'])->name('update-parents-info');
            Route::post('/{id}/update-identification-info', [MemberController::class, 'updateIdentificationInfo'])->name('update-identification-info');
            Route::post('/{id}/update-emergency-info', [MemberController::class, 'updateEmergencyInfo'])->name('update-emergency-info');
            Route::post('/{id}/update-dependents-info', [MemberController::class, 'updateDependents'])->name('update-dependents-info');

            Route::get('/export', [MemberDataController::class, 'exportSpreadsheet'])->name('export');
            Route::post('/import', [MemberDataController::class, 'importSpreadsheet'])->name('import');
        });

        // GROUP E: DEPOSITS
        Route::middleware('can_access:manage_deposits')->group(function () {
            // Share Capital
            Route::prefix('/share-capital')->name('share-capital.')->group(function () {
                Route::get('/', [ShareCapitalController::class, 'showShareCapital'])->name('index');
                Route::get('/member/{memberId}', [ShareCapitalController::class, 'showMemberContributions'])->name('member');
                Route::post('/store', [ShareCapitalController::class, 'storeShareCapital'])->name('store');
                Route::get('/export', [ShareCapitalController::class, 'exportCsv'])->name('export');
                // APIs
                Route::get('/api/index', [ShareCapitalController::class, 'apiIndex'])->name('api-index');
                Route::get('/api/member/{memberId}', [ShareCapitalController::class, 'apiMemberContributions'])->name('api-member');
                Route::get('/api/members-min', [ShareCapitalController::class, 'apiMembersMin'])->name('api-members-min');
            });

            // Savings Deposit
            Route::prefix('/savings-deposit')->name('savings.')->group(function () {
                Route::get('/', [SavingsDepositController::class, 'showSavingsDepositPage'])->name('index');
                Route::get('/member/{memberId}', [SavingsDepositController::class, 'showMemberSavings'])->name('member');
                Route::post('/store', [SavingsDepositController::class, 'storeSavingsDeposit'])->name('store');
                Route::get('/export', [SavingsDepositController::class, 'exportCsv'])->name('export');
                Route::post('/post-interest', [SavingsDepositController::class, 'postSemiAnnualInterest'])->name('post-interest');

                // Withdrawals
                Route::prefix('/withdrawals')->name('withdrawal.')->group(function () {
                    Route::get('/', [SavingsDepositController::class, 'withdrawalIndex'])->name('index');
                    Route::get('/{memberId}', [SavingsDepositController::class, 'showMemberWithdrawal'])->name('show');
                    Route::post('/{memberId}/approve', [SavingsDepositController::class, 'approveWithdrawal'])->name('approve');
                    Route::post('/{memberId}/decline', [SavingsDepositController::class, 'declineWithdrawal'])->name('decline');
                    Route::post('/{memberId}/release', [SavingsDepositController::class, 'releaseWithdrawal'])->name('release');
                    Route::get('/print/{memberId}', [SavingsDepositController::class, 'printWithdrawal'])->name('print');
                });

                // APIs
                Route::get('/api', [SavingsDepositController::class, 'apiIndex'])->name('api-index');
                Route::get('/api-members-min', [SavingsDepositController::class, 'apiMembersMin'])->name('api-members-min');
                Route::get('/api/member/{memberId}', [SavingsDepositController::class, 'apiMemberSavings'])->name('api-member');
            });

            // Time Deposit
            Route::prefix('/time-deposit')->name('time.')->group(function () {
                Route::get('/', [TimeDepositController::class, 'showtimeDepositPage'])->name('index');
                Route::get('/member/{memberId}', [TimeDepositController::class, 'showMemberTimeDeposit'])->name('member');
                Route::post('/store', [TimeDepositController::class, 'storeTimeDeposit'])->name('store');
                Route::post('/member/{memberId}/withdraw-interest', [TimeDepositController::class, 'withdrawInterest'])->name('withdraw-interest');
                Route::get('/export', [TimeDepositController::class, 'exportCsv'])->name('export');
                // APIs
                Route::get('/api-index', [TimeDepositController::class, 'apiIndex'])->name('api-index');
                Route::get('/api-members-min',[TimeDepositController::class, 'apiMembersMin'])->name('api-members-min');
            });
        });
    }); 
});

// Profile Management (Laravel Authenticated Client)
Route::middleware('auth')->prefix('profile')->name('profile.')->group(function () {
    Route::get('/', [ProfileController::class, 'edit'])->name('edit');
    Route::patch('/', [ProfileController::class, 'update'])->name('update');
    Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
});