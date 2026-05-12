import { useEffect } from "react";
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
import { UNIT_PRICE, RETAIL_PRICE } from "../constants";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  jina: z.string().min(2, "Jina lazima liwe na herufi angalau 2"),
  idadi: z.coerce.number().min(1, "Idadi lazima iwe > 0"),
  bei_kila_moja: z.coerce.number().min(0),
  bei_bidhaa: z.coerce.number().min(0),
  kilicholipwa: z.coerce.number().min(0, "Kilicholipwa hakiwezi kuwa negative"),
  njia_malipo: z.string().min(1, "Chagua kikundi"),
  simu: z.string().optional(),
  maelezo: z.string().optional(),
});

interface AddCustomerFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  initialData?: any;
}

export function AddCustomerForm({ onSubmit, initialData }: AddCustomerFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData ? {
      jina: initialData.jina || "",
      idadi: Number(initialData.idadi) || 1,
      bei_kila_moja: Number(initialData.idadi) > 0 ? (Number(initialData.bei_bidhaa) / Number(initialData.idadi)) : UNIT_PRICE,
      bei_bidhaa: Number(initialData.bei_bidhaa) || UNIT_PRICE,
      kilicholipwa: Number(initialData.kilicholipwa) || 0,
      njia_malipo: initialData.njia_malipo || "Cash",
      simu: initialData.simu || "",
      maelezo: initialData.maelezo || "",
    } : {
      jina: "",
      idadi: 1,
      bei_kila_moja: UNIT_PRICE,
      bei_bidhaa: UNIT_PRICE,
      kilicholipwa: 0,
      njia_malipo: "Cash",
      simu: "",
      maelezo: "",
    },
  });

  const idadiValue = form.watch("idadi");
  const unitPriceValue = form.watch("bei_kila_moja");

  // Synchronize total price when qty or unit price changes
  useEffect(() => {
    const qty = Number(idadiValue);
    const unit = Number(unitPriceValue);
    if (!isNaN(qty) && !isNaN(unit)) {
      form.setValue("bei_bidhaa", qty * unit);
    } else {
      form.setValue("bei_bidhaa", 0);
    }
  }, [idadiValue, unitPriceValue, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1.5 py-0">
        <FormField
          control={form.control}
          name="jina"
          render={({ field }) => (
            <FormItem className="space-y-0.5">
              <FormLabel className="text-[8px] font-black uppercase tracking-widest text-slate-400">Jina</FormLabel>
              <FormControl>
                <Input placeholder="Sema Jina..." {...field} className="h-7 text-[12px] font-bold py-0 px-2" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="njia_malipo"
          render={({ field }) => (
            <FormItem className="space-y-0.5">
              <FormLabel className="text-[8px] font-black uppercase tracking-widest text-slate-400">Kikundi</FormLabel>
              <FormControl>
                <div className="relative group/input">
                  <Input 
                    placeholder="Andika..." 
                    {...field} 
                    className="pr-8 h-7 text-[12px] font-bold py-0 px-2"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-6 h-6 border-none bg-transparent hover:bg-slate-100 rounded-md p-0">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash (Binafsi)</SelectItem>
                        <SelectItem value="Shekha">Shekha</SelectItem>
                        <SelectItem value="Zap Saccos">Zap Saccos</SelectItem>
                        <SelectItem value="SHOP">SHOP</SelectItem>
                        <SelectItem value="Jaji Mahakamani">Jaji Mahakamani</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="idadi"
            render={({ field }) => (
              <FormItem className="space-y-0.5">
                <FormLabel className="text-[8px] font-black uppercase tracking-widest text-slate-400">Pcs</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    className="h-7 text-[12px] font-black tabular-nums py-0 px-2"
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                      field.onChange(isNaN(val) ? 0 : val);
                      const currentUnitPrice = Number(form.getValues("bei_kila_moja"));
                      form.setValue("bei_bidhaa", (isNaN(val) ? 0 : val) * (isNaN(currentUnitPrice) ? 0 : currentUnitPrice));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bei_kila_moja"
            render={({ field }) => (
              <FormItem className="space-y-0.5">
                <FormLabel className="text-[8px] font-black uppercase tracking-widest text-slate-400">Bei @</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="number" 
                      {...field} 
                      className="h-7 text-[12px] font-black tabular-nums border-indigo-100 py-0 px-2"
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        field.onChange(isNaN(val) ? 0 : val);
                        const currentQty = Number(form.getValues("idadi"));
                        form.setValue("bei_bidhaa", (isNaN(val) ? 0 : val) * (isNaN(currentQty) ? 0 : currentQty));
                      }}
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-300">TZS</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex gap-1">
          <Button 
          type="button" 
          variant="outline" 
          className={cn(
            "flex-1 h-5 text-[6px] font-black uppercase tracking-widest transition-all rounded-md px-1",
            unitPriceValue === UNIT_PRICE ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" : "border-slate-50 text-slate-300"
          )}
          onClick={() => {
            form.setValue("bei_kila_moja", UNIT_PRICE);
            form.setValue("bei_bidhaa", Number(form.getValues("idadi")) * UNIT_PRICE);
          }}
          >
            JM (120k)
          </Button>
          <Button 
          type="button" 
          variant="outline" 
          className={cn(
            "flex-1 h-5 text-[6px] font-black uppercase tracking-widest transition-all rounded-md px-1",
            unitPriceValue === RETAIL_PRICE ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" : "border-slate-50 text-slate-300"
          )}
          onClick={() => {
            form.setValue("bei_kila_moja", RETAIL_PRICE);
            form.setValue("bei_bidhaa", Number(form.getValues("idadi")) * RETAIL_PRICE);
          }}
          >
            RE (140k)
          </Button>
        </div>

        <FormField
          control={form.control}
          name="bei_bidhaa"
          render={({ field }) => (
            <FormItem className="space-y-0.5">
              <FormLabel className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Jumla ya Bill</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="number" 
                    {...field} 
                    value={isNaN(Number(field.value)) ? 0 : field.value}
                    className={cn(
                      "h-9 text-[16px] font-black tabular-nums bg-slate-50/50 border-dashed border px-3 pr-10",
                      (Number(field.value) || 0) > (Number(idadiValue) || 0) * UNIT_PRICE ? "text-emerald-700 border-emerald-100" : 
                      (Number(field.value) || 0) < (Number(idadiValue) || 0) * UNIT_PRICE ? "text-red-700 border-red-100" : "text-[#1A237E] border-indigo-50"
                    )} 
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-[8px] font-black text-slate-300">TZS</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="kilicholipwa"
            render={({ field }) => (
              <FormItem className="space-y-0.5">
                <FormLabel className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Lipwa</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={isNaN(Number(field.value)) ? 0 : field.value} className="h-7 text-[12px] font-black tabular-nums py-0 px-2" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="simu"
            render={({ field }) => (
              <FormItem className="space-y-0.5">
                <FormLabel className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Simu (Opt)</FormLabel>
                <FormControl>
                  <Input placeholder="07.." {...field} className="h-7 text-[12px] font-bold py-0 px-2" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="maelezo"
          render={({ field }) => (
            <FormItem className="space-y-0.5">
              <FormLabel className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Maelezo (Opt)</FormLabel>
              <FormControl>
                <Textarea placeholder="..." {...field} className="min-h-[40px] text-[11px] font-semibold py-1 px-2 resize-none" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-9 bg-[#1A237E] hover:bg-black text-white font-black uppercase tracking-[0.1em] rounded-xl text-[11px] mt-1 shadow-md">
          Hifadhi Mteja
        </Button>
      </form>
    </Form>
  );
}
