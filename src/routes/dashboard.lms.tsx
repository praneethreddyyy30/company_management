import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Users, Award, Clock } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { useHRMStore } from "@/stores/hrmStore";

export const Route = createFileRoute("/dashboard/lms")({ component: LMS });

const colorMap: Record<string, string> = {
  kblue: "from-kblue to-kcyan",
  kviolet: "from-kviolet to-kblue",
  kcyan: "from-kcyan to-kviolet",
  kgold: "from-kgold to-korange",
  korange: "from-korange to-kgold",
};

function LMS() {
  const courses = useHRMStore((s) => s.courses);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight">Learning Management</h1>
        <p className="mt-1 text-[13px] text-white/55">Upskilling & development across the org</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Courses"
          value={courses.length}
          icon={BookOpen}
          color="violet"
          index={0}
        />
        <StatCard label="Active Learners" value={75} icon={Users} color="cyan" index={1} />
        <StatCard
          label="Avg Completion"
          value={Math.round(courses.reduce((a, c) => a + (c.progress || 0), 0) / courses.length)}
          suffix="%"
          icon={Award}
          color="gold"
          index={2}
        />
        <StatCard label="Total Hours" value={45} icon={Clock} color="blue" index={3} />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <GlassCard className="overflow-hidden" hover glowColor="violet">
              <div className={`h-24 bg-gradient-to-br ${colorMap[c.color]} relative`}>
                <div className="absolute inset-0 bg-grid opacity-30" />
                <div className="absolute bottom-2 right-3 rounded-full bg-black/30 px-2 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur">
                  {c.duration}
                </div>
              </div>
              <div className="p-4">
                <div className="font-display text-[14px] font-semibold leading-tight">
                  {c.title}
                </div>
                <div className="mt-0.5 text-[11px] text-white/45">
                  {c.category} · by {c.instructor}
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-white/45">
                      {c.completedBy}/{c.totalEnrolled} completed
                    </span>
                    <span className="font-display font-semibold text-kcyan">{c.progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.progress}%` }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full bg-gradient-to-r from-kviolet to-kcyan"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.modules.slice(0, 3).map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
