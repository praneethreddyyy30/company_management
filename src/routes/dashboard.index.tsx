import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { attendanceAPI, dashboardAPI, activityAPI } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { motion } from "framer-motion";
import {
  Users,
  ClipboardList,
  BookOpen,
  Star,
  Plus,
  Upload,
  Sparkles,
  Building2,
  UserPlus,
  FileText,
  Calendar,
  Network,
  BarChart3,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { GlassCard } from "@/components/common/GlassCard";
import { GlowBadge } from "@/components/common/GlowBadge";
import { LivePulse } from "@/components/common/LivePulse";
import { StatCard } from "@/components/common/StatCard";
import { Avatar } from "@/components/common/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { useHRMStore } from "@/stores/hrmStore";
import { activityFeed, heatmapData, leavePieData, employees } from "@/data/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AttendanceCard } from "./employee.index";

export const Route = createFileRoute("/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const setAIPanel = useAppStore((s) => s.setAIPanel);
  const navigate = useNavigate();
  const tasks = useHRMStore((s) => s.tasks);
  const highPriority = tasks.filter((t) => t.priority === "high").length;

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardAPI.getStats();
        setStats(res);
      } catch (err) {
        console.warn("Failed to fetch dashboard stats, falling back to mock values.");
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <GlassCard className="p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-[26px] font-bold tracking-tight">
              Good morning, {user?.name?.split(" ")[0] || "Arjun"} <span className="ml-1">👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-white/55">
              Here's your enterprise overview for {format(new Date(), "EEEE, MMMM do, yyyy")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <QuickPill
              icon={Plus}
              label="Add Employee"
              color="kcyan"
              onClick={() => {
                toast.success("Open employee creator");
                navigate({ to: "/dashboard/hrm" });
              }}
            />
            <QuickPill
              icon={Upload}
              label="Upload Report"
              color="kgold"
              onClick={() =>
                toast.success("Report uploaded", { description: "Q1_workforce_summary.pdf" })
              }
            />
            <QuickPill
              icon={Sparkles}
              label="Ask AI"
              color="kviolet"
              onClick={() => setAIPanel(true)}
            />
          </div>
        </div>
      </GlassCard>

      {user && (user.role === "Lead" || user.role === "Admin") && (
        <div className="grid gap-6 md:grid-cols-2">
          <AttendanceCard userId={user.id || (user as any)._id} />
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Workforce Score"
          value={stats?.attendancePercentage ?? 94.2}
          suffix="%"
          delta="+2.1%"
          icon={Users}
          color="cyan"
          index={0}
          spark={[60, 65, 62, 70, 74, 78, 82, 88, 92, 94]}
        />
        <StatCard
          label="Active Assignments"
          value={stats?.totalInterns ?? 127}
          delta="+14 this week"
          icon={ClipboardList}
          color="gold"
          index={1}
        >
          <div className="mt-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(127 / 150) * 100}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-kgold to-korange"
              />
            </div>
            <div className="mt-2 inline-flex rounded-full bg-korange/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-korange">
              {highPriority} High Priority
            </div>
          </div>
        </StatCard>
        <StatCard
          label="LMS Completion"
          value={87}
          suffix="%"
          delta="+5% this month"
          icon={BookOpen}
          color="violet"
          index={2}
        >
          <div className="-my-1 h-12 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="100%"
                data={[{ value: 87, fill: "#7c3aed" }]}
              >
                <RadialBar
                  background={{ fill: "rgba(255,255,255,0.06)" }}
                  dataKey="value"
                  cornerRadius={6}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-white/50">43 of 49 members</div>
        </StatCard>
        <StatCard
          label="Pending Evaluations"
          value={stats?.overdueTasks ?? 6}
          delta="Due in 3 days"
          deltaType="down"
          icon={Star}
          color="orange"
          index={3}
        >
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2 }}
              className="h-full rounded-full bg-gradient-to-r from-korange to-red-500"
            />
          </div>
        </StatCard>
      </div>

      {/* Ecosystem Map */}
      <EcosystemMap />

      {/* Split row */}
      <div className="grid gap-6 lg:grid-cols-5">
        <OrgIntelligence />
        <ActivityFeed />
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Heatmap />
        <LeaveAnalytics />
        <QuickActions />
      </div>
    </div>
  );
}

