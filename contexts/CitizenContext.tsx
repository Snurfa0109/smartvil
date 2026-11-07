"use client";

/**
 * [CONTEXT] Pengelola Status Autentikasi Warga di Frontend
 * Menyediakan React Context untuk profil warga login, pengecekan sesi, dan logout.
 */

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface CitizenProfile {
  id: string;
  phone: string;
  nama: string;
  residentId: string;
}

interface CitizenContextType {
  citizen: CitizenProfile | null;
  loading: boolean;
  setCitizen: (c: CitizenProfile | null) => void;
  signOut: () => Promise<void>;
}

const CitizenContext = createContext<CitizenContextType>({
  citizen: null,
  loading: true,
  setCitizen: () => {},
  signOut: async () => {},
});

export const useCitizen = () => useContext(CitizenContext);

export function CitizenProvider({ children }: { children: React.ReactNode }) {
  const [citizen, setCitizen] = useState<CitizenProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/citizen-auth", { method: "GET", credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.citizen) setCitizen(data.citizen);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/citizen-auth", { method: "DELETE", credentials: "same-origin" }).catch(() => {});
    setCitizen(null);
    router.push("/masuk");
  }, [router]);

  return (
    <CitizenContext.Provider value={{ citizen, loading, setCitizen, signOut }}>
      {children}
    </CitizenContext.Provider>
  );
}
