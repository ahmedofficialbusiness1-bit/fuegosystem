export enum PaymentStatus {
  FULL = "Amelipa Kamili",
  PARTIAL = "Sehemu",
  NONE = "Hajalipa",
  OVERPAID = "Prepaid (Pesa Iliyozidi)",
  FREE = "Bure/Katibu"
}

export interface CustomerHistory {
  id: string;
  kiasi: number;
  njia: string;
  tarehe: any; // Firestore Timestamp
  deni_kabla: number;
  deni_baada: number;
  aliyehifadhi: string;
}

export interface Customer {
  id: string;
  jina: string;
  idadi: number;
  kilicholipwa: number;
  bei_bidhaa: number;
  njia_malipo: string;
  hali: PaymentStatus;
  deni: number;
  tarehe_kuongezwa: any; // Firestore Timestamp
  tarehe_kulipwa?: any | null; // Firestore Timestamp
  maelezo?: string;
  simu?: string;
}

export interface Expense {
  id: string;
  maelezo: string;
  kiasi: number;
  aina: string; // e.g., Chakula, Usafiri, Kodi
  tarehe: any; // Firestore Timestamp
}
