import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('member.login.post'), {
            onFinish: () => reset('password'),
        });
    };

    const inputBaseClasses =
        'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

    const buttonPrimaryClasses =
        'w-full inline-flex justify-center items-center rounded-xl bg-emerald-600 text-white text-sm font-semibold py-2.5 shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors';

    return (
        <>
            <Head title="Member Login">
                <link rel="icon" type="image/png" href="/images/logo/pis_logo.png" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-100 flex items-center justify-center px-4 py-6">
                <div className="w-full max-w-5xl bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden grid lg:grid-cols-[1.1fr,1fr]">
                    {/* LEFT SIDE */}
                    <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-white p-7 sm:p-8 flex flex-col justify-between">
                        <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-soft-light bg-[radial-gradient(circle_at_0_0,white_0,transparent_55%),radial-gradient(circle_at_100%_0,white_0,transparent_55%)]" />

                        <div className="relative z-10 space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 text-[11px] font-medium tracking-wide uppercase">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                <span>Member Portal</span>
                            </div>

                            <div>
                                <h1 className="text-2xl sm:text-3xl font-semibold leading-snug">
                                    Welcome back to People&apos;s Multi-Purpose Cooperative
                                </h1>
                                <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 max-w-md">
                                    Access your People&apos;s Information System (PIS) dashboard to
                                    review your share capital, savings deposits, loan status, and more —
                                    all in one secure member portal.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 mt-6 sm:mt-8 space-y-3 text-[11px] sm:text-xs text-emerald-100/90">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[13px]">
                                    🔑
                                </span>
                                <p>
                                    Use the username and password sent to your email and mobile during
                                    registration.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[13px]">
                                    ⚠️
                                </span>
                                <p>Never share your login details with anyone.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[13px]">
                                    🖥️
                                </span>
                                <p>Always log out when using shared or public devices.</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="bg-white">
                        <div className="px-6 sm:px-7 pt-6 pb-7">
                            <div className="mb-4 flex flex-col items-center gap-3 sm:items-start sm:gap-2">
                                <div className="block sm:hidden mb-1">
                                    <img
                                        src="/images/logo/pis_logo.png"
                                        alt="PIS Logo"
                                        className="h-10 w-10 rounded-2xl bg-emerald-50 p-1.5 border border-emerald-100 shadow-inner"
                                    />
                                </div>

                                <div className="text-center sm:text-left space-y-1 w-full">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
                                        Member Login
                                    </p>
                                    <h2 className="mt-1 text-base sm:text-lg font-semibold text-slate-900">
                                        Log in to your PMPC account
                                    </h2>
                                    <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                                        Enter your username and password to access your People&apos;s
                                        Information System (PIS) dashboard.
                                    </p>
                                </div>
                            </div>

                            {status && (
                                <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 text-center">
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                {/* Username */}
                                <div>
                                    <InputLabel
                                        htmlFor="username"
                                        value="Username"
                                        className="text-xs text-slate-700"
                                    />
                                    <TextInput
                                        id="username"
                                        type="text"
                                        name="username"
                                        value={data.username}
                                        className={inputBaseClasses}
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('username', e.target.value)}
                                    />
                                    <InputError
                                        message={errors.username}
                                        className="mt-1 text-xs"
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <InputLabel
                                        htmlFor="password"
                                        value="Password"
                                        className="text-xs text-slate-700"
                                    />
                                    <div className="relative">
                                        <TextInput
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            className={`${inputBaseClasses} pr-10`}
                                            autoComplete="current-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-emerald-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <InputError
                                        message={errors.password}
                                        className="mt-1 text-xs"
                                    />
                                </div>

                                {/* Remember + Forgot */}
                                <div className="flex items-center justify-between gap-3">
                                    <label className="flex items-center gap-2 text-xs text-slate-600">
                                        <Checkbox
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(e) =>
                                                setData('remember', e.target.checked)
                                            }
                                            className="accent-emerald-600"
                                        />
                                        <span>Remember me</span>
                                    </label>

                                    <Link
                                        href={route('member.password.forgot')}
                                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                {/* Submit button */}
                                <div className="pt-2 space-y-2">
                                    <PrimaryButton
                                        className={`${buttonPrimaryClasses} flex items-center gap-2 justify-center`}
                                        disabled={processing}
                                    >
                                        <LogIn size={16} />
                                        <span>Log in</span>
                                    </PrimaryButton>
                                    <p className="text-[11px] text-slate-400 text-center">
                                        For your security, make sure you&apos;re logging in from the
                                        official PMPC website.
                                    </p>
                                </div>
                            </form>

                            <div className="mt-5 border-t border-slate-100 pt-4 text-center">
                                <p className="text-[11px] text-slate-500">
                                    Not yet registered?{' '}
                                    <Link
                                        href={route('member.register')}
                                        className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                    >
                                        Create your PMPC account
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
