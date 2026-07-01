import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/common/GlassCard";
import { Avatar } from "@/components/common/Avatar";
import { GlowBadge } from "@/components/common/GlowBadge";
import { StatCard } from "@/components/common/StatCard";
import { useHRMStore } from "@/stores/hrmStore";
import { Network, Building, Users, Layers } from "lucide-react";

import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/dashboard/org")({ component: Org });

function Org() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "Admin") {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-rose-500/10 p-4 text-rose-500 animate-pulse">
          <Network className="h-8 w-8" />
        </div>
        <h2 className="font-display text-[18px] font-bold text-white">Access Denied</h2>
        <p className="max-w-md text-[13.5px] text-white/50 leading-relaxed">
          This section contains company-wide organizational hierarchy restricted to System Administrators only.
        </p>
      </div>
    );
  }

  const employees = useHRMStore((s) => s.employees);
  const departments = Array.from(new Set(employees.map((e) => e.department)));
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight">Org Structure</h1>
        <p className="mt-1 text-[13px] text-white/55">Departments, reporting lines, headcount</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Departments"
          value={departments.length}
          icon={Building}
          color="cyan"
          index={0}
        />
        <StatCard
          label="Total Headcount"
          value={employees.length}
          icon={Users}
          color="blue"
          index={1}
        />
        <StatCard label="Active Leads" value={4} icon={Layers} color="violet" index={2} />
        <StatCard label="Open Roles" value={6} icon={Network} color="gold" index={3} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => {
          const list = employees.filter((e) => e.department === d);
          return (
            <GlassCard key={d} className="p-5" hover glowColor="blue">
              <div className="flex items-center justify-between">
                <div className="font-display text-[15px] font-semibold">{d}</div>
                <GlowBadge label={`${list.length} members`} color="cyan" />
              </div>
              <div className="mt-4 flex -space-x-2">
                {list.slice(0, 6).map((e) => (
                  <div key={e.id} className="ring-2 ring-carbon">
                    <Avatar initials={e.avatar} size={32} />
                  </div>
                ))}
                {list.length > 6 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] text-white/70 ring-2 ring-carbon">
                    +{list.length - 6}
                  </div>
                )}
              </div>
              <div className="mt-3 text-[11px] text-white/45">Lead: {list[0]?.name}</div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
