import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isWeekend,
  isToday,
} from "date-fns";
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Avatar } from "@/components/common/Avatar";
import { useHRMStore } from "@/stores/hrmStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/leave")({ component: LeavePage });

function LeavePage() {
  const leaves = useHRMStore((s) => s.leaves);
  const employees = useHRMStore((s) => s.employees);
  const setLeaveStatus = useHRMStore((s) => s.setLeaveStatus);
  const pending = leaves.filter((l) => l.status === "Pending");
  const approved = leaves.filter((l) => l.status === "Approved").length;

  const monthDays = useMemo(() => {
    const now = new Date(2025, 4, 1);
    const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
    const offset = getDay(days[0]);
    return { days, offset };
  }, []);

  const getLeavesForDay = (d: Date) =>
    leaves.filter((l) => {
      const from = parseISO(l.fromDate),
        to = parseISO(l.toDate);
      return d >= from && d <= to;
    });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight">Leave Management</h1>
        <p className="mt-1 text-[13px] text-white/55">Approvals, calendar, and balances</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Available Leaves" value={14} icon={CalendarIcon} color="cyan" index={0} />
        <StatCard label="Used" value={approved} icon={CheckCircle2} color="violet" index={1} />
        <StatCard
          label="Pending Approval"
          value={pending.length}
          icon={Clock}
          color="gold"
          index={2}
        />
      </div>

      <GlassCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-display text-[15px] font-semibold">May 2025</div>
            <div className="text-[11px] text-white/45">Team leave calendar</div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono uppercase tracking-wider text-white/35">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {Array.from({ length: monthDays.offset }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {monthDays.days.map((d) => {
            const dl = getLeavesForDay(d);
            return (
              <div
                key={d.toString()}
                className={cn(
                  "group relative aspect-square rounded-xl border bg-surface2/60 p-2",
                  isToday(d) ? "border-kcyan bg-kcyan/5" : "border-white/5",
                )}
              >
                <div
                  className={cn(
                    "font-display text-[13px] font-semibold",
                    isWeekend(d) && !isToday(d) ? "text-white/30" : "text-white/80",
                  )}
                >
                  {format(d, "d")}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {dl.slice(0, 4).map((l) => (
                    <span
                      key={l.id}
                      title={`${l.employeeName} · ${l.type}`}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        l.status === "Approved" && "bg-kcyan",
                        l.status === "Pending" && "bg-kgold",
                        l.status === "Rejected" && "bg-korange",
                      )}
                    />
                  ))}
                  {dl.length > 4 && (
                    <span className="text-[8px] text-white/40">+{dl.length - 4}</span>
                  )}
                </div>
                {dl.length > 0 && (
                  <div className="pointer-events-none absolute left-1/2 top-full z-20 hidden -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg border border-white/10 bg-carbon/95 px-2 py-1.5 text-[10px] text-white/80 shadow-xl group-hover:block">
                    {dl.map((l) => l.employeeName).join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-5">
        <GlassCard className="lg:col-span-3 p-5">
          <div className="font-display text-[15px] font-semibold">Pending Approvals</div>
          <div className="text-[11px] text-white/45">Action required</div>
          <div className="mt-4 space-y-3">
            {pending.length === 0 && (
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 text-center text-[12px] text-white/40">
                All caught up ✨
              </div>
            )}
            {pending.map((l) => {
              const emp = employees.find((e) => e.userId === l.employeeId);
              return (
                <motion.div
                  key={l.id}
                  layout
                  className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.03] p-3"
                >
                  <Avatar initials={emp?.avatar || "??"} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[13px] font-semibold">
                        {l.employeeName}
                      </span>
                      <span className="rounded-full bg-white/8 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/60">
                        {l.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/50">
                      {format(parseISO(l.fromDate), "MMM d")} →{" "}
                      {format(parseISO(l.toDate), "MMM d")} · {l.days}d
                    </div>
                    <div className="mt-0.5 text-[12px] italic text-white/55">"{l.reason}"</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setLeaveStatus(l.id, "Approved");
                        toast.success("Leave approved", { description: l.employeeName });
                      }}
                      className="rounded-lg border border-kcyan/30 bg-kcyan/10 px-3 py-1.5 text-[11px] font-medium text-kcyan hover:bg-kcyan/20"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setLeaveStatus(l.id, "Rejected");
                        toast.error("Leave rejected", { description: l.employeeName });
                      }}
                      className="rounded-lg border border-korange/30 bg-korange/10 px-3 py-1.5 text-[11px] font-medium text-korange hover:bg-korange/20"
                    >
                      Decline
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-5">
          <div className="font-display text-[15px] font-semibold">Leave Balance</div>
          <div className="text-[11px] text-white/45">Per employee</div>
          <table className="mt-4 w-full text-[12px]">
            <thead className="font-mono text-[9px] uppercase tracking-wider text-white/35">
              <tr>
                <th className="pb-2 text-left">Employee</th>
                <th className="pb-2">Casual</th>
                <th className="pb-2">Sick</th>
                <th className="pb-2">Earned</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 8).map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-white/4 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar initials={e.avatar} size={24} />
                      <span className="text-white/80">{e.name.split(" ")[0]}</span>
                    </div>
                  </td>
                  <td className="text-center font-mono text-white/60">
                    {6 - (e.tasksCompleted % 3)}
                  </td>
                  <td className="text-center font-mono text-white/60">
                    {8 - (e.tasksCompleted % 4)}
                  </td>
                  <td className="text-center font-mono text-kcyan">
                    {14 - (e.tasksCompleted % 5)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}

void XCircle;
