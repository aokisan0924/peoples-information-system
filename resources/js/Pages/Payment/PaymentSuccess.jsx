import { CheckCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function PaymentSuccess() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
                <CheckCircle className="mx-auto text-green-600" size={64} />
                <h2 className="text-2xl font-bold text-gray-800 mt-4">Payment Successful</h2>
                <p className="text-gray-600 mt-2">Thank you for your contribution to the cooperative.</p>

                <div className="mt-6 border-t pt-4">
                <p className="text-sm text-gray-500">A confirmation has been sent to your email.</p>
                <Link
                    href="/"
                    className="inline-block mt-6 bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition-all"
                >
                    Back to Dashboard
                </Link>
                </div>
            </div>
        </div>
    );
}
