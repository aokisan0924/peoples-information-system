<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GalleryController extends Controller
{
    public function gallery()
    {
        // Fetch all visible images
        $images = Gallery::where('is_visible', true)
            ->latest()
            ->get()
            ->map(function ($img) {
                return [
                    'id' => $img->id,
                    'src' => asset('storage/' . $img->image_path), // Format for frontend
                    'category' => $img->category,
                    'caption' => $img->caption
                ];
            });

        return Inertia::render('Gallery', [
            'dbImages' => $images
        ]);
    }
}
