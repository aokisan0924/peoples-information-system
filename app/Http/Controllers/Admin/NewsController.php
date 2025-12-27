<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class NewsController extends Controller
{
    // 1. Show the Page (Note: pointing to Admin/NewsIndex)
    public function index() {
        return Inertia::render('Admin/NewsIndex', [
            'news' => News::latest()->get()
        ]);
    }

    // 2. Store News (Handle Multiple Images)
    public function store(Request $request) {
        $request->validate([
            'images' => 'required|array|min:1',
            'images.*' => 'image|max:10240', // Max 10MB per file
            'caption' => 'nullable|string',
            'title' => 'required|string|max:255',
        ]);

        $imagePaths = [];

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                // Store in 'storage/app/public/news_images'
                $path = $file->store('news_images', 'public');
                $imagePaths[] = $path;
            }
        }

        News::create([
            'title' => $request->title,
            'caption' => $request->caption,
            'images' => $imagePaths,
            'is_published' => true
        ]);

        return redirect()->back()->with('success', 'News posted successfully!');
    }

    // 3. Delete News
    public function destroy($id) {
        $news = News::findOrFail($id);
        
        if ($news->images) {
            foreach ($news->images as $path) {
                Storage::disk('public')->delete($path);
            }
        }
        
        $news->delete();
        return redirect()->back();
    }

    // 4. AI Generator (Gemini)
    public function generateAiContent(Request $request, GeminiService $gemini)
    {
        $request->validate([
            'prompt' => 'required|string|min:3|max:999',
        ]);

        $topic = $request->input('prompt');

        $prompt = "You are the Social Media Manager for People's Multi-Purpose Cooperative. ";
        $prompt .= "Write a catchy headline (title) and a short, engaging Facebook-style caption (max 5 sentences) ";
        $prompt .= "about: '{$topic}'. ";
        $prompt .= "IMPORTANT: Return ONLY a valid JSON object with keys 'title' and 'caption'. No markdown.";

        try {
            $content = $gemini->generateContent($prompt);
            $cleanContent = str_replace(['```json', '```'], '', $content);
            $data = json_decode($cleanContent, true);

            return response()->json([
                'success' => true,
                'title' => $data['title'] ?? 'News Update',
                'caption' => $data['caption'] ?? $content
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}