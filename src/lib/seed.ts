import { db } from "./firebase";
import { collection, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { calculateHali, calculateDeni } from "./logic";

const wateja_data = [
  { jina: "HALIMA ALI MOHD", idadi: 1, kilicholipwa: 50000, bei_bidhaa: 120000, njia_malipo: "Shekha" },
  { jina: "KHADIJA FAKIHI", idadi: 1, kilicholipwa: 100000, bei_bidhaa: 120000, njia_malipo: "Shekha" },
  { jina: "RIFAT", idadi: 1, kilicholipwa: 100000, bei_bidhaa: 100000, njia_malipo: "Cash" },
  { jina: "SULEIMAN MOHAMMED", idadi: 12, kilicholipwa: 1065000, bei_bidhaa: 1440000, njia_malipo: "SHOP" },
  { jina: "JAJI MAHAKAMANI", idadi: 20, kilicholipwa: 1400000, bei_bidhaa: 2800000, njia_malipo: "Jaji Mahakamani" },
  { jina: "ABBY SHOP 2", idadi: 40, kilicholipwa: 4370000, bei_bidhaa: 4200000, njia_malipo: "SHOP 2" },
];

export async function seedData() {
  try {
    const batch = writeBatch(db);
    const customersRef = collection(db, "wateja");

    wateja_data.forEach((mteja) => {
      const docRef = doc(customersRef);
      const hali = calculateHali(mteja.kilicholipwa, mteja.bei_bidhaa);
      const deni = calculateDeni(mteja.kilicholipwa, mteja.bei_bidhaa);
      
      batch.set(docRef, {
        ...mteja,
        hali,
        deni,
        tarehe_kuongezwa: serverTimestamp(),
        tarehe_kulipwa: hali === "Amelipa Kamili" ? serverTimestamp() : null
      });
    });

    await batch.commit();
    console.log("Data imehifadhiwa!");
    return true;
  } catch (error) {
    console.error("Error seeding data:", error);
    return false;
  }
}
