import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Edit3, PlusCircle, History, Download, AlertTriangle, Wand2, Printer } from "lucide-react";
import { Customer, PaymentStatus } from "../types";
import { getStatusColor, getStatusTextColor, calculateHali, calculateDeni } from "@/lib/logic";
import { APP_CONFIG, UNIT_PRICE } from "../constants";

import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import { format, isBefore, subDays } from "date-fns";

import { cn } from "@/lib/utils";

interface WatejaTableProps {
  wateja: Customer[];
  onAddPayment: (mteja: Customer) => void;
  onEdit: (mteja: Customer) => void;
  onViewHistory: (mteja: Customer) => void;
  onFixMath?: (mteja: Customer) => void;
  hideControls?: boolean;
}

export function WatejaTable({ wateja, onAddPayment, onEdit, onViewHistory, onFixMath, hideControls }: WatejaTableProps) {

  const handlePrint = () => {
    window.print();
  };

  const thirtyDaysAgo = subDays(new Date(), 30);
  const inconsistentCount = wateja.filter(m => m.idadi * UNIT_PRICE !== m.bei_bidhaa).length;

  const isOldDebt = (mteja: Customer) => {
    const deni = calculateDeni(mteja.kilicholipwa, mteja.bei_bidhaa);
    if (deni <= 0) return false;
    const date = mteja.tarehe_kuongezwa?.toDate ? mteja.tarehe_kuongezwa.toDate() : new Date(mteja.tarehe_kuongezwa);
    return isBefore(date, thirtyDaysAgo);
  };

  return (
    <div className="space-y-4">
      <div className="hidden print:block text-center mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-2xl font-black uppercase">Orodha ya Wateja na Malipo</h1>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
          Imetolewa tarehe: {format(new Date(), "dd/MM/yyyy HH:mm")}
        </p>
      </div>

      <div className="flex justify-end gap-2 no-print">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => exportToPDF(wateja)}
          className="rounded-xl border-indigo-200 text-indigo-600 font-bold text-[10px] uppercase tracking-widest gap-2 bg-indigo-50/50"
        >
          <Download className="h-4 w-4" />
          Pakua PDF
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrint}
          className="rounded-xl border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest gap-2"
        >
          <Printer className="h-4 w-4 text-indigo-500" />
          Print Orodha
        </Button>
      </div>

      {inconsistentCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
               <AlertTriangle className="h-5 w-5" />
             </div>
             <div>
               <p className="text-[11px] font-black uppercase tracking-tight text-amber-900">Tatizo la Hesabu Limegundulika</p>
               <p className="text-[10px] font-bold text-amber-700/80">Kuna wateja {inconsistentCount} ambao hesabu yao ya Idadi na Bei haioani. Unaweza kurekebisha mmoja baada ya mwingine.</p>
             </div>
          </div>
        </div>
      )}
      <div className="rounded-2xl overflow-hidden hidden md:block border border-slate-100 shadow-sm bg-white">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-widest h-12 px-8">Mteja</TableHead>
              <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-widest px-4">Kikundi</TableHead>
              <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-widest text-center px-4">Idadi</TableHead>
              <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-widest px-4">Bei Kamili</TableHead>
              <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-widest px-4">Lipiwa</TableHead>
              <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-widest px-4">Deni</TableHead>
              <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-widest text-center px-4">Hali</TableHead>
              <TableHead className="font-bold text-[11px] text-slate-500 uppercase tracking-widest text-right px-8">Vitendo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wateja.length > 0 ? (
              wateja.map((mteja) => {
                const currentHali = calculateHali(mteja.kilicholipwa, mteja.bei_bidhaa);
                const currentDeni = calculateDeni(mteja.kilicholipwa, mteja.bei_bidhaa);
                
                // Only mark as inconsistent if the total doesn't match EITHER 120k OR 140k per piece
                const expectedWholesale = mteja.idadi * UNIT_PRICE;
                const expectedRetail = mteja.idadi * 140000;
                const isMathInconsistent = mteja.bei_bidhaa !== expectedWholesale && mteja.bei_bidhaa !== expectedRetail;

                return (
                  <TableRow 
                    key={mteja.id} 
                    style={{ backgroundColor: isMathInconsistent ? "#FFFDE7" : (currentHali === PaymentStatus.OVERPAID ? "#ECFDF5" : (getStatusColor(currentHali) + "30")) }}
                    className={cn(
                      "transition-colors hover:bg-slate-50/80 border-slate-100 group",
                      isOldDebt(mteja) && "border-l-4 border-l-red-500",
                      currentHali === PaymentStatus.OVERPAID && "border-l-4 border-l-emerald-500",
                      isMathInconsistent && "border-l-4 border-l-amber-500"
                    )}
                  >
                    <TableCell className="font-bold text-slate-900 py-5 px-8">
                      <div className="flex items-center gap-2 text-sm">
                         <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate font-black">{mteja.jina}</div>
                            {isMathInconsistent && (
                              <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-amber-500 text-amber-700 bg-amber-50 group-hover:scale-110 transition-transform">
                                <AlertTriangle className="h-2 w-2 mr-1" />
                                HESABU!
                              </Badge>
                            )}
                          </div>
                          {mteja.simu && (
                            <div className="text-[9px] uppercase tracking-widest font-black italic mt-0.5 text-indigo-400">
                              {mteja.simu}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                        mteja.njia_malipo === "Cash" || !mteja.njia_malipo ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm"
                      )}>
                        {(mteja.njia_malipo === "Cash" || !mteja.njia_malipo) ? "Binafsi" : mteja.njia_malipo}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-black text-slate-600 text-xs tabular-nums">{mteja.idadi}</TableCell>
                    <TableCell className="whitespace-nowrap font-bold text-slate-700 text-xs tabular-nums">
                      {mteja.bei_bidhaa.toLocaleString()}
                      {isMathInconsistent && (
                        <div className="text-[9px] text-amber-600 font-bold mt-1">
                          Hesabu imepishana na Idadi
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-black text-[#1B5E20] text-xs tabular-nums">{mteja.kilicholipwa.toLocaleString()}</TableCell>
                    <TableCell className={cn(
                      "whitespace-nowrap tabular-nums transition-all text-xs",
                      currentDeni > 0 ? "text-red-700 font-black scale-105" : 
                      (mteja.kilicholipwa > mteja.bei_bidhaa ? "text-emerald-700 font-black" : "text-slate-300 font-medium")
                    )}>
                      {currentDeni > 0 ? currentDeni.toLocaleString() : 
                       (mteja.kilicholipwa > mteja.bei_bidhaa ? (
                         <div className="flex flex-col items-end">
                           <span className="text-[8px] uppercase tracking-tighter">Prepaid</span>
                           <span>{ (mteja.kilicholipwa - mteja.bei_bidhaa).toLocaleString() }</span>
                         </div>
                       ) : "-")
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <span 
                        className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border border-white/50"
                        style={{ 
                          backgroundColor: getStatusTextColor(currentHali),
                          color: "white",
                        }}
                      >
                        {currentHali}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-8 space-x-1.5 whitespace-nowrap">
                      {isMathInconsistent && onFixMath && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onFixMath(mteja)}
                          className="h-8 px-3 border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 hover:border-amber-300"
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {currentDeni > 0 ? (
                        <Button 
                          size="sm" 
                          onClick={() => onAddPayment(mteja)} 
                          className="h-8 px-4 bg-[#1A237E] hover:bg-black text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm border-none"
                        >
                          LIPA
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onViewHistory(mteja)}
                          className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 hover:bg-slate-100/50"
                        >
                          HISTORIA
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => onEdit(mteja)} className="h-8 w-8 text-slate-300 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center opacity-20 grayscale scale-150">
                    <Search className="h-8 w-8 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Matches Found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {wateja.length > 0 ? (
          wateja.map(mteja => {
            const currentHali = calculateHali(mteja.kilicholipwa, mteja.bei_bidhaa);
            const currentDeni = calculateDeni(mteja.kilicholipwa, mteja.bei_bidhaa);
            const expectedWholesale = mteja.idadi * UNIT_PRICE;
            const expectedRetail = mteja.idadi * 140000;
            const isMathInconsistent = mteja.bei_bidhaa !== expectedWholesale && mteja.bei_bidhaa !== expectedRetail;

            return (
              <div 
                key={mteja.id}
                className={cn(
                  "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all",
                  isOldDebt(mteja) && "border-l-4 border-l-red-500",
                  currentHali === PaymentStatus.OVERPAID && "border-l-4 border-l-emerald-500",
                  isMathInconsistent && "border-l-4 border-l-amber-500"
                )}
                style={{ backgroundColor: isMathInconsistent ? "#FFFDE7" : "white" }}
              >
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800 text-sm leading-none">{mteja.jina}</h4>
                        {isMathInconsistent && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <span>{mteja.simu || "Namba haipo"}</span>
                         <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                         <span className="text-indigo-500">{mteja.njia_malipo || "Binafsi"}</span>
                      </div>
                    </div>
                    <span 
                      className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-sm"
                      style={{ backgroundColor: getStatusTextColor(currentHali), color: "white" }}
                    >
                      {currentHali}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Idadi & Bei</p>
                      <p className="text-xs font-bold text-slate-700">
                        {mteja.idadi} Pcs &bull; {mteja.bei_bidhaa.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deni Lililobaki</p>
                      <p className={cn(
                        "text-xs font-black",
                        currentDeni > 0 ? "text-red-600" : (mteja.kilicholipwa > mteja.bei_bidhaa ? "text-emerald-600" : "text-slate-300")
                      )}>
                        {currentDeni > 0 ? `TZS ${currentDeni.toLocaleString()}` : 
                         (mteja.kilicholipwa > mteja.bei_bidhaa ? `+${(mteja.kilicholipwa - mteja.bei_bidhaa).toLocaleString()}` : "-")
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex-1 text-[10px] font-bold text-slate-500">
                      Lipiwa: <span className="text-emerald-600">TZS {mteja.kilicholipwa.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => onEdit(mteja)} className="h-9 w-9 p-0 rounded-xl border-slate-100 flex items-center justify-center">
                          <Edit3 className="h-4 w-4 text-slate-400" />
                       </Button>
                       {currentDeni > 0 ? (
                         <Button onClick={() => onAddPayment(mteja)} className="h-9 px-4 bg-[#1A237E] hover:bg-black text-[10px] font-black uppercase tracking-widest rounded-xl border-none shadow-md">
                           Sajili Malipo
                         </Button>
                       ) : (
                        <Button variant="outline" onClick={() => onViewHistory(mteja)} className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200 text-slate-600">
                           Historia
                        </Button>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 border-dashed">
             <Search className="h-8 w-8 text-slate-200 mx-auto mb-2" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Hakuna Matokeo</p>
          </div>
        )}
      </div>
    </div>
  );
}


