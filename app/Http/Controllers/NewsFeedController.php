<?php

namespace App\Http\Controllers;

use App\Models\News;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NewsFeedController extends Controller
{
    public function index() {
        $news = News::where('is_published', true)->latest()->get();
        return Inertia::render('News', [ 'news' => $news ]);
    }
}
