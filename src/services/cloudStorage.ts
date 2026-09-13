import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { BusinessSettings, Customer, JobAnalysisResult, BusinessExpense } from "../types";

/**
 * Recursively cleans objects of `undefined` values which Firestore rejects.
 */
function sanitizeForFirestore<T>(val: T): T {
  if (val === undefined) {
    return null as unknown as T;
  }
  if (val === null || typeof val !== "object") {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    if (v !== undefined) {
      clean[k] = sanitizeForFirestore(v);
    }
  }
  return clean as T;
}

// -------------------------------------------------------------
// USER PROFILE & METADATA
// -------------------------------------------------------------

export async function touchUserProfile(userId: string, email: string): Promise<void> {
  if (!userId || userId.startsWith("local_")) return;
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        email,
        lastLoginAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Failed to update user profile in Firestore", err);
  }
}

// -------------------------------------------------------------
// BUSINESS SETTINGS
// -------------------------------------------------------------

export async function fetchCloudSettings(userId: string): Promise<BusinessSettings | null> {
  if (!userId || userId.startsWith("local_")) return null;
  try {
    const settingsRef = doc(db, "users", userId, "settings", "business");
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return snap.data() as BusinessSettings;
    }
    return null;
  } catch (err) {
    console.error("Error fetching cloud settings:", err);
    return null;
  }
}

export async function saveCloudSettings(
  userId: string,
  settings: BusinessSettings
): Promise<void> {
  if (!userId || userId.startsWith("local_")) return;
  try {
    const settingsRef = doc(db, "users", userId, "settings", "business");
    const sanitized = sanitizeForFirestore(settings);
    await setDoc(settingsRef, sanitized, { merge: true });
  } catch (err) {
    console.error("Error saving cloud settings:", err);
    throw err;
  }
}

// -------------------------------------------------------------
// CUSTOMERS
// -------------------------------------------------------------

