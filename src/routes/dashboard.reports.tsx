import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Avatar } from "@/components/common/Avatar";
import { TrendingUp, BarChart3, PieChart, Download } from "lucide-react";
import { analyticsAPI, batchAPI } from "@/lib/api";
import { toast } from "sonner";

import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/dashboard/reports")({ component: Reports });

const perf = ["Tech", "HR", "Ops", "Design", "Marketing", "Finance", "Product", "Sales"].map(
  (n) => ({ n, v: 60 + Math.round(Math.random() * 35) }),
);
const growth = Array.from({ length: 12 }).map((_, i) => ({
  m: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i],
  v: 40 + i * 4 + Math.random() * 10,
}));

function Reports() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "Admin") {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-rose-500/10 p-4 text-rose-500 animate-pulse">
          <TrendingUp className="h-8 w-8" />
        </div>
        <h2 className="font-display text-[18px] font-bold text-white">Access Denied</h2>
        <p className="max-w-md text-[13.5px] text-white/50 leading-relaxed">
          This section contains sensitive company reports and leaderboard metrics restricted to System Administrators only.
        </p>
      </div>
    );
  }

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [taskData, setTaskData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const list = await analyticsAPI.getLeaderboard();
        setLeaderboard(list);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      }
    };
    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter((item) => {
    const matchesTrack = selectedTrack ? item.track === selectedTrack : true;
    const selectedBatchObj = batches.find((b) => b._id === selectedBatch);
    const matchesBatch = selectedBatch
      ? selectedBatchObj
        ? item.batch === selectedBatchObj.name
        : false
      : true;
    return matchesTrack && matchesBatch;
  });

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const list = await batchAPI.getAll();
        setBatches(list);
      } catch (err) {
        console.error("Failed to load batches:", err);
      }
    };
    loadBatches();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const filters = {
          batchId: selectedBatch || undefined,
          track: selectedTrack || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        };
        const att = await analyticsAPI.getAttendanceChart(filters);
        const tsk = await analyticsAPI.getTaskChart(filters);
        setAttendanceData(att);
        setTaskData(tsk);
      } catch (err) {
        console.warn("Failed to fetch analytics from backend, using mock data.");
      }
    };
    fetchAnalytics();
  }, [selectedBatch, selectedTrack, startDate, endDate]);

  const handleExport = (type: "attendance" | "tasks" | "standups" | "leaderboard") => {
    const filters = {
      batchId: selectedBatch || undefined,
      track: selectedTrack || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    };
    const url = analyticsAPI.getExportUrl(type, filters);
    window.open(url, "_blank");
    toast.success(`Downloading ${type} CSV...`);
  };

  const perfData = attendanceData && attendanceData.trackComparison?.length > 0
    ? attendanceData.trackComparison.map((tc: any) => ({ n: tc.track, v: tc.attendanceRate }))
    : perf;

  const growthData = attendanceData && attendanceData.monthlyTrends?.length > 0
    ? attendanceData.monthlyTrends.map((mt: any) => ({ m: mt.month, v: mt.attendanceRate }))
    : growth;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight">Reports & Analytics</h1>
          <p className="mt-1 text-[13px] text-white/55">
            Strategic intelligence across the workforce
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport("attendance")}
            className="flex items-center gap-1.5 rounded-full border border-kcyan/30 bg-kcyan/10 px-3.5 py-2 text-[12px] text-kcyan hover:bg-kcyan/20"
          >
            <Download className="h-3.5 w-3.5" /> CSV Attendance
          </button>
          <button
            onClick={() => handleExport("tasks")}
            className="flex items-center gap-1.5 rounded-full border border-kcyan/30 bg-kcyan/10 px-3.5 py-2 text-[12px] text-kcyan hover:bg-kcyan/20"
          >
            <Download className="h-3.5 w-3.5" /> CSV Tasks
          </button>
          <button
            onClick={() => handleExport("standups")}
            className="flex items-center gap-1.5 rounded-full border border-kcyan/30 bg-kcyan/10 px-3.5 py-2 text-[12px] text-kcyan hover:bg-kcyan/20"
          >
            <Download className="h-3.5 w-3.5" /> CSV Standups
          </button>
          <button
            onClick={() => handleExport("leaderboard")}
            className="flex items-center gap-1.5 rounded-full border border-kgold/30 bg-kgold/10 px-3.5 py-2 text-[12px] text-kgold hover:bg-kgold/20"
          >
            <Download className="h-3.5 w-3.5" /> Leaderboard
          </button>
        </div>
      </div>

      {/* Filters Control Row */}
      <GlassCard className="p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-white/50 font-medium">Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="rounded-md border border-white/10 bg-[#12121f] px-3 py-1.5 text-[12px] text-white focus:border-kcyan focus:outline-none"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-white/50 font-medium">Track</label>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="rounded-md border border-white/10 bg-[#12121f] px-3 py-1.5 text-[12px] text-white focus:border-kcyan focus:outline-none"
          >
            <option value="">All Tracks</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Marketing">Marketing</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-white/50 font-medium">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-white/10 bg-[#12121f] px-3 py-1.5 text-[12px] text-white focus:border-kcyan focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-white/50 font-medium">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-white/10 bg-[#12121f] px-3 py-1.5 text-[12px] text-white focus:border-kcyan focus:outline-none"
          />
        </div>

        {(selectedBatch || selectedTrack || startDate || endDate) && (
          <button
            onClick={() => {
              setSelectedBatch("");
              setSelectedTrack("");
              setStartDate("");
              setEndDate("");
            }}
            className="px-3.5 py-1.5 text-[12px] text-korange bg-korange/10 hover:bg-korange/20 border border-korange/30 rounded-full transition-all"
          >
            Clear Filters
          </button>
        )}
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Attendance Rate"
          value={attendanceData?.overallStats?.attendanceRate ?? 88}
          suffix="%"
          icon={TrendingUp}
          color="cyan"
          index={0}
          delta="+4%"
        />
        <StatCard
          label="Task Completion"
          value={taskData?.overallStats?.completionRate ?? 94}
          suffix="%"
          icon={BarChart3}
          color="violet"
          index={1}
          delta="+1.2%"
        />
        <StatCard
          label="Cost / Hire"
          value={32}
          icon={PieChart}
          color="gold"
          index={2}
          delta="-8%"
        />
        <StatCard
          label="Time to Hire"
          value={21}
          suffix="d"
          icon={TrendingUp}
          color="blue"
          index={3}
          delta="-3d"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-5">
          <div className="font-display text-[15px] font-semibold">Attendance by Track</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={perfData}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="n" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#12121f",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="v" fill="#06c8d8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="font-display text-[15px] font-semibold">Attendance Trends (Monthly)</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="m" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#12121f",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Visual Leaderboard */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <div className="font-display text-[16px] font-bold">Intern Leaderboard</div>
            <div className="text-[11.5px] text-white/55">Ranked by performance, task completion, and attendance</div>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-kgold/15 border border-kgold/30 px-3 py-1 font-display text-[11px] font-semibold text-kgold shadow-[0_0_15px_rgba(255,184,0,0.1)]">
            🏆 TOP PERFORMERS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                <th className="py-3 pl-4">Rank</th>
                <th className="py-3">Intern</th>
                <th className="py-3">Track</th>
                <th className="py-3 text-center">Tasks</th>
                <th className="py-3 text-center">Attendance</th>
                <th className="py-3 text-center">LMS Progress</th>
                <th className="py-3 text-center">Overall Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeaderboard.map((item, idx) => (
                <tr key={item.internId} className="text-[13px] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pl-4 font-mono font-bold text-white/50">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar initials={item.avatar} size={28} />
                      <div>
                        <div className="font-semibold text-white/90">{item.name}</div>
                        <div className="text-[11px] text-white/45">{item.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <span className="rounded bg-white/5 px-2.5 py-0.5 text-[11px] text-white/70">
                      {item.track}
                    </span>
                  </td>
                  <td className="py-3.5 text-center font-mono">{item.taskCompletionPercentage}%</td>
                  <td className="py-3.5 text-center font-mono">{item.attendancePercentage}%</td>
                  <td className="py-3.5 text-center font-mono">{item.lmsProgress}%</td>
                  <td className="py-3.5 text-center font-mono font-bold text-kgold">{item.score}</td>
                </tr>
              ))}
              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/30 text-[13px]">
                    No leaderboard data matches the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
