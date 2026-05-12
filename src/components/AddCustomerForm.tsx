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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="jina"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jina la Mteja</FormLabel>
              <FormControl>
                <Input placeholder="Sema Jina..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="njia_malipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kikundi / Njia</FormLabel>
              <FormControl>
                <div className="relative group/input">
                  <Input 
                    placeholder="Andika jina la kikundi..." 
                    {...field} 
                    className="pr-10"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-8 h-8 p-0 border-none bg-transparent hover:bg-slate-100 rounded-md">
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="idadi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Idadi (Pcs)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                      field.onChange(isNaN(val) ? 0 : val);
                      // Force update total
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
              <FormItem>
                <FormLabel>Bei ya 1 (TZS)</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input 
                        type="number" 
                        {...field} 
                        className="h-11 font-bold border-indigo-200 focus:border-indigo-500"
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : Number(e.target.value);
                          field.onChange(isNaN(val) ? 0 : val);
                          // Force update total
                          const currentQty = Number(form.getValues("idadi"));
                          form.setValue("bei_bidhaa", (isNaN(val) ? 0 : val) * (isNaN(currentQty) ? 0 : currentQty));
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">TZS</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button 
          type="button" 
          variant="outline" 
          className={cn(
            "flex-1 h-8 text-[9px] font-black uppercase tracking-widest transition-all",
            unitPriceValue === UNIT_PRICE ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-slate-200"
          )}
          onClick={() => {
            form.setValue("bei_kila_moja", UNIT_PRICE);
            form.setValue("bei_bidhaa", Number(form.getValues("idadi")) * UNIT_PRICE);
          }}
          >
            Jumla (120k)
          </Button>
          <Button 
          type="button" 
          variant="outline" 
          className={cn(
            "flex-1 h-8 text-[9px] font-black uppercase tracking-widest transition-all",
            unitPriceValue === RETAIL_PRICE ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-slate-200"
          )}
          onClick={() => {
            form.setValue("bei_kila_moja", RETAIL_PRICE);
            form.setValue("bei_bidhaa", Number(form.getValues("idadi")) * RETAIL_PRICE);
          }}
          >
            Reja (140k)
          </Button>
        </div>

        <FormField
          control={form.control}
          name="bei_bidhaa"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Jumla ya Bei Inayobidwa (Total Bill)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="number" 
                    {...field} 
                    value={isNaN(Number(field.value)) ? 0 : field.value}
                    className={cn(
                      "h-14 text-2xl font-black tabular-nums bg-slate-50/50 border-dashed border-2",
                      (Number(field.value) || 0) > (Number(idadiValue) || 0) * UNIT_PRICE ? "text-emerald-700 border-emerald-100" : 
                      (Number(field.value) || 0) < (Number(idadiValue) || 0) * UNIT_PRICE ? "text-red-700 border-red-100" : "text-[#1A237E] border-indigo-100"
                    )} 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {(Number(field.value) || 0) > (Number(idadiValue) || 0) * UNIT_PRICE && (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase shadow-sm">Markup +{((Number(field.value) || 0) - ((Number(idadiValue) || 0) * UNIT_PRICE)).toLocaleString()}</span>
                    )}
                    {(Number(field.value) || 0) < (Number(idadiValue) || 0) * UNIT_PRICE && (
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase shadow-sm">Discount -{ (((Number(idadiValue) || 0) * UNIT_PRICE) - (Number(field.value) || 0)).toLocaleString()}</span>
                    )}
                    <span className="text-xs font-black text-slate-400">TZS</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          control={form.control}
          name="kilicholipwa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kilicholipwa (TZS)</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={isNaN(Number(field.value)) ? 0 : field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="simu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Namba ya Simu (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="07xxxxxxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maelezo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maelezo (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-[#1A237E]">Hifadhi Mteja</Button>
      </form>
    </Form>
  );
}