export async function fetchCloudCustomers(userId: string): Promise<Customer[]> {
  if (!userId || userId.startsWith("local_")) return [];
  try {
    const customersCol = collection(db, "users", userId, "customers");
    const q = query(customersCol, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const customers: Customer[] = [];
    snap.forEach((docSnap) => {
      customers.push(docSnap.data() as Customer);
    });
    return customers;
  } catch (err) {
    console.error("Error fetching cloud customers:", err);
    return [];
  }
}

export async function saveCloudCustomer(userId: string, customer: Customer): Promise<void> {
  if (!userId || userId.startsWith("local_")) return;
  try {
    const customerRef = doc(db, "users", userId, "customers", customer.id);
    const sanitized = sanitizeForFirestore(customer);
    await setDoc(customerRef, sanitized, { merge: true });
  } catch (err) {
    console.error("Error saving cloud customer:", err);
    throw err;
  }
}

export async function deleteCloudCustomer(userId: string, customerId: string): Promise<void> {
  if (!userId || userId.startsWith("local_")) return;
  try {
    const customerRef = doc(db, "users", userId, "customers", customerId);
    await deleteDoc(customerRef);
  } catch (err) {
    console.error("Error deleting cloud customer:", err);
    throw err;
  }
}

// -------------------------------------------------------------
// SAVED JOBS & QUOTES
// -------------------------------------------------------------

export async function fetchCloudJobs(userId: string): Promise<JobAnalysisResult[]> {
  if (!userId || userId.startsWith("local_")) return [];
  try {
    const jobsCol = collection(db, "users", userId, "jobs");
    const q = query(jobsCol, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const jobs: JobAnalysisResult[] = [];
    snap.forEach((docSnap) => {
      jobs.push(docSnap.data() as JobAnalysisResult);
    });
    return jobs;
  } catch (err) {
    console.error("Error fetching cloud jobs:", err);
    return [];
  }
}

export async function saveCloudJob(userId: string, job: JobAnalysisResult): Promise<void> {
  if (!userId || userId.startsWith("local_")) return;
  try {
    const jobRef = doc(db, "users", userId, "jobs", job.id);
    const sanitized = sanitizeForFirestore(job);
    await setDoc(jobRef, sanitized, { merge: true });
  } catch (err) {
    console.error("Error saving cloud job:", err);
    throw err;
  }
}

export async function deleteCloudJob(userId: string, jobId: string): Promise<void> {
  if (!userId || userId.startsWith("local_")) return;
  try {
    const jobRef = doc(db, "users", userId, "jobs", jobId);
    await deleteDoc(jobRef);
  } catch (err) {
    console.error("Error deleting cloud job:", err);
    throw err;
  }
}

// -------------------------------------------------------------
// EXPENSES & RECEIPTS
// -------------------------------------------------------------

export async function fetchCloudExpenses(userId: string): Promise<BusinessExpense[]> {
  if (!userId || userId.startsWith("local_")) return [];
  try {
    const expensesCol = collection(db, "users", userId, "expenses");
    const q = query(expensesCol, orderBy("date", "desc"));
    const snap = await getDocs(q);
    const expenses: BusinessExpense[] = [];
    snap.forEach((docSnap) => {
      expenses.push(docSnap.data() as BusinessExpense);
    });
    return expenses;
  } catch (err) {
    console.error("Error fetching cloud expenses:", err);
    return [];
  }
}

export async function saveCloudExpense(userId: string, expense: BusinessExpense): Promise<void> {
  if (!userId || userId.startsWith("local_")) return;
  try {
    const expenseRef = doc(db, "users", userId, "expenses", expense.id);
    const sanitized = sanitizeForFirestore(expense);
    await setDoc(expenseRef, sanitized, { merge: true });
  } catch (err) {
    console.error("Error saving cloud expense:", err);
    throw err;
  }
}

export async function deleteCloudExpense(userId: string, expenseId: string): Promise<void> {
  if (!userId || userId.startsWith("local_")) return;
  try {
    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    await deleteDoc(expenseRef);
  } catch (err) {
    console.error("Error deleting cloud expense:", err);
    throw err;
  }
}

// -------------------------------------------------------------
// DATA MIGRATION & IMPORT
// -------------------------------------------------------------

export async function checkHasCloudData(userId: string): Promise<boolean> {
  if (!userId || userId.startsWith("local_")) return false;
  try {
    const jobsCol = collection(db, "users", userId, "jobs");
    const snap = await getDocs(jobsCol);
    if (!snap.empty) return true;

    const customersCol = collection(db, "users", userId, "customers");
    const snapCust = await getDocs(customersCol);
    if (!snapCust.empty) return true;

    const settingsRef = doc(db, "users", userId, "settings", "business");
    const snapSettings = await getDoc(settingsRef);
    return snapSettings.exists();
  } catch (err) {
    console.warn("Error checking cloud data status:", err);
    return false;
  }
}

export async function importLocalDataToCloud(
  userId: string,
  localSettings?: BusinessSettings,
  localCustomers?: Customer[],
  localJobs?: JobAnalysisResult[],
  localExpenses?: BusinessExpense[]
): Promise<{ settingsCount: number; customersCount: number; jobsCount: number; expensesCount: number }> {
  let settingsCount = 0;
  let customersCount = 0;
  let jobsCount = 0;
  let expensesCount = 0;

  if (localSettings) {
    await saveCloudSettings(userId, localSettings);
    settingsCount++;
  }

  if (localCustomers && localCustomers.length > 0) {
    for (const cust of localCustomers) {
      await saveCloudCustomer(userId, cust);
      customersCount++;
    }
  }

  if (localJobs && localJobs.length > 0) {
    for (const job of localJobs) {
      await saveCloudJob(userId, job);
      jobsCount++;
    }
  }

  if (localExpenses && localExpenses.length > 0) {
    for (const exp of localExpenses) {
      await saveCloudExpense(userId, exp);
      expensesCount++;
    }
  }

  return { settingsCount, customersCount, jobsCount, expensesCount };
}
