import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/common/GlassCard";
import { useHRMStore } from "@/stores/hrmStore";
import { useAuthStore } from "@/stores/authStore";
import { CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/employee/tasks")({ component: EmpTasks });

function EmpTasks() {
  const user = useAuthStore((s) => s.user);
  const emp = useHRMStore((s) => s.employees).find((e) => e.userId === user?.id);
  const empId = emp ? emp.id : (user?.id || "e1");
  const tasks = useHRMStore((s) => s.tasks).filter((t) => t.assignedTo === empId);
  const toggle = useHRMStore((s) => s.toggleTaskDone);
  const updateStatus = useHRMStore((s) => s.updateTaskStatus);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] font-bold tracking-tight">My Tasks</h1>
      <GlassCard className="divide-y divide-white/5">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.01]"
          >
            <button
              onClick={() => toggle(t.id)}
              className="text-white/40 hover:text-white shrink-0"
            >
              {t.status === "done" ? (
                <CheckCircle2 className="h-5 w-5 text-kcyan" />
              ) : (
                <Circle className="h-5 w-5 text-white/30" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div
                className={`text-[13px] truncate ${t.status === "done" ? "line-through text-white/40" : "text-white/85"}`}
              >
                {t.title}
              </div>
              <div className="font-mono text-[10px] text-white/35">
                {t.module} · Due {t.dueDate}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={t.status}
                onChange={(e) => updateStatus(t.id, e.target.value as any)}
                className="rounded-lg border border-white/10 bg-surface3 px-2 py-1 text-[11px] text-white focus:border-kcyan focus:outline-none cursor-pointer"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${t.priority === "high" ? "bg-korange/15 text-korange" : t.priority === "medium" ? "bg-kgold/15 text-kgold" : "bg-kcyan/15 text-kcyan"}`}
              >
                {t.priority}
              </span>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="p-6 text-center text-white/40 text-[13px]">
            No tasks assigned yet.
          </div>
        )}
      </GlassCard>
    </div>
  );
}
