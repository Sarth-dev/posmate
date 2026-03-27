/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Calendar, Package, ArrowLeft, 
  BarChart3, Download, Filter, ShoppingBag, 
  Clock, ArrowUpRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [time, setTime] = useState(new Date());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    async function fetchOrders() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data } = await supabase.from('orders')
        .select('*')
        .eq('shop_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    }
    fetchOrders();
    return () => clearInterval(timer);
  }, [router]);

  // --- CSV DOWNLOAD LOGIC ---
  const downloadCSV = () => {
    if (orders.length === 0) return alert("No data available to download");

    // Define CSV Headers
    const headers = ["Order ID", "Date", "Time", "Subtotal", "Tax", "Total Amount", "Payment Method", "Table"];
    
    // Map data to rows
    const rows = orders.map(o => [
      o.id,
      new Date(o.created_at).toLocaleDateString(),
      new Date(o.created_at).toLocaleTimeString(),
      o.sub_total,
      o.tax_total,
      o.grand_total,
      o.payment_method,
      o.table_number
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(","), 
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sales_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- STATS LOGIC ---
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
    const revenue = todayOrders.reduce((acc, o) => acc + o.grand_total, 0);
    const orderCount = todayOrders.length;
    const upiSales = todayOrders.filter(o => o.payment_method?.toLowerCase() === 'upi').length;
    const cashSales = todayOrders.filter(o => o.payment_method?.toLowerCase() === 'cash').length;

    return { revenue, orderCount, upiSales, cashSales, todayOrders };
  }, [orders]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F8FAFC] font-black opacity-20">SYNCING DATA...</div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      
      {/* DESKTOP SIDEBAR RAIL */}
      <aside className="hidden lg:flex w-24 bg-[#1E293B] flex-col items-center py-6 gap-6 border-r border-slate-700/30">
        <div onClick={() => router.push('/')} className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mb-4 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-90 transition-transform">
          <span className="text-white font-black italic text-xl">P</span>
        </div>
        <nav className="flex flex-col gap-4 w-full px-2 text-slate-500">
           <div onClick={() => router.push('/')} className="p-4 cursor-pointer hover:text-white transition-colors"><Package size={22}/></div>
           <div className="p-4 bg-blue-600/10 text-blue-400 rounded-2xl shadow-inner"><BarChart3 size={22}/></div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-white border-b px-6 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 text-slate-400 active:scale-90">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black tracking-tighter text-slate-800">ANALYTICS HUB</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
              <Clock size={14}/> {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {/* FUNCTIONAL DOWNLOAD BUTTON */}
            <button 
              onClick={downloadCSV}
              className="p-4 bg-[#1E293B] text-white rounded-[1.25rem] shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center gap-2"
            >
              <Download size={18} />
              <span className="hidden md:block text-[10px] font-black tracking-widest">EXPORT CSV</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 no-scrollbar">
          
          {/* TOP CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
              label="Today's Total Sale" 
              value={`₹${stats.revenue.toLocaleString()}`} 
              icon={<TrendingUp size={24}/>} 
              color="emerald" 
            />
            <StatCard 
              label="Orders Processed" 
              value={stats.orderCount.toString()} 
              icon={<ShoppingBag size={24}/>} 
              color="blue" 
            />
            <StatCard 
              label="UPI vs Cash" 
              value={`${stats.upiSales} / ${stats.cashSales}`} 
              icon={<Filter size={24}/>} 
              color="orange" 
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* RECENT SALES TABLE */}
            <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest opacity-40">Today's Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                      <th className="px-8 py-5">Timestamp</th>
                      <th className="px-8 py-5">Order #</th>
                      <th className="px-8 py-5">Mode</th>
                      <th className="px-8 py-5 text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.todayOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-5 text-sm font-bold text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-8 py-5 text-sm font-black text-slate-800 tracking-tighter">#{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-8 py-5">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${order.payment_method?.toLowerCase() === 'upi' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                            {order.payment_method}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-900">₹{order.grand_total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SIDE HIGHLIGHTS */}
            <div className="space-y-6">
              <div className="bg-[#1E293B] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-300 relative overflow-hidden">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Insight</p>
                <h4 className="text-xl font-black mb-4 italic leading-tight">Your peak hour today was 1:00 PM - 2:00 PM</h4>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <ArrowUpRight size={16}/> +15% more than average
                </div>
                <div className="absolute -right-8 -bottom-8 opacity-5 rotate-12">
                   <TrendingUp size={160} />
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-6 opacity-40">Payment Statistics</h4>
                <div className="space-y-6">
                  <ProgressRow label="UPI Payments" count={stats.upiSales} total={stats.orderCount} color="bg-emerald-500" />
                  <ProgressRow label="Cash Payments" count={stats.cashSales} total={stats.orderCount} color="bg-orange-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const themes: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${themes[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
    </div>
  );
}

function ProgressRow({ label, count, total, color }: any) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-900">{count} Trx</span>
      </div>
      <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}