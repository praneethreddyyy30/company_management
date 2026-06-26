import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Send, X } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/stores/appStore";

interface Msg {
  role: "user" | "ai";
  text: string;
}

const seedMsgs: Msg[] = [
  {
    role: "ai",
    text: "Hi Arjun — I'm KLASSYGO AI. I can summarise activity, flag risks, and surface insights across HRM, ERP & CRM. What would you like to know?",
  },
];

const suggestions = [
  "Show me today's task summary",
  "Who has pending evaluations?",
  "Top performers this month?",
];

export function AICopilot() {
  const open = useAppStore((s) => s.aiPanelOpen);
  const setOpen = useAppStore((s) => s.setAIPanel);
  const [msgs, setMsgs] = useState<Msg[]>(seedMsgs);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: "ai", text: aiReply(text) }]);
    }, 900);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed inset-y-0 right-0 z-50 flex w-[400px] flex-col border-l border-white/7 bg-carbon/96 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-kblue to-kviolet shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="font-display text-[14px] font-semibold">
                  KLASSYGO AI <span className="text-kcyan">✦</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-3">
                {msgs.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={
                        m.role === "user"
                          ? "max-w-[85%] rounded-2xl rounded-br-sm border border-kblue/30 bg-kblue/15 px-3.5 py-2.5 text-[13px]"
                          : "max-w-[85%] rounded-2xl rounded-bl-sm border border-white/7 bg-surface3/70 px-3.5 py-2.5 text-[13px]"
                      }
                    >
                      {m.role === "ai" && <span className="mr-1 text-kcyan">✦</span>}
                      {m.text}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex">
                    <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-white/7 bg-surface3/70 px-3.5 py-3">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <motion.span
                          key={i}
                          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d }}
                          className="h-1.5 w-1.5 rounded-full bg-kcyan"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/5 px-4 py-3">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[11px] text-white/60 hover:border-kcyan/40 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 pl-4 pr-1.5 py-1.5"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask KLASSYGO AI…"
                  className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/30 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-kblue to-kviolet text-white shadow-[0_4px_14px_rgba(124,58,237,0.4)] hover:brightness-110"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function aiReply(q: string): string {
  const lc = q.toLowerCase();
  if (lc.includes("task"))
    return "You have 6 high-priority tasks in flight. Vikram and Arjun own 4 of them. Want me to draft a stand-up summary?";
  if (lc.includes("evaluat"))
    return "3 evaluations are pending this week — Ananya Singh (Design), Karthik Nair (Finance), and Nikhil Joshi (DevOps). All overdue by ≥2 days.";
  if (lc.includes("perform"))
    return "Top performers this month: Sanjay Krishnan (97), Vikram Iyer (95), Tara D'Souza (93). Workforce score is trending +2.1% week-over-week.";
  return "Got it. I've cross-referenced this against HRM, LMS and Talent pipelines — drilling down now. Anything specific you'd like surfaced?";
}
