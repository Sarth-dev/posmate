/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2, Store, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim() || !password.trim()) {
            setErrorMsg("Please enter your assigned credentials.");
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        const cleanEmail = email.trim().toLowerCase();

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ 
                email: cleanEmail, 
                password 
            });

            if (error) throw error;
            
            if (data?.session) {
                router.refresh(); 
                router.push('/dashboard'); 
            }
        } catch (error: any) {
            console.error("Auth Error:", error);
            if (error.message.includes("Invalid login credentials")) {
                setErrorMsg("Access Denied: Invalid email or password.");
            } else {
                setErrorMsg(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-10 font-sans">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 p-8 md:p-12 border border-slate-50 relative overflow-hidden">
                
                {/* Visual Glow */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-60"></div>

                <div className="flex flex-col items-center mb-10 relative z-10">
                    <div className="bg-blue-600 p-4 rounded-2xl text-white mb-6 shadow-xl shadow-blue-200">
                        <Store size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                        Paytimate
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-center">
                        Authorized Terminal Access Only
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-xs font-bold leading-tight">{errorMsg}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
                        <input
                            type="email"
                            required
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                            placeholder="owner@cafe.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors p-2"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-[#1E293B] text-white py-5 rounded-[1.5rem] font-black text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                        Enter Dashboard
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Need access? Contact your system provider.
                    </p>
                </div>
            </div>
        </div>
    );
}