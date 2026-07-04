"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  balance?: number | string;
}

interface Session {
  user?: User;
}

interface SessionContextType {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/user", { cache: "no-store" });
      if (!res.ok) {
        setSession(null);
        setStatus("unauthenticated");
        return;
      }

      const user = await res.json();
      setSession({
        user: {
          id: user.id,
          name: user.username,
          username: user.username,
          email: user.email,
          role: user.role,
          balance: user.balance,
        },
      });
      setStatus("authenticated");
    } catch {
      setSession(null);
      setStatus("unauthenticated");
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const signIn = async () => {
    await refreshSession();
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setSession(null);
    setStatus("unauthenticated");
  };

  return (
    <SessionContext.Provider value={{ data: session, status, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
