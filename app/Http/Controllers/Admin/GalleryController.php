<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class GalleryController extends Controller
{
    public function index(Request $request) {
        $query = Gallery::latest();
        
        if ($request->has('category') && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        return Inertia::render('Admin/Gallery', [
            'images' => $query->get(),
            'filters' => $request->only(['category'])
        ]);
    }

    // --- UPDATED FOR MULTIPLE UPLOAD ---
    public function store(Request $request) {
        $request->validate([
            'images'   => 'required|array|min:1',
            'images.*' => 'image|max:51200',
            'category' => 'required|string',
            'caption'  => 'nullable|string|max:255',
        ]);

        $uploadedCount = 0;

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('gallery_images', 'public');

                Gallery::create([
                    'image_path' => $path,
                    'category'   => $request->category,
                    'caption'    => $request->caption,
                    'is_visible' => true
                ]);
                
                $uploadedCount++;
            }
        }

        return redirect()->back()->with('success', "$uploadedCount images uploaded successfully!");
    }

    public function destroy($id) {
        $image = Gallery::findOrFail($id);
        
        if (Storage::disk('public')->exists($image->image_path)) {
            Storage::disk('public')->delete($image->image_path);
        }
        
        $image->delete();
        return redirect()->back()->with('success', 'Image deleted.');
    }
}