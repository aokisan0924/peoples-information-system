<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dependent extends Model
{
    protected $fillable = [
        'memberId', 'name', 'dob', 'gender',
    ];    

    public function member()
    {
        return $this->belongsTo(Member::class, 'memberId', 'name', 'dob', 'gender');
    }
}
