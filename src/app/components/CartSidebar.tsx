/* eslint-disable @typescript-eslint/no-explicit-any */
import { ShoppingCart, Trash2, Printer, Loader2, Banknote, Smartphone, Minus, Plus } from 'lucide-react';

interface CartSidebarProps {
  cart: any[];
  setCart: (cart: any[]) => void;
  subTotal: number;
  gst: number;
  loading: boolean;
  onCheckout: () => void;
  selectedTable: string;
  setSelectedTable: (val: string) => void;
  tables: string[];
  paymentMethod: 'Cash' | 'UPI';
  setPaymentMethod: (method: 'Cash' | 'UPI') => void;
}

export const CartSidebar = ({ 
  cart, setCart, subTotal, gst, loading, onCheckout, 
  selectedTable, setSelectedTable, tables,
  paymentMethod, setPaymentMethod 
}: CartSidebarProps) => {
  
  const grandTotal = (subTotal + gst).toFixed(2);

  return (
    <div className="w-[400px] bg-white border-l shadow-2xl flex flex-col h-full print:hidden">
      {/* 1. Header & Table Selection */}
      <div className="p-5 border-b space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-black text-xl flex items-center gap-2 text-slate-800">
            <ShoppingCart className="text-blue-600" size={24} /> 
            Current Order
          </h2>
          {cart.length > 0 && (
            <button 
              onClick={() => setCart([])} 
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              title="Clear Cart"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
        
        <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-100">
          <div className="flex-1 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase flex items-center">
            Table Assignment
          </div>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="bg-white border shadow-sm px-4 py-2 rounded-lg font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          >
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* 2. Scrollable Cart Items */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <ShoppingCart size={40} strokeWidth={1} />
            </div>
            <p className="font-bold tracking-tight">Your cart is empty</p>
            <p className="text-xs">Add items to start a bill</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="group flex items-center justify-between bg-white border-b border-slate-50 pb-4 last:border-0">
              <div className="flex-1 pr-4">
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.name}</h4>
                <p className="text-xs font-medium text-slate-400">₹{item.price_exclusive_tax} / unit</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
                  <button 
                    className="p-1.5 hover:bg-slate-50 text-slate-500"
                    onClick={() => setCart(cart.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 text-xs font-black text-slate-700 w-8 text-center">{item.quantity}</span>
                  <button 
                    className="p-1.5 hover:bg-slate-50 text-blue-600"
                    onClick={() => setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-sm font-black w-20 text-right text-slate-800">₹{(item.price_exclusive_tax * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Payment & Totals Footer */}
      <div className="bg-slate-900 p-6 rounded-t-[2.5rem] shadow-2xl space-y-5">
        
        {/* Payment Toggle */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Select Payment Mode</p>
          <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
            <button 
              onClick={() => setPaymentMethod('Cash')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm ${paymentMethod === 'Cash' ? 'bg-white text-slate-900 shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-white'}`}
            >
              <Banknote size={18} /> Cash
            </button>
            <button 
              onClick={() => setPaymentMethod('UPI')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm ${paymentMethod === 'UPI' ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-white'}`}
            >
              <Smartphone size={18} /> Online
            </button>
          </div>
        </div>

        {/* Totals Section */}
        <div className="space-y-2 border-b border-slate-800 pb-4">
          <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-tighter">
            <span>Sub-total</span>
            <span className="text-slate-200">₹{subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-tighter">
            <span>GST (18%)</span>
            <span className="text-slate-200">₹{gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-end pt-2">
            <span className="text-slate-400 font-black text-sm uppercase">Total Amount</span>
            <span className="text-3xl font-black text-blue-400 tracking-tighter">₹{grandTotal}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={onCheckout}
          disabled={loading || cart.length === 0}
          className={`group w-full py-4 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none 
            ${paymentMethod === 'UPI' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}`}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              <Printer size={20} className="group-hover:rotate-12 transition-transform" /> 
              {paymentMethod === 'UPI' ? 'CONFIRM ONLINE & PRINT' : 'COLLECT CASH & PRINT'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};