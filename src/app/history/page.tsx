/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, Printer, Search, Calendar, 
  ArrowUpRight, Loader2, Hash, CreditCard, Banknote 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

// --- SHARED THERMAL RECEIPT COMPONENT ---
const ThermalReceipt = ({ order, settings }: any) => {
  const upiUrl = `upi://pay?pa=${settings?.upi_id}&pn=${encodeURIComponent(settings?.shop_name || 'Store')}&am=${order.grand_total}&cu=INR`;
  
  return (
    <div className="w-[76mm] mx-auto p-2 bg-white text-black font-mono leading-tight">
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1 italic">Duplicate Bill</p>
        <h1 className="text-5xl font-black mb-2">#{order.token_number}</h1>
        <h2 className="text-xl font-black uppercase tracking-tighter">{settings?.shop_name || 'PAYTIMATE'}</h2>
      </div>

      <div className="flex justify-between mb-4 text-[10px] font-black border-b border-black pb-2 uppercase">
        <span>{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="bg-black text-white px-2 rounded">{order.table_number}</span>
      </div>

      <div className="border-t-2 border-black pt-2 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-black text-xs uppercase">Total Paid ({order.payment_method})</span>
          <span className="text-3xl font-black">₹{order.grand_total.toFixed(0)}</span>
        </div>
      </div>

      {order.payment_method === 'UPI' && (
        <div className="text-center py-4 border-t border-dashed border-gray-400">
          <div className="inline-block p-1 bg-white border border-black">
            <QRCode value={upiUrl} size={100} level="M" />
          </div>
        </div>
      )}
      <p className="text-center text-[8px] font-black uppercase mt-10 opacity-40 tracking-[0.4em]">Powered by Paytimate</p>
    </div>
  );
};

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [ordersRes, settingsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('shop_settings').select('*').eq('id', user.id).maybeSingle()
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleReprint = (order: any) => {
    setPrintData(order);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);
  };

  const filteredOrders = orders.filter(o => 
    o.token_number?.toString().includes(searchQuery) || 
    o.table_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      
      {/* HEADER */}
      <header className="no-print p-6 lg:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 bg-slate-950/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="p-3 bg-slate-900 rounded-2xl text-slate-400 hover:text-white hover:bg-red-800 transition-all shadow-lg"
          >
            <ChevronLeft size={20}/>
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Sales Logs</h1>
            <p className="text-[10px] font-black text-red-700 tracking-[0.3em] uppercase">Transaction History</p>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search Token or Table..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border-none pl-12 pr-4 py-4 rounded-2xl text-sm font-bold focus:ring-1 focus:ring-red-900"
          />
        </div>
      </header>

      {/* TABLE SECTION */}
      <main className="no-print flex-1 p-4 lg:p-12 overflow-x-auto">
        {loading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-red-800" /></div>
        ) : (
          <div className="bg-slate-900/30 rounded-[2.5rem] border border-slate-900 overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Token</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Reference</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Payment</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-red-900/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-black text-red-600 border border-slate-800 group-hover:border-red-900">
                          #{order.token_number}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-slate-600"/>
                        <span className="font-bold text-sm uppercase">{order.table_number}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${order.payment_method === 'UPI' ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {order.payment_method === 'UPI' ? <CreditCard size={14}/> : <Banknote size={14}/>}
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-lg font-black text-white italic">₹{order.grand_total}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleReprint(order)}
                        className="p-3 bg-slate-900 text-slate-400 rounded-xl hover:bg-red-800 hover:text-white transition-all shadow-md active:scale-95"
                        title="Reprint Receipt"
                      >
                        <Printer size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="py-20 text-center text-slate-600 font-bold uppercase text-xs tracking-widest italic">No transactions found</div>
            )}
          </div>
        )}
      </main>

      {/* HIDDEN PRINT AREA */}
      {printData && (
        <div id="receipt-print-area" className="hidden print:block fixed inset-0 z-[999] bg-white text-black">
          <ThermalReceipt order={printData} settings={settings} />
        </div>
      )}

      {/* GLOBAL STYLES FOR THERMAL PRINTER */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; height: 0; padding: 0; margin: 0; }
          #receipt-print-area, #receipt-print-area * { visibility: visible; height: auto; }
          #receipt-print-area { position: absolute; left: 0; top: 0; width: 76mm; display: block !important; background: white; }
          @page { size: 80mm auto; margin: 0; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}