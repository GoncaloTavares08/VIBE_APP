<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendResetPasswordEmail implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public \App\Models\User $user,
        public string $code
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        \Illuminate\Support\Facades\Mail::raw("O seu código de recuperação é: {$this->code}", function ($message) {
            $message->to($this->user->email)
                    ->subject('Recuperação de Password VIBE_APP');
        });
    }
}
