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
    <div className="space-y-6 py-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h4 className="font-semibold text-[#1A237E]">{mteja.jina}</h4>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Deni lililopo:</span>
          <span className="font-bold text-red-600">{mteja.deni.toLocaleString()} {APP_CONFIG.currency}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Jumla ya bei:</span>
          <span className="font-bold">{mteja.bei_bidhaa.toLocaleString()} {APP_CONFIG.currency}</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="kiasi"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex justify-between items-center">
                   <span>Kiasi cha Malipo Kipya (TZS)</span>
                   <Button 
                    type="button" 
                    variant="link" 
                    className="h-auto p-0 text-[10px] text-indigo-600 font-bold"
                    onClick={() => form.setValue("kiasi", Number(mteja.deni))}
                   >
                     LIPA DENI LOTE
                   </Button>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="50000" 
                      {...field} 
                      value={isNaN(Number(field.value)) ? "" : field.value}
                      className="h-12 text-lg font-bold tabular-nums" 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="njia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Njia ya Malipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "Cash"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chagua..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Shekha">Shekha</SelectItem>
                    <SelectItem value="Zap Saccos">Zap Saccos</SelectItem>
                    <SelectItem value="SHOP">SHOP</SelectItem>
                    <SelectItem value="Jaji Mahakamani">Jaji Mahakamani</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tarehe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tarehe na Saa ya Malipo</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} value={field.value || ""} />
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
                  <Textarea placeholder="Kumbukumbu fupi..." {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-[#1B5E20] hover:bg-[#154618]">Hifadhi Malipo</Button>
        </form>
      </Form>
    </div>
  );
}
