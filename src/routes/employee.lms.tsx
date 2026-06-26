import { createFileRoute } from "@tanstack/react-router";
import { useHRMStore } from "@/stores/hrmStore";
import { GlassCard } from "@/components/common/GlassCard";
import { motion } from "framer-motion";

export const Route = createFileRoute("/employee/lms")({ component: EmpLMS });

function EmpLMS() {
  const courses = useHRMStore((s) => s.courses);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] font-bold tracking-tight">My Learning</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => (
          <GlassCard key={c.id} className="p-5" hover glowColor="violet">
            <div className="font-display text-[14px] font-semibold">{c.title}</div>
            <div className="text-[11px] text-white/45">
              {c.category} · {c.duration}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-white/55">{c.progress}% complete</span>
              <span className="font-mono text-kgold">+{c.xp} XP</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c.progress}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full bg-gradient-to-r from-kviolet to-kcyan"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {c.modules.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
                >
                  {m}
                </span>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
