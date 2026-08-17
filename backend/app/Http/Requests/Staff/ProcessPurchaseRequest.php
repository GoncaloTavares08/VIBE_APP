<?php

namespace App\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;

class ProcessPurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|integer',
            'amount' => 'required|numeric|min:0.01',
            'event_id' => 'nullable|integer',
        ];
    }
}
