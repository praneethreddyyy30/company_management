import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { useHRMStore } from "@/stores/hrmStore";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/employee/feedback")({ component: Feedback });

function Feedback() {
  const user = useAuthStore((s) => s.user);
  const evals = useHRMStore((s) => s.evaluations).filter((e) => e.employeeId === (user?.id || "e1"));
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Feedback</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {evals.map((e) => (
          <GlassCard key={e.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="font-display text-[14px] font-semibold">{e.evaluator}</div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < e.rating ? "fill-kgold text-kgold" : "text-white/15"}`}
                  />
                ))}
              </div>
            </div>
            <div className="text-[11px] text-white/40">
              {e.category} · {e.date}
            </div>
            <p className="mt-3 text-[13px] italic text-white/70">"{e.comment}"</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
