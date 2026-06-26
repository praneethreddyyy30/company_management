import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { GlassCard } from "./GlassCard";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  suffix?: string;
  delta?: string;
  deltaType?: "up" | "down";
  icon: LucideIcon;
  color: "blue" | "cyan" | "violet" | "gold" | "orange";
  spark?: number[];
  index?: number;
  children?: React.ReactNode;
}

const colorClasses = {
  blue: { text: "text-kblue-bright", bg: "bg-kblue/15", stroke: "#2d9cef" },
  cyan: { text: "text-kcyan", bg: "bg-kcyan/15", stroke: "#06c8d8" },
  violet: { text: "text-kviolet", bg: "bg-kviolet/15", stroke: "#7c3aed" },
  gold: { text: "text-kgold", bg: "bg-kgold/15", stroke: "#ffb800" },
  orange: { text: "text-korange", bg: "bg-korange/15", stroke: "#f4511e" },
};

export function StatCard({
  label,
  value,
  suffix = "",
  delta,
  deltaType = "up",
  icon: Icon,
  color,
  spark,
  index = 0,
  children,
}: Props) {
  const c = colorClasses[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard glowColor={color} hover className="p-5 h-full">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
              {label}
            </div>
            <div
              className={cn(
                "mt-3 font-display font-extrabold text-[34px] leading-none tracking-tight",
                c.text,
              )}
            >
              <AnimatedNumber value={value} suffix={suffix} />
            </div>
          </div>
          <div className={cn("rounded-xl p-2.5", c.bg)}>
            <Icon className={cn("h-4 w-4", c.text)} />
          </div>
        </div>

        {children && <div className="mt-3">{children}</div>}

        <div className="mt-4 flex items-center justify-between">
          {delta && (
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                deltaType === "up" ? "bg-kcyan/10 text-kcyan" : "bg-korange/10 text-korange",
              )}
            >
              {deltaType === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {delta}
            </div>
          )}
          {spark && (
            <div className="h-7 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spark.map((v, i) => ({ i, v }))}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={c.stroke}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
