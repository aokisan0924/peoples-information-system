<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\CapitalContribution;
use App\Models\CapitalTransaction;
use App\Models\MembershipPayment;

class DashboardController extends Controller
{
    public function index(){
        return inertia('Client/ClientDashboard');
    }

    public function getCapitalTotal(){
        $memberId = Auth::guard('member')->id();

        $total = CapitalContribution::where('memberId', $memberId)
            ->where('is_paid', true)
            ->sum('amount');

        return response()->json(['total' => $total]);
    }

    public function getCapitalChartData(){
        $memberId = auth('member')->id();

        $data = CapitalContribution::where('memberId', $memberId)
            ->where('is_paid', true)
            ->selectRaw('DATE_FORMAT(created_at, "%b %Y") as month, SUM(amount) as amount')
            ->groupBy('month')
            ->orderByRaw('MIN(created_at)')
            ->get();
    
        return response()->json($data);
    }
}