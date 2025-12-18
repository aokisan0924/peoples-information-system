<?php

use App\Http\Controllers\Admin\LoanSettingController;
use App\Http\Controllers\Api\MayaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/maya/checkout', [MayaController::class, 'initiateMembershipPayment']);
Route::post('/webhook/maya', [MayaController::class, 'handleWebhook']);
