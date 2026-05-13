import '../css/app.css';
import './bootstrap';
import { Toaster } from "react-hot-toast";

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';


const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <Toaster 
                    position="top-center" 
                    toastOptions={{ 
                        duration: 3500,
                        style: { borderRadius: '100px', padding: '12px 24px', fontSize: '14px', fontWeight: '600' }
                    }} 
                />
                <App {...props} />
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
