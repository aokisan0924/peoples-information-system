<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CapitalTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'memberId',
        'description',
        'amount',
    ];
}
