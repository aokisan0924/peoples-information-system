<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;


class MemberSettingsController extends Controller
{
    public function edit(){
        return Inertia::render('Client/ClientChangePassword');
    }

    public function update(Request $request){
        $request->validate([
            'currentPassword' => 'required|string',
            'newPassword'     => 'required|string|min:8|confirmed',
        ]);
    
        $loginMember = Auth::guard('member')->user();
    
        if (!$loginMember || !$loginMember->member) {
            return back()->withErrors([
                'currentPassword' => 'Member account not found.',
            ]);
        }

        $member = $loginMember->member;
    
        if (!Hash::check($request->currentPassword, $member->password)) {
            return back()->withErrors([
                'currentPassword' => 'Current password is incorrect.',
            ]);
        }
    
        $member->password = Hash::make($request->newPassword);
        $member->save();
    
        return back()->with('success', 'Your password has been updated successfully.');
    }
}
