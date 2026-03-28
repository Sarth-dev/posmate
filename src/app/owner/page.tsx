/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, BarChart3, TrendingUp, Calendar, Download, 
  Trash2, CreditCard, Banknote, IndianRupee, RefreshCw,
  ShieldCheck, Lock, KeyRound, Eye, EyeOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OwnerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // --- SECURITY STATES ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const OWNER_PIN = "1234"; // 👈 Change this to your desired secret code

  useEffect(() => {
    fetchOwnerData();
  }, [dateRange]);

  async function fetchOwnerData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', `${dateRange.start}T00:00:00`)
      .lte('created_at', `${dateRange.end}T23:59:59`)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  }

  // --- CSV EXPORT LOGIC ---
  const downloadCSV = () => {
    const headers = ["Date", "Token", "Table", "Method", "Total"];
    const rows = orders.map(o => [
      new Date(o.created_at).toLocaleDateString(),
      `#${o.token_number}`,
      o.table_number,
      o.payment_method,
      o.grand_total
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales_Report_${dateRange.start}.csv`;
    a.click();
  };

  const stats = useMemo(() => {
    const total = orders.reduce((acc, o) => acc + (o.grand_total || 0), 0);
    const cash = orders.filter(o => o.payment_method === 'Cash').reduce((acc, o) => acc + (o.grand_total || 0), 0);
    const upi = orders.filter(o => o.payment_method === 'UPI').reduce((acc, o) => acc + (o.grand_total || 0), 0);
    return { total, cash, upi, count: orders.length };
  }, [orders]);

  // --- ACCESS DENIED / PIN SCREEN ---
  if (!isUnlocked) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/30">
            <Lock size={32} className="text-red-600" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white">Owner Security</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase mt-2 tracking-widest">Enter Master PIN to View Sales</p>
          
          <div className="mt-8 space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="password" 
                maxLength={4}
                placeholder="• • • •"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if(e.target.value === OWNER_PIN) setIsUnlocked(true);
                }}
                className="w-full bg-slate-950 border border-slate-800 py-5 rounded-2xl text-center text-2xl tracking-[1em] font-black text-red-600 focus:border-red-900 transition-all outline-none"
              />
            </div>
            <p className="text-[9px] text-slate-600 font-bold uppercase">Authorized Access Only</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="p-6 lg:px-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <button onClick={() => router.push('/dashboard')} className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-red-600 transition-all border border-slate-800 shadow-lg">
            <ChevronLeft size={20}/>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black uppercase tracking-widest text-white">Master Analytics</h1>
              <ShieldCheck size={16} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mt-1">Full Terminal Oversight</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
            <Calendar size={14} className="text-red-700 ml-2" />
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent border-none text-[10px] font-black uppercase text-slate-300 outline-none" />
            <div className="w-3 h-[1px] bg-slate-700" />
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent border-none text-[10px] font-black uppercase text-slate-300 outline-none" />
          </div>

          <button onClick={downloadCSV} className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-900/10">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto no-scrollbar">
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Revenue" value={`₹${stats.total.toFixed(0)}`} icon={<IndianRupee className="text-emerald-500" />} subtitle={`${stats.count} Bills Generated`} />
          <StatCard label="Cash" value={`₹${stats.cash.toFixed(0)}`} icon={<Banknote className="text-orange-500" />} subtitle="Physical Collection" />
          <StatCard label="UPI" value={`₹${stats.upi.toFixed(0)}`} icon={<CreditCard className="text-blue-500" />} subtitle="Digital Settlement" />
        </div>

        {/* DATA TABLE */}
        <div className="bg-slate-900/30 rounded-[2.5rem] border border-slate-900 overflow-hidden shadow-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Date & Time</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Token</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Payment</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-red-900/5 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white uppercase">{new Date(o.created_at).toLocaleDateString()}</span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase">{new Date(o.created_at).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-xs font-black text-red-600 italic">#{o.token_number}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${o.payment_method === 'UPI' ? 'border-blue-900/50 text-blue-400' : 'border-orange-900/50 text-orange-400'}`}>
                      {o.payment_method}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-white italic">₹{o.grand_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, subtitle }: any) {
  return (
    <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-900 group shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-slate-400">{icon}</div>
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
      </div>
      <h2 className="text-3xl font-black text-white tracking-tighter">{value}</h2>
      <p className="text-[10px] font-bold text-slate-500 uppercase italic mt-1">{subtitle}</p>
    </div>
  );
}