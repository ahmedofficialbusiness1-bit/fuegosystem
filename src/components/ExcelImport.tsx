import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PaymentStatus } from "../types";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { calculateHali, calculateDeni } from "../lib/logic";

interface ExcelImportProps {
  onSuccess: () => void;
}

export function ExcelImport({ onSuccess }: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          toast.error("Faili haina data yoyote!");
          setIsProcessing(false);
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const row of data) {
          // Normalize column names (ignore case and spaces)
          const findVal = (keys: string[]) => {
             const key = Object.keys(row).find(k => 
               keys.includes(k.toLowerCase().trim())
             );
             return key ? row[key] : null;
          };

          const jina = findVal(["jina", "name", "customer name", "mteja"]);
          const idadi = Number(findVal(["idadi", "quantity", "pcs", "idadi ya pcs"])) || 0;
          const kilicholipwa = Number(findVal(["kilicholipwa", "paid", "amount paid", "malipo", "malipo alio lipa mwanzo"])) || 0;
          const njia_malipo = findVal(["njia_malipo", "payment method", "group", "kikundi", "kikundi anachotoka"]) || "Cash";
          const simu = String(findVal(["simu", "phone", "mobile", "namba ya simu"]) || "").trim();
          const bei_bidhaa = Number(findVal(["bei_bidhaa", "total price", "total", "bei", "kiasi chote anachotakiwa kulipa"])) || 0;

          if (!jina || idadi <= 0 || bei_bidhaa <= 0) {
            console.warn("Skipping invalid row:", row);
            errorCount++;
            continue;
          }

          const deni = calculateDeni(kilicholipwa, bei_bidhaa);
          const hali = calculateHali(kilicholipwa, bei_bidhaa);

          await addDoc(collection(db, "wateja"), {
            jina,
            idadi,
            kilicholipwa,
            bei_bidhaa,
            njia_malipo,
            simu,
            hali,
            deni,
            tarehe_kuongezwa: serverTimestamp(),
            tarehe_kulipwa: hali === PaymentStatus.FULL ? serverTimestamp() : null,
            maelezo: "Imported from Excel",
          });
          successCount++;
        }

        toast.success(`Imefanikiwa! Wateja ${successCount} wameongezwa.`);
        if (errorCount > 0) toast.warning(`${errorCount} rows skipped due to missing data.`);
        onSuccess();
      } catch (error) {
        console.error("Excel Import Error:", error);
        toast.error("Imefeli kusoma faili ya Excel. Hakikisha format ni sahihi.");
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
         <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
         <div className="text-xs text-blue-800 leading-relaxed">
            <p className="font-bold mb-1 uppercase tracking-wider">Maelekezo ya Excel:</p>
            <p>Faili iwe na column hizi: <b>Jina</b>, <b>Idadi</b>, <b>Malipo</b>, <b>Kikundi</b>, <b>Bei</b>, na <b>Simu</b> (optional).</p>
         </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls"
        className="hidden"
      />
      
      <Button 
        variant="outline" 
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="w-full py-8 border-dashed border-2 border-slate-200 hover:border-[#1A237E] hover:bg-indigo-50 transition-all flex flex-col gap-2 rounded-2xl"
      >
        {isProcessing ? (
          <>
            <div className="w-6 h-6 border-2 border-indigo-100 border-t-[#1A237E] rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A237E]">Processing Excel...</span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Bofya kupakia faili ya Excel</span>
          </>
        )}
      </Button>
    </div>
  );
}
