import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { GlassCard } from "@/components/common/GlassCard";
import { GlowBadge } from "@/components/common/GlowBadge";
import { Avatar } from "@/components/common/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { useHRMStore } from "@/stores/hrmStore";
import { CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard/profile")({ component: LeadProfile });

function LeadProfile() {
  const user = useAuthStore((s) => s.user);
  const tasks = useHRMStore((s) => s.tasks) || [];
  const employees = useHRMStore((s) => s.employees) || [];

  // Find tasks assigned to the Lead.
  const myTasks = tasks.filter((t) => {
    return t.assignedTo === user?.id;
  });

  const pendingTasks = myTasks.filter((t) => t.status !== "done");
  const completedTasks = myTasks.filter((t) => t.status === "done");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
        My Lead Profile
      </h1>
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 justify-between">
          <div className="flex items-center gap-5">
            <Avatar initials={user?.avatar || "VI"} size={80} />
            <div>
              <div className="font-display text-[22px] font-bold">{user?.name}</div>
              <div className="text-[13px] text-white/55">{user?.email}</div>
              <div className="mt-2 flex gap-2">
                <GlowBadge label={user?.role || "Lead"} color="blue" />
                <GlowBadge label={user?.department || "Technology"} color="cyan" />
              </div>
            </div>
          </div>
          <div className="flex flex-col text-right text-[12px] text-white/50 font-mono">
            <span>Joined: January 15, 2024</span>
            <span>Location: Bengaluru, India</span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { k: "Role Type", v: "Administrator / Lead" },
            { k: "Department", v: user?.department || "Technology" },
            { k: "Active Interns Monitored", v: `${employees.filter(e => e.status === 'active').length} Interns` },
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

      {/* Tasks Section for Lead */}
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard className="p-6 flex flex-col gap-4">
          <h2 className="font-display text-[18px] font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet-400" /> Pending Management Tasks ({pendingTasks.length})
          </h2>
          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 scrollbar-none flex-1">
            {pendingTasks.map((t) => (
              <div key={t.id} className="rounded-lg border border-white/5 bg-white/[0.01] p-3 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[13px] font-medium text-white/80">{t.title}</span>
                  <GlowBadge label={t.priority} color={t.priority === 'high' ? 'orange' : t.priority === 'medium' ? 'gold' : 'cyan'} className="scale-75 origin-right shrink-0" />
                </div>
                <div className="flex justify-between items-center text-[10px] text-white/40 font-mono">
                  <span>Due: {t.dueDate}</span>
                  <span className="uppercase">{t.module}</span>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="py-12 text-center text-white/30 text-[12px] italic bg-white/[0.01] border border-dashed border-white/5 rounded-lg">
                No pending management tasks assigned to you. All clear! ✨
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col gap-4">
          <h2 className="font-display text-[18px] font-bold tracking-tight flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-kcyan" /> Completed Tasks ({completedTasks.length})
          </h2>
          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 scrollbar-none flex-1">
            {completedTasks.map((t) => (
              <div key={t.id} className="rounded-lg border border-white/5 bg-white/[0.01] p-3 flex flex-col gap-1.5 opacity-60">
                <span className="text-[13px] text-white/70 line-through">{t.title}</span>
                <div className="text-[9.5px] text-white/30 font-mono">
                  Completed · {t.dueDate}
                </div>
              </div>
            ))}
            {completedTasks.length === 0 && (
              <div className="py-12 text-center text-white/30 text-[12px] italic bg-white/[0.01] border border-dashed border-white/5 rounded-lg">
                No completed tasks.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
