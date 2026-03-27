/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, ClipboardList, BarChart3, Settings, Plus, Minus,
  Loader2, Printer, ShoppingBag, X, Search, LogOut, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

// 1. RECEIPT COMPONENT
const PrintReceipt = ({ order, cart, settings }: any) => {
  const total = order?.grand_total || 0;
  // Use the sequential token from the database
  const tokenDisplay = order.token_number || "---";
  const upiUrl = `upi://pay?pa=${settings?.upi_id}&pn=${encodeURIComponent(settings?.shop_name || 'Store')}&am=${total.toFixed(2)}&cu=INR`;

  return (
    <div className="p-4 w-[76mm] mx-auto text-slate-950 bg-white font-mono text-[11px] leading-tight border border-slate-100">
      
      {/* 1. HEADER & TOKEN (HIGH VISIBILITY) */}
      <div className="text-center border-b-2 border-black pb-3 mb-3">
        <p className="text-[9px] font-black tracking-[0.3em] uppercase mb-1 text-slate-500">Order Token</p>
        <h1 className="text-5xl font-black mb-2">#{tokenDisplay}</h1>
        <h2 className="text-lg font-black uppercase tracking-tighter">{settings?.shop_name || 'PAYTIMATE'}</h2>
        <p className="text-[8px] uppercase opacity-70">{settings?.address || 'Customer Receipt'}</p>
      </div>

      {/* 2. TRANSACTION METADATA */}
      <div className="flex justify-between mb-3 text-[9px] font-bold">
        <span>{new Date().toLocaleDateString('en-IN')} | {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
        <span className="bg-black text-white px-1 rounded">{order.table_number?.toUpperCase()}</span>
      </div>

      {/* 3. ITEMS TABLE (THE BILL) */}
      <table className="w-full mb-3">
        <thead>
          <tr className="text-left text-[9px] font-black uppercase border-b border-slate-300">
            <th className="pb-1">Item</th>
            <th className="pb-1 text-center">Qty</th>
            <th className="pb-1 text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item: any, idx: number) => (
            <tr key={idx} className="border-b border-slate-50">
              <td className="py-2 font-bold uppercase">{item.name}</td>
              <td className="py-2 text-center">x{item.quantity}</td>
              <td className="py-2 text-right">₹{(item.price_exclusive_tax * item.quantity).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. TOTALS SECTION */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-[10px] font-medium">
          <span>Subtotal</span>
          <span>₹{order.sub_total?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px] font-medium">
          <span>Taxes</span>
          <span>₹{order.tax_total?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t-2 border-black">
          <span className="font-black text-[11px] uppercase">Grand Total</span>
          <span className="text-2xl font-black">₹{total.toFixed(0)}</span>
        </div>
      </div>

      {/* 5. PAYMENT METHOD & QR */}
      <div className="text-center py-2 border-t border-dashed border-slate-300 mb-4">
        <p className="text-[9px] font-bold uppercase mb-2">Paid via {order.payment_method}</p>
        {order.payment_method === 'UPI' && settings?.upi_id && (
          <div className="inline-block p-1 bg-white border border-slate-200">
            <QRCode value={upiUrl} size={75} level="M" />
          </div>
        )}
      </div>

      {/* 6. PERFORATED KITCHEN SLIP (THE "TOKEN" SLIP) */}
      <div className="mt-6 pt-4 border-t-2 border-dashed border-black">
        <div className="text-center mb-2">
          <p className="text-[8px] font-black tracking-widest uppercase mb-1 opacity-50">--- Kitchen Copy ---</p>
          <h2 className="text-2xl font-black">TOKEN #{tokenDisplay}</h2>
          <p className="text-[10px] font-bold">{order.table_number?.toUpperCase()}</p>
        </div>
        
        {/* Simplified Item List for Chef */}
        <div className="space-y-1">
          {cart.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-[12px] font-black uppercase">
              <span>{item.name}</span>
              <span>x{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-6 opacity-30">
        <p className="text-[7px] font-bold uppercase tracking-[0.4em]">Powered by Paytimate</p>
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
  const [printData, setPrintData] = useState<{order: any, settings: any, cart: any} | null>(null);

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

        // UPDATED: Fetching from 'shop_settings' instead of 'settings'
        const [prodRes, settingsRes] = await Promise.all([
          supabase.from('products').select('*').eq('is_active', true),
          supabase.from('shop_settings').select('*').eq('id', authUser.id).maybeSingle() 
        ]);

        if (prodRes.data) setProducts(prodRes.data);
        if (settingsRes.data) {
          setSettings(settingsRes.data);
        } else {
          console.warn("No settings found for this owner in 'shop_settings' table.");
        }

      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setAuthChecking(false);
      }
    }
    fetchData();
  }, [router]);

  // CALCULATIONS
  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => p.category)));
    return ['All', ...unique.filter(Boolean)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = (p.name || "").toLowerCase().includes((searchQuery || "").toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const totals = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemTaxRate = item.tax_rate_percent ?? 18;
      const itemSubTotal = item.price_exclusive_tax * item.quantity;
      const itemTax = itemSubTotal * (itemTaxRate / 100);
      return {
        subTotal: acc.subTotal + itemSubTotal,
        taxTotal: acc.taxTotal + itemTax,
        grandTotal: acc.grandTotal + (itemSubTotal + itemTax)
      };
    }, { subTotal: 0, taxTotal: 0, grandTotal: 0 });
  }, [cart]);

  // HANDLERS
  const addToCart = (p: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item);
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
    const todayStr = new Date().toISOString().split('T')[0];
    let nextToken;

    // 1. Check if we need to reset/start a new sequence for the day
    if (!settings?.token_reset_date || settings.token_reset_date !== todayStr) {
      // Start at a random number between 101 and 150 so it looks "busy"
      nextToken = Math.floor(Math.random() * 50) + 101;
    } else {
      // Otherwise just increment
      nextToken = (settings?.last_token_number || 100) + 1;
    }

    // 2. Save the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        shop_id: user?.id,
        sub_total: totals.subTotal,
        tax_total: totals.taxTotal,
        grand_total: totals.grandTotal,
        payment_status: 'Paid',
        payment_method: paymentMethod,
        table_number: `Table ${selectedTable}`,
        token_number: nextToken // This matches the SQL column we just added
      }])
      .select().single();

    if (orderError) throw orderError;

    // 3. Update the shop_settings so the next token is tracked
    const { error: settingsError } = await supabase
      .from('shop_settings')
      .update({ 
        last_token_number: nextToken, 
        token_reset_date: todayStr 
      })
      .eq('id', user.id);
      
    if (settingsError) console.error("Settings update failed:", settingsError);

    // 4. Update local state so the UI stays in sync
    setSettings((prev: any) => ({ ...prev, last_token_number: nextToken, token_reset_date: todayStr }));

    // 5. Trigger Print
    setPrintData({ order: orderData, settings: settings, cart: [...cart] });
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);

    setCart([]);
    setIsCartOpen(false);

  } catch (e: any) {
    console.error(e);
    alert(`Checkout failed: ${e.message}`);
  } finally {
    setLoading(false);
  }
};

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  if (!isMounted || authChecking) return <div className="h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="no-print hidden lg:flex w-24 bg-[#0F172A] flex-col items-center py-8 gap-10">
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center">
          <span className="text-white font-black text-xl italic">P</span>
        </div>
        <nav className="flex flex-col gap-8">
          <NavItem icon={<LayoutDashboard size={24} />} active={true} onClick={() => {}} />
          <NavItem icon={<ClipboardList size={24} />} onClick={() => router.push('/history')} />
          <NavItem icon={<BarChart3 size={24} />} onClick={() => router.push('/reports')} />
          <NavItem icon={<Settings size={24} />} onClick={() => router.push('/settings')} />
        </nav>
        <button onClick={handleLogout} className="mt-auto p-4 text-slate-500 hover:text-red-400"><LogOut size={24} /></button>
      </aside>

      {/* MAIN VIEW */}
      <main className="no-print flex-1 flex flex-col min-w-0 bg-white lg:rounded-l-[3rem] shadow-2xl z-10">
        <header className="px-6 py-6 flex items-center justify-between border-b border-slate-50">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Menu Dashboard</h1>
          <div className="relative max-w-md w-full mx-8 hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none pl-12 pr-4 py-3 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500/20 transition-all" 
            />
          </div>
          <button onClick={() => setIsCartOpen(true)} className="lg:hidden p-3 bg-blue-600 text-white rounded-2xl relative">
            <ShoppingBag size={20} />
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full text-[10px] font-bold border-2 border-white flex items-center justify-center">{cart.length}</span>}
          </button>
        </header>

        <div className="p-6 flex items-center gap-3 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all uppercase border-2 ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 no-scrollbar">
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="bg-slate-50/50 rounded-[2.5rem] p-5 border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-2xl transition-all cursor-pointer group">
              <div className="w-full aspect-square bg-white rounded-[2rem] mb-4 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
                {p.category === 'Drinks' ? '🥤' : '🍔'}
              </div>
              <h3 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{p.name}</h3>
              <p className="font-black text-blue-600 mt-1">₹{p.price_exclusive_tax}</p>
            </div>
          ))}
        </div>
      </main>

      {/* CART SIDEBAR */}
      <aside className={`no-print fixed lg:relative inset-y-0 right-0 z-[120] w-full max-w-[440px] bg-[#F8FAFC] flex flex-col transform transition-transform duration-500 ease-out lg:translate-x-0 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Cart Details</h2>
            <p className="text-xs font-bold text-slate-400">Manage order & payments</p>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-3 bg-white rounded-2xl shadow-sm"><X size={20} /></button>
        </div>

        <div className="px-8 pb-6">
          <div className="relative">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Table Number</p>
            <button 
              onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-blue-400 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs italic">T</div>
                <span className="font-black text-slate-800 uppercase text-sm">Table #{selectedTable}</span>
              </div>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${isTableDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTableDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-[2rem] p-4 shadow-2xl z-50 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button 
                    key={n}
                    onClick={() => { setSelectedTable(n.toString()); setIsTableDropdownOpen(false); }}
                    className={`aspect-square rounded-xl font-black text-xs transition-all ${selectedTable === n.toString() ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 space-y-6 no-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl">{item.category === 'Drinks' ? '🥤' : '🍔'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate uppercase">{item.name}</p>
                <p className="text-xs font-bold text-blue-500">₹{(item.price_exclusive_tax * item.quantity).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3 px-2">
                <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-300 hover:text-red-500"><Minus size={16} /></button>
                <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-300 hover:text-blue-500"><Plus size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-white border-t border-slate-100 rounded-t-[3rem] shadow-sm space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Net Total</span>
              <span>₹{totals.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black text-blue-500 uppercase tracking-widest">
              <span>GST Applied</span>
              <span>₹{totals.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
              <span className="font-black text-slate-900 uppercase text-xs tracking-tighter">Total Amount</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{totals.grandTotal.toFixed(0)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setPaymentMethod('Cash')}
              className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all uppercase border-2 ${paymentMethod === 'Cash' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}
            >
              Cash
            </button>
            <button 
              onClick={() => setPaymentMethod('UPI')}
              className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all uppercase border-2 ${paymentMethod === 'UPI' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-100'}`}
            >
              UPI / QR
            </button>
          </div>

          <button 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || loading}
            className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-3 shadow-2xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-[11px]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Printer size={20} /> Complete Order & Receipt</>}
          </button>
        </div>
      </aside>

      {/* PRINT SECTION */}
      <div className="hidden print:block fixed inset-0 z-[999] bg-white">
        {printData && (
          <PrintReceipt 
            order={printData.order} 
            cart={printData.cart} 
            settings={printData.settings} 
          />
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\:block, .print\:block * { visibility: visible; }
          .print\:block { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            display: block !important;
          }
          @page { size: auto; margin: 0mm; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function NavItem({ icon, active, onClick }: { icon: any, active?: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}
    >
      {icon}
    </div>
  );
}