import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Customer, CustomerHistory } from "../types";
import { APP_CONFIG } from "../constants";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoryTableProps {
  history: CustomerHistory[];
}

export function HistoryTable({ history }: HistoryTableProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end no-print">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrint}
          className="rounded-xl border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest gap-2"
        >
          <Printer className="h-4 w-4 text-emerald-500" />
          Print Historia
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-xl border border-slate-100 overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-100">
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 py-4 px-6">Tarehe & Saa</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Kiasi (TZS)</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Njia</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Deni Kabla</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Deni Baada</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length > 0 ? (
              history.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                  <TableCell className="text-[11px] font-medium text-slate-500 py-4 px-6 tabular-nums">
                    {item.tarehe?.toDate ? format(item.tarehe.toDate(), "dd/MM HH:mm") : "N/A"}
                  </TableCell>
                  <TableCell className="font-black text-emerald-600 text-xs tabular-nums">
                    +{item.kiasi.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-tighter">
                      {item.njia}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-400 text-[11px] tabular-nums">{item.deni_kabla.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-slate-900 text-xs tabular-nums">{item.deni_baada.toLocaleString()}</TableCell>
                  <TableCell className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]">{item.aliyehifadhi}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">
                  Hakuna historia ya malipo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-3">
        {history.length > 0 ? (
          history.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full -mr-8 -mt-8 opacity-50" />
               
               <div className="flex justify-between items-start relative z-10">
                 <div className="space-y-0.5">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {item.tarehe?.toDate ? format(item.tarehe.toDate(), "dd MMM, HH:mm") : "N/A"}
                    </div>
                    <div className="text-lg font-black text-emerald-600 tabular-nums">
                      +TZS {item.kiasi.toLocaleString()}
                    </div>
                 </div>
                 <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                   {item.njia}
                 </span>
               </div>

               <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                 <div>
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Deni Kabla</div>
                    <div className="text-[11px] font-bold text-slate-500 tabular-nums">{item.deni_kabla.toLocaleString()}</div>
                 </div>
                 <div className="text-right">
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Deni Baada</div>
                    <div className="text-[11px] font-black text-slate-900 tabular-nums">{item.deni_baada.toLocaleString()}</div>
                 </div>
               </div>

               <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">
                 <span className="truncate max-w-[200px]">Admin: {item.aliyehifadhi}</span>
               </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-50 py-12 px-6 text-center rounded-2xl border border-dashed border-slate-200">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Hakuna historia ya malipo</p>
          </div>
        )}
      </div>
    </div>
  );
}
