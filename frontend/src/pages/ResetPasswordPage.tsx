import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth'; // Đã thay đổi: Import hàm từ auth.ts

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const passwordRef = useRef<HTMLInputElement>(null);

    const token = searchParams.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => { passwordRef.current?.focus(); }, []);

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-sm text-center">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
                        <p className="text-sm font-medium text-red-700">Invalid or missing reset token.</p>
                        <Link to="/forgot-password" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
                            Request a new reset link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    function validate() {
        const errs: Record<string, string> = {};
        if (!password) errs.password = 'Password is required';
        else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
        if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
        else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
        return errs;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError('');
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        setLoading(true);
        try {
            // Đã thay đổi: Truyền đúng biến 'newPassword' như Backend yêu cầu
            await resetPassword({ token, newPassword: password });

            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (error: any) {
            setServerError(error.message || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Set new password</h1>
                    <p className="mt-1 text-sm text-slate-500">Your new password must be at least 6 characters</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    {success ? (
                        <div className="space-y-4 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6 text-green-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Password reset!</h2>
                            <p className="text-sm text-slate-500">
                                Your password has been updated. Redirecting you to sign in…
                            </p>
                            <Link to="/login" className="block text-sm font-medium text-blue-600 hover:text-blue-700">
                                Go to sign in now
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            {serverError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {serverError}{' '}
                                    {serverError.toLowerCase().includes('expired') && (
                                        <Link to="/forgot-password" className="font-medium underline">
                                            Request a new link
                                        </Link>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        ref={passwordRef}
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((er) => ({ ...er, password: '' })); }}
                                        placeholder="Min. 6 characters"
                                        autoComplete="new-password"
                                        className={[
                                            'w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors pr-10',
                                            errors.password
                                                ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
                                                : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20',
                                        ].join(' ')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Confirm New Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((er) => ({ ...er, confirmPassword: '' })); }}
                                    placeholder="Re-enter new password"
                                    autoComplete="new-password"
                                    className={[
                                        'w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors',
                                        errors.confirmPassword
                                            ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
                                            : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20',
                                    ].join(' ')}
                                />
                                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Resetting…' : 'Reset password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}