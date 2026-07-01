import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useHRMStore, STAGES } from "@/stores/hrmStore";
import type { CandidateStage } from "@/data/mockData";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Avatar } from "@/components/common/Avatar";
import { Sparkles, Users, UserCheck, Send, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/dashboard/talent")({ component: Talent });

const stageLabels: Record<CandidateStage, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer Sent",
  onboarded: "Onboarded",
};
const stageColor: Record<CandidateStage, string> = {
  applied: "border-white/15 text-white/70",
  screening: "border-kblue/40 text-kblue-bright",
  interview: "border-kviolet/40 text-kviolet",
  offer: "border-kgold/40 text-kgold",
  onboarded: "border-kcyan/40 text-kcyan",
};

function Talent() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "Admin") {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-rose-500/10 p-4 text-rose-500 animate-pulse">
          <Users className="h-8 w-8" />
        </div>
        <h2 className="font-display text-[18px] font-bold text-white">Access Denied</h2>
        <p className="max-w-md text-[13.5px] text-white/50 leading-relaxed">
          This section contains recruiting candidate pipelines and metrics restricted to System Administrators only.
        </p>
      </div>
    );
  }

  const candidates = useHRMStore((s) => s.candidates);
  const moveCandidate = useHRMStore((s) => s.moveCandidate);

  const next = (s: CandidateStage): CandidateStage | null => {
    const i = STAGES.indexOf(s);
    return i < STAGES.length - 1 ? STAGES[i + 1] : null;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight">
          Talent Acquisition Intelligence
        </h1>
        <p className="mt-1 text-[13px] text-white/55">AI-augmented hiring pipeline</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Pipeline"
          value={candidates.length}
          icon={Users}
          color="cyan"
          index={0}
        />
        <StatCard
          label="Active Interviews"
          value={candidates.filter((c) => c.stage === "interview").length}
          icon={Sparkles}
          color="violet"
          index={1}
        />
        <StatCard
          label="Offers Sent"
          value={candidates.filter((c) => c.stage === "offer").length}
          icon={Send}
          color="gold"
          index={2}
        />
        <StatCard
          label="Hired This Month"
          value={candidates.filter((c) => c.stage === "onboarded").length}
          icon={UserCheck}
          color="blue"
          index={3}
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const list = candidates.filter((c) => c.stage === stage);
          return (
            <div key={stage} className="w-[280px] shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  {stageLabels[stage]}
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    stageColor[stage],
                  )}
                >
                  {list.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {list.map((c) => {
                  const score = c.aiMatchScore;
                  const tier =
                    score >= 90
                      ? { l: "EXCELLENT", c: "kcyan" }
                      : score >= 75
                        ? { l: "STRONG", c: "kgold" }
                        : score >= 60
                          ? { l: "GOOD", c: "kblue" }
                          : { l: "REVIEW", c: "korange" };
                  return (
                    <motion.div
                      key={c.id}
                      layout
                      transition={{ type: "spring", stiffness: 280, damping: 26 }}
                    >
                      <GlassCard
                        className="p-3"
                        hover
                        glowColor={tier.c as "cyan" | "gold" | "blue" | "orange"}
                      >
                        <div className="flex items-start gap-2.5">
                          <Avatar
                            initials={c.name
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")}
                            size={36}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-display text-[13px] font-semibold leading-tight">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-white/55">{c.role}</div>
                          </div>
                          {score > 88 && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-kviolet/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-kviolet">
                              <Sparkles className="h-2 w-2" /> TOP
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-white/45">AI Match</span>
                            <span
                              className={cn(
                                "font-display font-semibold",
                                tier.c === "kcyan" && "text-kcyan",
                                tier.c === "kgold" && "text-kgold",
                                tier.c === "kblue" && "text-kblue-bright",
                                tier.c === "korange" && "text-korange",
                              )}
                            >
                              {score}% · {tier.l}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                              className={cn(
                                "h-full rounded-full",
                                tier.c === "kcyan" && "bg-gradient-to-r from-kcyan to-kblue-bright",
                                tier.c === "kgold" && "bg-gradient-to-r from-kgold to-korange",
                                tier.c === "kblue" && "bg-kblue-bright",
                                tier.c === "korange" && "bg-korange",
                              )}
                            />
                          </div>
                        </div>
                        <div className="mt-2 font-mono text-[9px] text-white/30">
                          Applied {c.appliedAt}
                        </div>
                        {next(c.stage) && (
                          <button
                            onClick={() => {
                              moveCandidate(c.id, next(c.stage)!);
                              toast.success(`Moved to ${stageLabels[next(c.stage)!]}`, {
                                description: c.name,
                              });
                            }}
                            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-white/8 bg-white/[0.03] py-1.5 text-[10.5px] font-medium text-white/70 hover:border-kcyan/40 hover:text-kcyan"
                          >
                            Next Stage <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </GlassCard>
                    </motion.div>
                  );
                })}
                {list.length === 0 && (
                  <div className="rounded-lg border border-dashed border-white/8 p-4 text-center text-[11px] text-white/30">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
