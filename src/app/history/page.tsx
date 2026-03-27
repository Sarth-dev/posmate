/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Calendar, Tag, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data);
    }
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 mb-8 hover:text-slate-800">
        <ChevronLeft size={20}/> Back to Dashboard
      </button>

      <h1 className="text-3xl font-black text-slate-900 mb-8">Transaction History</h1>

      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Order ID</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Date</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Total</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6 font-bold text-slate-800 text-sm">#{order.id.slice(0, 8)}</td>
                <td className="px-8 py-6 text-slate-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-8 py-6 font-black text-slate-900 text-sm">₹{order.grand_total}</td>
                <td className="px-8 py-6">
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 w-fit">
                    <CheckCircle size={12}/> COMPLETED
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}