/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase'; // Adjust path if needed
import QRCode from 'react-qr-code';

// This internal component handles the search params inside Suspense
function ReceiptContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  
  const [order, setOrder] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  async function getPrintData() {
    if (!orderId) return;
    
    // Get the cart from the URL if it's not in the DB
    const cartParam = searchParams.get('cart');
    const localCart = cartParam ? JSON.parse(decodeURIComponent(cartParam)) : [];

    const { data: orderData } = await supabase.from('orders').select('*').eq('id', orderId).single();
    const { data: settingsData } = await supabase.from('settings').select('*').single();

    // Attach the local cart to the order object manually
    setOrder({ ...orderData, items: localCart });
    setSettings(settingsData);
    setLoading(false);
  }
  getPrintData();
}, [orderId]);

  // AUTO-PRINT LOGIC
  useEffect(() => {
    if (!loading && order) {
      // Small delay to ensure QR code and fonts render
      setTimeout(() => {
        window.print();
        // Optional: window.close(); // Closes the tab after printing
      }, 500);
    }
  }, [loading, order]);

  if (loading) return <div className="p-10 text-center font-mono">Generating Receipt...</div>;
  if (!order) return <div className="p-10 text-center font-mono">Order not found.</div>;

  const upiUrl = `upi://pay?pa=${settings?.upi_id}&pn=${encodeURIComponent(settings?.shop_name || 'Cafe')}&am=${order.grand_total?.toFixed(2)}&cu=INR`;

  return (
    <div className="p-4 w-[80mm] mx-auto text-black bg-white font-mono min-h-screen">
      {/* HEADER */}
      <div className="text-center border-b border-dashed border-black pb-4 mb-4">
        <h1 className="text-xl font-bold uppercase">{settings?.shop_name || 'PAYTIMATE CAFE'}</h1>
        <p className="text-[10px]">{settings?.address || 'Set address in settings'}</p>
        <p className="text-[10px]">PH: {settings?.phone_number || 'No contact'}</p>
        {settings?.gst_number && <p className="text-[10px]">GST: {settings?.gst_number}</p>}
      </div>

      {/* ORDER INFO */}
      <div className="flex justify-between mb-2 text-[12px]">
        <span>{new Date(order.created_at).toLocaleString()}</span>
        <span className="font-bold">{order.table_number}</span>
      </div>
      <p className="text-[10px] mb-2">Order ID: #{order.id.toString().slice(-6)}</p>

      <div className="border-b border-dashed border-black mb-2"></div>

      {/* ITEMS - Note: You must ensure your order table stores the items 
          OR fetch them from an order_items table. 
          Assuming 'cart' was saved as a JSONB column 'items' */}
      <table className="w-full mb-4">
        <thead>
          <tr className="text-left border-b border-black text-[12px]">
            <th className="py-1">Item</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {/* If you store order items in a separate table, fetch them. 
              If you store them in a JSON column 'items' in 'orders' table: */}
          {order.items?.map((item: any, idx: number) => (
            <tr key={idx} className="text-[11px]">
              <td className="py-1 uppercase">
                {item.name} x {item.quantity}
              </td>
              <td className="py-1 text-right">₹{(item.price_exclusive_tax * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <div className="space-y-1 border-t border-black pt-2 text-[12px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{order.sub_total?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST:</span>
          <span>₹{order.tax_total?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-black mt-1 pt-1">
          <span>TOTAL:</span>
          <span>₹{order.grand_total?.toFixed(2)}</span>
        </div>
        <div className="text-right text-[10px] mt-1 italic uppercase">Mode: {order.payment_method}</div>
      </div>

      {/* FOOTER & UPI */}
      <div className="mt-6 text-center">
        <p className="text-[10px] mb-4 font-bold italic">{settings?.footer_message || 'Thank you! Visit Again'}</p>
        
        {order.payment_method === 'UPI' && settings?.upi_id && (
          <div className="flex flex-col items-center gap-2 border-t border-dashed border-black pt-4">
            <p className="text-[9px] font-bold">SCAN TO PAY</p>
            <div className="bg-white p-2 border border-black">
              <QRCode value={upiUrl} size={110} />
            </div>
            <p className="text-[9px] mt-1 font-bold">{settings.upi_id}</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center text-[8px] text-slate-400">
        Generated by Paytimate POS
      </div>
    </div>
  );
}

// Exported component with Suspense boundary
export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="p-10 font-mono text-center">Loading...</div>}>
      <ReceiptContent />
    </Suspense>
  );
}