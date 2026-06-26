import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, Server, Wifi, Zap } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { LivePulse } from "@/components/common/LivePulse";
import { activityFeed } from "@/data/mockData";

export const Route = createFileRoute("/dashboard/monitor")({ component: Monitor });

const data = Array.from({ length: 20 }).map((_, i) => ({
  i,
  v: 40 + Math.sin(i * 0.6) * 20 + Math.random() * 10,
}));

function Monitor() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight">Live Monitor</h1>
          <p className="mt-1 text-[13px] text-white/55">Real-time platform telemetry</p>
        </div>
        <div className="flex items-center gap-1.5">
          <LivePulse color="kcyan" />
          <span className="font-mono text-[11px] text-kcyan">STREAMING · 1s</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Users"
          value={68}
          icon={Activity}
          color="cyan"
          index={0}
          spark={[10, 18, 25, 32, 40, 52, 60, 64, 68]}
        />
        <StatCard
          label="API Health"
          value={99.97}
          suffix="%"
          icon={Server}
          color="violet"
          index={1}
        />
        <StatCard label="Throughput" value={1240} icon={Zap} color="gold" index={2} />
        <StatCard label="Sync Lag" value={42} suffix="ms" icon={Wifi} color="blue" index={3} />
      </div>
      <GlassCard className="p-5">
        <div className="font-display text-[15px] font-semibold">Realtime Throughput</div>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="i" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="v"
                stroke="#06c8d8"
                strokeWidth={2}
                dot={false}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
      <GlassCard className="p-5">
        <div className="font-display text-[15px] font-semibold">Live Event Stream</div>
        <div className="mt-3 space-y-1.5">
          {activityFeed.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 font-mono text-[11px]"
            >
              <span className="text-kcyan">{a.time}</span>
              <span className="text-white/40">[{a.module}]</span>
              <span className="flex-1 text-white/75">{a.action}</span>
              <span className="text-white/30">— {a.actor}</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
