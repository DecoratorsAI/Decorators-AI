import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CloudUpload, CheckCircle, X, Shield, ArrowRight, Database } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LocalDataImportModalProps {
  onImportComplete?: () => void;
}

export const LocalDataImportModal: React.FC<LocalDataImportModalProps> = ({
  onImportComplete,
}) => {
  const {
    showLocalImportPrompt,
    dismissLocalImport,
    importLocalDataNow,
    localDataSummary,
    user,
  } = useAuth();

  const [importing, setImporting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    jobsCount: number;
    customersCount: number;
    settingsCount: number;
  } | null>(null);

  if (!showLocalImportPrompt || !user || !localDataSummary) {
    return null;
  }

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await importLocalDataNow();
      setSuccessResult(res);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      console.error("Failed to import local data:", err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0e162a] border border-orange-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Import Local Data to Cloud
              </h3>
              <p className="text-xs text-slate-400">
                Existing trade records found on this device
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissLocalImport}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successResult ? (
          <div className="py-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Import Complete!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Successfully synced {successResult.jobsCount} quotes and {successResult.customersCount} customers to your secure account ({user.email}).
            </p>
            <button
              type="button"
              onClick={dismissLocalImport}
              className="mt-3 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              We detected existing Decorator AI data stored locally in your browser. Would you like to migrate this data into your authenticated account so you can access it on your iPhone, iPad, laptop, and all other devices?
            </p>

            {/* Found items pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-900/80 rounded-2xl border border-slate-800 mb-5 text-center">
              <div className="p-2">
                <span className="block text-lg font-extrabold text-white">
                  {localDataSummary.jobsCount}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Saved Quotes
                </span>
              </div>
              <div className="p-2">
                <span className="block text-lg font-extrabold text-white">
                  {localDataSummary.customersCount}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Customers
                </span>
              </div>
              <div className="p-2 col-span-2 sm:col-span-1">
                <span className="block text-lg font-extrabold text-orange-400">
                  {localDataSummary.hasSettings ? "Ready" : "None"}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Trade Settings
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                id="btn-import-local-data"
                disabled={importing}
                onClick={handleImport}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md transition disabled:opacity-50"
              >
                {importing ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Migrate to Cloud Account</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={dismissLocalImport}
                disabled={importing}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold border border-slate-800 transition"
              >
                Keep Separate / Skip
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
