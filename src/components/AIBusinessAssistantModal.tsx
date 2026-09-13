import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Clock,
  TrendingUp,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { JobAnalysisResult, BusinessSettings } from "../types";
import { formatPounds } from "../utils/jobUtils";

interface AIBusinessAssistantModalProps {
  jobs: JobAnalysisResult[];
  customers?: any[];
  expenses?: any[];
  settings: BusinessSettings;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: any) => void;
  onSelectJob?: (job: JobAnalysisResult) => void;
  onNavigateToJob?: (job: JobAnalysisResult) => void;
  onNavigateToCalendar?: () => void;
  onNavigateToInvoices?: () => void;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  keyMetrics?: any;
  referencedJobs?: Array<{ id: string; ref?: string; title: string }>;
}

export const AIBusinessAssistantModal: React.FC<AIBusinessAssistantModalProps> = ({
  jobs,
  customers = [],
  expenses = [],
  settings,
  isOpen,
  onClose,
  onNavigate,
  onSelectJob,
  onNavigateToJob,
  onNavigateToCalendar,
  onNavigateToInvoices,
}) => {
  const assistantName = settings.assistantName || "Dave";
  const callName = settings.assistantUserCallName || settings.ownerName || "Dan";

  const handleJobClick = (target: JobAnalysisResult) => {
    onClose();
    if (onNavigateToJob) {
      onNavigateToJob(target);
    } else if (onSelectJob) {
      onSelectJob(target);
    }
  };
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: `Hello ${callName}! I'm ${assistantName}, your personal trade assistant for Decorator AI. I have live visibility over your ${jobs.length} jobs, quotes, calendar, material costs, and invoices.\n\nHow can I help your decorating business today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    "What jobs do I have this week?",
    "How much have I spent on paint?",
    "What invoices are unpaid?",
    "Which jobs made the most profit?",
    "What quotes need following up?",
    "What materials do I need to buy?",
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/business-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          jobs,
          expenses,
          customers,
          settings,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: "assistant",
        text: data.reply || "I analyzed your business data and found no conflicts or pending tasks.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        keyMetrics: data.keyMetrics,
        referencedJobs: data.referencedJobs,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("AI Business Assistant failed:", err);
      const fallbackMsg: Message = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text: `I had trouble connecting to the intelligence server. However, you currently have ${jobs.length} recorded jobs. Please try asking again in a few moments.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl bg-[#0d1424] border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[700px] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <span>{assistantName} — Trade Business Copilot</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {settings.assistantPersonality || "Friendly"}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Personal intelligence for {callName} • Grounded on real jobs, receipts & invoices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-slate-400 font-semibold text-[11px] shrink-0">Ask:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs whitespace-nowrap border border-slate-700 hover:border-orange-500/50 transition shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#090e18]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${
                m.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.sender === "user"
                    ? "bg-orange-500 text-slate-950 font-bold"
                    : "bg-slate-800 text-orange-400 border border-slate-700"
                }`}
              >
                {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed space-y-2.5 ${
                  m.sender === "user"
                    ? "bg-orange-500 text-slate-950 font-medium rounded-tr-none"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md"
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>

                {/* Referenced Job Cards */}
                {m.referencedJobs && m.referencedJobs.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Relevant Jobs:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.referencedJobs.map((rj) => {
                        const target = jobs.find((j) => j.id === rj.id);
                        return (
                          <button
                            key={rj.id}
                            type="button"
                            onClick={() => {
                              if (target) {
                                handleJobClick(target);
                              }
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold text-xs border border-slate-700 flex items-center space-x-1"
                          >
                            <span>{rj.ref || rj.title}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[10px] ${
                    m.sender === "user" ? "text-slate-900/70" : "text-slate-500"
                  } text-right`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-orange-400 border border-slate-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span>Analysing your live jobs and financial records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask your assistant anything about your decorating business..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:border-orange-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

