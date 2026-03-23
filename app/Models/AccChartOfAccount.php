<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccChartOfAccount extends Model
{
    protected $table = 'acc_chart_of_account';
    protected $fillable = [
        'accountCode', 'accountName', 'isActive'
    ];
}
