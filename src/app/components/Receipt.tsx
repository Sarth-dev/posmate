/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import QRCode from 'react-qr-code';

interface ReceiptProps {
  cart: any[];
  subTotal: number;
  gst: number;
  selectedTable: string;
  settings: any; 
  paymentMethod: string;
}

export const Receipt = ({ cart, subTotal, gst, selectedTable, settings, paymentMethod }: ReceiptProps) => {
  const total = subTotal + gst;
  const upiUrl = `upi://pay?pa=${settings?.upi_id}&pn=${encodeURIComponent(settings?.shop_name || 'Cafe')}&am=${total.toFixed(2)}&cu=INR`;

  return (
    // REMOVED "hidden print:block" here because parent div in dashboard handles it
    <div className="p-4 w-[80mm] mx-auto text-black bg-white font-mono">
      <div className="text-center border-b border-dashed border-black pb-4 mb-4">
        <h1 className="text-xl font-bold uppercase">{settings?.shop_name || 'PAYTIMATE CAFE'}</h1>
        <p className="text-[10px]">{settings?.address || 'Set address in settings'}</p>
        <p className="text-[10px]">PH: {settings?.phone_number || 'No contact'}</p>
        {settings?.gst_number && <p className="text-[10px]">GST: {settings?.gst_number}</p>}
      </div>

      <div className="flex justify-between mb-2 text-[12px]">
        <span>{new Date().toLocaleDateString()}</span>
        <span className="font-bold">{selectedTable}</span>
      </div>

      <div className="border-b border-dashed border-black mb-2"></div>

      <table className="w-full mb-4">
        <thead>
          <tr className="text-left border-b border-black text-[12px]">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, idx) => (
            <tr key={idx} className="text-[11px]">
              <td className="py-1 uppercase">{item.name}</td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className="py-1 text-right">₹{(item.price_exclusive_tax * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 border-t border-black pt-2 text-[12px]">
        <div className="flex justify-between"><span>Subtotal:</span><span>₹{subTotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>GST:</span><span>₹{gst.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-lg border-t border-black mt-1 pt-1">
          <span>TOTAL:</span><span>₹{total.toFixed(2)}</span>
        </div>
        <div className="text-right text-[10px] mt-1 italic">Mode: {paymentMethod}</div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-[10px] mb-4 font-bold italic">{settings?.footer_message || 'Thank you! Visit Again'}</p>
        
        {paymentMethod === 'UPI' && settings?.upi_id && (
          <div className="flex flex-col items-center gap-2 border-t border-dashed border-black pt-4">
            <p className="text-[9px] font-bold">SCAN TO PAY</p>
            <div className="bg-white p-2 border border-slate-100">
              <QRCode value={upiUrl} size={120} />
            </div>
            <p className="text-[9px] mt-1">{settings.upi_id}</p>
          </div>
        )}
      </div>
    </div>
  );
};