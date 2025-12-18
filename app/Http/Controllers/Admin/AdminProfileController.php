<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AdminProfileController extends Controller
{
    /**
     * Display the admin's profile form.
     */
    public function edit(Request $request) {
        return Inertia::render('Admin/AdminProfile', [
            'mustVerifyEmail' => false,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the admin's profile information.
     */
    public function update(Request $request) {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('admins')->ignore($request->user('admin')->id),
            ],
            'branch' => ['required', 'string', 'max:255'],
        ]);

        $request->user('admin')->fill($validated);

        if ($request->user('admin')->isDirty('email')) {
            $request->user('admin')->email_verified_at = null;
        }

        $request->user('admin')->save();

        return redirect()->route('admin.profile.edit');
    }

    /**
     * Update the admin's password.
     */
    public function updatePassword(Request $request) {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password:admin'], // 'admin' specifies the guard
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user('admin')->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back();
    }
}