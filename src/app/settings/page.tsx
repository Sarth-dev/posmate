/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Save, Plus, Trash2, Edit3, Store, Utensils, 
  ArrowLeft, Loader2, LayoutDashboard, ClipboardList,
  BarChart3, Settings as SettingsIcon, Layers, FolderPlus,
  Search, Phone, MapPin, QrCode, Globe, LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ManagementModal } from '../components/ManagementModal';

type TabType = 'shop' | 'products' | 'categories';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('shop');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Data States
  const [shopData, setShopData] = useState<any>({ shop_name: '', address: '', phone_number: '', upi_id: '', footer_message: '' });
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'product' | 'category'>('product');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return router.push('/login');
    setUser(authUser);

    const [shop, prod, cat] = await Promise.all([
      supabase.from('shop_settings').select('*').eq('id', authUser.id).maybeSingle(),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name')
    ]);

    if (shop.data) setShopData(shop.data);
    if (prod.data) setProducts(prod.data);
    if (cat.data) setCategories(cat.data);
  }

  const updateShopSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('shop_settings').upsert({ 
        id: user?.id, 
        ...shopData,
        updated_at: new Date() 
      });
      if (error) throw error;
      alert("Settings synchronized successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this collection? Products linked to this may lose their category labeling.")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) setCategories(categories.filter(c => c.id !== id));
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Rail (Matched to Dashboard) */}
      <aside className="hidden lg:flex w-20 bg-slate-900 flex-col items-center py-8 gap-10 border-r border-slate-800">
        <div className="w-12 h-12 bg-red-800 rounded-xl flex items-center justify-center font-black text-white italic">P</div>
        <nav className="flex flex-col gap-6">
          <NavItem icon={<LayoutDashboard size={20} />} onClick={() => router.push('/dashboard')} />
          <NavItem icon={<ClipboardList size={20} />} onClick={() => router.push('/history')} />
          <NavItem icon={<SettingsIcon size={20} />} active={true} />
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => router.replace('/auth'))} className="mt-auto p-4 text-slate-500 hover:text-red-500"><LogOut size={20} /></button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 bg-slate-950">
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-red-700">Console Settings</h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Manage terminal configuration</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl font-black text-[10px] tracking-widest hover:bg-slate-800 transition-all text-slate-300">
            <ArrowLeft size={16} /> EXIT TO POS
          </button>
        </header>

        {/* Tab Switcher */}
        <div className="px-8 py-6 flex gap-2 overflow-x-auto no-scrollbar bg-slate-950/50">
          <TabToggle active={activeTab === 'shop'} label="Shop Profile" onClick={() => setActiveTab('shop')} />
          <TabToggle active={activeTab === 'products'} label="Menu Manager" onClick={() => setActiveTab('products')} />
          <TabToggle active={activeTab === 'categories'} label="Collections" onClick={() => setActiveTab('categories')} />
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-slate-950">
          
          {/* SHOP PROFILE TAB */}
          {activeTab === 'shop' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-900/40 rounded-[2.5rem] p-10 border border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-red-700 mb-4">Store Identity</h3>
                  <SettingsInput label="Business Name" icon={<Store size={18}/>} value={shopData.shop_name} onChange={(v: any) => setShopData({...shopData, shop_name: v})} />
                  <SettingsInput label="Official Phone" icon={<Phone size={18}/>} value={shopData.phone_number} onChange={(v: any) => setShopData({...shopData, phone_number: v})} />
                  <SettingsInput label="Full Address" icon={<MapPin size={18}/>} value={shopData.address} onChange={(v: any) => setShopData({...shopData, address: v})} />
                </div>
                
                <div className="space-y-6">
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-red-700 mb-4">Payments & Branding</h3>
                  <SettingsInput label="Merchant UPI ID" icon={<QrCode size={18}/>} value={shopData.upi_id} onChange={(v: any) => setShopData({...shopData, upi_id: v})} />
                  <SettingsInput label="Receipt Message" icon={<Globe size={18}/>} value={shopData.footer_message} onChange={(v: any) => setShopData({...shopData, footer_message: v})} />
                  
                  <div className="pt-6">
                    <button
                      onClick={updateShopSettings}
                      disabled={loading}
                      className="w-full bg-red-800 hover:bg-red-700 text-white py-5 rounded-2xl font-black shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-widest text-[11px]"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Sync Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-6 px-2">
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest italic">{products.length} Items Listed</p>
                <button 
                  onClick={() => { setSelectedItem(null); setModalType('product'); setIsModalOpen(true); }}
                  className="bg-red-800 text-white px-8 py-3.5 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-900/10 transition-all"
                >
                  <Plus size={18} /> New Item
                </button>
              </div>

              <div className="bg-slate-900/40 rounded-[2rem] border border-slate-900 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      <th className="px-8 py-5">Product Details</th>
                      <th className="px-8 py-5">Category</th>
                      <th className="px-8 py-5">Base Price</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-red-900/5 transition-colors group">
                        <td className="px-8 py-5 font-bold text-sm uppercase tracking-tight text-slate-200">{p.name}</td>
                        <td className="px-8 py-5">
                          <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-black text-red-600 italic">₹{p.price_exclusive_tax}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelectedItem(p); setModalType('product'); setIsModalOpen(true); }} className="p-2 text-slate-500 hover:text-white"><Edit3 size={18} /></button>
                            <button className="p-2 text-slate-500 hover:text-red-500"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COLLECTIONS TAB */}
          {activeTab === 'categories' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end mb-8 px-2">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter">Menu Collections</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Organize searchable groups</p>
                </div>
                <button 
                  onClick={() => { setSelectedItem(null); setModalType('category'); setIsModalOpen(true); }}
                  className="bg-red-800 hover:bg-red-700 text-white px-6 py-3.5 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all"
                >
                  <FolderPlus size={18} /> New Collection
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-900 flex justify-between items-center group hover:border-red-900/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-red-900/20 group-hover:text-red-700 transition-colors border border-slate-800">
                        <Layers size={22} />
                      </div>
                      <div>
                        <span className="font-black text-slate-200 block uppercase tracking-tight">{cat.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {products.filter(p => p.category === cat.name).length} Items
                        </span>
                      </div>
                    </div>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-slate-700 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </main>

      <ManagementModal
        isOpen={isModalOpen}
        type={modalType}
        initialData={selectedItem}
        categories={categories.map(c => c.name)}
        onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
        onRefresh={fetchInitialData}
      />
    </div>
  );
}

// --- VISUAL SUB-COMPONENTS (MATCHED TO DASHBOARD) ---

function SettingsInput({ label, value, onChange, icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600">
          {icon}
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-950 border border-slate-800 focus:bg-slate-900 focus:border-red-900 outline-none transition-all font-bold text-sm text-slate-200 shadow-inner"
        />
      </div>
    </div>
  );
}

function TabToggle({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`whitespace-nowrap px-8 py-3.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${
        active 
        ? 'bg-red-800 text-white shadow-xl shadow-red-900/10' 
        : 'bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );
}

function NavItem({ icon, active, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl cursor-pointer transition-all ${
        active 
        ? 'bg-red-800 text-white shadow-lg' 
        : 'text-slate-500 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
    </div>
  );
}