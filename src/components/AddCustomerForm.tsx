import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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
import { InventoryItem, Customer } from "../types";

const formSchema = z.object({
  jina: z.string().min(2, "Jina lazima liwe na herufi angalau 2"),
  idadi: z.coerce.number().min(1, "Idadi lazima iwe > 0"),
  bei_kila_moja: z.coerce.number().min(0),
  bei_bidhaa: z.coerce.number().min(0),
  kilicholipwa: z.coerce.number().min(0, "Kilicholipwa hakiwezi kuwa negative"),
  malipo_mapya: z.coerce.number().min(0, "Malipo mapya hayawezi kuwa negative").optional(),
  njia_malipo: z.string().min(1, "Chagua kikundi"),
  simu: z.string().optional(),
  maelezo: z.string().optional(),
  bidhaa_id: z.string().optional(),
  bidhaa_jina: z.string().optional(),
});

interface AddCustomerFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  inventory?: InventoryItem[];
  wateja?: Customer[];
}

export function AddCustomerForm({ onSubmit: onSubmitProp, initialData, inventory = [], wateja = [] }: AddCustomerFormProps) {
  const defaultProduct = inventory && inventory.length > 0 ? inventory[0] : null;

  const existingGroups = useMemo(() => {
    const groupsSet = new Set<string>();
    // Pre-populate with standard/common options
    groupsSet.add("Cash");
    groupsSet.add("Shekha");
    groupsSet.add("Zap Saccos");
    groupsSet.add("SHOP");
    groupsSet.add("Jaji Mahakamani");

    // Add unique groups from existing customers
    wateja.forEach(m => {
      if (m.njia_malipo && m.njia_malipo.trim()) {
        groupsSet.add(m.njia_malipo.trim());
      }
    });

    return Array.from(groupsSet);
  }, [wateja]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData ? {
      jina: initialData.jina || "",
      idadi: Number(initialData.idadi) || 1,
      bei_kila_moja: Number(initialData.idadi) > 0 ? (Number(initialData.bei_bidhaa) / Number(initialData.idadi)) : UNIT_PRICE,
      bei_bidhaa: Number(initialData.bei_bidhaa) || UNIT_PRICE,
      kilicholipwa: Number(initialData.kilicholipwa) || 0,
      malipo_mapya: 0,
      njia_malipo: initialData.njia_malipo || "Cash",
      simu: initialData.simu || "",
      maelezo: initialData.maelezo || "",
      bidhaa_id: initialData.bidhaa_id || defaultProduct?.id || "",
      bidhaa_jina: initialData.bidhaa_jina || defaultProduct?.jina || "",
    } : {
      jina: "",
      idadi: 1,
      bei_kila_moja: defaultProduct?.bei_yake || UNIT_PRICE,
      bei_bidhaa: defaultProduct?.bei_yake || UNIT_PRICE,
      kilicholipwa: 0,
      malipo_mapya: 0,
      njia_malipo: "Cash",
      simu: "",
      maelezo: "",
      bidhaa_id: defaultProduct?.id || "",
      bidhaa_jina: defaultProduct?.jina || "",
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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("Submitting form data:", data);
    onSubmitProp(data);
  };

  const onInvalid = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error("Tafadhali kagua sehemu zilizowekwa nyekundu.");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-2 py-0">
        <FormField
          control={form.control}
          name="jina"
          render={({ field }) => (
            <FormItem className="space-y-0.5">
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jina kamili</FormLabel>
              <FormControl>
                <Input placeholder="Ingiza jina..." {...field} className="h-9 text-[13px] font-bold py-0 px-3 bg-slate-50/50" />
              </FormControl>
              <FormMessage className="text-[9px] font-bold" />
            </FormItem>
          )}
        />

        {inventory && inventory.length > 0 && (
          <FormField
            control={form.control}
            name="bidhaa_id"
            render={({ field }) => (
              <FormItem className="space-y-0.5">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Chagua Bidhaa Iliyouzwa</FormLabel>
                <Select
                  onValueChange={(val) => {
                    const selectedItem = inventory.find(item => item.id === val);
                    if (selectedItem) {
                      form.setValue("bidhaa_id", val);
                      form.setValue("bidhaa_jina", selectedItem.jina);
                      
                      // Auto-populate unit price
                      form.setValue("bei_kila_moja", selectedItem.bei_yake);
                      const currentQty = Number(form.getValues("idadi")) || 1;
                      form.setValue("bei_bidhaa", currentQty * selectedItem.bei_yake);
                    }
                  }}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 text-[13px] font-bold py-0 px-3 bg-indigo-50/30 border-indigo-100">
                      <SelectValue placeholder="Chagua bidhaa..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {inventory.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="text-xs font-bold text-slate-700">
                        {item.jina} (TZS {item.bei_yake.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[9px] font-bold" />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="njia_malipo"
          render={({ field }) => (
            <FormItem className="space-y-0.5">
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kikundi / Njia</FormLabel>
              <FormControl>
                <div className="relative group/input">
                  <Input 
                    placeholder="Andika au chagua..." 
                    {...field} 
                    className="pr-10 h-9 text-[13px] font-bold py-0 px-3 bg-slate-50/50"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-8 h-8 border-none bg-transparent hover:bg-slate-100 rounded-md p-0 flex items-center justify-center">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingGroups.map((group) => (
                          <SelectItem key={group} value={group} className="text-xs font-bold text-slate-700">
                            {group === "Cash" ? "Cash (Binafsi)" : group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FormControl>
              <FormMessage className="text-[9px] font-bold" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="idadi"
            render={({ field }) => (
              <FormItem className="space-y-0.5">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Idadi (Pcs)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    className="h-9 text-[13px] font-black tabular-nums py-0 px-3 bg-slate-50/50"
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                      field.onChange(isNaN(val) ? 0 : val);
                      const currentUnitPrice = Number(form.getValues("bei_kila_moja"));
                      form.setValue("bei_bidhaa", (isNaN(val) ? 0 : val) * (isNaN(currentUnitPrice) ? 0 : currentUnitPrice));
                    }}
                  />
                </FormControl>
                <FormMessage className="text-[9px] font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bei_kila_moja"
            render={({ field }) => (
              <FormItem className="space-y-0.5">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bei ya 1</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="number" 
                      {...field} 
                      className="h-9 text-[13px] font-black tabular-nums border-indigo-100 py-0 px-3 bg-slate-50/50"
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        field.onChange(isNaN(val) ? 0 : val);
                        const currentQty = Number(form.getValues("idadi"));
                        form.setValue("bei_bidhaa", (isNaN(val) ? 0 : val) * (isNaN(currentQty) ? 0 : currentQty));
                      }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300">TZS</span>
                  </div>
                </FormControl>
                <FormMessage className="text-[9px] font-bold" />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
          type="button" 
          variant="outline" 
          className={cn(
            "flex-1 h-7 text-[8px] font-black uppercase tracking-widest transition-all rounded-lg px-2",
            unitPriceValue === UNIT_PRICE ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" : "border-slate-100 text-slate-400"
          )}
          onClick={() => {
            form.setValue("bei_kila_moja", UNIT_PRICE);
            form.setValue("bei_bidhaa", Number(form.getValues("idadi")) * UNIT_PRICE);
          }}
          >
            JM (120,000)
          </Button>
          <Button 
          type="button" 
          variant="outline" 
          className={cn(
            "flex-1 h-7 text-[8px] font-black uppercase tracking-widest transition-all rounded-lg px-2",
            unitPriceValue === RETAIL_PRICE ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" : "border-slate-100 text-slate-400"
          )}
          onClick={() => {
            form.setValue("bei_kila_moja", RETAIL_PRICE);
            form.setValue("bei_bidhaa", Number(form.getValues("idadi")) * RETAIL_PRICE);
          }}
          >
            RE (140,000)
          </Button>
        </div>

        <FormField
          control={form.control}
          name="bei_bidhaa"
          render={({ field }) => (
            <FormItem className="space-y-0.5">
              <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Jumla kuu ya Bill (Total)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="number" 
                    {...field} 
                    className={cn(
                      "h-11 text-xl font-black tabular-nums bg-white border-dashed border-2 px-4 pr-16",
                      (Number(field.value) || 0) > (Number(idadiValue) || 0) * UNIT_PRICE ? "text-emerald-700 border-emerald-200" : 
                      (Number(field.value) || 0) < (Number(idadiValue) || 0) * UNIT_PRICE ? "text-red-700 border-red-200" : "text-[#1A237E] border-indigo-200"
                    )} 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300">TZS</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage className="text-[9px] font-bold" />
            </FormItem>
          )}
        />


        {initialData ? (
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-3 my-2">
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest leading-none">Marekebisho ya Hesabu & Malipo Mapya</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
              <div>
                <span className="text-[9px] text-slate-400 block font-normal uppercase">Kiasi kilicholipwa awali</span>
                <span className="text-[13px] font-black text-slate-800">TZS {Number(initialData.kilicholipwa || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-normal uppercase">Deni la sasa</span>
                <span className="text-[13px] font-black text-red-600">TZS {Number(initialData.deni || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <FormField
                control={form.control}
                name="malipo_mapya"
                render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-emerald-700 leading-none">Muingize Kiasi Hapa</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Weka kiasi kilicholipwa sasa..." 
                        {...field} 
                        className="h-9 text-[13px] font-black border-emerald-200 focus:border-emerald-500 bg-white"
                      />
                    </FormControl>
                    <FormMessage className="text-[9px] font-bold" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kilicholipwa"
                render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Sahihisha Cha Mwanzoni</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        className="h-9 text-[13px] font-bold bg-white"
                      />
                    </FormControl>
                    <FormMessage className="text-[9px] font-bold" />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] bg-white px-3 py-2 rounded-xl border border-indigo-50/50">
              <span className="font-bold text-slate-400 uppercase">Jumla Itakayolipwa sasa</span>
              <span className="font-black text-indigo-700 text-xs text-right">
                TZS {((Number(form.watch("kilicholipwa")) || 0) + (Number(form.watch("malipo_mapya")) || 0)).toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <FormField
              control={form.control}
              name="kilicholipwa"
              render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Kiasi kilicholipwa</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="h-9 text-[13px] font-black tabular-nums px-3 bg-slate-50/50" />
                  </FormControl>
                  <FormMessage className="text-[9px] font-bold" />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <FormField
            control={form.control}
            name="simu"
            render={({ field }) => (
              <FormItem className="space-y-0.5">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Namba ya Simu</FormLabel>
                <FormControl>
                  <Input placeholder="07.." {...field} className="h-9 text-[13px] font-bold px-3 bg-slate-50/50" />
                </FormControl>
                <FormMessage className="text-[9px] font-bold" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="maelezo"
          render={({ field }) => (
            <FormItem className="space-y-0.5">
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Maelezo ya ziada</FormLabel>
              <FormControl>
                <Textarea placeholder="Andika maelezo hapa..." {...field} className="min-h-[50px] text-[12px] font-semibold py-2 px-3 resize-none bg-slate-50/50" />
              </FormControl>
              <FormMessage className="text-[9px] font-bold" />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={form.formState.isSubmitting}
          className="w-full h-11 bg-[#1A237E] hover:bg-black text-white font-black uppercase tracking-[0.15em] rounded-xl text-xs mt-2 shadow-lg transition-all active:scale-95 flex gap-2 items-center justify-center"
        >
          {form.formState.isSubmitting ? "Inahifadhi..." : "Hifadhi Mteja"}
        </Button>
      </form>
    </Form>
  );
}
