<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccJournalEntry extends Model
{
    use SoftDeletes;

    protected $table = 'acc_journal_entries';

    protected $fillable = [
        'batch_reference',
        'source_type',
        'source_record_id',
        'memberId',
        'branch',
        'account_code',
        'account_name',
        'debit',
        'credit',
        'particulars',
        'transaction_date',
        'status',
        'reviewed_by',
        'reviewed_at',
        'reviewer_notes',
    ];

    protected $casts = [
        'debit'            => 'float',
        'credit'           => 'float',
        'reviewed_at'      => 'datetime',
        'transaction_date' => 'date',
    ];

    public function member() {
        return $this->belongsTo(Member::class, 'memberId');
    }

    public function reviewer() {
        return $this->belongsTo(\App\Models\Admin::class, 'reviewed_by');
    }

    // ── Account code maps ─────────────────────────────────────────────────────

    public static function cashOnHandAccounts(): array {
        return [
            'upi'       => ['code' => '11110', 'name' => 'Cash on Hand - Upi'],
            'aguinaldo' => ['code' => '11115', 'name' => 'Cash on Hand - Aguinaldo'],
            'fort_mag'  => ['code' => '11120', 'name' => 'Cash on Hand - Fort Mag'],
        ];
    }

    public static function cashInBankAccounts(): array {
        return [
            'ilagan'    => ['code' => '11130', 'name' => 'Cash in Bank - Ilagan'],
            'aguinaldo' => ['code' => '11135', 'name' => 'Cash in Bank - Aguinaldo'],
            'fort_mag'  => ['code' => '11140', 'name' => 'Cash in Bank - Fort Mag'],
        ];
    }

    public static function eWalletAccounts(): array {
        return [
            'upi'       => ['code' => '11190', 'name' => 'E-Wallet Fund - Upi'],
            'aguinaldo' => ['code' => '11195', 'name' => 'E-Wallet Fund - Aguinaldo'],
            'fort_mag'  => ['code' => '11200', 'name' => 'E-Wallet Fund - Fort Mag'],
        ];
    }

    public static function paymongoAccount(): array {
        return ['code' => '11205', 'name' => 'Cash in Bank - PayMongo'];
    }

    public static function savingsDepositAccount(): array {
        return ['code' => '21110', 'name' => 'Savings Deposit'];
    }

    public static function timeDepositAccount(): array {
        return ['code' => '21120', 'name' => 'Time Deposit'];
    }

    /**
     * Share capital account depends on member type:
     * Regular → Common (30110), Associate/Null/Unverified → Preferred (30210)
     */
    public static function shareCapitalAccount(string $accountStatus = ''): array {
        $status = strtolower(trim($accountStatus));
        if ($status === 'regular') {
            return ['code' => '30110', 'name' => 'Subscribed Share Capital - Common'];
        }
        return ['code' => '30210', 'name' => 'Subscribed Share Capital - Preferred'];
    }

    /**
     * Resolve cash/bank/e-wallet account from payment channel + branch.
     *
     * $channel: 'cash' | 'gcash' | 'maya' | 'bank' | 'paymongo'
     * $branch:  'upi' | 'aguinaldo' | 'fort_mag' | 'ilagan' | null
     */
    public static function resolveAssetAccount(string $channel, ?string $branch): array {
        $channel = strtolower(trim($channel));

        // Digital via PayMongo — always 11205
        if (in_array($channel, ['gcash', 'maya', 'paymongo'])) {
            return self::paymongoAccount();
        }

        // Bank transfer — Cash in Bank by branch
        if ($channel === 'bank') {
            $banks = self::cashInBankAccounts();
            return $banks[$branch] ?? ['code' => '11130', 'name' => 'Cash in Bank - Ilagan'];
        }

        // E-Wallet (non-PayMongo digital, e.g. internal e-wallet)
        if ($channel === 'ewallet') {
            $wallets = self::eWalletAccounts();
            return $wallets[$branch] ?? ['code' => '11190', 'name' => 'E-Wallet Fund - Upi'];
        }

        // Cash — Cash on Hand by branch
        $cash = self::cashOnHandAccounts();
        return $cash[$branch] ?? ['code' => '11110', 'name' => 'Cash on Hand - Upi'];
    }

    /**
     * All asset accounts for the UI dropdown.
     */
    public static function allAssetAccounts(): array {
        return [
            'cashOnHand'  => self::cashOnHandAccounts(),
            'cashInBank'  => self::cashInBankAccounts(),
            'eWallet'     => self::eWalletAccounts(),
            'paymongo'    => self::paymongoAccount(),
        ];
    }

    /**
     * All liability accounts for the UI dropdown.
     */
    public static function allLiabilityAccounts(): array
    {
        return [
            ['code' => '21110', 'name' => 'Savings Deposit'],
            ['code' => '21120', 'name' => 'Time Deposit'],
            ['code' => '30110', 'name' => 'Subscribed Share Capital - Common'],
            ['code' => '30210', 'name' => 'Subscribed Share Capital - Preferred'],
        ];
    }
}
