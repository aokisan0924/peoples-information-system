import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Search, User, FileText, CheckCircle2, Clock, AlertCircle, Loader2, Receipt, Lock } from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

export default function LoanCollection() {
    // ─── SEARCH & DATA STATE ───
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    
    const [loans, setLoans] = useState([]);
    const [activeLoan, setActiveLoan] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // ─── FORM POSTING STATE ───
    const [targetInstallment, setTargetInstallment] = useState(null);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatCurrency = (amount) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

    // ─── EFFECTS ───
    useEffect(() => {
        if (searchQuery.trim().length < 2) return setSearchResults([]);
        
        const delayDebounce = setTimeout(async () => {
            try {
                const { data } = await axios.get(route('admin.accounting.loans.search'), { params: { search: searchQuery } });
                setSearchResults(data);
            } catch (e) {
                toast.error("Error searching loans.");
            }
        }, 300);
        
        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    // ─── ACTIONS ───
    const handleSelectLoan = async (result) => {
        setIsLoading(true);
        setSelectedMember({ id: result.memberId, firstName: result.firstName, lastName: result.lastName });
        setSearchQuery('');
        setSearchResults([]);
        
        try {
            // Pass BOTH the member ID and the specifically searched Loan ID
            const { data } = await axios.get(route('admin.accounting.loans.member-details', { 
                id: result.memberId, 
                loanId: result.loanId 
            }));
            
            setLoans(data.loans);
            setActiveLoan(data.activeLoan);
            setSchedule(data.schedule);
            
            // Auto-select the next available unpaid or overdue row immediately!
            const nextUnpaid = data.schedule.find(item => item.status !== 'paid');
            setTargetInstallment(nextUnpaid || null);
            setReferenceNumber('');

        } catch (e) {
            toast.error("Failed to recover member's loan schedule.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoanSwitch = async (e) => {
        const switchLoanId = parseInt(e.target.value, 10);
        setIsLoading(true);
        try {
            const { data } = await axios.get(route('admin.accounting.loans.member-details', { 
                id: selectedMember.id, 
                loanId: switchLoanId 
            }));
            setLoans(data.loans);
            setActiveLoan(data.activeLoan);
            setSchedule(data.schedule);
            
            const nextUnpaid = data.schedule.find(item => item.status !== 'paid');
            setTargetInstallment(nextUnpaid || null);
            setReferenceNumber('');
        } catch (e) {
            toast.error("Failed to switch loan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostPayment = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const exactAmount = targetInstallment.amountDue;
        
        try {
            const { data } = await axios.post(route('admin.accounting.loans.post-amortization'), {
                loanId: activeLoan.id,
                installmentNumber: targetInstallment.installmentNumber,
                amountPaid: exactAmount, // Automatically send the exact amount
                referenceNumber: referenceNumber,
            });

            if (data.success) {
                toast.success(data.message);
                
                // Instantly turn the row green in the local React state!
                setSchedule(prev => {
                    const updatedSchedule = prev.map(item => 
                        item.installmentNumber === targetInstallment.installmentNumber 
                        ? { ...item, status: 'paid', amountPaid: exactAmount, referenceNumber: referenceNumber } : item
                    );

                    // Automatically advance the terminal to the NEXT unpaid installment
                    const nextUnpaid = updatedSchedule.find(item => item.status !== 'paid');
                    setTargetInstallment(nextUnpaid || null);

                    return updatedSchedule;
                });
                
                setReferenceNumber('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred while posting.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminSidebarLayout>
            <Head title="Loan Collections" />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen bg-slate-50 dark:bg-[#080e0c] transition-colors duration-300">
                
                {/* ─── LIVE LOAN LOOKUP INPUT ─── */}
                <div className="bg-white dark:bg-[#0f1f1a] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative z-30 shadow-sm">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 pl-1">
                        Find Active Loan Account
                    </label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input 
                            type="text" 
                            placeholder="Search by member name, ID, or LOAN Reference Number..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute left-5 right-5 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                            {searchResults.map(result => (
                                <button 
                                    key={result.loanId} 
                                    onClick={() => handleSelectLoan(result)} 
                                    className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 grid place-items-center shrink-0">
                                        <FileText size={14} className="text-indigo-600 dark:text-indigo-400" /> 
                                    </div>
                                    <div>
                                        <div className="text-sm text-slate-900 dark:text-white font-bold">
                                            {result.firstName} {result.lastName} <span className="text-slate-400 font-normal ml-1">({result.loanType})</span>
                                        </div>
                                        <div className="text-xs font-mono text-indigo-500 dark:text-indigo-400 mt-0.5">
                                            Ref: {result.loanReference} • ₱{parseFloat(result.loanAmount).toLocaleString('en-US')}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── WORKSPACE AREA ─── */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving Loan Profile...</span>
                    </div>
                ) : selectedMember && activeLoan ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start relative z-10">
                        
                        {/* ─── SCHEDULE MATRIX TERM TABLE ─── */}
                        <div className="lg:col-span-2 bg-white dark:bg-[#0f1f1a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col max-h-[75vh]">
                             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-[#13231d] shrink-0">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        {selectedMember.firstName}'s Amortization Timeline
                                    </h3>
                                    
                                    {/* DROPDOWN TO SWITCH BETWEEN MULTIPLE LOANS */}
                                    {loans.length > 1 ? (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-slate-500 font-medium">Select Active Loan:</span>
                                            <select 
                                                value={activeLoan.id} 
                                                onChange={handleLoanSwitch}
                                                className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-1 rounded border-none outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {loans.map(l => (
                                                    <option key={l.id} value={l.id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                                                        {l.loanReference} - ₱{parseFloat(l.loanAmount).toLocaleString('en-US')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 font-medium mt-1">
                                            Ref: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{activeLoan.loanReference}</span> • Principal: ₱{parseFloat(activeLoan.loanAmount).toLocaleString('en-US')}
                                        </p>
                                    )}
                                </div>
                                <div className="h-10 w-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 grid place-items-center shadow-sm">
                                    <FileText size={18} className="text-slate-400" />
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3.5">Term</th>
                                            <th className="px-6 py-3.5">Due Date</th>
                                            <th className="px-6 py-3.5 text-right">Amount Due</th>
                                            <th className="px-6 py-3.5 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                                        {schedule.map(row => {
                                            let rowColor = "text-slate-700 dark:text-slate-300";
                                            let badgeStyle = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                                            
                                            // Conditional Status Highlighting
                                            if (row.status === 'paid') {
                                                rowColor = "bg-emerald-500/5 dark:bg-emerald-500/[0.03] text-emerald-900 dark:text-emerald-300 font-semibold";
                                                badgeStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400";
                                            } else if (row.status === 'overdue') {
                                                rowColor = "bg-rose-500/5 dark:bg-rose-500/[0.03] text-rose-900 dark:text-rose-300 font-semibold";
                                                badgeStyle = "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400";
                                            }

                                            const isSelected = targetInstallment?.installmentNumber === row.installmentNumber;

                                            return (
                                                <tr 
                                                    key={row.installmentNumber} 
                                                    onClick={() => row.status !== 'paid' && setTargetInstallment(row)} 
                                                    className={`transition-colors duration-200 cursor-pointer 
                                                        ${rowColor} 
                                                        ${row.status !== 'paid' ? 'hover:bg-slate-100 dark:hover:bg-slate-800/40' : ''} 
                                                        ${isSelected ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                                    `}
                                                >
                                                    <td className="px-6 py-4 font-bold">
                                                        {row.installmentNumber} <span className="text-slate-400 font-normal">/ {activeLoan.numberOfPayments}</span>
                                                    </td>
                                                    <td className="px-6 py-4 font-sans text-slate-500 dark:text-slate-400">{row.dueDate}</td>
                                                    <td className="px-6 py-4 text-right font-black text-sm">{formatCurrency(row.amountDue)}</td>
                                                    <td className="px-6 py-4 text-center font-sans">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeStyle}`}>
                                                            {row.status === 'paid' && <CheckCircle2 size={12}/>}
                                                            {row.status === 'overdue' && <AlertCircle size={12}/>}
                                                            {row.status === 'unpaid' && <Clock size={12}/>}
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ─── LOCKED COLLECTION INPUT PANEL ─── */}
                        <div className="bg-white dark:bg-[#0f1f1a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                            <div className="border-b pb-4 border-slate-100 dark:border-slate-800">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                    <Receipt size={14}/> Post Remittance
                                </h3>
                            </div>
                            
                            {targetInstallment ? (
                                <form onSubmit={handlePostPayment} className="space-y-5">
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl">
                                        <div className="text-slate-700 dark:text-indigo-300 text-xs font-semibold mb-1">Target Installment:</div>
                                        <div className="font-mono font-black text-xl text-indigo-600 dark:text-indigo-400">
                                            {targetInstallment.installmentNumber} <span className="text-sm font-bold text-indigo-400 dark:text-indigo-600">/ {activeLoan.numberOfPayments}</span>
                                        </div>
                                    </div>

                                    {/* EXACT AMOUNT FIELD (LOCKED) */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                            Exact Amount Payable <Lock size={10} className="text-slate-400" />
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold dark:text-slate-400">₱</span>
                                            <input 
                                                type="text" 
                                                readOnly
                                                value={parseFloat(targetInstallment.amountDue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                                                className="w-full text-sm font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-3 pl-8 pr-4 outline-none cursor-not-allowed select-none" 
                                            />
                                        </div>
                                    </div>

                                    {/* REFERENCE FIELD */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Reference / OR Number</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={referenceNumber} 
                                            onChange={e => setReferenceNumber(e.target.value)} 
                                            className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-shadow placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                                            placeholder="Enter Receipt Ref..." 
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || !targetInstallment} 
                                        className="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
                                        Confirm Payment
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-16 px-4 text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-500/20">
                                    <CheckCircle2 className="mx-auto h-8 w-8 mb-3 opacity-80" />
                                    This loan is fully settled or no active installments are pending.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#0f1f1a] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <Search className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium text-center max-w-sm">
                            Search and select an active loan profile using the input field above to begin posting remittances.
                        </p>
                    </div>
                )}
            </div>
        </AdminSidebarLayout>
    );
}