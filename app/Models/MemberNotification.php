<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberNotification extends Model
{
    protected $table = 'member_notification';

    protected $fillable = [
        'memberId',
        'title',
        'message',
        'type',
        'isRead',
        'linkUrl',
        'metaJson',
    ];

    protected $casts = [
        'isRead'  => 'boolean',
        'metaJson'=> 'array',
    ];

    public function member() {
        return $this->belongsTo(Member::class, 'memberId');
    }
}
