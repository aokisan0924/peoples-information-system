<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use PragmaRX\Google2FA\Google2FA;
use Illuminate\Support\Facades\RateLimiter;

class AdminAuthController extends Controller
{
    /**
     * Show admin login form
     */
    public function showLogin(){
        return Inertia::render('Admin/AdminLogin');
    }

    /**
     * Handle admin login
     */
    public function login(Request $request) {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::guard('admin')->attempt($credentials, $request->boolean('remember'))) {
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ]);
        }

        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();

        // If 2FA is enabled -> require OTP (logout prevents bypass)
        if (!empty($admin->google2fa_secret)) {
            Auth::guard('admin')->logout();

            session([
                'admin2faLoginId' => $admin->id,
            ]);

            return redirect()->route('admin.2fa.form');
        }

        // Not enabled -> setup flow (still logged in)
        return redirect()->route('admin.2fa.setup');
    }

    public function show2faSetup() {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return redirect()->route('admin.login');
        }

        // Already enabled -> Redirect based on role
        if (!empty($admin->google2fa_secret)) {
            if (strtolower($admin->role) === 'accounting-clerk') {
                return redirect()->route('admin.accounting.ledger.index');
            }
            return redirect()->route('admin.dashboard');
        }

        $google2fa = new Google2FA();

        // Save admin id to session for deterministic commit later
        session(['admin2faSetupId' => $admin->id]);

        // Reuse pending secret so refresh doesn't break QR
        $pendingSecret = session('admin2faPendingSecret');
        if (!$pendingSecret) {
            $pendingSecret = $google2fa->generateSecretKey();
            session(['admin2faPendingSecret' => $pendingSecret]);
        }

        $issuer = "People's Information System";

        $google2faUrl = $google2fa->getQRCodeUrl(
            $issuer,
            (string) $admin->email,
            $pendingSecret
        );

        return Inertia::render('Admin/AdminTwoFactorSetup', [
            'google2faUrl' => $google2faUrl,
            'secret' => $pendingSecret,
        ]);
    }

    public function show2faForm() {
        // Login OTP flow
        if (session()->has('admin2faLoginId')) {
            return Inertia::render('Admin/AdminTwoFactor', ['mode' => 'login']);
        }

        // Setup OTP flow
        if (session()->has('admin2faSetupId') && session()->has('admin2faPendingSecret')) {
            return Inertia::render('Admin/AdminTwoFactor', ['mode' => 'setup']);
        }

        return redirect()->route('admin.login');
    }

    public function verify2fa(Request $request) {
        $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        // digits only (handles spaces/dashes)
        $code = preg_replace('/\D+/', '', (string) $request->input('code'));

        // throttle attempts
        $throttleKey = 'admin2fa:' . sha1(($request->ip() ?? 'ip') . '|' . session()->getId());
        if (RateLimiter::tooManyAttempts($throttleKey, 8)) {
            return back()->withErrors(['code' => 'Too many attempts. Please try again shortly.']);
        }
        RateLimiter::hit($throttleKey, 30);

        $google2fa = new Google2FA();

        /**
         * LOGIN OTP FLOW (admin logged out)
         */
        if (session()->has('admin2faLoginId')) {
            $adminId = session('admin2faLoginId');
            $admin = Admin::query()->find($adminId);

            if (!$admin || empty($admin->google2fa_secret)) {
                session()->forget(['admin2faLoginId']);
                return redirect()->route('admin.login')->withErrors(['email' => 'Invalid session.']);
            }

            // Hosting-safe tolerance
            $isValid = $google2fa->verifyKey((string) $admin->google2fa_secret, $code, 8);

            if (!$isValid) {
                return back()->withErrors(['code' => 'Invalid authentication code.']);
            }

            Auth::guard('admin')->login($admin);
            session()->forget(['admin2faLoginId']);

            // --- REDIRECT LOGIC ---
            if (strtolower($admin->role) === 'accounting-clerk') {
                return redirect()->route('admin.accounting.ledger.index')->with('success', 'Two-Factor Authentication verified.');
            }

            return redirect()->route('admin.dashboard')->with('success', 'Two-Factor Authentication verified.');
        }

        /**
         * SETUP OTP FLOW (admin logged in earlier; we commit after verification)
         */
        if (session()->has('admin2faSetupId') && session()->has('admin2faPendingSecret')) {
            $setupAdminId = session('admin2faSetupId');
            $pendingSecret = (string) session('admin2faPendingSecret');
        
            // Verify the key before saving
            $isValid = $google2fa->verifyKey($pendingSecret, $code, 8);
        
            if (!$isValid) {
                return back()->withErrors(['code' => 'Invalid authentication code.']);
            }
        
            // FIX: Retrieve the model and save specifically
            $admin = Admin::find($setupAdminId);
        
            if ($admin) {
                $admin->google2fa_secret = $pendingSecret;
                $admin->save(); // This handles updated_at and ensures persistence
        
                session()->forget(['admin2faSetupId', 'admin2faPendingSecret']);
        
                // --- REDIRECT LOGIC ---
                if (strtolower($admin->role) === 'accounting-clerk') {
                    return redirect()->route('admin.accounting.ledger.index')->with('success', 'Two-Factor Authentication enabled.');
                }

                return redirect()->route('admin.dashboard')->with('success', 'Two-Factor Authentication enabled.');
            }
        
            return back()->withErrors(['code' => 'Admin user not found.']);
        }

        return redirect()->route('admin.login');
    }

    /**
     * Logout admin
     */
    public function logout(Request $request){
        Auth::guard('admin')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        session()->forget(['admin_2fa:id', 'admin_2fa:mode', 'admin_2fa:pendingSecret']);

        return redirect()->route('admin.login');
    }
}