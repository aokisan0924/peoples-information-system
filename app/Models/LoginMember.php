<?php

namespace App\Models;

use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Model;

class LoginMember extends Member
{
    use Notifiable;

    protected $table = 'members'; 


    protected $fillable = ['username', 'password'];

    protected $hidden = ['password'];

    public function member() {
        return $this->hasOne(Member::class, 'id');
    }

    public function branchService() {
        return $this->hasOne(BranchService::class, 'memberId', 'id');
    }

    public function membershipPayment() {
        return $this->hasOne(MembershipPayment::class);
    }

    public function capitalContribution() {
        return $this->hasOne(CapitalContribution::class);
    }
}
