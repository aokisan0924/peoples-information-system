<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use App\Models\AFPInfo;
use App\Models\BranchService;
use App\Models\ParentsInfo;
use App\Models\IdentificationInfo;
use App\Models\SpouseInfo;
use App\Models\EmergencyContact;
use App\Models\Dependent;
use App\Models\MembershipPayment;
use App\Models\CapitalContribution;

class Member extends Authenticatable
{
    use HasFactory, Notifiable;
    
    protected $guarded = [];

    protected $fillable = [
        'firstName', 'lastName', 'middleName', 'suffix', 'nickname',
        'dob', 'religion', 'age', 'gender', 'civilStatus', 'nationality',
        'email', 'contact', 'region', 'regionName', 'province', 'provinceName',
        'city', 'cityName', 'barangay', 'barangayName', 'fullAddress',
        'profileImage', 'signaturePath', 'username', 'password',
    ];
    
    public function afpInfo()
    {
        return $this->hasOne(AFPInfo::class, 'memberId', 'id');
    }

    public function branchService()
    {
        return $this->hasOne(BranchService::class, 'memberId', 'id');
    }

    public function parentsInfo()
    {
        return $this->hasOne(ParentsInfo::class, 'memberId', 'id');
    }

    public function identificationInfo()
    {
        return $this->hasOne(IdentificationInfo::class, 'memberId', 'id');
    }

    public function spouseInfo()
    {
        return $this->hasOne(SpouseInfo::class, 'memberId', 'id');
    }

    public function emergencyContact()
    {
        return $this->hasOne(EmergencyContact::class, 'memberId', 'id');
    }

    public function dependents()
    {
        return $this->hasMany(Dependent::class, 'memberId', 'id');
    }

    public function membershipPayment() {
        return $this->hasOne(MembershipPayment::class, 'memberId');
    }

    public function capitalContribution() {
        return $this->hasOne(CapitalContribution::class, 'memberId');
    }

    public function loans() {
        return $this->hasMany(Loan::class, 'memberId', 'id');
    }
}

