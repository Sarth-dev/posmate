/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Edit3, Package, IndianRupee, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ModalProps {
  type: 'product' | 'category';
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  categories: string[];
  initialData?: any; 
}

export const ManagementModal = ({ type, isOpen, onClose, onRefresh, categories, initialData }: ModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    price_exclusive_tax: '',
    tax_rate_percent: 18,
    category: ''
  });

  // Sync form state with initialData or defaults
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          price_exclusive_tax: initialData.price_exclusive_tax || '',
          tax_rate_percent: initialData.tax_rate_percent || 18,
          category: initialData.category || categories[0] || ''
        });
      } else {
        setFormData({
          name: '',
          price_exclusive_tax: '',
          tax_rate_percent: 18,
          category: categories[0] || ''
        });
      }
    }
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required. Please log in again.");

      if (type === 'product') {
        // Build payload specifically matching your standardized DB columns
        const payload = {
          name: formData.name,
          price_exclusive_tax: parseFloat(formData.price_exclusive_tax),
          tax_rate_percent: parseFloat(formData.tax_rate_percent),
          category: formData.category,
          shop_id: user.id, // Using shop_id as standardized identifier
          is_active: true
        };

        if (initialData?.id) {
          const { error } = await supabase.from('products').update(payload).eq('id', initialData.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('products').insert([payload]);
          if (error) throw error;
        }
      } else {
        // Category logic
        const { error } = await supabase.from('categories').insert([
          { 
            name: formData.name, 
            shop_id: user.id // Standardized identifier
          }
        ]);
        if (error) throw error;
      }

      onRefresh();
      onClose();
    } catch (err: any) {
      console.error("Management Error:", err);
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 md:p-6 transition-all animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] w-full max-w-lg p-6 md:p-10 shadow-2xl relative border border-slate-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              {initialData ? <Edit3 size={24} /> : <Plus size={24} />}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                {initialData ? 'Update' : 'Add'} {type === 'product' ? 'Item' : 'Collection'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">Terminal Synchronization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              <Package size={12}/> {type === 'product' ? 'Item Name' : 'Collection Name'}
            </label>
            <input 
              required 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-700" 
              placeholder={type === 'product' ? "e.g. Espresso Romano" : "e.g. Beverages"} 
            />
          </div>

          {type === 'product' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Price Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <IndianRupee size={12}/> Price (Excl. Tax)
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    value={formData.price_exclusive_tax} 
                    onChange={e => setFormData({...formData, price_exclusive_tax: e.target.value})} 
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-700" 
                    placeholder="0.00" 
                  />
                </div>
                {/* Tax Field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    GST Rate (%)
                  </label>
                  <select 
                    value={formData.tax_rate_percent} 
                    onChange={e => setFormData({...formData, tax_rate_percent: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-700 appearance-none"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Standard)</option>
                    <option value={12}>12% (Service)</option>
                    <option value={18}>18% (Luxury)</option>
                  </select>
                </div>
              </div>

              {/* Category Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <Tag size={12}/> Assign Collection
                </label>
                <div className="relative">
                  <select 
                    required
                    disabled={categories.length === 0}
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer disabled:opacity-50"
                  >
                    {categories.length === 0 ? (
                      <option value="">No Collections Found</option>
                    ) : (
                      categories.map((c: string) => <option key={c} value={c}>{c}</option>)
                    )}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <X size={14} className="rotate-45" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Button */}
          <div className="pt-4">
            <button 
              disabled={loading || (type === 'product' && categories.length === 0)} 
              className="w-full bg-[#1E293B] text-white py-5 rounded-[1.5rem] font-black hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20}/>
              ) : (
                <>
                  {initialData ? 'UPDATE CHANGES' : `CONFIRM ${type.toUpperCase()}`}
                </>
              )}
            </button>
            {type === 'product' && categories.length === 0 && (
              <p className="text-center text-[10px] text-red-400 font-bold mt-3 animate-pulse uppercase tracking-wider">
                Please create a collection first!
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};