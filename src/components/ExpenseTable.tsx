import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
} from "@/components/ui/table";
import { format } from "date-fns";
import { Expense } from "../types";
import { Trash2, Edit2, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportExpensesToPDF } from "@/lib/exportUtils";

interface ExpenseTableProps {
  expenses: Expense[];
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

export function ExpenseTable({ expenses, onDelete, onEdit }: ExpenseTableProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="hidden print:block text-center mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-2xl font-black uppercase">Ripoti ya Matumizi</h1>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
          Imetolewa tarehe: {format(new Date(), "dd/MM/yyyy HH:mm")}
        </p>
      </div>

      <div className="flex justify-end gap-2 no-print">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => exportExpensesToPDF(expenses)}
          className="rounded-xl border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-widest gap-2 bg-red-50/50"
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
          <Printer className="h-3.5 w-3.5" />
          Print Matumizi
        </Button>
      </div>
      
      {/* Desktop View */}
      <div className="hidden md:block rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 py-4 px-8">Tarehe</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Aina</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Maelezo</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Kiasi</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
                  <TableCell className="py-4 px-8 text-xs text-slate-500 font-medium">
                    {expense.tarehe?.toDate ? format(expense.tarehe.toDate(), "dd/MM/yyyy HH:mm") : "N/A"}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm border border-indigo-100">
                      {expense.aina}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900">{expense.maelezo}</TableCell>
                  <TableCell className="text-right font-black text-red-600 tabular-nums">
                    {expense.kiasi.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onEdit(expense)}
                          className="h-8 w-8 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDelete(expense.id)}
                          className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">
                  Hakuna matumizi yaliyorekodiwa
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {expenses.length > 0 ? (
          expenses.map((expense) => (
            <div key={expense.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {expense.tarehe?.toDate ? format(expense.tarehe.toDate(), "dd/MM/yyyy HH:mm") : "N/A"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-tight border border-indigo-100">
                      {expense.aina}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {onEdit && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(expense)}
                      className="h-8 w-8 text-indigo-400 bg-indigo-50"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(expense.id)}
                      className="h-8 w-8 text-slate-300 bg-slate-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-xs font-bold text-slate-900">{expense.maelezo}</div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kiasi kilichotoka</span>
                <span className="text-sm font-black text-red-600 tabular-nums">
                  TZS {expense.kiasi.toLocaleString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white py-12 px-6 text-center rounded-2xl border border-dashed border-slate-200">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Hakuna matumizi yaliyorekodiwa</p>
          </div>
        )}
      </div>
    </div>
  );
}
