"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
    const applySession = async (sbUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
      setUser(
        sbUser
          ? {
              uid: sbUser.id,
              email: sbUser.email ?? "",
              displayName: (sbUser.user_metadata?.display_name as string) ?? sbUser.email ?? "Admin",
            }
          : null
      );

      if (sbUser) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", sbUser.id)
            .maybeSingle();
          if (error) throw error;

          if (data) {
            const userRole = (data.role as AdminRole) || "admin";
            const active = data.active !== false;

            setRole(active ? userRole : "user");
            setAdminProfile({
              uid: sbUser.id,
              email: sbUser.email ?? "",
              displayName: data.display_name ?? "Admin",
              role: userRole,
              active,
              department: data.department ?? "",
              lastLogin: data.last_login ?? null,
              permissions: Array.isArray(data.permissions) ? data.permissions : undefined,
            });
            supabase
              .from("profiles")
              .update({ last_login: new Date().toISOString() })
              .eq("id", sbUser.id)
              .then(() => undefined);
          } else {
            const initialProfile: AdminProfile = {
              uid: sbUser.id,
              email: sbUser.email ?? "",
              displayName: "Super Admin",
              role: "superadmin",
              active: true,
              department: "Sekretariat Kelurahan",
            };
            try {
              await supabase.from("profiles").insert({
                id: sbUser.id,
                email: initialProfile.email,
                display_name: initialProfile.displayName,
                role: "superadmin",
                active: true,
                department: initialProfile.department,
              });
            } catch (initErr) {
              console.warn("Could not auto-bootstrap admin record:", initErr);
            }
            setRole("superadmin");
            setAdminProfile(initialProfile);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole("admin");
          setAdminProfile({
            uid: sbUser.id,
            email: sbUser.email ?? "",
            displayName: "Admin",
            role: "admin",
            active: true,
          });
        }
      } else {
        setRole(null);
        setAdminProfile(null);
      }

      setLoading(false);
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      await applySession(data.session?.user ?? null);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const canAccess = (featureKey: string): boolean => {
    if (!user) return false;
    if (featureKey === "audit" || featureKey === "admins") {
      return role === "superadmin";
    }
    if (role === "superadmin") {
      return true;
    }
    if (adminProfile && Array.isArray(adminProfile.permissions)) {
      return adminProfile.permissions.includes(featureKey);
    }
    return true;
  };

  const isSuperAdmin = role === "superadmin";

  return (
    <AuthContext.Provider value={{ user, role, adminProfile, loading, isSuperAdmin, canAccess, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
