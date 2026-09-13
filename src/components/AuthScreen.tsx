import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Cloud,
  Smartphone,
  Laptop,
  ExternalLink,
  UserCheck,
  Zap,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuthScreenProps {
  onSuccess?: () => void;
  onContinueOffline?: () => void;
  canDismiss?: boolean;
}

type AuthMode = "signin" | "signup" | "forgot";

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onContinueOffline,
  canDismiss = false,
}) => {
  const { signIn, signUp, resetPassword, loginAsLocalTradeUser } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [suggestMode, setSuggestMode] = useState<"signin" | "signup" | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleAuthError = (err: unknown) => {
    if (!err || typeof err !== "object") {
      setError("An unexpected error occurred. Please try again.");
      return;
    }
    const code = (err as { code?: string }).code || "";
    const message = (err as { message?: string }).message || "";

    if (code === "auth/operation-not-allowed" || message.includes("OPERATION_NOT_ALLOWED") || message.includes("operation-not-allowed")) {
      setIsOperationNotAllowed(true);
      setError(
        "Email/Password authentication is currently turned off in your Firebase Project configuration."
      );
      return;
    }

    setIsOperationNotAllowed(false);

    switch (code) {
      case "auth/invalid-email":
        setError("Please enter a valid email address.");
        break;
      case "auth/user-not-found":
      case "auth/invalid-credential":
        setError("Incorrect email or password, or no account has been registered with this email yet.");
        if (mode === "signin") {
          setSuggestMode("signup");
        }
        break;
      case "auth/wrong-password":
        setError("Incorrect password. Please verify and try again.");
        break;
      case "auth/email-already-in-use":
        setError("An account with this email already exists. Please sign in instead.");
        setSuggestMode("signin");
        break;
      case "auth/weak-password":
        setError("Password is too short. Please use at least 6 characters.");
        break;
      case "auth/too-many-requests":
        setError("Too many attempts. Please wait a moment or reset your password.");
        break;
      case "auth/network-request-failed":
        setError("Network connection issue. Please check your internet connection.");
        break;
      default:
        setError(message || "Authentication failed.");
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsOperationNotAllowed(false);
    setSuggestMode(null);
    setResetSent(false);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (mode === "forgot") {
      setLoading(true);
      try {
        await resetPassword(email);
        setResetSent(true);
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      setLoading(true);
      try {
        await signUp(email, password);
        if (onSuccess) onSuccess();
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Sign in
    setLoading(true);
    try {
      await signIn(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAsLocalAccount = (customEmail?: string) => {
    const targetEmail = (customEmail || email).trim() || "trade.decorator@local";
    loginAsLocalTradeUser(targetEmail);
    if (onSuccess) {
      onSuccess();
    } else if (onContinueOffline) {
      onContinueOffline();
    }
  };

  return (
    <div
      className={
        canDismiss
          ? "relative w-full max-w-md my-auto py-2 selection:bg-orange-500 selection:text-slate-950"
          : "min-h-screen bg-[#0b1220] flex flex-col justify-center items-center px-4 py-8 sm:py-12 selection:bg-orange-500 selection:text-slate-950"
      }
    >
      {/* Background glow accents (only in full-screen mode) */}
      {!canDismiss && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-10 w-[400px] h-[300px] bg-amber-600/10 rounded-full blur-3xl" />
        </div>
      )}

      <div className="relative w-full max-w-md z-10">
        {/* Close button if presented in a modal */}
        {canDismiss && onContinueOffline && (
          <button
            type="button"
            onClick={onContinueOffline}
            className="absolute -top-3 -right-2 sm:-top-2 sm:-right-2 z-20 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3.5">
            <img
              src="/decorator-ai-logo.jpg"
              alt="Decorator AI"
              className="w-16 h-16 rounded-2xl object-cover shadow-2xl border-2 border-orange-500/30"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Decorator <span className="text-orange-500">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xs mx-auto">
            UK Painting & Decorating AI Assistant with instant multi-device cloud sync
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex items-center justify-center gap-2 mb-5 text-[11px] text-slate-300">
          <span className="inline-flex items-center space-x-1 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
            <Cloud className="w-3 h-3 text-orange-400" />
            <span>Cloud Sync</span>
          </span>
          <span className="inline-flex items-center space-x-1 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
            <Smartphone className="w-3 h-3 text-amber-400" />
            <span>iPhone & iPad</span>
          </span>
          <span className="inline-flex items-center space-x-1 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
            <Laptop className="w-3 h-3 text-orange-400" />
            <span>Laptop & Mac</span>
          </span>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0e162a]/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Mode Switcher */}
          {mode !== "forgot" ? (
            <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                id="tab-auth-signin"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setIsOperationNotAllowed(false);
                  setSuggestMode(null);
                }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer ${
                  mode === "signin"
                    ? "bg-orange-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="tab-auth-signup"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setIsOperationNotAllowed(false);
                  setSuggestMode(null);
                }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer ${
                  mode === "signup"
                    ? "bg-orange-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white">Reset Password</span>
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setIsOperationNotAllowed(false);
                  setResetSent(false);
                }}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* Operation Not Allowed Guidance Banner */}
          {isOperationNotAllowed && (
            <div className="mb-5 p-4 bg-amber-950/40 border border-amber-500/50 rounded-2xl space-y-3">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300">
                    Firebase Email Sign-In Provider Disabled
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    By default, Google Firebase requires you to toggle <strong>Email/Password</strong> ON in the Firebase console before users can register or sign in.
                  </p>
                </div>
              </div>

              {/* Step by step */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <span>To enable Cloud Login in 30 seconds:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>
                    Open{" "}
                    <a
                      href="https://console.firebase.google.com/project/ai-studio-applet-webapp-a4a0e/authentication/providers"
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 hover:text-orange-300 font-semibold underline inline-flex items-center space-x-0.5"
                    >
                      <span>Firebase Auth Console</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                    </a>
                  </li>
                  <li>Click <strong>Email/Password</strong> under Sign-in providers</li>
                  <li>Toggle <strong>Enable</strong> to ON and click <strong>Save</strong></li>
                </ol>
              </div>

              {/* Instant bypass button */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  id="auth-bypass-local-btn"
                  onClick={() => handleStartAsLocalAccount(email)}
                  className="w-full py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md transition cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    Continue as Local Trade Account ({email.trim() ? email.trim() : "Instant Start"})
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Standard error banner */}
          {error && !isOperationNotAllowed && (
            <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-2xl space-y-2 text-rose-200 text-xs">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
              {suggestMode === "signup" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setSuggestMode(null);
                  }}
                  className="mt-1 block text-[11px] text-orange-300 hover:text-white underline font-bold"
                >
                  Click here to Create a New Account with this email →
                </button>
              )}
              {suggestMode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setSuggestMode(null);
                  }}
                  className="mt-1 block text-[11px] text-orange-300 hover:text-white underline font-bold"
                >
                  Click here to Sign In instead →
                </button>
              )}
            </div>
          )}

          {/* Reset Sent Banner */}
          {resetSent && (
            <div className="mb-5 p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-start space-x-2.5 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                Password reset link sent! Check your email inbox and spam folder for instructions.
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Decorator / Business Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="auth-email-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. danvtv04@gmail.com"
                  className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      id="link-forgot-password"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                        setIsOperationNotAllowed(false);
                      }}
                      className="text-[11px] text-orange-400 hover:text-orange-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="auth-password-input"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                    className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Signup only) */}
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="auth-confirm-password-input"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 disabled:opacity-50 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20 transition cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : mode === "signin" ? (
                <>
                  <span>Sign In & Open App</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === "signup" ? (
                <>
                  <span>Create Account & Sync</span>
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Send Reset Email</span>
                  <Mail className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Start / Local Account Alternative */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col items-center space-y-2">
            <button
              type="button"
              id="auth-instant-trade-start-btn"
              onClick={() => handleStartAsLocalAccount(email)}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {email.trim()
                  ? `Continue with Local Trade Profile (${email.trim()})`
                  : "Quick Start as Guest / Local Trade Mode"}
              </span>
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              Quotes & customers will be securely saved locally on this browser.
            </p>
          </div>
        </div>

        {/* Security / Privacy Trust Badge */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-[11px] text-slate-500 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Decorator AI uses client-side encryption & dedicated storage isolation.
          </span>
        </div>
      </div>
    </div>
  );
};
