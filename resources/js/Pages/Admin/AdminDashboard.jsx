import React from 'react';
import { Head } from '@inertiajs/react';
import { Users, Banknote, Wallet } from 'lucide-react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import CountUp from 'react-countup';

export default function AdminDashboard({ dashboarSummary }) {
    return (
        <>
            <Head title="Dashboard">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout>
            <h1 className="text-2xl font-bold text-green-600 mb-4">Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-green-100 p-6 rounded-xl shadow-sm flex items-center gap-4">
                        <div className="bg-green-100 text-green-600 p-3 rounded-full">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Total Members</div>
                            <div className="text-3xl font-semibold text-gray-800">
                                <CountUp end={dashboarSummary.totalMembers} duration={1.5} separator="," />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-blue-100 p-6 rounded-xl shadow-sm flex items-center gap-4">
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                            <Banknote size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Total Share Capital</div>
                            <div className="text-3xl font-semibold text-gray-800">
                                ₱ <CountUp end={dashboarSummary.totalShareCapital} duration={1.5} separator="," />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-yellow-100 p-6 rounded-xl shadow-sm flex items-center gap-4">
                        <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Revenue</div>
                            <div className="text-3xl font-semibold text-gray-800">
                                ₱ <CountUp end={dashboarSummary.revenue} duration={1.5} separator="," />
                            </div>
                        </div>
                    </div>

                    
                </div>
            </AdminSidebarLayout>
        </>
    );
}