function QuickPill({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium backdrop-blur-md transition-all hover:scale-[1.02]",
        color === "kcyan" && "border-kcyan/30 bg-kcyan/8 text-kcyan hover:bg-kcyan/15",
        color === "kgold" && "border-kgold/30 bg-kgold/8 text-kgold hover:bg-kgold/15",
        color === "kviolet" && "border-kviolet/30 bg-kviolet/8 text-kviolet hover:bg-kviolet/15",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

const MODULES = [
  {
    key: "central",
    label: "Central",
    metric: "15",
    icon: Building2,
    color: "kblue",
    path: "/dashboard/hrm",
  },
  {
    key: "lms",
    label: "LMS",
    metric: "87%",
    icon: BookOpen,
    color: "kviolet",
    path: "/dashboard/lms",
  },
  {
    key: "onboard",
    label: "Onboarding",
    metric: "3",
    icon: UserPlus,
    color: "kcyan",
    path: "/dashboard/onboarding",
  },
  {
    key: "work",
    label: "Work Hub",
    metric: "127",
    icon: ClipboardList,
    color: "kgold",
    path: "/dashboard/work",
  },
  {
    key: "policy",
    label: "Policies",
    metric: "8",
    icon: FileText,
    color: "korange",
    path: "/dashboard/policies",
  },
  {
    key: "eval",
    label: "Evaluations",
    metric: "6",
    icon: Star,
    color: "kviolet",
    path: "/dashboard/evaluations",
  },
];

function EcosystemMap() {
  const navigate = useNavigate();
  const W = 100,
    H = 100;
  const cx = W / 2,
    cy = H / 2;
  const radius = 36;

  const positions = MODULES.map((_, i) => {
    const a = -Math.PI / 2 + (i / MODULES.length) * Math.PI * 2;
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
  });

  return (
    <GlassCard className="relative h-[340px] overflow-hidden p-5">
      <div className="absolute left-5 top-5 z-10">
        <div className="font-display text-[15px] font-semibold">Module Ecosystem</div>
        <div className="text-[11px] text-white/45">Real-time module mesh</div>
      </div>
      <div className="absolute right-5 top-5 z-10">
        <GlowBadge label="LIVE MESH" color="cyan" />
      </div>

      {/* SVG connectors */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        {positions.map((p, i) => {
          const mid = { x: (cx + p.x) / 2 + (Math.random() - 0.5) * 2, y: (cy + p.y) / 2 };
          return (
            <motion.path
              key={i}
              d={`M ${cx} ${cy} Q ${mid.x} ${mid.y} ${p.x} ${p.y}`}
              stroke="rgba(6,200,216,0.25)"
              strokeWidth="0.2"
              fill="none"
              strokeDasharray="2 2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2 + i * 0.2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          );
        })}
      </svg>

      {/* Center node */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="absolute -inset-2 rounded-full border border-dashed border-kgold/40 animate-spin-slow" />
          <div className="absolute -inset-[3px] rounded-full border border-kcyan/30 animate-spin-reverse" />
          <div className="relative flex h-[90px] w-[90px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-kblue via-kviolet to-korange shadow-[0_0_60px_rgba(26,123,196,0.5),0_0_120px_rgba(124,58,237,0.3),inset_0_2px_0_rgba(255,255,255,0.2)]">
            <div className="font-display text-[12px] font-extrabold">HRM</div>
            <div className="font-mono text-[8px] text-kcyan/80">KLASSYGO</div>
          </div>
        </div>
      </div>

      {/* Module nodes */}
      {positions.map((p, i) => {
        const m = MODULES[i];
        const Icon = m.icon;
        return (
          <motion.button
            key={m.key}
            whileHover={{ scale: 1.14 }}
            onClick={() => navigate({ to: m.path })}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <div
              className={cn(
                "flex h-16 w-16 flex-col items-center justify-center rounded-full border bg-white/[0.04] backdrop-blur-xl transition-shadow",
                m.color === "kblue" && "border-kblue/50 shadow-[0_0_18px_rgba(26,123,196,0.4)]",
                m.color === "kviolet" && "border-kviolet/50 shadow-[0_0_18px_rgba(124,58,237,0.4)]",
                m.color === "kcyan" && "border-kcyan/50 shadow-[0_0_18px_rgba(6,200,216,0.4)]",
                m.color === "kgold" && "border-kgold/50 shadow-[0_0_18px_rgba(255,184,0,0.35)]",
                m.color === "korange" && "border-korange/50 shadow-[0_0_18px_rgba(244,81,30,0.4)]",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  m.color === "kblue" && "text-kblue-bright",
                  m.color === "kviolet" && "text-kviolet",
                  m.color === "kcyan" && "text-kcyan",
                  m.color === "kgold" && "text-kgold",
                  m.color === "korange" && "text-korange",
                )}
              />
              <div className="mt-0.5 text-[8px] font-medium text-white/70">{m.label}</div>
              <div
                className={cn(
                  "font-display text-[12px] font-bold",
                  m.color === "kblue" && "text-kblue-bright",
                  m.color === "kviolet" && "text-kviolet",
                  m.color === "kcyan" && "text-kcyan",
                  m.color === "kgold" && "text-kgold",
                  m.color === "korange" && "text-korange",
                )}
              >
                {m.metric}
              </div>
            </div>
          </motion.button>
        );
      })}
    </GlassCard>
  );
}

function OrgIntelligence() {
  const ceo = employees.find((e) => e.role.includes("Operating"))!;
  const leads = [
    employees.find((e) => e.role.includes("Lead Engineer"))!,
    employees.find((e) => e.role.includes("HR Business"))!,
  ];
  const teams = [
    employees.filter((e) => e.department === "Technology").slice(0, 3),
    employees.filter((e) => e.department === "Human Resources").slice(0, 3),
  ];
  return (
    <GlassCard className="lg:col-span-3 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-[15px] font-semibold">Organization Structure</div>
          <div className="text-[11px] text-white/45">Live workforce hierarchy</div>
        </div>
        <button className="text-[12px] text-kcyan hover:underline">View Full →</button>
      </div>
      <div className="mt-6 flex flex-col items-center gap-6">
        {/* Root */}
        <div className="rounded-lg border border-kgold/40 bg-kgold/8 px-4 py-2 font-display text-[12px] font-semibold text-kgold shadow-[0_0_18px_rgba(255,184,0,0.25)]">
          {ceo.name} · {ceo.role}
        </div>
        {/* Connector */}
        <svg width="280" height="20" className="-my-3">
          <line x1="140" y1="0" x2="140" y2="20" stroke="rgba(6,200,216,0.4)" />
        </svg>
        {/* Leads */}
        <div className="flex w-full justify-around gap-6">
          {leads.map((l, idx) => (
            <div key={l.id} className="flex flex-col items-center">
              <div className="rounded-lg border border-kblue/40 bg-kblue/8 px-3 py-1.5 text-[11px] font-medium text-kblue-bright">
                {l.name.split(" ")[0]} · {l.role}
              </div>
              <svg width="200" height="20" className="-my-1">
                <line x1="100" y1="0" x2="100" y2="20" stroke="rgba(6,200,216,0.3)" />
              </svg>
              <div className="flex gap-3">
                {teams[idx].map((t) => (
                  <div key={t.id} className="group relative flex flex-col items-center">
                    <Avatar initials={t.avatar} size={36} />
                    <div className="mt-1 text-[9px] text-white/70">{t.name.split(" ")[0]}</div>
                    <div className="text-[8px] text-white/40">
                      {t.role.split(" ").slice(-2).join(" ")}
                    </div>
                    <div className="pointer-events-none absolute -top-12 z-10 hidden whitespace-nowrap rounded-lg border border-white/10 bg-carbon/95 px-2 py-1 text-[10px] text-white/80 shadow-xl group-hover:block">
                      {t.name} — {t.email}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await activityAPI.getAll();
        setActivities(data);
      } catch (err) {
        console.warn("Failed to load activity logs, using mock activity feed.");
        setActivities(activityFeed.map(a => ({
          _id: a.id,
          module: a.module,
          impact: a.impact,
          action: a.action,
          userName: a.actor,
          timestamp: new Date()
        })));
      }
    };
    loadActivities();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewActivity = (newLog: any) => {
      setActivities(prev => [newLog, ...prev].slice(0, 100));
    };

    socket.on("activity:received", handleNewActivity);
    socket.on("activity:new", handleNewActivity);

    return () => {
      socket.off("activity:received", handleNewActivity);
      socket.off("activity:new", handleNewActivity);
    };
  }, []);

  const colorBg: Record<string, string> = {
    kblue: "bg-kblue-bright",
    kcyan: "bg-kcyan",
    kviolet: "bg-kviolet",
    kgold: "bg-kgold",
    korange: "bg-korange",
  };
  const impactColor = (i: string) =>
    i === "HIGH"
      ? "bg-korange/15 text-korange"
      : i === "MED"
        ? "bg-kgold/15 text-kgold"
        : "bg-kcyan/15 text-kcyan";

  return (
    <GlassCard className="lg:col-span-2 flex h-[460px] flex-col p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-[15px] font-semibold">Enterprise Activity</div>
          <div className="text-[11px] text-white/45">Real-time feed across all modules</div>
        </div>
        <div className="flex items-center gap-1.5">
          <LivePulse color="kcyan" />
          <span className="font-mono text-[10px] text-kcyan">LIVE</span>
        </div>
      </div>
      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        {activities.map((a, i) => {
          let colorKey = "kblue";
          const mod = (a.module || "HRM").toLowerCase();
          if (mod === "talent" || mod === "certificates") colorKey = "kcyan";
          else if (mod === "leave" || mod === "offers") colorKey = "kgold";
          else if (mod === "lms") colorKey = "kviolet";
          else if (mod === "policy" || mod === "auth") colorKey = "korange";

          let timeStr = "Just now";
          if (a.timestamp) {
            const diffMs = new Date().getTime() - new Date(a.timestamp).getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffMins < 1) {
              timeStr = "Just now";
            } else if (diffMins < 60) {
              timeStr = `${diffMins}m ago`;
            } else if (diffHours < 24) {
              timeStr = `${diffHours}h ago`;
            } else {
              timeStr = format(new Date(a.timestamp), "MMM d");
            }
          }

          return (
            <div key={a._id || a.id || i} className="flex gap-3 border-b border-white/5 py-3 last:border-0">
              <div className="flex flex-col items-center">
                <span className={cn("h-2 w-2 rounded-full", colorBg[colorKey])} />
                {i !== activities.length - 1 && <span className="mt-1 h-full w-px bg-white/10" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider",
                      colorKey === "kblue" && "bg-kblue/15 text-kblue-bright",
                      colorKey === "kcyan" && "bg-kcyan/15 text-kcyan",
                      colorKey === "kviolet" && "bg-kviolet/15 text-kviolet",
                      colorKey === "kgold" && "bg-kgold/15 text-kgold",
                      colorKey === "korange" && "bg-korange/15 text-korange",
                    )}
                  >
                    {a.module}
                  </span>
                  <span className="font-mono text-[9px] text-white/30">{timeStr}</span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 py-[1px] text-[9px] font-semibold",
                      impactColor(a.impact),
                    )}
                  >
                    {a.impact}
                  </span>
                </div>
                <div className="mt-1 text-[12.5px] text-white/85">{a.action || a.details}</div>
                <div className="text-[11px] text-white/45">by {a.userName || a.actor || "System"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function Heatmap() {
  const [data, setData] = useState<number[][]>(heatmapData);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = ["6am", "9am", "12pm", "3pm", "6pm"];
  
  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const grid = await attendanceAPI.getHeatmap();
        if (grid && Array.isArray(grid) && grid.length === 5) {
          setData(grid);
        }
      } catch (err) {
        console.warn("Failed to fetch live workforce heatmap, falling back to mock data.", err);
      }
    };
    fetchHeatmap();
  }, []);

  const cellColor = (v: number) => {
    if (v === 0) return "bg-white/[0.03]";
    if (v <= 3) return "bg-kblue/30";
    if (v <= 6) return "bg-kcyan/50";
    if (v <= 9) return "bg-kgold/60";
    return "bg-korange/80";
  };
  return (
    <GlassCard className="p-5">
      <div className="font-display text-[15px] font-semibold">Workforce Heatmap</div>
      <div className="mb-3 text-[11px] text-white/45">Activity intensity by day & hour</div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-1 text-right">
          {hours.map((h) => (
            <span key={h} className="font-mono text-[9px] text-white/30">
              {h}
            </span>
          ))}
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-7 gap-1">
            {data.map((row, ri) =>
              row.map((v, ci) => (
                <div key={`${ri}-${ci}`} className="group relative">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (ri * 7 + ci) * 0.01 }}
                    whileHover={{ scale: 1.3 }}
                    className={cn("h-5 w-full rounded-sm", cellColor(v))}
                  />
                  <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-carbon px-1.5 py-0.5 font-mono text-[9px] text-white shadow group-hover:block">
                    {v} actions
                  </div>
                </div>
              )),
            )}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {days.map((d) => (
              <span key={d} className="text-center font-mono text-[9px] text-white/30">
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function LeaveAnalytics() {
  return (
    <GlassCard className="p-5">
      <div className="font-display text-[15px] font-semibold">Leave Analytics</div>
      <div className="text-[11px] text-white/45">Monthly distribution</div>
      <div className="relative mx-auto mt-2 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={leavePieData}
              dataKey="value"
              innerRadius={50}
              outerRadius={78}
              paddingAngle={3}
              stroke="none"
            >
              {leavePieData.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-[20px] font-bold">32</div>
          <div className="text-[10px] text-white/45">Total</div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {leavePieData.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              <span className="text-white/75">{d.name}</span>
            </div>
            <span className="font-mono text-white/55">
              {d.value} · {Math.round((d.value / 32) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    {
      icon: Plus,
      label: "Add Employee",
      color: "kcyan",
      onClick: () => navigate({ to: "/dashboard/hrm" }),
    },
    {
      icon: Upload,
      label: "Upload Policy",
      color: "kgold",
      onClick: () => {
        toast.success("Policy uploaded");
        navigate({ to: "/dashboard/policies" });
      },
    },
    {
      icon: Calendar,
      label: "Approve Leaves",
      color: "kblue",
      onClick: () => navigate({ to: "/dashboard/leave" }),
    },
    {
      icon: Star,
      label: "Send Evaluation",
      color: "kviolet",
      onClick: () => navigate({ to: "/dashboard/evaluations" }),
    },
    {
      icon: ClipboardList,
      label: "Create Task",
      color: "korange",
      onClick: () => navigate({ to: "/dashboard/work" }),
    },
    {
      icon: Network,
      label: "Add Candidate",
      color: "kcyan",
      onClick: () => navigate({ to: "/dashboard/talent" }),
    },
  ];
  return (
    <GlassCard className="p-5">
      <div className="font-display text-[15px] font-semibold">Quick Actions</div>
      <div className="text-[11px] text-white/45">One-tap workflows</div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={cn(
              "group flex flex-col items-center justify-center rounded-xl border bg-white/[0.03] py-4 transition-all hover:scale-[1.03]",
              a.color === "kcyan" &&
                "border-kcyan/20 hover:border-kcyan/50 hover:shadow-[0_0_18px_rgba(6,200,216,0.25)]",
              a.color === "kblue" &&
                "border-kblue/20 hover:border-kblue/50 hover:shadow-[0_0_18px_rgba(26,123,196,0.25)]",
              a.color === "kviolet" &&
                "border-kviolet/20 hover:border-kviolet/50 hover:shadow-[0_0_18px_rgba(124,58,237,0.25)]",
              a.color === "kgold" &&
                "border-kgold/20 hover:border-kgold/50 hover:shadow-[0_0_18px_rgba(255,184,0,0.25)]",
              a.color === "korange" &&
                "border-korange/20 hover:border-korange/50 hover:shadow-[0_0_18px_rgba(244,81,30,0.25)]",
            )}
          >
            <a.icon
              className={cn(
                "h-5 w-5",
                a.color === "kcyan" && "text-kcyan",
                a.color === "kblue" && "text-kblue-bright",
                a.color === "kviolet" && "text-kviolet",
                a.color === "kgold" && "text-kgold",
                a.color === "korange" && "text-korange",
              )}
            />
            <div className="mt-1.5 text-[11.5px] font-medium text-white/80">{a.label}</div>
          </button>
        ))}
      </div>
      <button
        onClick={() => navigate({ to: "/dashboard/reports" })}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] py-2 text-[12px] text-white/70 hover:bg-white/[0.06]"
      >
        <BarChart3 className="h-3.5 w-3.5" /> View Reports
      </button>
    </GlassCard>
  );
}
