/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Save, Plus, Trash2, Edit3, Store, Utensils, 
  ArrowLeft, Loader2, LayoutDashboard, ClipboardList,
  BarChart3, Settings as SettingsIcon, Layers, FolderPlus,
  Search, Phone, MapPin, QrCode, Globe
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
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
      
      {/* Sidebar Rail */}
      <aside className="hidden md:flex w-24 bg-[#1E293B] flex-col items-center py-6 gap-4 border-r border-slate-700/30">
        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-white font-black italic text-xl">P</span>
        </div>
        <nav className="flex flex-col gap-3 w-full px-2">
          <NavItem icon={<LayoutDashboard size={22} />} label="POS" onClick={() => router.push('/dashboard')} />
          <NavItem icon={<ClipboardList size={22} />} label="Orders" onClick={() => router.push('/history')} />
          <NavItem icon={<BarChart3 size={22} />} label="Reports" onClick={() => router.push('/dashboard')} />
          <NavItem icon={<SettingsIcon size={22} />} label="Settings" active={true} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Console Settings</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Manage your terminal configuration</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <ArrowLeft size={16} /> EXIT TO POS
          </button>
        </header>

        {/* Tab Switcher */}
        <div className="px-8 py-4 flex gap-2 overflow-x-auto no-scrollbar">
          <TabToggle active={activeTab === 'shop'} label="Shop Profile" onClick={() => setActiveTab('shop')} />
          <TabToggle active={activeTab === 'products'} label="Menu Manager" onClick={() => setActiveTab('products')} />
          <TabToggle active={activeTab === 'categories'} label="Collections" onClick={() => setActiveTab('categories')} />
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          
          {/* SHOP PROFILE TAB */}
          {activeTab === 'shop' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-[0.2em] text-blue-500 mb-4">Store Identity</h3>
                  <SettingsInput label="Business Name" icon={<Store size={18}/>} value={shopData.shop_name} onChange={(v: any) => setShopData({...shopData, shop_name: v})} />
                  <SettingsInput label="Official Phone" icon={<Phone size={18}/>} value={shopData.phone_number} onChange={(v: any) => setShopData({...shopData, phone_number: v})} />
                  <SettingsInput label="Full Address" icon={<MapPin size={18}/>} value={shopData.address} onChange={(v: any) => setShopData({...shopData, address: v})} />
                </div>
                
                <div className="space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-[0.2em] text-emerald-500 mb-4">Payments & Branding</h3>
                  <SettingsInput label="Merchant UPI ID" icon={<QrCode size={18}/>} value={shopData.upi_id} onChange={(v: any) => setShopData({...shopData, upi_id: v})} />
                  <SettingsInput label="Receipt Message" icon={<Globe size={18}/>} value={shopData.footer_message} onChange={(v: any) => setShopData({...shopData, footer_message: v})} />
                  
                  <div className="pt-6">
                    <button
                      onClick={updateShopSettings}
                      disabled={loading}
                      className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} SYNC CHANGES
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-6">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{products.length} Items Listed</p>
                <button 
                  onClick={() => { setSelectedItem(null); setModalType('product'); setIsModalOpen(true); }}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 font-black text-xs hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-all"
                >
                  <Plus size={18} /> NEW ITEM
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="px-8 py-5">Product Details</th>
                      <th className="px-8 py-5">Category</th>
                      <th className="px-8 py-5">Base Price</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 font-bold text-slate-800">{p.name}</td>
                        <td className="px-8 py-5">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter italic">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-black text-slate-900">₹{p.price_exclusive_tax}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelectedItem(p); setModalType('product'); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-blue-500"><Edit3 size={18} /></button>
                            <button className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
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
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Menu Collections</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Organize your menu items into searchable groups.</p>
                </div>
                <button 
                  onClick={() => { setSelectedItem(null); setModalType('category'); setIsModalOpen(true); }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <FolderPlus size={18} /> NEW COLLECTION
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-[1.2rem] flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <Layers size={22} />
                      </div>
                      <div>
                        <span className="font-black text-slate-700 block">{cat.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {products.filter(p => p.category === cat.name).length} Items
                        </span>
                      </div>
                    </div>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
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

// --- VISUAL SUB-COMPONENTS ---

function SettingsInput({ label, value, onChange, icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
          {icon}
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
        />
      </div>
    </div>
  );
}

function TabToggle({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`whitespace-nowrap px-8 py-3.5 rounded-2xl text-[10px] font-black tracking-widest transition-all ${
        active 
        ? 'bg-[#1E293B] text-white shadow-xl shadow-slate-200' 
        : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
      }`}
    >
      {label.toUpperCase()}
    </button>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-4 w-full rounded-2xl cursor-pointer transition-all group relative ${active ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />}
      {icon}
      <span className={`text-[9px] mt-2 font-black uppercase tracking-widest ${active ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}>{label}</span>
    </div>
  );
}