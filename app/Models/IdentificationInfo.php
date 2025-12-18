<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdentificationInfo extends Model
{
    protected $fillable = [
        'memberId', 'tinNo', 'gsisNo', 'crnUmidNo',
    ];    

    public function member()
    {
        return $this->belongsTo(Member::class, 'memberId');
    }
}
