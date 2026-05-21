import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Customer } from "../types";
import { APP_CONFIG } from "../constants";

const formSchema = z.object({
  kiasi: z.coerce.number().min(1, "Kiasi lazima kiwe zaidi ya 0"),
  njia: z.string().min(1, "Chagua njia ya malipo"),
  tarehe: z.string().min(1, "Chagua tarehe ya malipo"),
  maelezo: z.string().optional(),
});

interface AddPaymentFormProps {
  mteja: Customer;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
}

export function AddPaymentForm({ mteja, onSubmit }: AddPaymentFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      kiasi: 0,
      njia: "Cash",
      tarehe: new Date().toISOString().slice(0, 16),
      maelezo: mteja.maelezo || "",
    },
  });

  return (
    <div className="space-y-4 py-2">
      <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex justify-between items-center">
        <div>
          <h4 className="font-black text-[#1A237E] text-xs uppercase tracking-tight">{mteja.jina}</h4>
          <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{mteja.njia_malipo || "Binafsi"}</p>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-black text-slate-400 uppercase block">Deni Lililopo</span>
          <span className="font-black text-red-600 text-sm">{mteja.deni.toLocaleString()}</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="kiasi"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                   <span>Kiasi cha Malipo (TZS)</span>
                   <Button 
                    type="button" 
                    variant="link" 
                    className="h-auto p-0 text-[9px] text-indigo-600 font-black uppercase tracking-tighter"
                    onClick={() => form.setValue("kiasi", Number(mteja.deni))}
                   >
                     LIPA YOTE
                   </Button>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field} 
                    value={isNaN(Number(field.value)) ? "" : field.value}
                    className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold tabular-nums text-sm focus:ring-indigo-500" 
                  />
                </FormControl>
                <FormMessage className="text-[9px]" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="njia"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Njia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "Cash"}>
                    <FormControl>
                      <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Cash" className="text-xs">Cash</SelectItem>
                      <SelectItem value="Shekha" className="text-xs">Shekha</SelectItem>
                      <SelectItem value="Zap Saccos" className="text-xs">Zap Saccos</SelectItem>
                      <SelectItem value="SHOP" className="text-xs">SHOP</SelectItem>
                      <SelectItem value="Jaji Mahakamani" className="text-xs">Jaji</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[9px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tarehe"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tarehe</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value || ""} className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[10px] font-bold px-2" />
                  </FormControl>
                  <FormMessage className="text-[9px]" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="maelezo"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Maelezo</FormLabel>
                <FormControl>
                  <Input placeholder="Optional..." {...field} value={field.value || ""} className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px]" />
                </FormControl>
                <FormMessage className="text-[9px]" />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg mt-2">Hifadhi Malipo</Button>
        </form>
      </Form>
    </div>
  );
}
