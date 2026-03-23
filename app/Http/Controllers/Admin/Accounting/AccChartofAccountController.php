<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccChartOfAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccChartofAccountController extends Controller
{
    public function index(Request $request) {
        $query = AccChartOfAccount::query();

        if ($request->filled('search')) {
            $searchTerm = "%" . $request->search . "%";
            $query->where('accountName', 'like', $searchTerm)
                    ->orWhere('accountCode', 'like', $searchTerm);
        }

        return Inertia::render('Admin/Accounting/ChartOfAccount', [
            'accounts' => $query->orderBy('accountCode')->paginate(10)->withQueryString()
        ]);
    }

    public function store(Request $request) {
        $data = $request->validate([
            'accountCode' => ['required', 'string', 'unique:acc_chart_of_account,accountCode'],
            'accountName' => ['required', 'string', 'max:255']
        ]);

        AccChartOfAccount::create($data);
        return redirect()->back();
    }

    public function update(Request $request, $id) {
        $account = AccChartOfAccount::findOrFail($id);
        $data = $request->validate([
            'accountCode' => ['required', 'string', 'unique:acc_chart_of_account,accountCode,' . $id],
            'accountName' => ['required', 'string', 'max:255']
        ]);

        $account->update($data);
        return redirect()->back();
    }

    public function destroy($id) {
        AccChartOfAccount::findOrFail($id)->delete();
        return redirect()->back();
    }

    public function import(Request $request) {
        $request->validate([
            'file' => 'required|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        fgetcsv($handle); // Skip the header row

        $imported = 0;
        $skipped = 0;

        while (($data = fgetcsv($handle, 1000, ',')) !== FALSE) {
            if (!empty($data[0]) && !empty($data[1])) {
                // Check for existing code to prevent errors
                $exists = AccChartOfAccount::where('accountCode', $data[0])->exists();
                
                if (!$exists) {
                    AccChartOfAccount::create([
                        'accountCode' => $data[0],
                        'accountName' => $data[1],
                    ]);
                    $imported++;
                } else {
                    $skipped++;
                }
            }
        }
        fclose($handle);

        return redirect()->back()->with('success', "Imported $imported accounts. Skipped $skipped duplicates.");
    }

    public function downloadTemplate() {
        $callback = function() {
            $file = fopen('php://output', 'w');
            
            // Header Row
            fputcsv($file, ['accountCode', 'accountName']);
            
            // Example Row
            fputcsv($file, ['105-01', 'Loans Receivable - Principal']);
            
            fclose($file);
        };

        // streamDownload automatically injects the correct headers to force a file download
        return response()->streamDownload($callback, 'chart_of_accounts_template.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
