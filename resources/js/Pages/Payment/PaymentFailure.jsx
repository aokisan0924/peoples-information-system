import { AlertTriangle } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function PaymentFailure() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
                <AlertTriangle className="mx-auto text-red-600" size={64} />
                <h2 className="text-2xl font-bold text-gray-800 mt-4">Payment Failed</h2>
                <p className="text-gray-600 mt-2">
                Unfortunately, your payment did not go through.
                </p>

                <div className="mt-6 border-t pt-4">
                <p className="text-sm text-gray-500">Please try again or contact support.</p>
                <Link
                    href="/"
                    className="inline-block mt-6 bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-all"
                >
                    Go Back Home
                </Link>
                </div>
            </div>
        </div>
    );
}
