/* eslint-disable react/jsx-no-undef */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, ClipboardList, Settings, Plus, Minus,
  Loader2, Printer, ShoppingBag, X, Search, LogOut, ChevronDown,
  UserLock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

// --- 1. THERMAL PRINTER OPTIMIZED RECEIPT remains same ---
const PrintReceipt = ({ order, cart, settings }: any) => {
  const total = order?.grand_total || 0;
  const tokenDisplay = order.token_number || "---";
  const upiUrl = `upi://pay?pa=${settings?.upi_id}&pn=${encodeURIComponent(settings?.shop_name || 'Store')}&am=${total.toFixed(2)}&cu=INR`;

  return (
    <div className="w-[76mm] mx-auto p-2 bg-white text-black font-mono leading-tight overflow-visible">
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1">Order Token</p>
        <h1 className="text-6xl font-black mb-2">#{tokenDisplay}</h1>
        <h2 className="text-xl font-black uppercase tracking-tighter">{settings?.shop_name || 'PAYTIMATE'}</h2>
        <p className="text-[9px] uppercase font-bold">{settings?.address || 'Premium POS Service'}</p>
      </div>
      <div className="flex justify-between mb-4 text-[10px] font-black border-b border-black pb-2">
        <span>{new Date().toLocaleDateString('en-IN')} {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="bg-black text-white px-2 rounded uppercase">{order.table_number}</span>
      </div>
      <table className="w-full mb-4 text-[11px]">
        <thead>
          <tr className="border-b-2 border-black text-left uppercase font-black">
            <th className="pb-1">Item</th>
            <th className="pb-1 text-center">Qty</th>
            <th className="pb-1 text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-100">
              <td className="py-2 font-bold uppercase leading-none">{item.name}</td>
              <td className="py-2 text-center font-bold">x{item.quantity}</td>
              <td className="py-2 text-right font-black">₹{(item.price_exclusive_tax * item.quantity).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t-2 border-black pt-2 mb-6">
        <div className="flex justify-between text-[10px] font-bold mb-1">
          <span>Subtotal</span>
          <span>₹{order.sub_total?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px] font-bold mb-2">
          <span>Taxes (GST)</span>
          <span>₹{order.tax_total?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center border-t border-black pt-2">
          <span className="font-black text-xs uppercase">Grand Total</span>
          <span className="text-3xl font-black">₹{total.toFixed(0)}</span>
        </div>
      </div>
      {order.payment_method === 'UPI' && settings?.upi_id && (
        <div className="text-center py-4 border-t border-dashed border-gray-400 mb-6">
          <div className="inline-block p-2 bg-white border-2 border-black">
            <QRCode value={upiUrl} size={110} level="M" />
          </div>
          <p className="text-[9px] font-black mt-2 uppercase tracking-widest">Scan to Pay UPI</p>
        </div>
      )}
      <div className="border-t-4 border-double border-black pt-6 mt-6">
        <div className="text-center mb-4">
          <p className="text-[10px] font-black tracking-[0.5em] uppercase mb-2 opacity-60">--- Kitchen Copy ---</p>
          <h2 className="text-3xl font-black underline underline-offset-4">TOKEN #{tokenDisplay}</h2>
          <p className="text-lg font-black mt-1 uppercase">{order.table_number}</p>
        </div>
        <div className="space-y-2 border-y border-black py-4">
          {cart.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm font-black uppercase">
              <span>{item.name}</span>
              <span>QTY: {item.quantity}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-center mt-10 pb-8 opacity-40">
        <p className="text-[8px] font-black uppercase tracking-[0.5em]">Powered by Paytimate</p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI'>('Cash');
  const [selectedTable, setSelectedTable] = useState('1');
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [printData, setPrintData] = useState<{ order: any, settings: any, cart: any } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    async function fetchData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/auth');
          return;
        }
        setUser(authUser);
        const [prodRes, settingsRes] = await Promise.all([
          supabase.from('products').select('*').eq('is_active', true),
          supabase.from('shop_settings').select('*').eq('id', authUser.id).maybeSingle()
        ]);
        if (prodRes.data) setProducts(prodRes.data);
        if (settingsRes.data) setSettings(settingsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setAuthChecking(false);
      }
    }
    fetchData();
  }, [router]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category))).filter(Boolean)], [products]);
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => (activeCategory === 'All' || p.category === activeCategory) && 
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, activeCategory, searchQuery]);

  const totals = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemSub = item.price_exclusive_tax * item.quantity;
      const itemTax = itemSub * ((item.tax_rate_percent ?? 18) / 100);
      return { subTotal: acc.subTotal + itemSub, taxTotal: acc.taxTotal + itemTax, grandTotal: acc.grandTotal + itemSub + itemTax };
    }, { subTotal: 0, taxTotal: 0, grandTotal: 0 });
  }, [cart]);

  const addToCart = (p: any) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === p.id);
      if (exists) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || loading) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let nextToken = (!settings?.token_reset_date || settings.token_reset_date !== today) 
        ? Math.floor(Math.random() * 50) + 101 
        : (settings?.last_token_number || 100) + 1;

      const { data: order, error } = await supabase.from('orders').insert([{
        shop_id: user.id, sub_total: totals.subTotal, tax_total: totals.taxTotal, 
        grand_total: totals.grandTotal, payment_method: paymentMethod, 
        table_number: `Table ${selectedTable}`, token_number: nextToken
      }]).select().single();

      if (error) throw error;
      await supabase.from('shop_settings').update({ last_token_number: nextToken, token_reset_date: today }).eq('id', user.id);
      setSettings((p: any) => ({ ...p, last_token_number: nextToken, token_reset_date: today }));
      setPrintData({ order, settings, cart: [...cart] });
      
      setTimeout(() => { 
        window.print(); 
        setPrintData(null); 
        setCart([]); 
        setIsCartOpen(false); 
      }, 900);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  if (!isMounted || authChecking) return <div className="h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#020617] overflow-hidden text-slate-100">
      
      {/* 📱 MOBILE/TABLET BOTTOM NAVIGATION & 💻 DESKTOP SIDEBAR */}
      <aside className="no-print fixed bottom-0 left-0 right-0 lg:relative lg:flex lg:w-20 bg-slate-900 flex lg:flex-col items-center justify-around lg:justify-start py-3 lg:py-8 gap-0 lg:gap-10 border-t lg:border-t-0 lg:border-r border-slate-800 z-[150]">
        <div className="hidden lg:flex w-12 h-12 bg-red-800 rounded-xl items-center justify-center font-black text-white italic">P</div>
        <nav className="flex lg:flex-col gap-8 lg:gap-6 items-center">
          <NavItem icon={<LayoutDashboard size={20} />} active={true} />
          <NavItem icon={<ClipboardList size={20} />} onClick={() => router.push('/history')} />
          <NavItem icon={<Settings size={20} />} onClick={() => router.push('/settings')} />
          <NavItem icon={<UserLock size={20} />} onClick={() => router.push('/owner')} />
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => router.replace('/auth'))} className="lg:mt-auto p-3 text-slate-500 hover:text-red-500"><LogOut size={20} /></button>
      </aside>

      {/* DASHBOARD HUB */}
      <main className="no-print flex-1 flex flex-col min-w-0 bg-slate-950 pb-20 lg:pb-0">
        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-[100]">
          <h1 className="text-lg md:text-xl font-black uppercase tracking-widest text-red-700">POS Hub</h1>
          <div className="relative max-w-xs w-full mx-4 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900 border-none pl-9 pr-4 py-2 rounded-lg text-xs focus:ring-1 focus:ring-red-900" />
          </div>
          <button onClick={() => setIsCartOpen(true)} className="lg:hidden p-2 bg-red-800 rounded-lg relative">
            <ShoppingBag size={20} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-black w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center">{cart.length}</span>}
          </button>
        </header>

        {/* Categories Bar */}
        <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar bg-slate-950">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-red-800 text-white shadow-lg shadow-red-900/20' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>{cat}</button>
          ))}
        </div>

        {/* Product Grid - Dynamic Columns */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 no-scrollbar">
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="bg-slate-900/40 p-3 md:p-4 rounded-2xl border border-slate-900 hover:border-red-900/50 transition-all cursor-pointer group flex flex-col items-center text-center">
              <div className="aspect-square w-full max-w-[100px] bg-slate-900 rounded-2xl mb-3 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">{p.category === 'Drinks' ? '🥤' : '🍔'}</div>
              <h3 className="font-bold text-[10px] md:text-xs uppercase truncate w-full">{p.name}</h3>
              <p className="text-red-600 font-black text-xs md:text-sm mt-1 italic">₹{p.price_exclusive_tax}</p>
            </div>
          ))}
        </div>
      </main>

      {/* 🛒 CART (Responsive Sidebar) */}
      <aside className={`no-print fixed lg:relative inset-y-0 right-0 z-[200] w-full md:w-[400px] lg:w-[380px] bg-slate-900 flex flex-col transition-transform duration-300 shadow-2xl lg:shadow-none lg:border-l lg:border-slate-900 ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h2 className="font-black uppercase tracking-tighter text-lg">Order Summary</h2>
          <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 bg-slate-800 rounded-lg"><X size={18} /></button>
        </div>

        <div className="px-6 py-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Assign Table</p>
          <div className="relative">
            <button onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)} className="w-full bg-slate-950 p-3 rounded-xl flex justify-between items-center text-xs font-bold border border-slate-800">
              <span className="uppercase tracking-widest">TABLE #{selectedTable}</span>
              <ChevronDown size={16} className={isTableDropdownOpen ? 'rotate-180' : ''} />
            </button>
            {isTableDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 p-2 rounded-xl grid grid-cols-5 gap-1 shadow-2xl z-[210] border border-slate-700">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => { setSelectedTable(n.toString()); setIsTableDropdownOpen(false); }} className={`p-2 rounded-lg text-xs font-bold ${selectedTable === n.toString() ? 'bg-red-800 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-700'}`}>{n}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-3 no-scrollbar pb-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
               <ShoppingBag size={48} className="mb-4" />
               <p className="text-xs uppercase font-black">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-sm">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-xl">{item.category === 'Drinks' ? '🥤' : '🍔'}</div>
                <div className="flex-1 min-w-0"><p className="text-[10px] font-bold uppercase truncate">{item.name}</p><p className="text-[10px] font-black text-red-600 italic">₹{(item.price_exclusive_tax * item.quantity).toFixed(0)}</p></div>
                <div className="flex items-center gap-2"><button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-500"><Minus size={14} /></button><span className="text-xs font-bold w-4 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-red-500"><Plus size={14} /></button></div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grand Total</span>
            <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">₹{totals.grandTotal.toFixed(0)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPaymentMethod('Cash')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${paymentMethod === 'Cash' ? 'bg-white text-black border-white' : 'border-slate-800 text-slate-500'}`}>Cash</button>
            <button onClick={() => setPaymentMethod('UPI')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${paymentMethod === 'UPI' ? 'bg-red-800 text-white border-red-800' : 'border-slate-800 text-slate-500'}`}>UPI / QR</button>
          </div>
          <button onClick={handleCheckout} disabled={cart.length === 0 || loading} className="w-full bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-black py-5 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-transform">
            {loading ? <Loader2 className="animate-spin" /> : <><Printer size={18} /> Print Bill</>}
          </button>
        </div>
      </aside>

      {/* --- PRINT AREA --- */}
      {printData && (
        <div id="receipt-print-area" className="hidden print:block fixed inset-0 z-[999] bg-white text-black">
          <PrintReceipt order={printData.order} cart={printData.cart} settings={printData.settings} />
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; height: 0; padding: 0; margin: 0; }
          #receipt-print-area, #receipt-print-area * { visibility: visible; height: auto; }
          #receipt-print-area { position: absolute; left: 0; top: 0; width: 76mm; display: block !important; }
          @page { size: 80mm auto; margin: 0mm; }
          .no-print { display: none !important; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function NavItem({ icon, active, onClick }: { icon: any, active?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`p-4 lg:p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-red-800 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
      {icon}
    </div>
  );
}