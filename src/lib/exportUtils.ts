import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Customer } from "../types";
import { format } from "date-fns";

export function exportToExcel(data: Customer[], fileName: string = "Wateja_Fuego.xlsx") {
  const worksheet = XLSX.utils.json_to_sheet(data.map(c => ({
    "Jina": c.jina,
    "Kikundi": (c.njia_malipo === "Cash" || !c.njia_malipo) ? "Binafsi" : c.njia_malipo,
    "Idadi": c.idadi,
    "Bei Kamili": c.bei_bidhaa,
    "Kilicholipwa": c.kilicholipwa,
    "Deni": c.deni,
    "Hali": c.hali,
    "Tarehe ya Kuongezwa": c.tarehe_kuongezwa ? format(c.tarehe_kuongezwa.toDate ? c.tarehe_kuongezwa.toDate() : new Date(c.tarehe_kuongezwa), "dd/MM/yyyy") : "N/A"
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Wateja");
  XLSX.writeFile(workbook, fileName);
}

export function exportToPDF(data: Customer[], title: string = "Ripoti ya Wateja - Fuego Pressure Cooker") {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setTextColor(26, 35, 126); // Primary color
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Imetolewa tarehe: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);
  doc.text(`Idadi ya rekodi: ${data.length}`, 14, 35);

  const tableData = data.map(c => [
    c.tarehe_kuongezwa ? format(c.tarehe_kuongezwa.toDate ? c.tarehe_kuongezwa.toDate() : new Date(c.tarehe_kuongezwa), "dd/MM/yyyy") : "-",
    c.jina,
    (c.njia_malipo === "Cash" || !c.njia_malipo) ? "Binafsi" : c.njia_malipo,
    c.idadi,
    c.bei_bidhaa.toLocaleString(),
    c.kilicholipwa.toLocaleString(),
    (c.bei_bidhaa - c.kilicholipwa > 0 ? (c.bei_bidhaa - c.kilicholipwa).toLocaleString() : "0"),
    c.hali
  ]);

  autoTable(doc, {
    startY: 40,
    head: [["Tarehe", "Mteja", "Kikundi", "Qty", "Bei", "Lipiwa", "Deni", "Hali"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [26, 35, 126], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    }
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function exportExpensesToPDF(data: any[], title: string = "Ripoti ya Matumizi") {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setTextColor(183, 28, 28); // Red color for expenses
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Imetolewa tarehe: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);

  const tableData = data.map(e => [
    e.tarehe ? format(e.tarehe.toDate ? e.tarehe.toDate() : new Date(e.tarehe), "dd/MM/yyyy") : "-",
    e.aina,
    e.maelezo || "-",
    e.kiasi.toLocaleString()
  ]);

  const total = data.reduce((sum, e) => sum + e.kiasi, 0);

  autoTable(doc, {
    startY: 40,
    head: [["Tarehe", "Aina", "Maelezo", "Kiasi (TZS)"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [183, 28, 28], fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      3: { halign: 'right', fontStyle: 'bold' }
    },
    foot: [["", "", "JUMLA KUU", total.toLocaleString()]],
    footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  doc.save(`Ripoti_Matumizi_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function exportProfitReportToPDF(totalSales: number, totalExpenses: number, title: string = "Ripoti ya Faida na Hasara") {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(26, 35, 126);
  doc.text("FUEGO PRESSURE COOKER", 105, 25, { align: "center" });
  
  doc.setFontSize(16);
  doc.text(title, 105, 35, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Kipindi: ${format(new Date(), "MMMM yyyy")}`, 105, 42, { align: "center" });
  doc.text(`Imetolewa: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 105, 47, { align: "center" });

  const profit = totalSales - totalExpenses;

  autoTable(doc, {
    startY: 60,
    head: [["Maelezo", "Kiasi (TZS)"]],
    body: [
      ["JUMLA YA MAUZO (Pesa Zilizoingia)", totalSales.toLocaleString()],
      ["JUMLA YA MATUMIZI", totalExpenses.toLocaleString()],
      [{ content: "FAIDA / HASARA", styles: { fontStyle: 'bold', fontSize: 12 } }, { content: profit.toLocaleString(), styles: { fontStyle: 'bold', fontSize: 12, textColor: profit >= 0 ? [27, 94, 32] : [183, 28, 28] } }]
    ],
    theme: "grid",
    headStyles: { fillColor: [26, 35, 126] },
    columnStyles: {
      1: { halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.text("Asante kwa kazi nzuri!", 105, finalY + 20, { align: "center" });

  doc.save(`Ripoti_Faida_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function exportFullBackup(wateja: Customer[], expenses: any[]) {
  const wb = XLSX.utils.book_new();

  // 1. Wateja Sheet
  const watejaSheet = XLSX.utils.json_to_sheet(wateja.map(c => ({
    "Tarehe ya Kuongezwa": c.tarehe_kuongezwa ? format(c.tarehe_kuongezwa.toDate ? c.tarehe_kuongezwa.toDate() : new Date(c.tarehe_kuongezwa as any), "dd/MM/yyyy HH:mm") : "-",
    "Jina la Mteja": c.jina,
    "Kikundi": (c.njia_malipo === "Cash" || !c.njia_malipo) ? "Binafsi" : c.njia_malipo,
    "Namba ya Simu": c.simu || "-",
    "Idadi": c.idadi,
    "Bei ya Bidhaa": c.bei_bidhaa,
    "Kiasi Kilicholipwa": c.kilicholipwa,
    "Deni": c.bei_bidhaa - c.kilicholipwa,
    "Hali ya Malipo": c.hali
  })));
  XLSX.utils.book_append_sheet(wb, watejaSheet, "Wateja na Malipo");

  // 2. Matumizi Sheet
  const expensesSheet = XLSX.utils.json_to_sheet(expenses.map(e => ({
    "Tarehe": e.tarehe ? format(e.tarehe.toDate ? e.tarehe.toDate() : new Date(e.tarehe), "dd/MM/yyyy HH:mm") : "-",
    "Aina ya Matumizi": e.aina,
    "Maelezo": e.maelezo || "-",
    "Kiasi (TZS)": e.kiasi
  })));
  XLSX.utils.book_append_sheet(wb, expensesSheet, "Matumizi");

  // Generate Filename: fuego_dd_mm_yyyy.xlsx
  const fileName = `fuego_${format(new Date(), "dd_MM_yyyy_HHmm")}.xlsx`;
  
  XLSX.writeFile(wb, fileName);
}
