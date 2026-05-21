import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Package, Ruler, Trash2, Edit3, Save, CheckCircle2 } from "lucide-react";
import { InventoryItem } from "../types";
import { motion } from "framer-motion";

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAdd: (item: Partial<InventoryItem>) => void;
  onUpdate: (id: string, data: Partial<InventoryItem>) => void;
  onDelete: (id: string) => void;
  totalSoldPcs: number;
}

export function InventoryView({ inventory, onAdd, onUpdate, onDelete, totalSoldPcs }: InventoryViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    jina: "",
    stock_in: 0,
    pcs_per_carton: 4,
    bei_yake: 120000
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      onAdd(formData);
      setIsAdding(false);
    }
    setFormData({ jina: "", stock_in: 0, pcs_per_carton: 4, bei_yake: 120000 });
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData(item);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Stoo (Inventory)</h3>
          <p className="text-slate-500 text-sm font-medium">Simamia bidhaa zako na idadi iliyopo stoo.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#1A237E] hover:bg-black text-white font-black uppercase tracking-widest rounded-xl shadow-lg transition-all"
        >
          {isAdding ? "Funga" : <><Plus className="h-4 w-4 mr-2" /> Ongeza Bidhaa</>}
        </Button>
      </div>

      {isAdding && (
         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 border-indigo-100 shadow-xl overflow-hidden rounded-2xl">
              <CardHeader className="bg-indigo-50 border-b border-indigo-100 py-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-[#1A237E]">Ingiza Bidhaa Mpya</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jina la Bidhaa</label>
                    <Input 
                      placeholder="e.g. FG 225" 
                      value={formData.jina} 
                      onChange={e => setFormData({...formData, jina: e.target.value})}
                      required
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock In (PCS)</label>
                    <Input 
                      type="number"
                      placeholder="e.g. 700" 
                      value={formData.stock_in} 
                      onChange={e => setFormData({...formData, stock_in: Number(e.target.value)})}
                      required
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PCS per Carton</label>
                    <Input 
                      type="number"
                      placeholder="e.g. 4" 
                      value={formData.pcs_per_carton} 
                      onChange={e => setFormData({...formData, pcs_per_carton: Number(e.target.value)})}
                      required
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bei ya Moja (TZS)</label>
                    <Input 
                      type="number"
                      placeholder="e.g. 120000" 
                      value={formData.bei_yake} 
                      onChange={e => setFormData({...formData, bei_yake: Number(e.target.value)})}
                      required
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 rounded-xl shadow-md">
                      Hifadhi Bidhaa
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
         </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map(item => {
          const sold = item.jina === "FG 225" ? totalSoldPcs : 0; 
          const remaining = item.stock_in - sold;
          const cartonsSold = Math.floor(sold / item.pcs_per_carton);
          const cartonsRemaining = Math.floor(remaining / item.pcs_per_carton);
          const pcsInLooseRemaining = remaining % item.pcs_per_carton;

          return (
            <Card key={item.id} className="border-none shadow-xl rounded-3xl overflow-hidden relative group md:col-span-2 lg:col-span-1">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
               
               <CardHeader className="p-6 pb-2">
                 <div className="flex items-center justify-between">
                    <div className="bg-indigo-100 p-2.5 rounded-2xl">
                      <Package className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(item)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => onDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                 </div>
                 <div className="mt-4">
                    <h4 className="text-xl font-black text-slate-800 tracking-tight">{item.jina}</h4>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Uchunguzi wa Jumla (Detailed Evaluation)</p>
                 </div>
               </CardHeader>

               <CardContent className="p-6 pt-4 space-y-6">
                  {/* Physical PCS tracking */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">INGIA</p>
                      <p className="text-lg font-black text-slate-800">{item.stock_in.toLocaleString()}</p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase">PCS</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                      <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">UZA</p>
                      <p className="text-lg font-black text-orange-600">{sold.toLocaleString()}</p>
                      <p className="text-[7px] font-bold text-orange-300 uppercase">PCS</p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">BAKI</p>
                      <p className="text-lg font-black text-indigo-600">{remaining.toLocaleString()}</p>
                      <p className="text-[7px] font-bold text-indigo-300 uppercase">PCS</p>
                    </div>
                  </div>

                  {/* Carton tracking */}
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carton Zilizoenda</p>
                      </div>
                      <p className="text-sm font-black text-slate-700">{cartonsSold.toLocaleString()} <span className="text-[8px]">CTN</span></p>
                    </div>
                    <div className="h-px bg-slate-50"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carton Zilizobaki</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-700">{cartonsRemaining.toLocaleString()} <span className="text-[8px]">CTN</span></p>
                        {pcsInLooseRemaining > 0 && <p className="text-[8px] text-slate-400 font-bold">+{pcsInLooseRemaining} PCS LOOSE</p>}
                      </div>
                    </div>
                  </div>

                  {/* Financial Evaluation */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thamani ya Bidhaa (tzs)</p>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Thamani Iliyouzwa</p>
                          <p className="text-sm font-black text-orange-600">{(sold * item.bei_yake).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Thamani Iliyobaki</p>
                          <p className="text-sm font-black text-indigo-600">{(remaining * item.bei_yake).toLocaleString()}</p>
                        </div>
                     </div>

                     <div className="bg-indigo-600 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-100 italic relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                        <div>
                          <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">Thamani Halisi (Jumla Kuu)</p>
                          <p className="text-base font-black text-white">TZS {(item.stock_in * item.bei_yake).toLocaleString()}</p>
                        </div>
                        <Package className="h-6 w-6 text-white opacity-20" />
                     </div>
                  </div>
               </CardContent>
            </Card>
          );
        })}

        {inventory.length === 0 && !isAdding && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <Package className="h-12 w-12 text-slate-200 mb-4" />
            <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest">Hakuna Bidhaa Kwenye Stoo</h4>
            <Button 
                onClick={() => setIsAdding(true)}
                variant="link" 
                className="text-indigo-500 font-bold mt-2"
            >
                Ongeza sasa bidhaa ya kwanza
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
