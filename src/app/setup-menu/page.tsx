/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState } from 'react';
import { Plus, Save, Utensils, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SetupMenu() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([
    { name: '', price: '', category: 'Beverages', is_veg: true }
  ]);

  const categories = ['Beverages', 'Starters', 'Main Course', 'Desserts', 'Snacks'];

  const addItem = () => {
    setItems([...items, { name: '', price: '', category: 'Beverages', is_veg: true }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveMenu = async () => {
    setLoading(true);
    try {
      // 1. Get current user ID (Shop Owner)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 2. Prepare and Insert Categories first (unique ones)
      const uniqueCats = Array.from(new Set(items.map(i => i.category)));
      const { data: catData } = await supabase
        .from('categories')
        .upsert(uniqueCats.map(name => ({ name, shop_id: user.id })), { onConflict: 'name' })
        .select();

      // 3. Map items to their Category IDs and Insert Products
      const productsToInsert = items.map(item => {
        const catId = catData?.find(c => c.name === item.category)?.id;
        return {
          shop_id: user.id,
          category_id: catId,
          name: item.name,
          price_exclusive_tax: parseFloat(item.price),
          tax_rate_percent: 5.00, // Standard Resto GST is 5%
          is_active: true,
          current_stock: 999, // For cafes, stock is often unlimited/not tracked
        };
      });

      const { error } = await supabase.from('products').insert(productsToInsert);
      
      if (error) throw error;
      
      // 4. Redirect to Dashboard
      router.push('/dashboard');
    } catch (err) {
      alert("Error saving menu. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Branding */}
        <div className="md:w-1/3 bg-blue-600 p-10 text-white flex flex-col justify-between">
          <div>
            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Utensils size={24} />
            </div>
            <h1 className="text-3xl font-bold leading-tight">Welcome to Paytimate</h1>
            <p className="mt-4 text-blue-100">Let's set up your digital menu. You can always edit this later in your dashboard.</p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-2 text-sm text-blue-200">
              <CheckCircle2 size={16} /> <span>GST Ready Invoices</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-200 mt-2">
              <CheckCircle2 size={16} /> <span>Inventory Tracking</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-10 overflow-y-auto max-h-[80vh]">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Create Your Menu</h2>
          
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input 
                  placeholder="Dish Name" 
                  className="flex-1 min-w-[150px] p-2 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none text-sm"
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].name = e.target.value;
                    setItems(newItems);
                  }}
                />
                
                <select 
                  className="p-2 bg-transparent border-b border-slate-200 text-sm outline-none"
                  value={item.category}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].category = e.target.value;
                    setItems(newItems);
                  }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
                  <span className="text-slate-400 pl-2 text-sm">₹</span>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-16 p-1 outline-none text-sm"
                    value={item.price}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].price = e.target.value;
                      setItems(newItems);
                    }}
                  />
                </div>

                <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={addItem}
            className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg transition"
          >
            <Plus size={18} /> Add Item
          </button>

          <button 
            disabled={loading}
            onClick={handleSaveMenu}
            className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition disabled:opacity-50"
          >
            {loading ? 'Saving Menu...' : 'Launch My POS'}
            <Save size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}