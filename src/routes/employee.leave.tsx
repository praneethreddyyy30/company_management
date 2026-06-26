import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GlassCard } from "@/components/common/GlassCard";
import { useHRMStore } from "@/stores/hrmStore";
import { useAuthStore } from "@/stores/authStore";
import type { LeaveType } from "@/data/mockData";
import { toast } from "sonner";
import { differenceInCalendarDays } from "date-fns";

export const Route = createFileRoute("/employee/leave")({ component: EmpLeave });

const schema = z.object({
  type: z.enum(["casual", "sick", "earned"]),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  reason: z.string().min(5),
});

function EmpLeave() {
  const user = useAuthStore((s) => s.user);
  const addLeave = useHRMStore((s) => s.addLeave);
  const leaves = useHRMStore((s) => s.leaves).filter((l) => l.employeeId === (user?.id || "e1"));
  type Form = z.infer<typeof schema>;
  const { register, handleSubmit, watch, setValue, reset, formState } = useForm<Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: { type: "casual" } as Partial<Form>,
  });
  const type = watch("type");

  const onSubmit = (data: Form) => {
    const days = Math.max(
      1,
      differenceInCalendarDays(new Date(data.toDate), new Date(data.fromDate)) + 1,
    );
    addLeave({
      id: `l${Date.now()}`,
      employeeId: user?.id || "e1",
      employeeName: user?.name || "Arjun Mehta",
      type: data.type,
      fromDate: data.fromDate,
      toDate: data.toDate,
      days,
      reason: data.reason,
      status: "Pending",
      appliedAt: new Date().toISOString().slice(0, 10),
    });
    toast.success("Leave request submitted", { description: `${days} day(s)` });
    reset({ type: "casual" } as Form);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Leave</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6" glowColor="cyan">
          <div className="text-[11px] font-mono uppercase tracking-wider text-white/40">
            Available
          </div>
          <div className="mt-2 font-display text-[48px] font-extrabold text-kcyan">14</div>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
            <div className="flex gap-2">
              {(["casual", "sick", "earned"] as LeaveType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("type", t)}
                  className={`flex-1 rounded-full border px-3 py-2 text-[12px] capitalize ${type === t ? "border-kcyan bg-kcyan/15 text-kcyan" : "border-white/10 text-white/60"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                {...register("fromDate")}
                className="h-10 rounded-lg border border-white/8 bg-white/4 px-3 text-[12px] text-white"
              />
              <input
                type="date"
                {...register("toDate")}
                className="h-10 rounded-lg border border-white/8 bg-white/4 px-3 text-[12px] text-white"
              />
            </div>
            <textarea
              {...register("reason")}
              rows={2}
              placeholder="Reason…"
              className="w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-[12px] focus:outline-none"
            />
            {formState.errors.reason && (
              <div className="text-[11px] text-korange">{formState.errors.reason.message}</div>
            )}
            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-r from-kblue to-kviolet font-display text-[13px] font-semibold text-white"
            >
              Submit Request
            </button>
          </form>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="font-display text-[15px] font-semibold">My Leave History</div>
          <div className="mt-3 space-y-2">
            {leaves.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[12px]"
              >
                <div>
                  <div className="text-white/85 capitalize">
                    {l.type} · {l.days}d
                  </div>
                  <div className="font-mono text-[10px] text-white/40">
                    {l.fromDate} → {l.toDate}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${l.status === "Approved" ? "bg-kcyan/15 text-kcyan" : l.status === "Pending" ? "bg-kgold/15 text-kgold" : "bg-korange/15 text-korange"}`}
                >
                  {l.status}
                </span>
              </div>
            ))}
            {leaves.length === 0 && <div className="text-[12px] text-white/40">No leaves yet.</div>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
