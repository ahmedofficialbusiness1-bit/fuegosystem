import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  maelezo: z.string().min(2, "Maelezo yanahitajika"),
  kiasi: z.preprocess((val) => Number(val), z.number().min(1, "Kiasi lazima kiwe zaidi ya 0")),
  aina: z.string().min(1, "Chagua aina ya matumizi"),
  tarehe: z.string().min(1, "Chagua tarehe"),
});

interface AddExpenseFormProps {
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
  initialData?: {
    id?: string;
    maelezo: string;
    kiasi: number;
    aina: string;
    tarehe: any;
  };
}

export function AddExpenseForm({ onSubmit, isSubmitting, initialData }: AddExpenseFormProps) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maelezo: initialData?.maelezo || "",
      kiasi: Number(initialData?.kiasi) || 0,
      aina: initialData?.aina || "Mengineyo",
      tarehe: initialData?.tarehe?.toDate 
        ? initialData.tarehe.toDate().toISOString().slice(0, 16) 
        : (typeof initialData?.tarehe === 'string' ? initialData.tarehe : new Date().toISOString().slice(0, 16)),
    },
  });

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="aina"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[10px] font-black uppercase text-slate-500">Aina ya Matumizi</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "Mengineyo"}>
                <FormControl>
                  <SelectTrigger className="h-10 border-slate-200 focus:border-indigo-500 rounded-xl transition-all">
                    <SelectValue placeholder="Chagua aina" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl overflow-hidden">
                  <SelectItem value="Kodi" className="py-2.5 text-xs focus:bg-slate-50">Kodi</SelectItem>
                  <SelectItem value="Usafiri" className="py-2.5 text-xs focus:bg-slate-50">Usafiri</SelectItem>
                  <SelectItem value="Mishahara" className="py-2.5 text-xs focus:bg-slate-50">Mishahara</SelectItem>
                  <SelectItem value="Chakula" className="py-2.5 text-xs focus:bg-slate-50">Chakula</SelectItem>
                  <SelectItem value="Malighafi" className="py-2.5 text-xs focus:bg-slate-50">Malighafi</SelectItem>
                  <SelectItem value="Umeme/Maji" className="py-2.5 text-xs focus:bg-slate-50">Umeme/Maji</SelectItem>
                  <SelectItem value="Mengineyo" className="py-2.5 text-xs focus:bg-slate-50">Mengineyo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-[9px]" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="kiasi"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-black uppercase text-slate-500">Kiasi (TZS)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="number" 
                      {...field} 
                      value={isNaN(Number(field.value)) ? "" : field.value}
                      className="h-10 pl-4 pr-12 font-bold border-slate-200 focus:border-indigo-500 rounded-xl bg-slate-50/50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">TZS</span>
                  </div>
                </FormControl>
                <FormMessage className="text-[9px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tarehe"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-black uppercase text-slate-500">Tarehe</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    value={field.value || ""}
                    className="h-10 border-slate-200 focus:border-indigo-500 rounded-xl bg-slate-50/50 text-[10px]"
                  />
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
              <FormLabel className="text-[10px] font-black uppercase text-slate-500">Maelezo</FormLabel>
              <FormControl>
                <Textarea 
                   placeholder="Elezea matumizi haya..." 
                   className="resize-none min-h-[80px] text-xs border-slate-200 focus:border-indigo-500 rounded-xl bg-slate-50/50 p-3"
                   {...field} 
                   value={field.value || ""}
                />
              </FormControl>
              <FormMessage className="text-[9px]" />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full h-11 bg-red-600 hover:bg-black text-white font-black uppercase tracking-widest rounded-xl shadow-lg transition-all"
        >
          {isSubmitting ? "Inahifadhi..." : initialData ? "Sasisha" : "Hifadhi Matumizi"}
        </Button>
      </form>
    </Form>
  );
}
