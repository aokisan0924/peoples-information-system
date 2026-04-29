<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    public function create()
    {
        // Fetch all admins
        $admins = Admin::select('id', 'name', 'email', 'role', 'branch', 'permissions', 'created_at')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Admin/CreateAdmin', [
            'admins' => $admins
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:admins',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'string', 'in:super-admin,loan-processor,accounting-clerk,cashier,admin-officer'],
            'branch' => 'required|string',
            'permissions' => 'nullable|array',
            'permissions.*' => ['string', 'in:view_loans,process_loans,manage_members,manage_deposits,view_reports,manage_accounting']
        ]);

        Admin::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'branch' => $request->branch,
            'permissions' => $request->permissions ?? [], 
        ]);

        return redirect()->back()->with('success', 'Admin user created successfully.');
    }

    public function update(Request $request, $id)
    {
        $admin = Admin::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('admins')->ignore($admin->id)],
            'role' => ['required', 'string', 'in:super-admin,loan-processor,accounting-clerk,cashier,admin-officer'],
            'branch' => 'required|string',
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'permissions' => 'nullable|array',
            'permissions.*' => ['string', 'in:view_loans,process_loans,manage_members,manage_deposits,view_reports,manage_accounting']
        ]);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'branch' => $request->branch,
            'permissions' => $request->permissions ?? [], 
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $admin->update($data);

        return redirect()->back()->with('success', 'Admin user updated successfully.');
    }
}