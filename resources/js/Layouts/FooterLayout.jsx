import { Mail, MapPin, Phone } from 'lucide-react';

export default function ClientFooterLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                {children}
            </main>

        <footer className="bg-gray-800 text-white py-10 mt-10">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                {/* Main Office */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Main Office</h2>
                    <div className="flex items-start gap-2 mb-2">
                        <MapPin size={16} className="mt-1" aria-hidden="true" />
                        <address className="not-italic">
                            Stall #2, Principe Building,<br />
                            Maharlika Highway, Upi, Gamu, Isabela, 3301
                        </address>
                    </div>
                </div>

                {/* Satellite Office */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Satellite Office</h2>
                    <div className="flex items-start gap-2 mb-2">
                        <MapPin size={16} className="mt-1" aria-hidden="true" />
                        <address className="not-italic">
                            20e 2nd Camarilla St.,<br />
                            Brgy. San Roque, Cubao, Quezon City 1109
                        </address>
                    </div>
                </div>

                {/* Contact Information */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Contact Us</h2>
                    <div className="flex items-center gap-2 mb-2">
                        <Phone size={16} aria-hidden="true" />
                        <a href="tel:09171234567" className="hover:underline">
                            (078) 123-4567 / 0917-123-4567
                        </a>
                    </div>
                        <div className="flex items-center gap-2">
                            <Mail size={16} aria-hidden="true" />
                            <a href="mailto:info@pmultipurposecoop.org" className="hover:underline">
                                info@pmultipurposecoop.org
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-8 pt-4 text-center text-gray-400 text-xs">
                © {new Date().getFullYear()} People's Multi-Purpose Cooperative. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
