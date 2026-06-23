import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { PieChart } from 'lucide-react';
import axios from 'axios';

export default function LoansReceivable() {
    const [receivables, setReceivables] = useState([]);

    useEffect(() => {
        axios.get(route('admin.accounting.receivables.data')).then(res => setReceivables(res.data));
    }, []);

    return (
        <AdminSidebarLayout>
            <Head title="Loans Receivable">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h1 className="text-xl font-black text-slate-800 flex items-center gap-2"><PieChart className="text-emerald-600"/> Loans Receivable Ledger</h1>
                    <p className="text-sm text-slate-500 mt-1">Active portfolio of all approved and billed loans.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                            <tr>
                                <th className="p-4">Reference</th>
                                <th className="p-4">Borrower Name</th>
                                <th className="p-4 text-right">Gross Amount</th>
                                <th className="p-4">Billed Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {receivables.map(loan => (
                                <tr key={loan.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-500">{loan.loanReference}</td>
                                    <td className="p-4 font-bold text-slate-800">{loan.memberName}</td>
                                    <td className="p-4 text-right font-black text-emerald-600">₱{loan.gross.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                    <td className="p-4 text-xs text-slate-500">{loan.billedAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminSidebarLayout>
    );
}
