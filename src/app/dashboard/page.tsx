/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Minus, Loader2, Printer, ShoppingBag, X, Search, LogOut, 
  LayoutDashboard, ClipboardList, Settings, Zap, ReceiptText, Trash2, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

// --- 🎟️ DUAL-ZONE PRINT (BILL + KITCHEN SLIP) ---
const PrintReceipt = ({ order, cart, settings }: any) => {
  return (
    <div className="receipt-container">
      {/* SECTION 1: CUSTOMER BILL */}
      <div className="customer-bill">
        <div className="token-header">
          <span className="token-label">TOKEN</span>
          <h1 className="token-number">#{order.token_number}</h1>
        </div>
        <div className="shop-info">
          <p className="shop-name">{settings?.shop_name || 'PAYTIMATE'}</p>
          <p className="order-meta">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} | {order.table_number}</p>
        </div>
        <div className="item-divider" />
        <div className="items-list">
          {cart.map((item: any, idx: number) => (
            <div key={idx} className="receipt-row">
              <span className="qty-name">{item.quantity}x {item.name}</span>
              <span className="price">₹{(item.price_exclusive_tax * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>
        <div className="total-section">
          <span className="total-label">TOTAL PAID</span>
          <span className="total-amount">₹{order.grand_total.toFixed(0)}</span>
        </div>
        {order.payment_method === 'UPI' && (
          <div className="qr-box">
            <QRCode value={`upi://pay?pa=${settings?.upi_id}&am=${order.grand_total}`} size={60} />
            <p className="qr-text">PAID VIA UPI</p>
          </div>
        )}
      </div>

      {/* ✂️ CUTTING LINE */}
      <div className="cutting-line">
        <span>✂ CUT HERE FOR KITCHEN ✂</span>
      </div>

      {/* SECTION 2: KITCHEN ORDER TICKET (KOT) */}
      <div className="kitchen-slip">
        <div className="kot-header">
          <h2 className="kot-title">KITCHEN ORDER</h2>
          <p className="kot-meta">{order.table_number} | TOKEN #{order.token_number}</p>
        </div>
        <div className="kot-items">
          {cart.map((item: any, idx: number) => (
            <div key={idx} className="kot-row">
              <span className="kot-qty">{item.quantity}</span>
              <span className="kot-name">{item.name}</span>
            </div>
          ))}
        </div>
        <p className="kot-footer">Time: {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI'>('Cash');
  const [selectedTable, setSelectedTable] = useState('01');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/auth');
      setUser(user);
      const [p, s] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true),
        supabase.from('shop_settings').select('*').eq('id', user.id).maybeSingle()
      ]);
      setProducts(p.data || []);
      setSettings(s.data);
    }
    fetchData();
  }, [router]);

  const totals = useMemo(() => {
    return cart.reduce((acc, item) => {
      const sub = item.price_exclusive_tax * item.quantity;
      const tax = sub * ((item.tax_rate_percent ?? 18) / 100);
      return { 
        sub_total: acc.sub_total + sub, 
        tax_total: acc.tax_total + tax,
        grand_total: acc.grand_total + sub + tax 
      };
    }, { sub_total: 0, tax_total: 0, grand_total: 0 });
  }, [cart]);

  const handleCheckout = async () => {
    if (!cart.length || loading) return;
    setLoading(true);
    try {
      const token = (settings?.last_token_number || 100) + 1;
      const { data: order, error } = await supabase.from('orders').insert([{
        shop_id: user.id, 
        sub_total: totals.sub_total, 
        tax_total: totals.tax_total, 
        grand_total: totals.grand_total,
        payment_method: paymentMethod, 
        token_number: token,
        table_number: `Table ${selectedTable}`
      }]).select().single();

      if (error) throw error;
      await supabase.from('shop_settings').update({ last_token_number: token }).eq('id', user.id);

      setPrintData({ order, settings, cart: [...cart] });
      setTimeout(() => { window.print(); setPrintData(null); setCart([]); setLoading(false); }, 800);
    } catch (e: any) { alert(e.message); setLoading(false); }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#050505] text-slate-200 overflow-hidden font-sans">
      
      {/* 🚀 UNIVERSAL PERSISTENT SIDEBAR (Now visible on all devices) */}
      <aside className="no-print flex flex-col w-16 lg:w-24 items-center py-4 lg:py-8 gap-6 lg:gap-8 bg-[#0a0a0a] border-r border-white/5 z-[110]">
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
          <Zap size={20} className="lg:hidden" fill="white" />
          <Zap size={24} className="hidden lg:block" fill="white" />
        </div>
        <nav className="flex flex-col gap-4">
            <button className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white/5 text-red-500 border border-white/10"><LayoutDashboard size={20}/></button>
            <button onClick={() => router.push('/history')} className="p-3 lg:p-4 rounded-xl lg:rounded-2xl text-slate-500 hover:bg-white/5 transition-all"><ClipboardList size={20}/></button>
            <button onClick={() => router.push('/settings')} className="p-3 lg:p-4 rounded-xl lg:rounded-2xl text-slate-500 hover:bg-white/5 transition-all"><Settings size={20}/></button>
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => router.replace('/auth'))} className="mt-auto p-4 text-slate-600 hover:text-red-500 transition-colors"><LogOut size={20}/></button>
      </aside>

      <main className="no-print flex-1 flex flex-col relative min-w-0">
        {/* TOP BAR */}
        <header className="h-20 flex items-center justify-between px-4 lg:px-8 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="hidden xs:block">
              <h2 className="text-[8px] lg:text-[10px] font-black text-red-600 uppercase tracking-widest">Console</h2>
              <h1 className="text-sm lg:text-lg font-bold">Terminal</h1>
            </div>
            
            {/* 📍 TABLE SELECTOR */}
            <div className="relative">
              <button 
                onClick={() => setIsTableOpen(!isTableOpen)}
                className="flex items-center gap-1.5 lg:gap-2 bg-white/5 border border-white/10 px-3 lg:px-4 py-2 rounded-xl hover:bg-white/10 transition-all text-[10px] lg:text-xs font-black"
              >
                T{selectedTable} <ChevronDown size={14} className={`transition-transform ${isTableOpen ? 'rotate-180' : ''}`} />
              </button>
              {isTableOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 lg:w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 grid grid-cols-3 gap-1 shadow-2xl z-[120] backdrop-blur-2xl">
                  {['01', '02', '03', '04', '05', '06', '07', '08', '09'].map(num => (
                    <button 
                      key={num}
                      onClick={() => { setSelectedTable(num); setIsTableOpen(false); }}
                      className={`py-2 rounded-lg text-[10px] font-black transition-all ${selectedTable === num ? 'bg-red-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
             <div className="relative group hidden sm:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-white/5 border border-white/10 pl-10 lg:pl-12 pr-4 py-2 rounded-full text-xs outline-none focus:border-red-500/50 w-32 lg:w-64 transition-all"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <button onClick={() => setIsCartOpen(true)} className="lg:hidden p-3 bg-red-600 rounded-full shadow-lg relative">
               <ShoppingBag size={18}/>
               {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
             </button>
          </div>
        </header>

        {/* PRODUCT GRID */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-6 content-start no-scrollbar">
          {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
            <div 
              key={p.id} 
              onClick={() => setCart(prev => {
                const ex = prev.find(i => i.id === p.id);
                return ex ? prev.map(i => i.id === p.id ? {...i, quantity: i.quantity+1} : i) : [...prev, {...p, quantity: 1}]
              })}
              className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl lg:rounded-[2rem] p-3 lg:p-4 transition-all hover:border-red-500/30 hover:-translate-y-1 active:scale-95 cursor-pointer"
            >
              <div className="aspect-square rounded-xl lg:rounded-2xl bg-white/5 flex items-center justify-center text-2xl lg:text-4xl group-hover:scale-110 transition-transform duration-500">
                {p.category === 'Drinks' ? '🥤' : '🍔'}
              </div>
              <div className="mt-2 lg:mt-4">
                <p className="text-[7px] lg:text-[10px] font-black text-red-500 uppercase tracking-widest">{p.category}</p>
                <h3 className="text-[10px] lg:text-sm font-bold mt-0.5 text-white truncate uppercase">{p.name}</h3>
                <div className="flex justify-between items-center mt-1.5 lg:mt-3">
                  <span className="text-xs lg:text-lg font-black text-white">₹{p.price_exclusive_tax}</span>
                  <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-600 transition-all"><Plus size={12} /></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 💳 SIDE CART */}
      <aside className={`no-print fixed lg:relative inset-y-0 right-0 w-full lg:w-[420px] bg-[#0a0a0a] border-l border-white/5 flex flex-col z-[150] transition-transform duration-500 ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 lg:p-8 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
             <ReceiptText className="text-red-500" size={24}/>
             <h2 className="text-lg font-bold tracking-tight uppercase">Cart</h2>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-full"><X/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 no-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="bg-white/[0.03] border border-white/5 p-3 lg:p-4 rounded-2xl flex items-center gap-3 lg:gap-4 group">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white uppercase truncate">{item.name}</p>
                <p className="text-xs font-black text-red-500">₹{item.price_exclusive_tax * item.quantity}</p>
              </div>
              <div className="flex items-center gap-2 lg:gap-3 bg-black/40 p-1 rounded-full border border-white/5">
                <button onClick={() => setCart(c => c.map(i => i.id === item.id ? {...i, quantity: Math.max(1, i.quantity-1)} : i))} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10"><Minus size={10}/></button>
                <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                <button onClick={() => setCart(c => c.map(i => i.id === item.id ? {...i, quantity: i.quantity+1} : i))} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10"><Plus size={10}/></button>
              </div>
              <button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="p-2 text-slate-600 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>

        <div className="p-6 lg:p-8 bg-[#080808] border-t border-white/5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</span>
            <span className="text-3xl lg:text-4xl font-black text-white tracking-tighter">₹{totals.grand_total.toFixed(0)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
             <button onClick={() => setPaymentMethod('Cash')} className={`py-4 rounded-xl text-[10px] font-black tracking-widest border transition-all ${paymentMethod === 'Cash' ? 'bg-white text-black border-white shadow-xl shadow-white/5' : 'border-white/10 text-slate-500 hover:bg-white/5'}`}>CASH</button>
             <button onClick={() => setPaymentMethod('UPI')} className={`py-4 rounded-xl text-[10px] font-black tracking-widest border transition-all ${paymentMethod === 'UPI' ? 'bg-red-600 text-white border-red-600 shadow-xl shadow-red-900/20' : 'border-white/10 text-slate-500 hover:bg-white/5'}`}>UPI QR</button>
          </div>

          <button onClick={handleCheckout} disabled={!cart.length || loading} className="w-full relative overflow-hidden bg-red-600 hover:bg-red-500 disabled:opacity-30 py-5 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] transition-all group active:scale-95 shadow-lg shadow-red-900/20">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : <><Printer size={18} className="inline mr-2"/> Execute & Print</>}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
          </button>
        </div>
      </aside>

      {/* 🖨️ PRINT SECTION */}
      {printData && (
        <div id="print-root">
          <PrintReceipt order={printData.order} cart={printData.cart} settings={printData.settings} />
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @media print {
          body * { visibility: hidden !important; }
          #print-root, #print-root * { visibility: visible !important; display: block !important; }
          #print-root { position: fixed; left: 0; top: 0; width: 72mm; background: white; padding: 0; }
          @page { size: 80mm auto; margin: 0; }
        }

        .receipt-container { width: 72mm; font-family: monospace; color: black; background: white; padding: 2mm; }
        .token-header { text-align: center; border-bottom: 2px solid black; padding-bottom: 1mm; margin-bottom: 1mm; }
        .token-number { font-size: 40px; margin: 0; font-weight: 900; }
        .shop-name { font-size: 14px; font-weight: 900; text-align: center; margin: 0; text-transform: uppercase; }
        .order-meta { font-size: 10px; text-align: center; margin: 0; }
        .item-divider { border-bottom: 1px dashed #000; margin: 2mm 0; }
        .receipt-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 1mm; }
        .total-section { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid black; padding-top: 1mm; margin-top: 1mm; }
        .total-amount { font-size: 20px; font-weight: 900; }
        .qr-box { text-align: center; margin-top: 2mm; }
        .qr-text { font-size: 8px; font-weight: bold; }

        .cutting-line { border-top: 2px dashed black; text-align: center; margin: 6mm 0; position: relative; }
        .cutting-line span { font-size: 8px; background: white; padding: 0 2mm; position: absolute; top: -6px; left: 50%; transform: translateX(-50%); font-weight: bold; }

        .kitchen-slip { border: 2px solid black; padding: 2mm; }
        .kot-title { font-size: 16px; font-weight: 900; text-align: center; border-bottom: 1px solid black; margin-bottom: 2mm; }
        .kot-meta { font-size: 12px; font-weight: 900; text-align: center; }
        .kot-row { display: flex; gap: 4mm; font-size: 18px; font-weight: 900; border-bottom: 1px solid #eee; padding: 1mm 0; }
        .kot-qty { background: black; color: white; padding: 0 2mm; border-radius: 4px; }
        .kot-footer { font-size: 10px; text-align: right; margin-top: 2mm; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        @media (max-width: 400px) { .xs\:block { display: none; } }
      `}</style>
    </div>
  );
}