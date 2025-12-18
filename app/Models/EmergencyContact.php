<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmergencyContact extends Model
{
    protected $fillable = [
        'memberId', 'contactPersonName', 'contactPersonAddress',
        'contactPersonPhone', 'contactPersonRelation',
    ];   
    
    public function member()
    {
        return $this->belongsTo(Member::class, 'memberId');
    }
}
