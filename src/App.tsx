/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ArrowUpCircle, 
  Plus,
  BarChart3,
  Search,
  LogOut,
  TrendingUp,
  Percent,
  Printer,
  Download,
  Flame,
  ShieldCheck,
  Zap,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { APP_CONFIG } from "./constants";
import { PaymentStatus, Customer, CustomerHistory, Expense } from "./types";
import { WatejaTable } from "./components/WatejaTable";
import { AddCustomerForm } from "./components/AddCustomerForm";
import { AddPaymentForm } from "./components/AddPaymentForm";
import { HistoryTable } from "./components/HistoryTable";
import { ExcelImport } from "./components/ExcelImport";
import { AddExpenseForm } from "./components/AddExpenseForm";
import { ExpenseTable } from "./components/ExpenseTable";
import { VikundiView } from "./components/VikundiView";
import { calculateHali, calculateDeni } from "./lib/logic";
import { seedData } from "./lib/seed";
import { UNIT_PRICE } from "./constants";

// Firebase imports - will be used once configured
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  where,
  increment,
  writeBatch,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "./lib/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

import { StatsCharts } from "./components/StatsCharts";
import { cn } from "@/lib/utils";
import { exportToExcel, exportToPDF, exportProfitReportToPDF, exportFullBackup } from "@/lib/exportUtils";

