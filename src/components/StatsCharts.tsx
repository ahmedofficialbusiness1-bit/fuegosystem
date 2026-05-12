import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from "recharts";
import { Customer, PaymentStatus } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface StatsChartsProps {
  wateja: Customer[];
}

export function StatsCharts({ wateja }: StatsChartsProps) {
  const handlePrint = () => {
    window.print();
  };

  // Data for Pie Chart (Status Distribution)
  const statusData = [
    { name: "Kamili", value: wateja.filter(c => c.hali === PaymentStatus.FULL).length, color: "#1B5E20" },
    { name: "Sehemu", value: wateja.filter(c => c.hali === PaymentStatus.PARTIAL).length, color: "#F57F17" },
    { name: "Hajali", value: wateja.filter(c => c.hali === PaymentStatus.NONE).length, color: "#B71C1C" },
    { name: "Zaidi", value: wateja.filter(c => c.hali === PaymentStatus.OVERPAID).length, color: "#0D47A1" },
  ].filter(d => d.value > 0);

  // Data for Bar Chart (Collections by Payment Method)
  const methodMap = new Map<string, number>();
  wateja.forEach(c => {
    const current = methodMap.get(c.njia_malipo) || 0;
    methodMap.set(c.njia_malipo, current + c.kilicholipwa);
  });
  
  const collectionData = Array.from(methodMap.entries()).map(([name, value]) => ({
    name,
    kiasi: value
  })).sort((a,b) => b.kiasi - a.kiasi).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex justify-end no-print">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrint}
          className="rounded-xl border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest gap-2"
        >
          <Printer className="h-4 w-4 text-indigo-500" />
          Print Chati
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Mawasilisho ya Malipo</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Fedha kwa Njia ya Malipo</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={collectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip formatter={(value: number) => value.toLocaleString() + " TZS"} />
              <Bar dataKey="kiasi" fill="#1A237E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
