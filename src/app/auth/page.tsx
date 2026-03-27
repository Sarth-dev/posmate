/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Loader2, Store, MailCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    // Prevent Hydration Mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Safety Check to prevent ".toLowerCase()" on undefined
        if (!email || !password) {
            setErrorMsg("Please enter both email and password.");
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        // Sanitize input
        const cleanEmail = email.trim().toLowerCase();

        try {
            if (isLogin) {
                // LOGIN
                const { data, error } = await supabase.auth.signInWithPassword({ 
                    email: cleanEmail, 
                    password 
                });

                if (error) throw error;
                
                if (data?.session) {
                    // 2. CRITICAL: Refresh the server-side context so middleware sees the cookie
                    router.refresh();
                    router.replace('/dashboard'); 
                }
            } else {
                // SIGN UP
                const { data, error } = await supabase.auth.signUp({ 
                    email: cleanEmail, 
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    }
                });
                
                if (error) throw error;

                if (data.user) {
                    setIsEmailSent(true);
                }
            }
        } catch (error: any) {
            console.error("Auth Error:", error);
            // Translate common Supabase errors for the user
            if (error.message.includes("Email not confirmed")) {
                setErrorMsg("Please verify your email address before logging in.");
            } else if (error.message.includes("Invalid login credentials")) {
                setErrorMsg("Invalid email or password. Please try again.");
            } else {
                setErrorMsg(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    if (isEmailSent) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center font-sans">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 p-12 flex flex-col items-center border border-slate-100">
                    <div className="bg-emerald-50 p-6 rounded-3xl text-emerald-600 mb-8 animate-bounce">
                        <MailCheck size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Check Your Inbox</h1>
                    <p className="text-slate-500 mt-4 font-medium leading-relaxed">
                        We've sent a magic link to <span className="font-bold text-slate-800">{email}</span>. 
                        Verify it to unlock your dashboard.
                    </p>
                    <button 
                        onClick={() => setIsEmailSent(false)} 
                        className="mt-10 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:text-blue-700"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-10 font-sans">
            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-200 p-8 md:p-12 border border-slate-50 relative overflow-hidden">
                
                {/* Decorative Background Element */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

                <div className="flex flex-col items-center mb-10 relative z-10">
                    <div className="bg-blue-600 p-4 rounded-2xl text-white mb-6 shadow-xl shadow-blue-200">
                        <Store size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                        {isLogin ? 'Paytimate' : 'Join Us'}
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                        {isLogin ? 'Manager Portal' : 'Register Your Business'}
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-xs font-bold leading-tight">{errorMsg}</p>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                            placeholder="owner@cafe.com"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                placeholder="••••••••"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-[#1E293B] text-white py-5 rounded-[1.5rem] font-black text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 hover:bg-slate-800 transition shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 mt-6"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
                        {isLogin ? 'Authorize Access' : 'Initialize Account'}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setErrorMsg(null);
                        }}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors"
                    >
                        {isLogin ? "Need an account? Sign Up" : "Already registered? Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
}