export default function App() {
  const [activeTab, setActiveTab] = useState("all");
  const [wateja, setWateja] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [selectedMteja, setSelectedMteja] = useState<Customer | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<CustomerHistory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [user, setUser] = useState<any>(null);
  const [prefferedGroup, setPrefferedGroup] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth Form State
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Auth Listener & Persistence
  useEffect(() => {
    // Explicitly set persistence to local
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setWateja([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Data Sync
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(collection(db, "wateja"));
    
    const unsubscribeWateja = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      // Sort manually by date ASC for reports
      const sortedData = [...data].sort((a, b) => {
        const dateA = a.tarehe_kuongezwa?.toDate ? a.tarehe_kuongezwa.toDate() : new Date(0);
        const dateB = b.tarehe_kuongezwa?.toDate ? b.tarehe_kuongezwa.toDate() : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });
      setWateja(sortedData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "wateja");
      toast.error("Imeshindwa kupakia data");
      setLoading(false);
    });

    const expensesQ = query(collection(db, "expenses"));
    const unsubscribeExpenses = onSnapshot(expensesQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      const sortedData = [...data].sort((a, b) => {
        const dateA = a.tarehe?.toDate ? a.tarehe.toDate() : new Date(0);
        const dateB = b.tarehe?.toDate ? b.tarehe.toDate() : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });
      setExpenses(sortedData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "expenses");
    });

    return () => {
      unsubscribeWateja();
      unsubscribeExpenses();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Umeingia kwa mafanikio");
    } catch (error: any) {
      console.error("Login Error Details:", error);
      
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
        toast.error("Popup imezuiwa au haitumiki hapa! Tafadhali fungua mfumo kwenye TAB MPYA kwa kutumia icon ya juu kulia.");
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error("Domain hii hairuhusiwi! Ongeza '" + window.location.hostname + "' kwenye Firebase Console (Authorized Domains).");
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        toast.info("Login iliahirishwa.");
      } else {
        toast.error("Kosa la kuingia: " + (error.code || error.message));
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.info("Umetoka kwenye mfumo");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Tafadhali jaza email na password.");
      return;
    }
    
    setAuthSubmitting(true);
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Karibu tena!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Akaunti imetengenezwa vizuri!");
      }
    } catch (error: any) {
      console.error("Email Auth Error:", error);
      let message = "Kosa limetokea. Jaribu tena.";
      if (error.code === "auth/user-not-found") message = "Mtumiaji hajapatikana.";
      if (error.code === "auth/wrong-password") message = "Password siyo sahihi.";
      if (error.code === "auth/email-already-in-use") message = "Email hii tayari inatumika.";
      if (error.code === "auth/weak-password") message = "Password lazima iwe na angalau herufi 6.";
      if (error.code === "auth/invalid-email") message = "Email yako siyo sahihi.";
      toast.error(message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Tafadhali jaza email kwanza kwenye kisanduku cha email.", {
        description: "Andika email yako kwanza kisha ubonyeze hapa tena."
      });
      return;
    }
    
    const toastId = toast.loading("Inatuma email ya kureset password...");
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      toast.success("Email ya kureset password imetumwa!", {
        id: toastId,
        description: "Tafadhali kagua Inbox yako (au Spam folder)."
      });
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      let message = "Imeshindwa kutuma email.";
      if (error.code === "auth/user-not-found") message = "Email hii haikuonekana kwenye mfumo wetu.";
      if (error.code === "auth/invalid-email") message = "Email uliyoingiza siyo sahihi.";
      if (error.code === "auth/too-many-requests") message = "Maombi mengi yameingia. Subiri kidogo kisha jaribu tena.";
      
      toast.error(message, { 
        id: toastId,
        description: `Kosa: ${error.code || "Hitilafu ya mtandao"}`
      });
    }
  };

  const handleAddCustomer = async (formData: any) => {
    try {
      const hali = calculateHali(formData.kilicholipwa, formData.bei_bidhaa);
      const deni = calculateDeni(formData.kilicholipwa, formData.bei_bidhaa);
      
      const sanitizedData = { ...formData };
      Object.keys(sanitizedData).forEach(key => {
        if (sanitizedData[key] === undefined) {
          sanitizedData[key] = "";
        }
      });

      const mtejaRef = await addDoc(collection(db, "wateja"), {
        ...sanitizedData,
        hali,
        deni,
        tarehe_kuongezwa: serverTimestamp(),
        tarehe_kulipwa: hali === PaymentStatus.FULL ? serverTimestamp() : null
      });

      // Add to history
      if (formData.kilicholipwa > 0) {
        await addDoc(collection(db, "wateja", mtejaRef.id, "historia_malipo"), {
          kiasi: formData.kilicholipwa,
          njia: formData.njia_malipo,
          tarehe: serverTimestamp(),
          deni_kabla: formData.bei_bidhaa,
          deni_baada: deni,
          aliyehifadhi: user.email
        });
      }

      setIsAddingCustomer(false);
      toast.success("Mteja ameongezwa");
    } catch (error: any) {
      console.error("Add customer error:", error);
      const errInfo = error.message.startsWith("{") ? JSON.parse(error.message) : { error: error.message };
      toast.error(`Imeshindwa kuhifadhi: ${errInfo.error || "Hitilafu ya mtandao"}`);
    }
  };

  const handleBulkUpdateWateja = async (
    updates: { id: string, data: Partial<Customer>, amountAdded: number, paymentMethod: string, tarehe?: any }[],
    groupContext?: { name: string, totalAmount: number, tarehe?: any }
  ) => {
    try {
      // Chunk the updates to avoid Firestore batch limits
      const CHUNK_SIZE = 200;
      for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
        const chunk = updates.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        
        chunk.forEach(update => {
          const docRef = doc(db, "wateja", update.id);
          const finalData = { ...update.data };
          const paymentDate = (update.tarehe || groupContext?.tarehe) 
            ? Timestamp.fromDate(new Date(update.tarehe || groupContext?.tarehe)) 
            : serverTimestamp();
          
          // Sanitize finalData to prevent undefined values
          Object.keys(finalData).forEach(key => {
            if (finalData[key as keyof typeof finalData] === undefined) {
              delete finalData[key as keyof typeof finalData];
            }
          });

          if (finalData.hali === PaymentStatus.FULL || finalData.hali === PaymentStatus.OVERPAID) {
            finalData.tarehe_kulipwa = paymentDate;
          }

          if (finalData.kilicholipwa !== undefined) finalData.kilicholipwa = Number(finalData.kilicholipwa);
          if (finalData.deni !== undefined) finalData.deni = Number(finalData.deni);

          batch.update(docRef, finalData);
          
          const member = wateja.find(m => m.id === update.id);
          if (member && update.amountAdded > 0) {
            const historyRef = doc(collection(db, "wateja", update.id, "historia_malipo"));
            batch.set(historyRef, {
              kiasi: Number(update.amountAdded),
              njia: update.paymentMethod || "Malipo ya Pamoja",
              tarehe: paymentDate,
              deni_kabla: Number(member.deni),
              deni_baada: Number(update.data.deni ?? 0),
              aliyehifadhi: auth.currentUser?.email || user?.email || "System"
            });
          }
        });
        
        await batch.commit();
      }

      // Record group level payment record if provided
      if (groupContext && groupContext.totalAmount > 0) {
        const groupDate = groupContext.tarehe ? Timestamp.fromDate(new Date(groupContext.tarehe)) : serverTimestamp();
        await addDoc(collection(db, "vikundi_malipo"), {
          kikundi: groupContext.name,
          kiasi: groupContext.totalAmount,
          tarehe: groupDate,
          aliyehifadhi: auth.currentUser?.email || user?.email || "System"
        });
      }
      
      setWateja(prev => prev.map(m => {
        const update = updates.find(u => u.id === m.id);
        if (update) {
          const finalUpdate = { ...update.data };
          if (finalUpdate.hali === PaymentStatus.FULL || finalUpdate.hali === PaymentStatus.OVERPAID) {
            finalUpdate.tarehe_kulipwa = new Date().toISOString(); 
          }
          return { ...m, ...finalUpdate };
        }
        return m;
      }));

      toast.success(groupContext 
        ? `Malipo ya kikundi ${groupContext.name} yamehifadhiwa`
        : `Malipo ya kikundi yamehifadhiwa kwa wateja ${updates.length}`
      );
    } catch (error) {
       console.error("Bulk payment error:", error);
       handleFirestoreError(error, OperationType.WRITE, "wateja/bulk");
       toast.error("Imefeli kuhifadhi malipo ya kikundi. Tafadhali jaribu tena.");
    }
  };

  const handleUpdateCustomer = async (formData: any) => {
    if (!selectedMteja) return;
    try {
      const hali = calculateHali(formData.kilicholipwa, formData.bei_bidhaa);
      const deni = calculateDeni(formData.kilicholipwa, formData.bei_bidhaa);
      
      const mtejaRef = doc(db, "wateja", selectedMteja.id);
      
      const sanitizedData = { ...formData };
      Object.keys(sanitizedData).forEach(key => {
        if (sanitizedData[key] === undefined) {
          sanitizedData[key] = "";
        }
      });

      await updateDoc(mtejaRef, {
        ...sanitizedData,
        hali,
        deni,
        tarehe_kulipwa: hali === PaymentStatus.FULL ? (selectedMteja.tarehe_kulipwa || serverTimestamp()) : null
      });

      setIsAddingCustomer(false);
      setSelectedMteja(null);
      toast.success("Taarifa zimebadilishwa");
    } catch (error: any) {
      console.error("Update customer error:", error);
      const errInfo = error.message.startsWith("{") ? JSON.parse(error.message) : { error: error.message };
      toast.error(`Imeshindwa kubadili: ${errInfo.error || "Hitilafu ya mtandao"}`);
    }
  };

  const handleFixMath = async (mteja: Customer) => {
    try {
      // Determine what the price should be. 
      // If it's wholesale (120k * idadi) or retail (140k * idadi) 
      // We try to find which one is closer or default to wholesale
      const wholesaleTotal = mteja.idadi * UNIT_PRICE;
      const retailTotal = mteja.idadi * 140000;
      
      // If the current price is closer to retail, we use retail, otherwise wholesale
      const correctlyCalculatedTotal = Math.abs(mteja.bei_bidhaa - retailTotal) < Math.abs(mteja.bei_bidhaa - wholesaleTotal) 
        ? retailTotal 
        : wholesaleTotal;

      const hali = calculateHali(mteja.kilicholipwa, correctlyCalculatedTotal);
      const deni = calculateDeni(mteja.kilicholipwa, correctlyCalculatedTotal);

      await updateDoc(doc(db, "wateja", mteja.id), {
        bei_bidhaa: correctlyCalculatedTotal,
        hali,
        deni,
        tarehe_kulipwa: hali === PaymentStatus.FULL ? (mteja.tarehe_kulipwa || serverTimestamp()) : null
      });

      toast.success(`Hesabu ya ${mteja.jina} imerekebishwa kuwa TZS ${correctlyCalculatedTotal.toLocaleString()}`);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, `wateja/${mteja.id}`);
       toast.error("Imeshindwa kurekebisha hesabu");
    }
  };

  const handleAddExpense = async (formData: any) => {
    try {
      await addDoc(collection(db, "expenses"), {
        ...formData,
        tarehe: formData.tarehe ? Timestamp.fromDate(new Date(formData.tarehe)) : serverTimestamp(),
      });
      setIsAddingExpense(false);
      toast.success("Matumizi yamehifadhiwa");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "expenses");
      toast.error("Imeshindwa kuhifadhi matumizi");
    }
  };

  const handleUpdateExpense = async (formData: any) => {
    if (!selectedExpense) return;
    try {
      const expenseRef = doc(db, "expenses", selectedExpense.id);
      await updateDoc(expenseRef, {
        ...formData,
        tarehe: formData.tarehe ? Timestamp.fromDate(new Date(formData.tarehe)) : serverTimestamp(),
      });
      setIsAddingExpense(false);
      setSelectedExpense(null);
      toast.success("Matumizi yamebadilishwa");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `expenses/${selectedExpense.id}`);
      toast.error("Imeshindwa kubadili matumizi");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Je, una uhakika unataka kufuta rekodi hii ya matumizi?")) return;
    try {
      await deleteDoc(doc(db, "expenses", id));
      toast.success("Matumizi yamefutwa");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
      toast.error("Imeshindwa kufuta matumizi");
    }
  };

  const handleAddPayment = async (paymentData: any) => {
    if (!selectedMteja) return;

    try {
      const mpyaKilicholipwa = selectedMteja.kilicholipwa + paymentData.kiasi;
      const mpyaDeni = calculateDeni(mpyaKilicholipwa, selectedMteja.bei_bidhaa);
      const mpyaHali = calculateHali(mpyaKilicholipwa, selectedMteja.bei_bidhaa);

      const mtejaRef = doc(db, "wateja", selectedMteja.id);
      const paymentDate = paymentData.tarehe ? Timestamp.fromDate(new Date(paymentData.tarehe)) : serverTimestamp();
      
      await updateDoc(mtejaRef, {
        kilicholipwa: mpyaKilicholipwa,
        deni: mpyaDeni,
        hali: mpyaHali,
        tarehe_kulipwa: mpyaHali === PaymentStatus.FULL ? paymentDate : selectedMteja.tarehe_kulipwa || null
      });

      // Add to history
      await addDoc(collection(db, "wateja", selectedMteja.id, "historia_malipo"), {
        kiasi: paymentData.kiasi,
        njia: paymentData.njia,
        tarehe: paymentDate,
        deni_kabla: selectedMteja.deni,
        deni_baada: mpyaDeni,
        aliyehifadhi: auth.currentUser?.email || user?.email || "System"
      });

      setIsAddingPayment(false);
      setSelectedMteja(null);
      toast.success("Malipo yamehifadhiwa");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `wateja/${selectedMteja?.id}`);
      toast.error("Imeshindwa kuhifadhi malipo");
    }
  };

  const fetchHistory = async (mteja: Customer) => {
    try {
      const q = query(collection(db, "wateja", mteja.id, "historia_malipo"), orderBy("tarehe", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CustomerHistory[];
      setHistory(data);
      setSelectedMteja(mteja);
      setIsViewingHistory(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `wateja/${mteja.id}/historia_malipo`);
      toast.error("Imeshindwa kupakia historia");
    }
  };

  // Filter wateja based on active tab and search query
  const getFilteredWateja = () => {
    let filtered = wateja;

    // Filter by tab status
    switch (activeTab) {
      case "full": filtered = filtered.filter(c => calculateHali(c.kilicholipwa, c.bei_bidhaa) === PaymentStatus.FULL); break;
      case "partial": filtered = filtered.filter(c => calculateHali(c.kilicholipwa, c.bei_bidhaa) === PaymentStatus.PARTIAL); break;
      case "none": filtered = filtered.filter(c => calculateHali(c.kilicholipwa, c.bei_bidhaa) === PaymentStatus.NONE); break;
      case "prepaid": filtered = filtered.filter(c => calculateHali(c.kilicholipwa, c.bei_bidhaa) === PaymentStatus.OVERPAID); break;
      case "debt": filtered = filtered.filter(c => calculateDeni(c.kilicholipwa, c.bei_bidhaa) > 0).sort((a,b) => calculateDeni(b.kilicholipwa, b.bei_bidhaa) - calculateDeni(a.kilicholipwa, a.bei_bidhaa)); break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.jina.toLowerCase().includes(q) || 
        (c.simu && c.simu.includes(q)) ||
        c.njia_malipo.toLowerCase().includes(q)
      );
    }

    return filtered;
  };

  const stats = {
    full: wateja.filter(c => calculateHali(c.kilicholipwa, c.bei_bidhaa) === PaymentStatus.FULL),
    partial: wateja.filter(c => calculateHali(c.kilicholipwa, c.bei_bidhaa) === PaymentStatus.PARTIAL),
    none: wateja.filter(c => calculateHali(c.kilicholipwa, c.bei_bidhaa) === PaymentStatus.NONE),
    overpaid: wateja.filter(c => calculateHali(c.kilicholipwa, c.bei_bidhaa) === PaymentStatus.OVERPAID),
  };

  const totals = {
    fullCollected: stats.full.reduce((acc, c) => acc + (Number(c.kilicholipwa) || 0), 0),
    partialDebt: stats.partial.reduce((acc, c) => acc + calculateDeni(Number(c.kilicholipwa) || 0, Number(c.bei_bidhaa) || 0), 0),
    noneDebt: stats.none.reduce((acc, c) => acc + calculateDeni(Number(c.kilicholipwa) || 0, Number(c.bei_bidhaa) || 0), 0),
    overpaidExtra: stats.overpaid.reduce((acc, c) => acc + ((Number(c.kilicholipwa) || 0) - (Number(c.bei_bidhaa) || 0)), 0),
  };

  const finance = {
    totalRevenue: wateja.reduce((acc, c) => acc + (Number(c.kilicholipwa) || 0), 0),
    totalExpenses: expenses.reduce((acc, e) => acc + (Number(e.kiasi) || 0), 0),
    totalMarkup: wateja.reduce((acc, c) => {
      const baseCost = (Number(c.idadi) || 1) * UNIT_PRICE;
      const realizedMarkup = Math.max(0, (Number(c.kilicholipwa) || 0) - baseCost);
      return acc + realizedMarkup;
    }, 0),
    totalDiscounts: wateja.reduce((acc, c) => {
      const baseCost = (Number(c.idadi) || 1) * UNIT_PRICE;
      const agreedPrice = Number(c.bei_bidhaa) || 0;
      const discount = Math.max(0, baseCost - agreedPrice);
      return acc + discount;
    }, 0),
    discountCount: wateja.filter(c => {
      const idadi = Number(c.idadi) || 1;
      const bei = Number(c.bei_bidhaa) || 0;
      return bei < (idadi * UNIT_PRICE);
    }).length,
    markupCount: wateja.filter(c => {
      const idadi = Number(c.idadi) || 1;
      const kilicholipwa = Number(c.kilicholipwa) || 0;
      return kilicholipwa > (idadi * UNIT_PRICE);
    }).length,
    balance: 0
  };
  finance.balance = finance.totalRevenue - finance.totalExpenses;

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FF] p-4 sm:p-6 overflow-hidden relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(26,35,126,0.15)] overflow-hidden bg-white border border-white/50 backdrop-blur-xl"
        >
          {/* Left Side: Branding & Info */}
          <div className="bg-[#1A237E] p-8 sm:p-12 text-white relative flex flex-col justify-between overflow-hidden">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[length:24px_24px]"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 mb-10"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                  <Flame className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter leading-none mb-1">FUEGO</h1>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em]">{APP_CONFIG.brand.name.split(' ').slice(1).join(' ')}</p>
                </div>
              </motion.div>

              <div className="space-y-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-[1.1] tracking-tight text-white">
                    Simamia Mauzo <br />
                    <span className="text-orange-400">Punguza Madeni.</span>
                  </h2>
                  <p className="text-indigo-100/70 text-base max-w-md font-medium leading-relaxed">
                    Mfumo namba moja wa kusimamia wateja, mauzo ya vikundi na matumizi kwa ufanisi zaidi.
                  </p>
                </motion.div>

                <div className="grid gap-6">
                  {[
                    { icon: ShieldCheck, title: "Usalama wa Data", desc: "Data zako ziko salama kwenye Firebase Cloud." },
                    { icon: Zap, title: "Real-time Sync", desc: "Tazama mabadiliko papo hapo kwenye vifaa vyote." },
                    { icon: BarChart3, title: "Ripoti Kamilifu", desc: "Zalisha PDF na Excel za faida na matumizi." }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (idx * 0.1) }}
                      className="flex gap-4 items-start group"
                    >
                      <div className="bg-white/10 p-2 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                        <item.icon className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                        <p className="text-[11px] text-indigo-200/80 leading-snug">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
              className="mt-12 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2"
            >
              <div className="h-px bg-white/20 w-8" />
              Empowering Tanzania Small Business
            </motion.div>
          </div>

          {/* Right Side: Login Form */}
          <div className="bg-white p-8 sm:p-12 flex flex-col justify-center items-center relative min-h-[600px]">
            <div className="w-full max-w-sm space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                  {authMode === "login" ? "Karibu Tena" : "Anza Sasa"}
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  {authMode === "login" 
                    ? "Tafadhali ingia ili kuendelea na kazi yako." 
                    : "Fungua akaunti mpya kuanza kusimamia biashara."}
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button 
                  onClick={() => setAuthMode("login")}
                  type="button"
                  className={cn(
                    "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    authMode === "login" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="h-3 w-3" />
                    Ingia (Login)
                  </div>
                </button>
                <button 
                  onClick={() => setAuthMode("signup")}
                  type="button"
                  className={cn(
                    "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    authMode === "signup" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <UserPlus className="h-3 w-3" />
                    Jisajili (Sign Up)
                  </div>
                </button>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input 
                        type="email" 
                        placeholder="mfano@gmail.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 pl-12 rounded-2xl bg-white border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                      {authMode === "login" && (
                        <button 
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-all py-1 px-2 -mr-2 active:scale-95"
                        >
                          Umesahau?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 pl-12 pr-12 rounded-2xl bg-white border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit"
                  disabled={authSubmitting}
                  className={cn(
                    "w-full h-14 bg-[#1A237E] hover:bg-black text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all duration-300",
                    authSubmitting && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {authSubmitting 
                    ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> 
                    : (authMode === "login" ? "Ingia Sasa" : "Tengeneza Akaunti")}
                </Button>
              </form>

              <div className="text-center -mt-4">
                <button 
                  type="button"
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                  className="text-[11px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                >
                  {authMode === "login" ? "Huna akaunti bado? Jisajili" : "Tayari una akaunti? Ingia"}
                </button>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-slate-100 flex-1"></div>
                <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest leading-none">Au tumia</span>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>

              {/* Social Login */}
              <Button 
                onClick={() => handleLogin()}
                variant="outline"
                type="button"
                className="w-full h-14 bg-white hover:bg-slate-50 text-slate-600 font-black uppercase tracking-[0.15em] rounded-2xl border-slate-100 shadow-sm transition-all flex gap-3 group"
              >
                <div className="bg-white border rounded-full p-1 group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                Quick Login na Google
              </Button>

                <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 space-y-4 w-full">
                  <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest text-center flex items-center justify-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    Msaada wa Uingiaji: Muhimu
                  </h4>
                  <div className="space-y-4">
                    <p className="text-[11px] text-orange-700 font-bold text-center italic leading-tight">
                      UKIKUTANA NA TATIZO LA KUINGIA (LOGIN ERROR):
                    </p>
                    <div className="space-y-3">
                      {[
                        "Fungua mfumo kwenye TAB MPYA kwa kubonyeza icon ya mshale juu kulia (Open in new tab).",
                        "Hakikisha umeruhusu 'Popups' kwenye browser yako (Chrome/Safari).",
                        "Kama bado unahitaji msaada, wasiliana na mtengenezaji."
                      ].map((text, i) => (
                        <div key={i} className="flex gap-2 items-start text-[11px] text-orange-800 font-medium leading-tight">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1 flex-shrink-0" />
                          {text}
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full h-10 border-orange-200 text-orange-600 hover:bg-orange-100 font-black text-[10px] uppercase tracking-widest rounded-xl flex gap-2"
                      onClick={() => window.open(window.location.href, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Fungua kwenye Tab Mpya
                    </Button>
                  </div>
                </div>

              <div className="pt-2 text-center">
                 <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                   &copy; {new Date().getFullYear()} Fuego Business Suite
                 </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F5F5F5] font-sans text-slate-900 overflow-hidden relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-300 no-print"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-[#1A237E] flex flex-col shadow-xl z-50 transition-transform duration-300 transform lg:relative lg:translate-x-0 lg:z-20 no-print",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center font-bold text-white shadow-lg">F</div>
            <h1 className="text-white font-bold tracking-tight text-lg uppercase">{APP_CONFIG.brand.name}</h1>
          </div>
          <p className="text-indigo-200 text-[10px] mt-1 font-semibold uppercase tracking-wider">System v2.4 &bull; Real-time</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 custom-scrollbar overflow-y-auto">
          <div className="text-indigo-300 text-[11px] font-bold uppercase px-3 py-2 mt-2">MENU KUU</div>
          <button 
            onClick={() => { setActiveTab("all"); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
              activeTab === "all" ? "bg-indigo-800/40 text-white border-l-4 border-orange-500 shadow-sm" : "text-indigo-100 hover:bg-white/5"
            )}
          >
            <Users className="h-4 w-4 opacity-70 group-hover:scale-110 transition-transform" /> <span>Wateja Wote</span>
          </button>
          
          <div className="text-indigo-300 text-[11px] font-bold uppercase px-3 py-2 mt-4">UCHAMBUZI</div>
          <button 
            onClick={() => { setActiveTab("full"); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "full" ? "bg-indigo-800/40 text-white border-l-4 border-green-500 shadow-sm" : "text-indigo-100 hover:bg-white/5"
            )}
          >
            <CheckCircle2 className="h-4 w-4 opacity-70 text-green-400" /> <span>Amelipa Kamili</span>
          </button>
          <button 
            onClick={() => { setActiveTab("partial"); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "partial" ? "bg-indigo-800/40 text-white border-l-4 border-yellow-500 shadow-sm" : "text-indigo-100 hover:bg-white/5"
            )}
          >
            <AlertCircle className="h-4 w-4 opacity-70 text-yellow-400" /> <span>Malipo ya Sehemu</span>
          </button>
          <button 
            onClick={() => { setActiveTab("none"); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "none" ? "bg-indigo-800/40 text-white border-l-4 border-red-500 shadow-sm" : "text-indigo-100 hover:bg-white/5"
            )}
          >
            <XCircle className="h-4 w-4 opacity-70 text-red-400" /> <span>Hawajalipa</span>
          </button>
          <button 
            onClick={() => { setActiveTab("prepaid"); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "prepaid" ? "bg-indigo-800/40 text-white border-l-4 border-emerald-400 shadow-sm" : "text-indigo-100 hover:bg-white/5"
            )}
          >
            <ArrowUpCircle className="h-4 w-4 opacity-70 text-emerald-400" /> <span>Prepaid (Overpaid)</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab("debt"); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-4",
              activeTab === "debt" ? "bg-indigo-800/40 text-white border-l-4 border-purple-500 shadow-sm" : "text-indigo-100 hover:bg-white/5"
            )}
          >
             <span className="opacity-70 font-bold ml-1">💰</span> <span className="ml-0.5">Madeni Yote</span>
          </button>
          
          <div className="text-indigo-300 text-[11px] font-bold uppercase px-3 py-2 mt-4">FEDHA</div>
          <button 
            onClick={() => { setActiveTab("expenses"); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "expenses" ? "bg-indigo-800/40 text-white border-l-4 border-orange-400 shadow-sm" : "text-indigo-100 hover:bg-white/5"
            )}
          >
            <XCircle className="h-4 w-4 opacity-70 text-orange-400 rotate-180" /> <span>Matumizi (Expenses)</span>
          </button>

          <button 
            onClick={() => { setActiveTab("profit_report"); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-1",
              activeTab === "profit_report" ? "bg-indigo-800/40 text-white border-l-4 border-emerald-400 shadow-sm" : "text-indigo-100 hover:bg-white/5"
            )}
          >
            <TrendingUp className="h-4 w-4 opacity-70 text-emerald-400" /> <span>Faida na Punguzo</span>
          </button>

          <button 
            onClick={() => { setActiveTab("vikundi"); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-1",
              activeTab === "vikundi" ? "bg-indigo-800/40 text-white border-l-4 border-indigo-400 shadow-sm" : "text-indigo-100 hover:bg-white/5"
            )}
          >
            <Users className="h-4 w-4 opacity-70 text-indigo-400" /> <span>Vikundi (Groups)</span>
          </button>
        </nav>

        <div className="p-4 border-t border-indigo-900/50">
          <div className="bg-indigo-900/40 p-3 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-xs">
              {user.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.displayName || "Admin"}</p>
              <p className="text-indigo-300 text-[10px] leading-none mt-1">Online &bull; Firestore active</p>
            </div>
            <button onClick={handleLogout} className="text-indigo-300 hover:text-white transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 shadow-sm no-print">
          <div className="flex items-center gap-2 lg:gap-4 flex-1">
             <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10 text-slate-500"
                onClick={() => setIsMobileMenuOpen(true)}
             >
                <BarChart3 className="h-6 w-6 rotate-90" />
             </Button>

             <h2 className="font-black text-slate-800 text-sm lg:text-lg tracking-tight uppercase truncate max-w-[120px] sm:max-w-none">
               {activeTab === "all" ? "Orodha" : 
                activeTab === "vikundi" ? "Vikundi" :
                activeTab.toUpperCase()}
             </h2>
             
             <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
             
             {/* Search Input - Responsive */}
             <div className="relative group transition-all flex-1 max-w-[200px] sm:max-w-[300px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 group-focus-within:text-[#1A237E] transition-colors" />
               <Input 
                 placeholder="Tafuta..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="h-9 sm:h-10 pl-8 sm:pl-10 pr-4 bg-slate-50 border-slate-100 rounded-xl text-[10px] sm:text-xs font-medium focus-visible:ring-[#1A237E] focus-visible:bg-white transition-all w-full shadow-inner group-hover:border-slate-200"
               />
             </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button 
                variant="outline"
                onClick={() => exportFullBackup(wateja, expenses)}
                className="h-9 sm:h-10 px-2 sm:px-4 text-[9px] sm:text-[10px] font-black text-emerald-700 bg-emerald-50 rounded-lg shadow-sm hover:bg-emerald-100 transition-all uppercase tracking-widest border border-emerald-200 flex"
              >
                <Download className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Backup</span>
            </Button>
            <Button 
                variant="outline"
                onClick={() => setIsImportingExcel(true)}
                className="h-9 sm:h-10 px-2 sm:px-4 text-[9px] sm:text-[10px] font-black text-[#1A237E] bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest border border-slate-200 hidden xs:flex"
              >
                Excel
            </Button>
            <Button 
                onClick={() => {
                  setSelectedMteja(null);
                  setIsAddingCustomer(true);
                }}
                className="h-9 sm:h-10 px-3 sm:px-6 text-[9px] sm:text-[10px] font-black text-white bg-[#1A237E] rounded-lg shadow-lg hover:bg-black transition-all uppercase tracking-widest border-none"
              >
                <Plus className="h-3.5 w-3.5 xs:mr-1" /> <span className="hidden xs:inline">Mteja Mpya</span>
            </Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="p-4 lg:p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 sm:gap-8 bg-[#f8f9fa]">
          
          {/* Financial Report (Mapato vs Matumizi) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 shrink-0 h-auto">
             <div className="bg-[#1A237E] p-6 lg:p-8 rounded-2xl lg:rounded-3xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-20 w-20 text-white" />
                </div>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">Mapato Yote yaliyopokelewa</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{finance.totalRevenue.toLocaleString()}</span>
                  <span className="text-[10px] text-indigo-200 font-bold">TZS</span>
                </div>
                <div className="mt-4 h-1 w-full bg-indigo-900 rounded-full overflow-hidden">
                   <div className="h-full bg-green-400 w-full"></div>
                </div>
             </div>

             <div className="bg-white p-6 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <XCircle className="h-20 w-20 text-red-600" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Matumizi (Expenses)</p>
                <div className="mt-4 flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl lg:text-3xl font-black text-red-600">-{finance.totalExpenses.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 font-bold">TZS</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setIsAddingExpense(true)}
                    className="mt-3 w-fit h-7 px-3 bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-black uppercase tracking-widest rounded-lg border-none transition-all"
                  >
                    + Ongeza
                  </Button>
                </div>
             </div>

             <div className="bg-white p-6 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                   <CheckCircle2 className="h-20 w-20 text-emerald-600" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Salio (Hela Iliyobaki)</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className={cn("text-2xl lg:text-3xl font-black", finance.balance >= 0 ? "text-emerald-600" : "text-red-700")}>
                    {finance.balance.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">TZS</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-2 truncate">
                  {finance.balance >= 0 ? "Biashara inaendelea vizuri." : "Tahadhari: Matumizi yamezidi mapato!"}
                </p>
             </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 shrink-0 h-auto">
            <div className="bg-white p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm border-l-4 border-[#1B5E20] hover:shadow-md transition-all group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">TAYARI</p>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mt-3">
                <span className="text-lg lg:text-xl font-black text-slate-900 leading-none">{stats.full.length}</span>
                <span className="text-[8px] lg:text-[9px] font-black text-[#1B5E20] opacity-80 uppercase tracking-tighter bg-green-50 px-2 py-0.5 rounded truncate">TZS {totals.fullCollected.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="bg-white p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm border-l-4 border-[#F57F17] hover:shadow-md transition-all group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">SEHEMU</p>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mt-3">
                <span className="text-lg lg:text-xl font-black text-slate-900 leading-none">{stats.partial.length}</span>
                <span className="text-[8px] lg:text-[9px] font-black text-[#F57F17] opacity-80 uppercase tracking-tighter bg-yellow-50 px-2 py-0.5 rounded truncate">TZS {totals.partialDebt.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm border-l-4 border-[#B71C1C] hover:shadow-md transition-all group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">DENI</p>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mt-3">
                <span className="text-lg lg:text-xl font-black text-slate-900 leading-none">{stats.none.length}</span>
                <span className="text-[8px] lg:text-[9px] font-black text-[#B71C1C] opacity-80 uppercase tracking-tighter bg-red-50 px-2 py-0.5 rounded truncate">TZS {totals.noneDebt.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm border-l-4 border-[#0D47A1] hover:shadow-md transition-all group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">PREPAID</p>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mt-3">
                <span className="text-lg lg:text-xl font-black text-slate-900 leading-none">{stats.overpaid.length}</span>
                <span className="text-[8px] lg:text-[9px] font-black text-[#0D47A1] opacity-80 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded truncate">TZS {totals.overpaidExtra.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Stats Section only on main tab */}
          {activeTab === "all" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <StatsCharts wateja={wateja} />
            </div>
          )}

          {/* Main Table Section */}
          <div className="bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[9px] lg:text-[10px]">
                  {activeTab === "expenses" ? "Matumizi" : "Wateja"}
                </h3>
              </div>
              <div className="flex items-center gap-2 lg:gap-4">
                {activeTab !== "expenses" && (
                  <div className="flex items-center bg-white rounded-lg p-1 border border-slate-100 shadow-sm">
                    <Button variant="ghost" size="sm" className="h-7 px-2 lg:px-3 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 rounded-md" onClick={() => exportToExcel(getFilteredWateja())}>EXC</Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 lg:px-3 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 rounded-md" onClick={() => exportToPDF(getFilteredWateja())}>PDF</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale py-20">
                   <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1A237E] rounded-full animate-spin mb-4" />
                   <p className="text-xs font-black uppercase tracking-widest">Sychronizing Records...</p>
                </div>
              ) : activeTab === "expenses" ? (
                <div className="p-8 animate-in fade-in zoom-in-95 duration-500">
                  <ExpenseTable 
                    expenses={expenses} 
                    onDelete={handleDeleteExpense} 
                    onEdit={(expense) => {
                      setSelectedExpense(expense);
                      setIsAddingExpense(true);
                    }}
                  />
                </div>
              ) : activeTab === "profit_report" ? (
                <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="hidden print:block text-center mb-8 border-b-2 border-slate-900 pb-4">
                    <h1 className="text-2xl font-black uppercase">Ripoti ya Faida na Hasara</h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Imetolewa tarehe: {new Date().toLocaleString()}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 no-print">
                    <Button 
                      variant="outline" 
                      onClick={() => exportProfitReportToPDF(finance.totalRevenue, finance.totalExpenses)} 
                      className="rounded-xl border-indigo-200 text-indigo-600 font-black text-[10px] uppercase tracking-widest gap-2 bg-indigo-50/50"
                    >
                      <Download className="h-4 w-4" />
                      Pakua PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.print()} 
                      className="rounded-xl border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print Ripoti ya Faida
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
                      <CardHeader className="bg-emerald-50 border-b border-emerald-100 px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                             <TrendingUp className="h-5 w-5" />
                           </div>
                           <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-900">Faida Iliyopatikana (Markup)</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-10">
                         <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-black text-emerald-600">+{finance.totalMarkup.toLocaleString()}</span>
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">TZS</span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Kutoka kwa wateja {finance.markupCount} waliolipa zaidi ya 120k</p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
                      <CardHeader className="bg-red-50 border-b border-red-100 px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                             <Percent className="h-5 w-5" />
                           </div>
                           <CardTitle className="text-sm font-black uppercase tracking-widest text-red-900">Punguzo Lililotolewa (Discounts)</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-10">
                         <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-black text-red-600">-{finance.totalDiscounts.toLocaleString()}</span>
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">TZS</span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Pcs zote {wateja.filter(c => (Number(c.bei_bidhaa)/Number(c.idadi)) < UNIT_PRICE).reduce((acc, c) => acc + Number(c.idadi), 0)} zilizouzwa chini ya 120,000</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* PROFIT LIST */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" /> Orodha ya Faida ya Bei
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100">
                            <th className="px-8 py-4">Mteja</th>
                            <th className="px-8 py-4">Idadi</th>
                            <th className="px-8 py-4 text-right">Bei Aliyepewa (TZS)</th>
                            <th className="px-8 py-4 text-right">Pato la Faida</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {wateja.filter(c => (Number(c.kilicholipwa) > (c.idadi * UNIT_PRICE))).map(c => {
                            const realizedMarkup = Number(c.kilicholipwa) - (c.idadi * UNIT_PRICE);
                            return (
                              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-4 font-bold text-slate-900 text-xs">{c.jina}</td>
                                <td className="px-8 py-4 font-bold text-slate-500 text-xs">{c.idadi}</td>
                                <td className="px-8 py-4 text-right font-black text-xs tabular-nums text-indigo-600">{c.kilicholipwa.toLocaleString()}</td>
                                <td className="px-8 py-4 text-right font-black text-xs tabular-nums text-emerald-600 uppercase tracking-tighter">
                                  +{realizedMarkup.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                          {finance.markupCount === 0 && (
                            <tr>
                              <td colSpan={4} className="px-8 py-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                                Hakuna wateja waliolipa zaidi ya 120,000/=
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* DISCOUNT LIST */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 bg-red-50/50 border-b border-red-100 flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-red-700 flex items-center gap-2">
                        <Percent className="h-3 w-3" /> Orodha ya Punguzo (Discounts)
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100">
                            <th className="px-8 py-4">Mteja</th>
                            <th className="px-8 py-4">Idadi</th>
                            <th className="px-8 py-4 text-right">Bei Aliyepewa (TZS)</th>
                            <th className="px-8 py-4 text-right">Jumla ya Punguzo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {wateja.filter(c => (c.bei_bidhaa < (c.idadi * UNIT_PRICE))).map(c => {
                            const discount = (c.idadi * UNIT_PRICE) - c.bei_bidhaa;
                            return (
                              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-4 font-bold text-slate-900 text-xs">{c.jina}</td>
                                <td className="px-8 py-4 font-bold text-slate-500 text-xs">{c.idadi}</td>
                                <td className="px-8 py-4 text-right font-black text-xs tabular-nums text-indigo-600">{c.bei_bidhaa.toLocaleString()}</td>
                                <td className="px-8 py-4 text-right font-black text-xs tabular-nums text-red-500 uppercase tracking-tighter">
                                  -{discount.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                          {finance.discountCount === 0 && (
                            <tr>
                              <td colSpan={4} className="px-8 py-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                                Hakuna mteja aliyedaiwa punguzo
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : activeTab === "vikundi" ? (
                <div className="p-8">
                  <VikundiView 
                    wateja={wateja} 
                    onUpdateWateja={handleBulkUpdateWateja} 
                    onEditMember={(member) => {
                      setSelectedMteja(member);
                      setIsAddingCustomer(true);
                    }}
                    onAddMemberToGroup={(groupName) => {
                      setSelectedMteja(null);
                      // We can pass the group name via initialData or some other state
                      // Let's use a temporary state or just pre-fill in the component
                      setIsAddingCustomer(true);
                      // To pre-fill, we'll need to pass the group name to AddCustomerForm
                      // I'll add a new state for prefilling group
                      setPrefferedGroup(groupName);
                    }}
                  />
                </div>
              ) : (
                <WatejaTable 
                  wateja={getFilteredWateja()} 
                  onAddPayment={(mteja) => {
                    setSelectedMteja(mteja);
                    setIsAddingPayment(true);
                  }}
                  onEdit={(mteja) => {
                    setSelectedMteja(mteja);
                    setIsAddingCustomer(true); 
                  }}
                  onViewHistory={fetchHistory}
                  onFixMath={handleFixMath}
                />
              )}
            </div>
          </div>

          {/* Debt Summary Banner */}
          {activeTab === "debt" && (
            <div className="mt-4 bg-[#1A237E] p-3 sm:p-6 rounded-2xl relative overflow-hidden flex items-center justify-between group border border-white/5 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px]"></div>
              
              <div className="relative z-10">
                <h3 className="text-white font-black text-[10px] sm:text-base uppercase tracking-tight leading-none">
                  Madeni Yanayosubiriwa
                </h3>
                <p className="text-indigo-300/60 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest mt-0.5">Total Outstanding Receivables</p>
              </div>

              <div className="relative z-10 flex items-baseline gap-1.5 sm:gap-3">
                <span className="text-xl sm:text-4xl font-black text-white tabular-nums tracking-tighter">
                  {(totals.partialDebt + totals.noneDebt).toLocaleString()}
                </span>
                <span className="text-[9px] sm:text-base text-orange-400 font-black uppercase tracking-widest">TZS</span>
              </div>
            </div>
          )}

          {/* Empty State Seed */}
          {wateja.length === 0 && !loading && (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="p-8 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
                 <Search className="h-10 w-10 text-slate-200" />
              </div>
              <Button variant="link" className="text-slate-300 uppercase font-black text-[10px] tracking-widest hover:text-[#1A237E]" onClick={async () => {
                const res = await seedData();
                if(res) toast.success("Data imewekwa!");
              }}>
                Initialize with sample data
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Popups & Notifications */}
      <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
        <DialogContent className="w-[95vw] sm:max-w-[450px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#1A237E] p-4 sm:p-6 text-white relative">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-xl"></div>
             <DialogTitle className="text-sm sm:text-lg font-black uppercase tracking-tight">
              {selectedMteja ? "Badili Taarifa" : "Sajili Mteja Mpya"}
            </DialogTitle>
          </div>
          <div className="p-4 sm:p-6">
            <AddCustomerForm 
              initialData={selectedMteja ? {
                jina: selectedMteja.jina,
                idadi: selectedMteja.idadi,
                bei_bidhaa: selectedMteja.bei_bidhaa,
                kilicholipwa: selectedMteja.kilicholipwa,
                njia_malipo: selectedMteja.njia_malipo,
                maelezo: selectedMteja.maelezo || "",
                simu: selectedMteja.simu || ""
              } : prefferedGroup ? { 
                njia_malipo: prefferedGroup,
                idadi: 1,
                bei_kila_moja: UNIT_PRICE,
                kilicholipwa: 0
              } : undefined}
              onSubmit={(data) => {
                if (selectedMteja) {
                  handleUpdateCustomer(data);
                } else {
                  handleAddCustomer(data);
                }
                setPrefferedGroup(null);
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
        <DialogContent className="w-[95vw] sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#1B5E20] p-8 text-white">
             <DialogTitle className="text-xl font-black uppercase tracking-tight">Pokea Malipo: {selectedMteja?.jina}</DialogTitle>
             <DialogDescription className="text-green-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">
               Ingiza kiasi kilichopokelewa sasa
             </DialogDescription>
          </div>
          <div className="p-8">
            {selectedMteja && (
              <AddPaymentForm mteja={selectedMteja} onSubmit={handleAddPayment} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewingHistory} onOpenChange={setIsViewingHistory}>
        <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col">
          <div className="bg-slate-900 p-8 text-white">
             <DialogTitle className="text-xl font-black uppercase tracking-tight">Historia ya Malipo</DialogTitle>
             <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
               Taarifa za malipo kwa: {selectedMteja?.jina}
             </DialogDescription>
          </div>
          <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
            <HistoryTable history={history} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportingExcel} onOpenChange={setIsImportingExcel}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#1A237E] p-8 text-white">
             <DialogTitle className="text-xl font-black uppercase tracking-tight">Ingiza Wateja toka Excel</DialogTitle>
             <DialogDescription className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">
               Pakia faili yako ya Excel hapa chini
             </DialogDescription>
          </div>
          <div className="p-8">
            <ExcelImport onSuccess={() => setIsImportingExcel(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingExpense} onOpenChange={(open) => {
        setIsAddingExpense(open);
        if (!open) setSelectedExpense(null);
      }}>
        <DialogContent className="w-[95vw] sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-red-600 p-8 text-white">
             <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {selectedExpense ? "Badili Matumizi" : "Ongeza Matumizi Mpya"}
            </DialogTitle>
             <DialogDescription className="text-red-200 text-[10px] font-bold uppercase tracking-widest mt-1">
               Rekodi kila senti inayotoka kwa usahihi
             </DialogDescription>
          </div>
          <div className="p-8">
            <AddExpenseForm 
              initialData={selectedExpense || undefined}
              onSubmit={(data) => {
                if (selectedExpense) {
                  handleUpdateExpense(data);
                } else {
                  handleAddExpense(data);
                }
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors theme="light" />
    </div>
  );
}
