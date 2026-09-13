import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { touchUserProfile, importLocalDataToCloud, checkHasCloudData } from "../services/cloudStorage";
import { BusinessSettings, Customer, JobAnalysisResult } from "../types";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
  isLocalOnly?: boolean;
}

export type AuthUser = (User & { isLocalOnly?: false }) | AppUser;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  loginAsLocalTradeUser: (email: string) => void;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  showLocalImportPrompt: boolean;
  setShowLocalImportPrompt: (show: boolean) => void;
  importLocalDataNow: () => Promise<{ settingsCount: number; customersCount: number; jobsCount: number }>;
  dismissLocalImport: () => void;
  localDataSummary: { jobsCount: number; customersCount: number; hasSettings: boolean } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("decorator_ai_local_user");
      if (stored) return JSON.parse(stored) as AppUser;
    } catch {
      // ignore
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [showLocalImportPrompt, setShowLocalImportPrompt] = useState(false);
  const [localDataSummary, setLocalDataSummary] = useState<{
    jobsCount: number;
    customersCount: number;
    hasSettings: boolean;
  } | null>(null);

  // Check if there is local data on initial load
  const inspectLocalData = () => {
    try {
      const storedJobs = localStorage.getItem("decorator_ai_jobs");
      const storedCusts = localStorage.getItem("decorator_ai_customers");
      const storedSettings = localStorage.getItem("decorator_ai_business_settings");

      const jobsCount = storedJobs ? (JSON.parse(storedJobs) as unknown[]).length : 0;
      const customersCount = storedCusts ? (JSON.parse(storedCusts) as unknown[]).length : 0;
      const hasSettings = !!storedSettings;

      if (jobsCount > 0 || customersCount > 0) {
        return { jobsCount, customersCount, hasSettings };
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.removeItem("decorator_ai_local_user");
        setLoading(false);

        // Record login in user profile
        await touchUserProfile(currentUser.uid, currentUser.email || "");

        // Check if there's local data to prompt import
        const summary = inspectLocalData();
        if (summary) {
          setLocalDataSummary(summary);
          const alreadyDismissed = sessionStorage.getItem(`dismissed_migration_${currentUser.uid}`);
          if (!alreadyDismissed) {
            // Check if cloud has no data yet, in which case import is highly recommended
            const hasCloud = await checkHasCloudData(currentUser.uid);
            if (!hasCloud) {
              setShowLocalImportPrompt(true);
            }
          }
        }
      } else {
        // If not logged into Firebase, check if there was a local trade user profile
        try {
          const stored = localStorage.getItem("decorator_ai_local_user");
          if (stored) {
            setUser(JSON.parse(stored) as AppUser);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
        setShowLocalImportPrompt(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signUp = async (email: string, pass: string) => {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (res.user) {
      await touchUserProfile(res.user.uid, res.user.email || email);
    }
  };

  const loginAsLocalTradeUser = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const slug = cleanEmail.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 24);
    const localUser: AppUser = {
      uid: `local_${slug}`,
      email: cleanEmail,
      displayName: cleanEmail.split("@")[0],
      isLocalOnly: true,
    };
    try {
      localStorage.setItem("decorator_ai_local_user", JSON.stringify(localUser));
    } catch (e) {
      console.warn("Could not save local user profile", e);
    }
    setUser(localUser);
  };

  const signOut = async () => {
    try {
      localStorage.removeItem("decorator_ai_local_user");
    } catch (e) {
      console.warn("Could not remove local user", e);
    }
    setUser(null);
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const changePassword = async (newPass: string) => {
    if (!auth.currentUser) {
      throw new Error("Changing password requires an active Firebase Cloud session.");
    }
    await updatePassword(auth.currentUser, newPass);
  };

  const importLocalDataNow = async () => {
    if (!user) throw new Error("Must be logged in to import data to cloud.");
    if (user.isLocalOnly) {
      throw new Error("Must be signed into a Cloud account to sync local data.");
    }

    let localSettings: BusinessSettings | undefined;
    let localCustomers: Customer[] | undefined;
    let localJobs: JobAnalysisResult[] | undefined;

    try {
      const s = localStorage.getItem("decorator_ai_business_settings");
      if (s) localSettings = JSON.parse(s);
      const c = localStorage.getItem("decorator_ai_customers");
      if (c) localCustomers = JSON.parse(c);
      const j = localStorage.getItem("decorator_ai_jobs");
      if (j) localJobs = JSON.parse(j);
    } catch (e) {
      console.error("Failed to parse local data for import:", e);
    }

    const result = await importLocalDataToCloud(
      user.uid,
      localSettings,
      localCustomers,
      localJobs
    );

    setShowLocalImportPrompt(false);
    sessionStorage.setItem(`dismissed_migration_${user.uid}`, "true");
    return result;
  };

  const dismissLocalImport = () => {
    setShowLocalImportPrompt(false);
    if (user) {
      sessionStorage.setItem(`dismissed_migration_${user.uid}`, "true");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        loginAsLocalTradeUser,
        resetPassword,
        changePassword,
        showLocalImportPrompt,
        setShowLocalImportPrompt,
        importLocalDataNow,
        dismissLocalImport,
        localDataSummary,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
