<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentsInfo extends Model
{
    protected $fillable = [
        'memberId', 'motherName', 'motherAge',
        'fatherName', 'fatherAge',
    ];    

    public function member()
    {
        return $this->belongsTo(Member::class, 'memberId');
    }
}
