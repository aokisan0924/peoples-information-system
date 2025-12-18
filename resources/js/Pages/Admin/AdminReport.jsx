import React from 'react';
import { Head } from '@inertiajs/react';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';

export default function AdminReport({ auth }) {
    return (
        <>
            <Head title="Dashboard">
                <link rel="icon" href="/images/logo/pis_logo.png" />
            </Head>
            <AdminSidebarLayout auth={auth}>
            <h1 className="text-2xl font-bold text-green-600 mb-4">Reports</h1>
                
            </AdminSidebarLayout>
        </>
    );
}
