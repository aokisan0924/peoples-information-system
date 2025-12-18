import { XCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function PaymentCancel() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
                <XCircle className="mx-auto text-yellow-500" size={64} />
                <h2 className="text-2xl font-bold text-gray-800 mt-4">Payment Cancelled</h2>
                <p className="text-gray-600 mt-2">
                Your payment was cancelled. No charges have been made.
                </p>

                <div className="mt-6 border-t pt-4">
                <p className="text-sm text-gray-500">You can try again anytime.</p>
                <Link
                    href="/"
                    className="inline-block mt-6 bg-yellow-500 text-white px-6 py-2 rounded-xl hover:bg-yellow-600 transition-all"
                >
                    Return to Dashboard
                </Link>
                </div>
            </div>
        </div>
    );
}
