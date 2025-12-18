<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpouseInfo extends Model
{
    protected $fillable = [
        'memberId', 'spouseName', 'spouseAge', 'spouseDob', 'dateMarriage',
    ]; 
    
    public function member()
    {
        return $this->belongsTo(Member::class, 'memberId', 'spouseName', 'spouseAge', 'spouseDob', 'dateMarriage');
    }
}
