<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegistrationOtp extends Model
{
    protected $table = 'registration_otps';

    protected $fillable = [
        'otpToken',
        'phoneNumber',
        'otpCodeHashed',
        'formData',
        'isVerified',
        'attempts',
        'maxAttempts',
        'expiresAt',
    ];

    protected $casts = [
        'formData'   => 'array',
        'isVerified' => 'boolean',
        'expiresAt'  => 'datetime',
    ];
}
