<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PasswordResetOtp extends Model
{
    protected $table = 'password_reset_otps';

    protected $fillable = [
        'memberId',
        'otpToken',
        'channel',
        'destination',
        'otpCodeHashed',
        'isVerified',
        'attempts',
        'maxAttempts',
        'expiresAt',
    ];

    protected $casts = [
        'isVerified' => 'boolean',
        'expiresAt'  => 'datetime',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'memberId');
    }
}
