import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Avatar } from "@/components/common/Avatar";
import { useHRMStore } from "@/stores/hrmStore";
import { UserPlus, CheckCircle2, FileText, Sparkles } from "lucide-react";

import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/dashboard/onboarding")({ component: Onboarding });

const checklist = [
  "Personal info collected",
  "Documents uploaded",
  "Workspace assigned",
  "Buddy assigned",
  "First-week plan",
  "Welcome session",
  "LMS courses enrolled",
];

function Onboarding() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "Admin") {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-rose-500/10 p-4 text-rose-500 animate-pulse">
          <UserPlus className="h-8 w-8" />
        </div>
        <h2 className="font-display text-[18px] font-bold text-white">Access Denied</h2>
        <p className="max-w-md text-[13.5px] text-white/50 leading-relaxed">
          This section contains onboarding checklist pipelines restricted to System Administrators only.
        </p>
      </div>
    );
  }
  const interns = useHRMStore((s) => s.employees).filter((e) => e.employmentType === "intern");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight">
          Onboarding & Acquisition
        </h1>
        <p className="mt-1 text-[13px] text-white/55">New joiner pipeline</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="In Progress" value={3} icon={UserPlus} color="cyan" index={0} />
        <StatCard label="Completed (30d)" value={5} icon={CheckCircle2} color="violet" index={1} />
        <StatCard label="Docs Pending" value={2} icon={FileText} color="gold" index={2} />
        <StatCard label="AI Suggestions" value={8} icon={Sparkles} color="blue" index={3} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {interns
          .concat(interns)
          .slice(0, 3)
          .map((e, i) => {
            const progress = [70, 45, 90][i];
            return (
              <GlassCard key={`${e.id}-${i}`} className="p-5" hover glowColor="cyan">
                <div className="flex items-center gap-3">
                  <Avatar initials={e.avatar} size={48} />
                  <div>
                    <div className="font-display text-[14px] font-semibold">{e.name}</div>
                    <div className="text-[11px] text-white/50">{e.role}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/55">Progress</span>
                    <span className="font-display font-semibold text-kcyan">{progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-kblue to-kcyan"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  {checklist.slice(0, 5).map((c, idx) => {
                    const done = idx < Math.floor(progress / 20);
                    return (
                      <div key={c} className="flex items-center gap-2 text-[11.5px]">
                        <CheckCircle2
                          className={`h-3.5 w-3.5 ${done ? "text-kcyan" : "text-white/15"}`}
                        />
                        <span
                          className={done ? "text-white/75" : "text-white/35 line-through-none"}
                        >
                          {c}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
      </div>
    </div>
  );
}
