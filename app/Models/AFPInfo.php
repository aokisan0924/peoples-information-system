<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AFPInfo extends Model
{
    protected $table = 'afp_infos';
    protected $fillable = [
        'memberId', 'afpsn', 'rank', 'designation', 'afpId',
        'presentAssignment', 'controlNo', 'yearsInService',
        'cadEnlistment', 'retirementDate', 'pensionDate',
    ];    

    public function member()
    {
        return $this->belongsTo(Member::class, 'memberId');
    }
}
