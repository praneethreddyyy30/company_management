import { createFileRoute } from "@tanstack/react-router";
import { Search, MessageSquare } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/common/GlassCard";
import { Avatar } from "@/components/common/Avatar";
import { useHRMStore } from "@/stores/hrmStore";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/directory")({ component: Directory });

function Directory() {
  const employees = useHRMStore((s) => s.employees);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const depts = ["All", ...Array.from(new Set(employees.map((e) => e.department)))];
  const list = employees.filter(
    (e) =>
      (dept === "All" || e.department === dept) && e.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[26px] font-bold tracking-tight">Contact Directory</h1>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="h-10 w-full rounded-full border border-white/8 bg-white/4 pl-10 pr-4 text-[13px] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {depts.map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className={`rounded-full border px-3 py-1.5 text-[11px] ${dept === d ? "border-kviolet bg-kviolet/15 text-kviolet" : "border-white/10 text-white/60"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => (
          <GlassCard key={e.id} className="p-4">
            <div className="flex items-center gap-3">
              <Avatar initials={e.avatar} size={42} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-[13px] font-semibold">{e.name}</div>
                <div className="text-[11px] text-white/55">{e.role}</div>
                <div className="font-mono text-[10px] text-white/35">{e.email}</div>
              </div>
              <button
                onClick={() => {
                  toast.success("Opening mail client...", { description: `Sending email to ${e.name} (${e.email})` });
                  window.location.href = `mailto:${e.email}`;
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 hover:border-kviolet/40 hover:text-kviolet"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
