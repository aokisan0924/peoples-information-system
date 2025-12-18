<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class BranchService extends Model
{
    use HasFactory, Notifiable;

    protected $guarded = [];

    protected $fillable = [
        'memberId', 'branchService', 'subBranch',
    ];    

    public function member()
    {
        // return $this->belongsTo(Member::class, 'memberId', 'id', 'branchService', 'subBranch');
        return $this->belongsTo(Member::class, 'memberId', 'id');
    }
}
