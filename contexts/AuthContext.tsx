"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, getToken, setToken } from "@/lib/api";

export type AdminRole = "superadmin" | "admin" | "operator";

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
}

export interface AdminProfile {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  department?: string;
  lastLogin?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  role: AdminRole | "user" | null;
  adminProfile: AdminProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  canAccess: (featureKey: string) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  adminProfile: null,
  loading: true,
  isSuperAdmin: false,
  canAccess: () => false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AdminRole | "user" | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Decode JWT payload (uid/email) to hydrate basic user info
    try {
      const payload = JSON.parse(atob(token.split(".")[1])) as { uid?: string; email?: string };
      apiGet("profiles", payload.uid || "")
        .then((row) => {
          if (!row || Number(row.active) === 0) {
            setToken(null);
            setUser(null);
            setRole(null);
            setAdminProfile(null);
            setLoading(false);
            return;
          }
          const profile: AdminProfile = {
            uid: String(row.id),
            email: String(row.email),
            displayName: String(row.display_name || "Admin"),
            role: (row.role as AdminRole) || "admin",
            active: Number(row.active) !== 0,
            department: String(row.department || ""),
            lastLogin: row.last_login ? new Date(row.last_login as string).toISOString() : undefined,
            permissions: (row.permissions as string[]) || [],
          };
          setUser({ uid: profile.uid, email: profile.email, displayName: profile.displayName });
          setRole(profile.role);
          setAdminProfile(profile);
          setLoading(false);
        })
        .catch(() => {
          setToken(null);
          setLoading(false);
        });
    } catch {
      setToken(null);
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    setToken(null);
    setUser(null);
    setRole(null);
    setAdminProfile(null);
    router.push("/login");
  };

  const isSuperAdmin = role === "superadmin";

  const canAccess = (featureKey: string) => {
    if (isSuperAdmin) return true;
    if (!adminProfile) return false;
    const perms = adminProfile.permissions ?? [];
    if (perms.includes("*")) return true;
    return perms.includes(featureKey);
  };

  return (
    <AuthContext.Provider value={{ user, role, adminProfile, loading, isSuperAdmin, canAccess, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
