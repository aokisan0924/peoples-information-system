import React from "react";
import { Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

export const resourceInputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:[color-scheme:dark]";

export const resourcePanelClass = "overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#101a16]";

export function ResourcePage({ children, className = "" }) {
    return (
        <main className={`min-h-screen bg-slate-50/80 px-4 py-5 text-slate-900 transition-colors sm:px-6 sm:py-7 lg:px-8 dark:bg-[#080e0c] dark:text-white ${className}`}>
            <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">{children}</div>
        </main>
    );
}

export function ResourceHeader({ icon: Icon, eyebrow, title, description, actions, backHref, backLabel = "Back" }) {
    return (
        <header className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-5 py-6 text-white shadow-xl shadow-emerald-950/10 sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div className="min-w-0">
                    {backHref && (
                        <Link href={backHref} className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/15 hover:text-white">
                            <ArrowLeft size={15} /> {backLabel}
                        </Link>
                    )}
                    <div className="flex items-start gap-3 sm:gap-4">
                        {Icon && <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 shadow-inner"><Icon size={22} /></span>}
                        <div className="min-w-0">
                            {eyebrow && <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200/80">{eyebrow}</p>}
                            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
                            {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-emerald-50/70">{description}</p>}
                        </div>
                    </div>
                </div>
                {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
            </div>
        </header>
    );
}

export function ResourceSectionHeader({ title, description, actions }) {
    return (
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200/80 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/[0.03]">
            <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
                {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

export function ResourceEmptyState({ icon: Icon, title, description }) {
    return (
        <div className="grid min-h-56 place-items-center px-6 py-12 text-center">
            <div>
                {Icon && <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/30"><Icon size={22} /></span>}
                <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
                {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
        </div>
    );
}
