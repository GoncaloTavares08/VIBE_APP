<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;

class ProcessImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $tempPath;
    protected $finalPath;
    protected $modelClass;
    protected $modelId;
    protected $imageColumn;

    public function __construct($tempPath, $finalPath, $modelClass = null, $modelId = null, $imageColumn = null)
    {
        $this->tempPath = $tempPath;
        $this->finalPath = $finalPath;
        $this->modelClass = $modelClass;
        $this->modelId = $modelId;
        $this->imageColumn = $imageColumn;
    }

    public function handle(): void
    {
        if (!Storage::disk('public')->exists($this->tempPath)) {
            return;
        }

        $manager = new ImageManager(new Driver());
        $image = $manager->decode(Storage::disk('public')->path($this->tempPath));
        $encoded = $image->encode(new WebpEncoder(85));

        Storage::disk('public')->put($this->finalPath, (string) $encoded);
        Storage::disk('public')->delete($this->tempPath);

        if ($this->modelClass && $this->modelId && $this->imageColumn) {
            $model = $this->modelClass::find($this->modelId);
            if ($model) {
                // Keep 'storage/' prefix to maintain compatibility with existing URLs
                $model->update([$this->imageColumn => 'storage/' . $this->finalPath]);
            }
        }
    }
}
