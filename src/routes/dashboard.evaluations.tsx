import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { Avatar } from "@/components/common/Avatar";
import { useHRMStore } from "@/stores/hrmStore";

export const Route = createFileRoute("/dashboard/evaluations")({ component: Evaluations });

function Evaluations() {
  const evals = useHRMStore((s) => s.evaluations);
  const employees = useHRMStore((s) => s.employees);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight">Evaluations</h1>
        <p className="mt-1 text-[13px] text-white/55">Performance reviews & feedback</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {evals.map((e) => {
          const emp = employees.find((x) => x.userId === e.employeeId);
          return (
            <GlassCard key={e.id} className="p-5" hover glowColor="violet">
              <div className="flex items-start gap-3">
                <Avatar initials={emp?.avatar || "??"} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-[14px] font-semibold">{emp?.name}</div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < e.rating ? "fill-kgold text-kgold" : "text-white/15"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/50">
                    {e.category} · by {e.evaluator} · {e.date}
                  </div>
                  <p className="mt-3 text-[12.5px] italic text-white/65">"{e.comment}"</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
