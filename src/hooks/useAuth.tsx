import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { db } from "../lib/db";
import { resetClient } from "../lib/telegram";
import { ensurePersistentStorage } from "../lib/persistence";

interface AuthContextType {
  isAuthenticated: boolean;
  phone: string;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Ask the browser to exempt our IndexedDB data (Telegram session,
    // api credentials, cached files) from automatic eviction. This runs
    // once per app load, before we check for an existing session, so
    // that once the user IS authenticated, the session is as durable
    // as the browser allows.
    ensurePersistentStorage();

    db.credentials.get(1).then((creds) => {
      if (creds?.sessionString) {
        setIsAuthenticated(true);
        setPhone(creds.phone);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
  }, [tick]);

  const logout = async () => {
    await db.credentials.clear();
    await db.folders.clear();
    await db.files.clear();
    resetClient();
    setIsAuthenticated(false);
    setPhone("");
  };

  const refresh = () => setTick((t) => t + 1);

  return (
    <AuthContext.Provider value={{ isAuthenticated, phone, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
