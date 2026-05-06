<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccPpeDepreciation extends Model
{
    protected $fillable = [
        'branch', 'category', 'date_acquired', 'particular', 'amount', 'life_years'
    ];
}
