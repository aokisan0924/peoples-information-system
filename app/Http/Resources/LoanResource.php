<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'loanReference'       => $this->loanReference,
            'firstName'           => $this->member->firstName,
            'lastName'            => $this->member->lastName,
            'grossAmount'         => (float) $this->gross,
            'monthlyAmortization' => (float) $this->monthlyAmortization,
            'netProceeds'         => (float) $this->netProceeds,
            'status'              => $this->status,
            'createdAt'           => optional($this->created_at)->toDateTimeString(),
        ];
    }
}
