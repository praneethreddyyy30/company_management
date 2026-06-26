import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/common/GlassCard";
import { GlowBadge } from "@/components/common/GlowBadge";
import { Avatar } from "@/components/common/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { useHRMStore } from "@/stores/hrmStore";
import { Sparkles } from "lucide-react";
import { aiPerformanceAPI } from "@/lib/api";

export const Route = createFileRoute("/employee/profile")({ component: Profile });

function Profile() {
  const user = useAuthStore((s) => s.user);
  const emp = useHRMStore((s) => s.employees).find((e) => e.userId === user?.id) || user;

  const [aiPerformance, setAiPerformance] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setLoadingAi(true);
      aiPerformanceAPI
        .getByIntern(user.id)
        .then((res) => {
          setAiPerformance(res);
        })
        .catch((err) => {
          console.warn("Failed to fetch AI performance:", err);
          setAiPerformance(null);
        })
        .finally(() => {
          setLoadingAi(false);
        });
    }
  }, [user?.id]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] font-bold tracking-tight">My Profile</h1>
      <GlassCard className="p-6">
        <div className="flex items-center gap-5">
          <Avatar initials={emp?.avatar || "AM"} size={80} />
          <div>
            <div className="font-display text-[22px] font-bold">{emp?.name}</div>
            <div className="text-[13px] text-white/55">{emp?.email}</div>
            <div className="mt-2 flex gap-2">
              <GlowBadge label={emp?.role || ""} color="violet" />
              <GlowBadge label={emp?.department || ""} color="cyan" />
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { k: "Employee ID", v: emp?.id },
            { k: "Joined", v: emp?.joinedAt?.slice(0, 10) },
            { k: "Department", v: emp?.department },
            { k: "Manager", v: "Vikram Iyer" },
            { k: "Location", v: "Bengaluru, India" },
            { k: "Status", v: emp?.status ? (emp.status === "active" ? "Active" : emp.status === "leave" ? "On Leave" : "Off Active") : "Active" },
            { k: "Employment Type", v: emp?.employmentType ? (emp.employmentType.charAt(0).toUpperCase() + emp.employmentType.slice(1)) : "Full-Time" },
          ].map((r) => (
            <div key={r.k} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                {r.k}
              </div>
              <div className="mt-1 text-[13px] text-white/80">{r.v}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* AI Standup Insights Card */}
      <GlassCard className="p-6 border-kcyan/20 bg-kcyan/[0.01] relative overflow-hidden">
        {/* Glow highlight */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-kcyan/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2.5 mb-4">
          <Sparkles className="h-5 w-5 text-kcyan animate-pulse" />
          <div>
            <h2 className="font-display text-[18px] font-bold tracking-tight">AI Standup Insights</h2>
            <p className="text-[11.5px] text-white/50">Weekly automated review & constructive recommendations</p>
          </div>
        </div>

        {loadingAi ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-kcyan border-t-transparent" />
            <span className="text-[12px] text-white/45">Analyzing your latest standups...</span>
          </div>
        ) : aiPerformance ? (
          <div className="space-y-4 text-[13px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-white/5 bg-white/[0.01] p-3 flex flex-col justify-between min-h-[80px]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/45">Overall Grade</span>
                <span className="text-[22px] font-extrabold text-kcyan font-display mt-1">
                  {aiPerformance.grade || "B"}
                </span>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.01] p-3 flex flex-col justify-between min-h-[80px] md:col-span-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/45">Review Date</span>
                <span className="text-[14px] text-white/80 mt-2">
                  {aiPerformance.compiledDate ? new Date(aiPerformance.compiledDate).toLocaleDateString() : "Just now"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 rounded-lg border border-white/5 bg-white/[0.01] p-3.5">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-white/45">
                Progress Summary
              </span>
              <p className="text-white/85 leading-relaxed">
                {aiPerformance.progressSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 rounded-lg border border-white/5 bg-white/[0.01] p-3.5">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-white/45">
                  Patterns Observed
                </span>
                <p className="text-white/85 leading-relaxed">
                  {aiPerformance.patternsObserved}
                </p>
              </div>
              <div className="space-y-1.5 rounded-lg border border-kcyan/10 bg-kcyan/[0.01] p-3.5">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-kcyan">
                  Recommendations
                </span>
                <p className="text-kcyan leading-relaxed font-sans italic">
                  "{aiPerformance.constructiveRecommendation || aiPerformance.recommendations}"
                </p>
              </div>
            </div>

            <div className="text-[10px] text-white/35 text-right font-mono">
              Based on your last {aiPerformance.standupsCount || 7} daily standup submissions
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-white/40 text-[12px] italic bg-white/[0.01] border border-dashed border-white/5 rounded-lg">
            No standup evaluation compiled yet. Keep submitting daily standups, and your lead can compile your performance review!
          </div>
        )}
      </GlassCard>
    </div>
  );
}
