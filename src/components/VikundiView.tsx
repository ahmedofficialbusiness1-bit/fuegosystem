import { useState, useMemo, useEffect } from "react";
import { 
  Users, 
  Search, 
  TrendingUp, 
  CircleDollarSign, 
  Package, 
  ChevronRight,
  HandCoins,
  PlusIcon,
  ChevronDownIcon,
  Edit3,
  TrendingDown,
  UserPlus,
  History,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Customer, PaymentStatus } from "../types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { db, handleFirestoreError, OperationType, auth } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

interface GroupPaymentRecord {
  id: string;
  kikundi: string;
  kiasi: number;
  tarehe: any;
  aliyehifadhi: string;
}

interface VikundiViewProps {
  wateja: Customer[];
  onUpdateWateja: (
    updates: { id: string, data: Partial<Customer>, amountAdded: number, paymentMethod: string, tarehe?: any }[], 
    groupContext?: { name: string, totalAmount: number, tarehe?: any }
  ) => Promise<void>;
  onEditMember: (member: Customer) => void;
  onAddMemberToGroup: (groupName: string) => void;
}

export function VikundiView({ wateja, onUpdateWateja, onEditMember, onAddMemberToGroup }: VikundiViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [viewingMembers, setViewingMembers] = useState("");
  const [amountToPay, setAmountToPay] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 16));
  const [unitPrice, setUnitPrice] = useState("");
  const [sortBy, setSortBy] = useState<"paid" | "name" | "debt" | "percent">("paid");
  const [groupHistory, setGroupHistory] = useState<GroupPaymentRecord[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"members" | "history">("members");

  useEffect(() => {
    if (!viewingMembers || !auth.currentUser) {
      setGroupHistory([]);
      return;
    }

    const q = query(
      collection(db, "vikundi_malipo"),
      where("kikundi", "==", viewingMembers)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: GroupPaymentRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as GroupPaymentRecord);
      });
      // Sort manually
      records.sort((a, b) => {
        const dateA = a.tarehe?.toDate ? a.tarehe.toDate() : new Date(0);
        const dateB = b.tarehe?.toDate ? b.tarehe.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setGroupHistory(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "vikundi_malipo");
    });

    return () => unsubscribe();
  }, [viewingMembers]);

  const groups = useMemo(() => {
    const groupedData: Record<string, {
      name: string;
      members: Customer[];
      totalPcs: number;
      totalRevenue: number;
      totalPaid: number;
      totalDebt: number;
      paymentPercentage: number;
    }> = {};

    wateja.forEach(m => {
      const gName = m.njia_malipo || "Binafsi (No Group)";
      if (gName === "Cash") return; // Cash is treated as individual/no group for this view

      if (!groupedData[gName]) {
        groupedData[gName] = {
          name: gName,
          members: [],
          totalPcs: 0,
          totalRevenue: 0,
          totalPaid: 0,
          totalDebt: 0,
          paymentPercentage: 0
        };
      }
      groupedData[gName].members.push(m);
      groupedData[gName].totalPcs += Number(m.idadi) || 0;
      groupedData[gName].totalRevenue += Number(m.bei_bidhaa) || 0;
      groupedData[gName].totalPaid += Number(m.kilicholipwa) || 0;
      const currentDeni = Number(m.bei_bidhaa) - Number(m.kilicholipwa);
      groupedData[gName].totalDebt += (currentDeni > 0 ? currentDeni : 0);
    });

    Object.values(groupedData).forEach(g => {
      const revenue = Math.max(0, Number(g.totalRevenue) || 0);
      const paid = Number(g.totalPaid) || 0;
      const percentage = revenue > 0 ? (paid / revenue) * 100 : 0;
      g.paymentPercentage = isNaN(percentage) ? 0 : Math.min(100, Math.max(0, percentage));
    });

    return Object.values(groupedData).sort((a, b) => {
      if (sortBy === "paid") return b.totalPaid - a.totalPaid;
      if (sortBy === "debt") return b.totalDebt - a.totalDebt;
      if (sortBy === "percent") return b.paymentPercentage - a.paymentPercentage;
      return a.name.localeCompare(b.name);
    });
  }, [wateja, sortBy]);

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateHali = (paid: number, total: number) => {
    if (paid > total + 1) return PaymentStatus.OVERPAID;
    if (paid >= total - 1) return PaymentStatus.FULL;
    if (paid > 0) return PaymentStatus.PARTIAL;
    return PaymentStatus.NONE;
  };

  const handleGroupPriceSync = async () => {
    if (!selectedGroup || !unitPrice || isNaN(Number(unitPrice))) {
      toast.error("Tafadhali ingiza bei sahihi");
      return;
    }

    const group = groups.find(g => g.name === selectedGroup);
    if (!group) return;

    const groupUnitPrice = Number(unitPrice);
    
    // 1. Calculate total revenue and current total paid for the group
    let totalGroupRevenue = 0;
    let totalGroupPaid = 0;
    
    const membersWithNewPrices = group.members.map(m => {
      const idadi = Number(m.idadi) || 0;
      const beiMpya = idadi * groupUnitPrice;
      totalGroupRevenue += beiMpya;
      totalGroupPaid += (Number(m.kilicholipwa) || 0);
      
      return {
        ...m,
        bei_kila_moja: groupUnitPrice,
        bei_bidhaa: beiMpya,
      };
    });

    // 2. Proportional Redistribution: Everyone gets paid based on the group's total percentage
    // This ensures "Mgeni Simai" surplus is shared to cover others properly.
    if (totalGroupRevenue > 0) {
      let remainingToDistribute = totalGroupPaid;
      
      membersWithNewPrices.forEach((m, idx) => {
        let share = 0;
        if (idx === membersWithNewPrices.length - 1) {
          // Last person gets the remaining to avoid rounding errors
          share = remainingToDistribute;
        } else {
          // Share is proportional to their price vs total group revenue
          share = Math.round((m.bei_bidhaa / totalGroupRevenue) * totalGroupPaid);
        }
        
        m.kilicholipwa = share;
        remainingToDistribute -= share;
      });
    }

    // 3. Prepare updates for database
    const updates = membersWithNewPrices.map(m => ({
      id: m.id,
      amountAdded: 0, 
      paymentMethod: "Usawazishaji wa Bei na Ugawaji (Kikundi)",
      data: {
        bei_kila_moja: m.bei_kila_moja,
        bei_bidhaa: m.bei_bidhaa,
        kilicholipwa: m.kilicholipwa,
        deni: (m.bei_bidhaa - m.kilicholipwa) > 0 ? (m.bei_bidhaa - m.kilicholipwa) : 0,
        hali: calculateHali(m.kilicholipwa, m.bei_bidhaa)
      }
    }));

    try {
      await onUpdateWateja(updates);
      toast.success(`Bei imesasishwa na malipo yamegawiwa sawa kwa wote katika ${selectedGroup}`);
      setIsPriceOpen(false);
      setUnitPrice("");
    } catch (error) {
      console.error(error);
      toast.error("Imefeli kusasisha bei");
    }
  };

  const handleGroupPayment = async () => {
    if (!selectedGroup || !amountToPay || Number(amountToPay) <= 0) {
      toast.error("Tafadhali ingiza kiasi sahihi");
      return;
    }

    const group = groups.find(g => g.name === selectedGroup);
    if (!group) return;

    const newPayment = Number(amountToPay);
    const totalGroupPaidBefore = group.members.reduce((acc, m) => acc + (Number(m.kilicholipwa) || 0), 0);
    const totalGroupRevenue = group.members.reduce((acc, m) => acc + (Number(m.bei_bidhaa) || 0), 0);
    const totalGroupPaidAfter = totalGroupPaidBefore + newPayment;
    
    // Proportional redistribution:
    // Every member should have: (TotalGroupPaidAfter / TotalGroupRevenue) * TheirPrice
    const updates = group.members.map((m, idx) => {
      const mPrice = Number(m.bei_bidhaa) || 0;
      const initialPaid = Number(m.kilicholipwa) || 0;
      
      let finalPaid = 0;
      if (totalGroupRevenue > 0) {
        // Simple proportional share of the NEW total
        finalPaid = Math.round((mPrice / totalGroupRevenue) * totalGroupPaidAfter);
      } else {
        // If no items, just add 0
        finalPaid = initialPaid;
      }
      
      // In the very last member, we might need a small adjustment for rounding
      // but for simplicity in handleBulkUpdate, we'll let it be.
      
      return {
        id: m.id,
        amountAdded: finalPaid - initialPaid, // This is their share of the new payment
        paymentMethod: "Malipo ya Pamoja (Kikundi)",
        data: {
          kilicholipwa: finalPaid,
          deni: (mPrice - finalPaid) > 0 ? (mPrice - finalPaid) : 0,
          hali: calculateHali(finalPaid, mPrice),
        }
      };
    });

    try {
      await onUpdateWateja(updates, { 
        name: selectedGroup, 
        totalAmount: newPayment,
        tarehe: paymentDate
      });
      toast.success(`Malipo ya TZS ${newPayment.toLocaleString()} yamegawanywa sawa kwa kikundi ${selectedGroup}`);
      setIsPayOpen(false);
      setAmountToPay("");
      setPaymentDate(new Date().toISOString().slice(0, 16));
    } catch (error) {
      console.error(error);
      toast.error("Imefeli kusave malipo");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
            Vikundi
          </h2>
          <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Orodha na malipo ya pamoja</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Tafuta kikundi..." 
              className="pl-9 h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-indigo-500 shadow-inner text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setSortBy("paid")}
              className={cn(
                "flex-1 sm:flex-none px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                sortBy === "paid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-white/50"
              )}
            >
              Malipo
            </button>
            <button 
              onClick={() => setSortBy("percent")}
              className={cn(
                "flex-1 sm:flex-none px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                sortBy === "percent" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-white/50"
              )}
            >
              %
            </button>
            <button 
              onClick={() => setSortBy("name")}
              className={cn(
                "flex-1 sm:flex-none px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                sortBy === "name" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-white/50"
              )}
            >
              A-Z
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredGroups.map(group => {
          const isExpanded = viewingMembers === group.name;
          
          return (
            <Card key={group.name} className={cn(
              "rounded-2xl sm:rounded-3xl border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 bg-white",
              isExpanded && "md:col-span-2 lg:col-span-3 ring-2 ring-indigo-500 shadow-lg"
            )}>
              <CardHeader className="bg-slate-50 border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 sm:p-1.5 bg-white rounded-lg border border-slate-200">
                     <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                    {group.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1.5">
                  <Dialog open={isPriceOpen && selectedGroup === group.name} onOpenChange={(open) => {
                    setIsPriceOpen(open);
                    if (open) {
                      setSelectedGroup(group.name);
                      const firstMember = group.members[0];
                      if (firstMember?.bei_kila_moja) {
                        const price = Number(firstMember.bei_kila_moja);
                        setUnitPrice(isNaN(price) ? "" : price.toString());
                      } else {
                        setUnitPrice("");
                      }
                    }
                  }}>
                    <DialogTrigger 
                      render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600"
                        />
                      }
                    >
                      <CircleDollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl sm:rounded-3xl sm:max-w-md w-[95vw] sm:w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
                          <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                          Bei ya Kikundi
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 sm:py-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500">Unit Price (TZS)</Label>
                          <Input 
                            type="number" 
                            placeholder="Mfano: 2000" 
                            className="h-12 sm:h-14 text-xl sm:text-2xl font-black tabular-nums border-slate-200 focus:border-indigo-500 bg-slate-50"
                            value={unitPrice || ""}
                            onChange={(e) => setUnitPrice(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase border-slate-100" onClick={() => setIsPriceOpen(false)}>Ghairi</Button>
                        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10 sm:h-11 font-black text-[10px] uppercase tracking-widest" onClick={handleGroupPriceSync}>Sasisha</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-indigo-50 text-indigo-600"
                    onClick={() => onAddMemberToGroup(group.name)}
                  >
                    <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <span className="text-[8px] sm:text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
                    {group.members.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className={cn("p-4 sm:p-6 space-y-4", isExpanded && "border-b border-slate-100")}>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="space-y-1">
                      <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pcs</span>
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3 w-3 text-slate-400" />
                        <span className="text-xs sm:text-sm font-black tabular-nums">{group.totalPcs.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest block">Lipiwa</span>
                      <div className="flex items-center gap-1.5">
                        <CircleDollarSign className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs sm:text-sm font-black tabular-nums">{group.totalPaid.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest block">Madeni</span>
                      <div className="flex items-center gap-1.5 justify-end">
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-xs sm:text-sm font-black tabular-nums text-red-600">{group.totalDebt.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase">
                      <span className="text-slate-400">Malipo</span>
                      <span className={cn(
                        group.paymentPercentage >= 100 ? "text-emerald-600" : 
                        group.paymentPercentage > 50 ? "text-indigo-600" : "text-amber-600"
                      )}>
                        {group.paymentPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          group.paymentPercentage >= 100 ? "bg-emerald-500" : 
                          group.paymentPercentage > 50 ? "bg-indigo-500" : "bg-amber-400"
                        )}
                        style={{ width: `${isNaN(group.paymentPercentage) ? 0 : Math.min(Math.max(0, group.paymentPercentage), 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-4 flex items-center gap-2">
                    <Dialog open={isPayOpen && selectedGroup === group.name} onOpenChange={(open) => {
                      setIsPayOpen(open);
                      if (open) setSelectedGroup(group.name);
                    }}>
                      <DialogTrigger 
                        render={
                          <Button 
                            className="flex-1 rounded-xl h-10 sm:h-11 bg-indigo-600 hover:bg-indigo-700 font-black text-[9px] sm:text-[11px] uppercase tracking-widest gap-2 shadow-sm"
                          />
                        }
                      >
                        <HandCoins className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Ingiza Malipo
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl sm:rounded-3xl sm:max-w-md w-[95vw] sm:w-[500px]">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <HandCoins className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            Lipia Kikundi
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2 sm:py-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Kiasi (TZS)</Label>
                            <Input 
                              type="number" 
                              placeholder="Mfano: 500,000" 
                              className="h-12 sm:h-14 text-xl sm:text-2xl font-black tabular-nums border-slate-200 focus:border-indigo-500 bg-slate-50"
                              value={amountToPay || ""}
                              onChange={(e) => setAmountToPay(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-slate-500">Tarehe</Label>
                             <Input 
                               type="datetime-local" 
                               className="h-10 sm:h-12 border-slate-200 focus:border-indigo-500 bg-slate-50 text-xs"
                               value={paymentDate}
                               onChange={(e) => setPaymentDate(e.target.value)}
                             />
                          </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                          <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase border-slate-100" onClick={() => setIsPayOpen(false)}>Ghairi</Button>
                          <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 h-10 sm:h-11 font-black text-[10px] uppercase tracking-widest" onClick={handleGroupPayment}>Gawa Sasa</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      className={cn(
                        "h-10 sm:h-11 px-3 sm:px-4 rounded-xl border-slate-100 font-black text-[8px] sm:text-[10px] uppercase tracking-widest gap-2",
                        isExpanded ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "text-slate-500 hover:bg-slate-50"
                      )}
                      onClick={() => {
                        if (!isExpanded) {
                          setViewingMembers(group.name);
                          setActiveSubTab("members");
                        } else {
                          setViewingMembers("");
                        }
                      }}
                    >
                      {isExpanded ? "Funga" : "Watu"}
                      <ChevronDownIcon className={cn("h-3 w-3 sm:h-4 sm:w-4 transition-transform", isExpanded && "rotate-180")} />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100 flex flex-col animate-in slide-in-from-top-2 duration-500">
                    <div className="flex border-b border-slate-200 bg-white overflow-x-auto scrollbar-hide">
                      <button 
                        onClick={() => setActiveSubTab("members")}
                        className={cn(
                          "px-4 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap",
                          activeSubTab === "members" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Watu ({group.members.length})
                        {activeSubTab === "members" && (
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500" />
                        )}
                      </button>
                      <button 
                        onClick={() => setActiveSubTab("history")}
                        className={cn(
                          "px-4 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap",
                          activeSubTab === "history" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Historia ({groupHistory.length})
                        {activeSubTab === "history" && (
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500" />
                        )}
                      </button>
                    </div>

                    <div className="p-3 sm:p-6">
                        {activeSubTab === "members" ? (
                        <div>
                          {/* Desktop Table View */}
                          <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-slate-200">
                                  <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mwanachama</th>
                                  <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Pcs</th>
                                  <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Lipiwa</th>
                                  <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Deni</th>
                                  <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-50 pl-4">Badili</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {group.members.map(member => (
                                  <tr key={member.id} className="hover:bg-white/50 transition-colors group/row">
                                    <td className="py-3 pr-4">
                                      <div className="text-xs font-bold text-slate-900 group-hover/row:text-indigo-600 transition-colors">{member.jina}</div>
                                      {member.simu && <div className="text-[10px] text-slate-400 font-medium">{member.simu}</div>}
                                    </td>
                                    <td className="py-3 px-2 text-center text-xs font-black tabular-nums text-slate-600">{member.idadi}</td>
                                    <td className="py-3 px-2 text-right text-xs font-black tabular-nums text-emerald-600 font-bold">{member.kilicholipwa.toLocaleString()}</td>
                                    <td className="py-3 px-2 text-right text-xs font-black tabular-nums text-red-500">{member.deni.toLocaleString()}</td>
                                    <td className="py-3 pl-4 text-center border-l border-slate-50">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-lg hover:bg-white shadow-sm border border-transparent hover:border-slate-200"
                                        onClick={() => onEditMember(member)}
                                      >
                                        <Edit3 className="h-3 w-3 text-indigo-600" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Member List View */}
                          <div className="sm:hidden space-y-3">
                            {group.members.map(member => (
                              <div key={member.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center justify-between">
                                <div className="min-w-0">
                                  <div className="text-[11px] font-black text-slate-800 truncate">{member.jina}</div>
                                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                                    {member.idadi} pcs &bull; Deni: <span className="text-red-500">TZS {member.deni.toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                   <div className="text-[10px] font-black text-emerald-600 mr-2 text-right">
                                      <div className="text-[8px] text-slate-300 font-black tracking-tighter">LIPWA</div>
                                      {member.kilicholipwa.toLocaleString()}
                                   </div>
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 bg-slate-50 rounded-lg"
                                      onClick={() => onEditMember(member)}
                                    >
                                      <Edit3 className="h-3.5 w-3.5 text-indigo-500" />
                                    </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {groupHistory.length > 0 ? (
                            <div>
                               {/* Desktop History View */}
                               <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="border-b border-slate-200">
                                      <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tarehe na Saa</th>
                                      <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Kiasi</th>
                                      <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Alieingiza</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {groupHistory.map(record => {
                                      const date = record.tarehe?.toDate ? record.tarehe.toDate() : new Date();
                                      return (
                                        <tr key={record.id} className="hover:bg-white/50 transition-colors">
                                          <td className="py-3 pr-4">
                                            <div className="flex items-center gap-3">
                                              <Clock className="h-3 w-3 text-indigo-300" />
                                              <div>
                                                <div className="text-xs font-bold text-slate-700">
                                                  {date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                  {date.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-3 px-2 text-right text-xs font-black tabular-nums text-emerald-600">
                                            TZS {record.kiasi.toLocaleString()}
                                          </td>
                                          <td className="py-3 pl-4 text-right">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">{record.aliyehifadhi}</div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                               </div>

                               {/* Mobile History View */}
                               <div className="sm:hidden space-y-3">
                                 {groupHistory.map(record => {
                                    const date = record.tarehe?.toDate ? record.tarehe.toDate() : new Date();
                                    return (
                                      <div key={record.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex justify-between items-center">
                                        <div className="space-y-0.5">
                                           <div className="text-[10px] font-black text-slate-800">
                                              {date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' })} &bull; {date.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}
                                           </div>
                                           <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[140px]">
                                              By: {record.aliyehifadhi.split('@')[0]}
                                           </div>
                                        </div>
                                        <div className="text-[11px] font-black text-emerald-600">
                                           TZS {record.kiasi.toLocaleString()}
                                        </div>
                                      </div>
                                    );
                                 })}
                               </div>
                            </div>
                          ) : (
                            <div className="py-12 text-center space-y-2">
                              <History className="h-8 w-8 text-slate-200 mx-auto" />
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Hakuna historia ya malipo</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-3">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-slate-200" />
             </div>
             <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Hakuna kikundi kilichopatikana</p>
          </div>
        )}
      </div>
    </div>
  );
}
