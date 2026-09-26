"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export type AdminRole = "superadmin" | "admin" | "operator";

export interface AdminProfile {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  department?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  role: AdminRole | "user" | null;
  adminProfile: AdminProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  adminProfile: null,
  loading: true,
  isSuperAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole | "user" | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userRole = (data.role as AdminRole) || "admin";
            const active = data.active !== false; // default true if not set

            setRole(active ? userRole : "user");
            setAdminProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? "",
              displayName: firebaseUser.displayName ?? data.displayName ?? "Admin",
              role: userRole,
              active,
              department: data.department ?? "",
              lastLogin: data.lastLogin ?? null,
            });
          } else {
            // First time or legacy admin: bootstrap as superadmin
            const initialProfile: AdminProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? "",
              displayName: firebaseUser.displayName ?? "Super Admin",
              role: "superadmin",
              active: true,
              department: "Sekretariat Kelurahan",
            };
            try {
              const { setDoc } = await import("firebase/firestore");
              await setDoc(userDocRef, {
                ...initialProfile,
                createdAt: serverTimestamp(),
              });
            } catch (initErr) {
              console.warn("Could not auto-bootstrap admin record:", initErr);
            }
            setRole("superadmin");
            setAdminProfile(initialProfile);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          // Fallback to admin to prevent accidental lockouts
          setRole("admin");
          setAdminProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            displayName: firebaseUser.displayName ?? "Admin",
            role: "admin",
            active: true,
          });
        }
      } else {
        setRole(null);
        setAdminProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isSuperAdmin = role === "superadmin";

  return (
    <AuthContext.Provider value={{ user, role, adminProfile, loading, isSuperAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
