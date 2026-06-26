import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Users, TrendingUp, Target, DollarSign } from "lucide-react";

export const Route = createFileRoute("/dashboard/crm")({ component: CRM });

const pipeline = [
  { s: "Lead", v: 84 },
  { s: "Qualified", v: 56 },
  { s: "Proposal", v: 32 },
  { s: "Negotiation", v: 18 },
  { s: "Closed", v: 12 },
];

function CRM() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight">CRM Pipeline</h1>
        <p className="mt-1 text-[13px] text-white/55">Customer relationships & deals</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Contacts"
          value={1248}
          icon={Users}
          color="cyan"
          index={0}
          delta="+12%"
        />
        <StatCard
          label="Active Deals"
          value={42}
          icon={Target}
          color="violet"
          index={1}
          delta="+5"
        />
        <StatCard
          label="Win Rate"
          value={38}
          suffix="%"
          icon={TrendingUp}
          color="gold"
          index={2}
          delta="+2.1%"
        />
        <StatCard
          label="Pipeline Value"
          value={2.4}
          suffix="M"
          icon={DollarSign}
          color="blue"
          index={3}
          delta="+18%"
        />
      </div>
      <GlassCard className="p-5">
        <div className="font-display text-[15px] font-semibold">Pipeline Funnel</div>
        <div className="mt-4 h-80">
          <ResponsiveContainer>
            <BarChart data={pipeline} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="s"
                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: "#12121f",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="v" fill="#7c3aed" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
