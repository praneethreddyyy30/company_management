import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { GlassCard } from "@/components/common/GlassCard";
import { GlowBadge } from "@/components/common/GlowBadge";
import { AnimatedNumber } from "@/components/common/AnimatedNumber";
import { Avatar } from "@/components/common/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { useHRMStore } from "@/stores/hrmStore";
import { Star, CheckCircle2, Play, Square, Timer, Check } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { standupAPI, attendanceAPI, internAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/")({ component: Portal });

// Self-contained canvas confetti particle generator
function triggerConfetti() {
  const canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#06C8D8", "#7C3AED", "#FFD700", "#FF69B4", "#00FF00"];
  const particles: any[] = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 4 + 3,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }

  let active = true;
  let frame = 0;

  function draw() {
    if (!active || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let anyActive = false;

    particles.forEach((p) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;

      if (p.y < canvas.height) {
        anyActive = true;
      }

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });

    frame++;
    if (anyActive && frame < 400) {
      requestAnimationFrame(draw);
    } else {
      active = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  draw();
}

function GuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[90] w-[90%] max-w-[600px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-kcyan/20 bg-carbon p-6 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        <h3 className="font-display text-[16px] font-bold text-white flex items-center gap-2 mb-3">
          📖 KLASSYGO Intern Guidelines & Training Program Policy
        </h3>
        <div className="max-h-[320px] overflow-y-auto space-y-4 text-[12.5px] text-white/70 pr-2 leading-relaxed font-sans">
          <p>Welcome to the <strong>KLASSYGO Internship Program</strong>! Please read these guidelines carefully as they govern your daily routine and evaluations.</p>
          
          <div className="space-y-1">
            <h4 className="font-semibold text-kcyan">🕒 1. Daily Work Hours & Attendance Policy</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Work Start Time:</strong> Standard shift begins at <strong>10:00 AM IST</strong>.</li>
              <li><strong>Late Limit:</strong> Clocking in after <strong>10:00 AM</strong> registers as <strong>Late</strong>.</li>
              <li><strong>Absent Trigger:</strong> If you do not clock in by <strong>11:00 AM</strong>, you will be automatically marked as <strong>Absent</strong>.</li>
              <li>Always check-in and check-out daily to log your hours.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-kviolet">📝 2. Daily Standup Updates</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Every intern must submit their daily standup update before the end of the day.</li>
              <li>You must specify: Yesterday's work, today's plan, active blockers, mood, and task completion percentage.</li>
              <li><strong>Draft System:</strong> Your updates auto-save every 30 seconds to prevent data loss.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-kgold">🎓 3. Certification Eligibility</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>To be eligible for an internship completion certificate, you must satisfy the configured thresholds:</li>
              <li><strong>Minimum Task Completion Rate:</strong> 85%</li>
              <li><strong>Minimum Shift Attendance Rate:</strong> 80%</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-kcyan">🤖 4. AI Performance Summaries</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Every weekend, our AI Performance Engine reviews your last 7 daily standups.</li>
              <li>It generates weekly progress reports, identifies work patterns, and provides constructive feedback.</li>
              <li>These reports are visible on your profile for review.</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-full bg-gradient-to-r from-kblue to-kcyan px-6 text-[12px] font-semibold text-white shadow-[0_4px_16px_rgba(6,200,216,0.2)] hover:shadow-[0_4px_20px_rgba(6,200,216,0.35)] transition-all cursor-pointer"
          >
            I Have Read & Agree
          </button>
        </div>
      </div>
    </>
  );
}

function OnboardingChecklist({
  status,
  onCompleteStep,
  setGuideModalOpen
}: {
  status: any;
  onCompleteStep: (step: string) => void;
  setGuideModalOpen: (o: boolean) => void;
}) {
  if (!status || status.completed) return null;

  const steps = [
    { key: "profileCompleted", label: "Profile Setup", desc: "Fill in your background details on your profile page.", actionText: "Setup Profile", action: "profile" },
    { key: "guideRead", label: "Read Internship Guide", desc: "Review KLASSYGO guidelines, timings, and policies.", actionText: "Open Guide", action: "guide" },
    { key: "tasksReviewed", label: "Review Assigned Tasks", desc: "Visit your task hub and review assigned issues.", actionText: "Check Tasks", action: "tasks" },
    { key: "standupSubmitted", label: "Submit Daily Standup", desc: "Submit your daily standup progress report.", actionText: "Scroll to Form", action: "standup" },
    { key: "attendanceMarked", label: "Mark Attendance Check-In", desc: "Register your clock-in check-in attendance today.", actionText: "Scroll to Clock", action: "attendance" },
  ];

  const completedCount = Object.values(status.checklist || {}).filter(Boolean).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const user = useAuthStore((s) => s.user);
  return (
    <GlassCard className="p-5 border-l-4 border-l-kcyan bg-gradient-to-br from-kcyan/5 via-carbon to-transparent mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-white flex items-center gap-2">
            🚀 Welcome {user?.name?.split(" ")[0] || "Intern"}! Complete Your Onboarding Checklist
          </h2>
          <p className="text-[11.5px] text-white/55 mt-1">Get ready to work by completing your setup tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-white/60">Progress: <span className="text-kcyan font-bold">{progress}%</span></div>
          <div className="w-28 h-2 overflow-hidden rounded-full bg-white/5 border border-white/5">
            <div className="h-full bg-gradient-to-r from-kblue to-kcyan transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s) => {
          const isDone = !!status.checklist[s.key];
          return (
            <div key={s.key} className={cn("p-3 rounded-xl border flex flex-col justify-between transition-colors", isDone ? "border-kcyan/20 bg-kcyan/5" : "border-white/5 bg-white/2 hover:bg-white/[0.04]")}>
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={cn("text-[11.5px] font-semibold", isDone ? "text-kcyan" : "text-white/80")}>{s.label}</span>
                  {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-kcyan flex-shrink-0" />}
                </div>
                <p className="text-[10px] text-white/45 leading-relaxed">{s.desc}</p>
              </div>
              {!isDone && (
                <button
                  type="button"
                  onClick={() => {
                    if (s.action === "profile") {
                      onCompleteStep("profileCompleted");
                      window.location.href = "/employee/profile";
                    } else if (s.action === "guide") {
                      setGuideModalOpen(true);
                    } else if (s.action === "tasks") {
                      onCompleteStep("tasksReviewed");
                      window.location.href = "/employee/tasks";
                    } else if (s.action === "standup") {
                      document.getElementById("standup-form")?.scrollIntoView({ behavior: "smooth" });
                    } else if (s.action === "attendance") {
                      document.getElementById("attendance-card")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="mt-3 w-full h-8 rounded-lg bg-white/5 border border-white/8 text-[10.5px] font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  {s.actionText}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function AttendanceCard({ userId, onCheckInSuccess }: { userId: string; onCheckInSuccess?: () => void }) {
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState("00:00:00");

  const fetchTodayRecord = async () => {
    try {
      const history = await attendanceAPI.getHistory(userId);
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayRec = history.find((h: any) => {
        const hDate = h.date || h.checkIn;
        return new Date(hDate).toISOString().slice(0, 10) === todayStr;
      });
      setTodayRecord(todayRec || null);
    } catch (e) {
      console.error("Failed to load today's attendance record:", e);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTodayRecord();
    }
  }, [userId]);

  // Live Timer for checked-in session
  useEffect(() => {
    if (!todayRecord || !todayRecord.checkIn || todayRecord.checkOut) return;

    const timer = setInterval(() => {
      const start = new Date(todayRecord.checkIn).getTime();
      const now = new Date().getTime();
      const diff = now - start;

      if (diff < 0) return;

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const fHrs = String(hrs).padStart(2, "0");
      const fMins = String(mins).padStart(2, "0");
      const fSecs = String(secs).padStart(2, "0");

      setElapsed(`${fHrs}:${fMins}:${fSecs}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [todayRecord]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const rec = await attendanceAPI.checkIn();
      setTodayRecord(rec);
      toast.success(`Checked In Successfully! Status: ${rec.status}`);
      if (onCheckInSuccess) onCheckInSuccess();
    } catch (e: any) {
      toast.error(e.message || "Check-In failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const rec = await attendanceAPI.checkOut();
      setTodayRecord(rec);
      toast.success(`Checked Out Successfully! Hours: ${rec.totalHours}`);
    } catch (e: any) {
      toast.error(e.message || "Check-Out failed");
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = !!todayRecord;
  const isCheckedOut = !!(todayRecord && todayRecord.checkOut);

  return (
    <GlassCard id="attendance-card" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-[16px] font-semibold text-white">Daily Attendance</h2>
          <p className="text-[11px] text-white/45">Shift Schedule: 10:00 AM - 06:00 PM</p>
        </div>
        <Timer className={cn("h-5 w-5", isCheckedIn && !isCheckedOut ? "text-kcyan animate-pulse" : "text-white/30")} />
      </div>

      <div className="space-y-4">
        {/* State 1: Not checked-in */}
        {!isCheckedIn && (
          <div className="text-center py-4">
            <p className="text-[12.5px] text-white/60 mb-4">You have not clocked in for today yet.</p>
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-8 text-[13.5px] font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="h-4 w-4" /> Check In Now
            </button>
          </div>
        )}

        {/* State 2: Checked-in, running shift */}
        {isCheckedIn && !isCheckedOut && (
          <div className="space-y-4">
            <div className="flex items-center justify-around rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="text-center">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Check In</div>
                <div className="mt-1 text-[14px] font-semibold text-white">
                  {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="mt-0.5">
                  <GlowBadge label={todayRecord.status} color={todayRecord.status === "Late" ? "gold" : "cyan"} />
                </div>
              </div>
              <div className="h-8 w-[1px] bg-white/10" />
              <div className="text-center">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Elapsed Time</div>
                <div className="mt-1 font-mono text-[16px] font-bold text-kcyan">{elapsed}</div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-red-500 px-8 text-[13.5px] font-semibold text-white shadow-[0_4px_16px_rgba(244,63,94,0.2)] hover:shadow-[0_4px_20px_rgba(244,63,94,0.35)] transition-all cursor-pointer disabled:opacity-50"
              >
                <Square className="h-4 w-4" /> Check Out Shift
              </button>
            </div>
          </div>
        )}

        {/* State 3: Completed shift */}
        {isCheckedOut && (
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
              <Check className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-white">Shift Completed</p>
              <p className="text-[11.5px] text-white/45 mt-0.5">You have clocked out for today.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 font-mono text-[12px] text-white/60">
              Total Logged Time: <span className="text-kcyan font-bold">{todayRecord.totalHours} hrs</span>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function DailyStandupForm({ userId, onStandupSuccess }: { userId: string; onStandupSuccess?: () => void }) {
  const [yesterdayWork, setYesterdayWork] = useState("");
  const [todayPlan, setTodayPlan] = useState("");
  const [blockers, setBlockers] = useState("");
  const [mood, setMood] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [draftSavedTime, setDraftSavedTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Restore draft if the page reloads
  useEffect(() => {
    const saved = localStorage.getItem("standup_draft_" + userId);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.yesterdayWork) setYesterdayWork(parsed.yesterdayWork);
        if (parsed.todayPlan) setTodayPlan(parsed.todayPlan);
        if (parsed.blockers) setBlockers(parsed.blockers);
        if (parsed.mood) setMood(parsed.mood);
        if (parsed.completionPercentage !== undefined) setCompletionPercentage(Number(parsed.completionPercentage));
        if (parsed.savedAt) setDraftSavedTime(parsed.savedAt);
      } catch (e) {
        console.error("Failed to parse standup draft:", e);
      }
    }
  }, [userId]);

  // Check if standup already submitted today
  const checkSubmission = async () => {
    try {
      const standups = await standupAPI.getByIntern(userId);
      const todayStr = new Date().toISOString().slice(0, 10);
      const submittedToday = standups.some((s: any) => {
        const sDate = s.date || s.createdAt || s.submittedAt;
        return new Date(sDate).toISOString().slice(0, 10) === todayStr;
      });
      setAlreadySubmitted(submittedToday);
    } catch (err) {
      console.error("Failed to fetch standups history:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      checkSubmission();
    }
  }, [userId]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (yesterdayWork || todayPlan || blockers || mood) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const draft = {
          yesterdayWork,
          todayPlan,
          blockers,
          mood,
          completionPercentage,
          savedAt: timestamp
        };
        localStorage.setItem("standup_draft_" + userId, JSON.stringify(draft));
        setDraftSavedTime(timestamp);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(saveInterval);
  }, [yesterdayWork, todayPlan, blockers, mood, completionPercentage, userId]);

  const handleStandupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yesterdayWork.trim() || !todayPlan.trim() || !mood) {
      toast.error("Please fill in yesterday's work, today's plan, and your mood.");
      return;
    }
    setIsSubmitting(true);
    try {
      await standupAPI.submit({
        yesterdayWork,
        todayPlan,
        blockers: blockers || "None",
        mood,
        completionPercentage
      });
      toast.success("Daily Standup submitted successfully!");
      
      // Clear draft
      localStorage.removeItem("standup_draft_" + userId);
      setYesterdayWork("");
      setTodayPlan("");
      setBlockers("");
      setMood("");
      setCompletionPercentage(0);
      setDraftSavedTime("");
      setAlreadySubmitted(true);

      // Update parent onboarding and stores
      if (onStandupSuccess) onStandupSuccess();
      useHRMStore.getState().fetchData();
    } catch (error: any) {
      console.error("Failed to submit standup:", error);
      toast.error(error.message || "Failed to submit standup");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (alreadySubmitted) {
    return (
      <GlassCard className="p-5 border-l-4 border-l-kcyan bg-gradient-to-br from-kcyan/5 to-transparent">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-kcyan" />
          <div>
            <h3 className="font-display text-[15px] font-semibold text-white/90">Daily Standup Completed</h3>
            <p className="mt-1 text-[12px] text-white/55">You have submitted your daily standup update. Keep up the great work! ✨</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const moods = [
    { label: "Productive", val: "productive", emoji: "🤩" },
    { label: "Tired", val: "tired", emoji: "😴" },
    { label: "Stressed", val: "stressed", emoji: "🤯" },
    { label: "Happy", val: "happy", emoji: "😊" },
  ];

  return (
    <GlassCard id="standup-form" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-[16px] font-semibold text-white">Daily Standup</h2>
          <p className="text-[11px] text-white/45">Share your progress, plans, and blockers</p>
        </div>
        {draftSavedTime && (
          <span className="text-[10px] font-mono text-white/40">
            Draft saved at {draftSavedTime}
          </span>
        )}
      </div>

      <form onSubmit={handleStandupSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
              Yesterday's Work *
            </label>
            <textarea
              required
              rows={3}
              value={yesterdayWork}
              onChange={(e) => setYesterdayWork(e.target.value)}
              placeholder="What did you work on yesterday? Key tasks, fixes..."
              className="w-full rounded-xl border border-white/8 bg-white/4 p-3 text-[12.5px] text-white focus:border-kcyan focus:outline-none placeholder-white/20 resize-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
              Today's Plan *
            </label>
            <textarea
              required
              rows={3}
              value={todayPlan}
              onChange={(e) => setTodayPlan(e.target.value)}
              placeholder="What is your plan for today? Focus areas..."
              className="w-full rounded-xl border border-white/8 bg-white/4 p-3 text-[12.5px] text-white focus:border-kcyan focus:outline-none placeholder-white/20 resize-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
            Blockers (Optional)
          </label>
          <input
            type="text"
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="Are there any blockers slowing you down? E.g. PR reviews, API access..."
            className="w-full h-10 rounded-xl border border-white/8 bg-white/4 px-3 text-[12.5px] text-white focus:border-kcyan focus:outline-none placeholder-white/20"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-white/50 mb-2">
              How is your mood? *
            </label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => setMood(m.val)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-all cursor-pointer ${
                    mood === m.val
                      ? "border-kcyan bg-kcyan/15 text-kcyan font-semibold shadow-[0_0_12px_rgba(6,200,216,0.15)]"
                      : "border-white/10 bg-white/2 text-white/60 hover:border-white/20 hover:text-white/80"
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono uppercase tracking-wider text-white/50 mb-2">
              <span>Task Completion Rate</span>
              <span className="text-kcyan font-semibold">{completionPercentage}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={completionPercentage}
                onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                className="flex-1 accent-kcyan h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-kblue to-kcyan px-6 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(6,200,216,0.2)] hover:shadow-[0_4px_20px_rgba(6,200,216,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSubmitting ? "Submitting..." : "Submit Standup"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function Portal() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id || "e1";
  const emp = useHRMStore((s) => s.employees).find((e) => e.userId === userId);
  const empId = emp ? emp.id : userId;
  const tasks = useHRMStore((s) => s.tasks).filter((t) => t.assignedTo === empId);
  const courses = useHRMStore((s) => s.courses);
  const evals = useHRMStore((s) => s.evaluations).filter((e) => e.employeeId === empId);
  const totalXP = courses.reduce((a, c) => a + (c.xp || 0), 0);
  const overall = Math.round(
    (evals.reduce((a, e) => a + e.rating, 0) / Math.max(evals.length, 1)) * 20,
  );

  const [onboarding, setOnboarding] = useState<any>(null);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const fetchOnboarding = async () => {
    try {
      const status = await internAPI.getOnboardingStatus();
      setOnboarding(status);
    } catch (e) {
      console.error("Failed to load onboarding:", e);
    }
  };

  useEffect(() => {
    if (userId && user?.role === "Intern") {
      fetchOnboarding();
    }
  }, [userId, user]);

  const handleCompleteStep = async (step: string) => {
    try {
      const updated = await internAPI.completeOnboardingStep(step);
      if (updated.completed && !onboarding?.completed) {
        toast.success("Congratulations! You have completed all onboarding steps! Welcome to KLASSYGO! 🎉");
        setTimeout(() => triggerConfetti(), 150);
      }
      setOnboarding(updated);
    } catch (err) {
      console.error("Failed to mark onboarding step:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Full screen canvas for Confetti */}
      <canvas id="confetti-canvas" className="pointer-events-none fixed inset-0 z-[100] h-full w-full" />

      {guideModalOpen && (
        <GuideModal isOpen={guideModalOpen} onClose={() => {
          setGuideModalOpen(false);
          handleCompleteStep("guideRead");
        }} />
      )}

      {/* Checklist banner if not completed */}
      {user?.role === "Intern" && onboarding && !onboarding.completed && (
        <OnboardingChecklist
          status={onboarding}
          onCompleteStep={handleCompleteStep}
          setGuideModalOpen={setGuideModalOpen}
        />
      )}

      {/* Onboarding Welcome Celebration message */}
      {user?.role === "Intern" && onboarding && onboarding.completed && (
        <GlassCard className="p-4 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-display text-[14.5px] font-semibold text-white">Onboarding Completed successfully</h3>
              <p className="text-[11.5px] text-white/55 mt-0.5">Welcome aboard! Your training checklist is completed.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => triggerConfetti()}
            className="h-8 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer"
          >
            Celebrate 🎉
          </button>
        </GlassCard>
      )}

      <GlassCard className="bg-gradient-to-br from-kviolet/10 to-transparent p-6">
        <div className="flex items-center gap-4">
          <Avatar initials={user?.avatar || "AM"} size={56} />
          <div>
            <h1 className="font-display text-[24px] font-bold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0]}
            </h1>
            <p className="mt-1 text-[13px] text-white/55">
              You have {tasks.filter((t) => t.status !== "done").length} tasks due today and{" "}
              {evals.length} recent evaluations
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 md:grid-cols-2">
        <DailyStandupForm userId={userId} onStandupSuccess={fetchOnboarding} />
        <AttendanceCard userId={userId} onCheckInSuccess={fetchOnboarding} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-5">
          <div className="font-display text-[15px] font-semibold">My Tasks</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {(["todo", "in-progress", "done"] as const).map((s) => (
              <div key={s} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="mb-2 text-[10px] font-mono uppercase tracking-wider text-white/40">
                  {s.replace("-", " ")}
                </div>
                <div className="space-y-2">
                  {tasks
                    .filter((t) => t.status === s)
                    .slice(0, 5)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-[12px]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${t.priority === "high" ? "bg-korange" : t.priority === "medium" ? "bg-kgold" : "bg-kcyan"}`}
                          />
                          <span className="text-white/80">{t.title}</span>
                        </div>
                        <div className="mt-1 font-mono text-[9px] text-white/30">
                          Due {t.dueDate}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="font-display text-[15px] font-semibold">LMS Progress</div>
          <div className="mt-3 space-y-2.5">
            {courses.slice(0, 4).map((c) => (
              <div key={c.id}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/75">{c.title}</span>
                  <span className="font-mono text-kgold">+{c.xp} XP</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full bg-gradient-to-r from-kblue to-kcyan"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <div className="font-display text-[26px] font-extrabold text-kgold">
              <AnimatedNumber value={totalXP} />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Total XP
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-5">
          <div className="font-display text-[15px] font-semibold">My Evaluations</div>
          <div className="mt-3 space-y-3">
            {evals.map((e) => (
              <div key={e.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] text-white/75">
                    {e.evaluator} · {e.date}
                  </div>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < e.rating ? "fill-kgold text-kgold" : "text-white/15"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-[12px] italic text-white/60">"{e.comment}"</p>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="font-display text-[15px] font-semibold">Overall Performance</div>
          <div className="mt-3 h-48">
            <ResponsiveContainer>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="62%"
                outerRadius="100%"
                data={[{ value: overall, fill: "#7c3aed" }]}
              >
                <RadialBar
                  background={{ fill: "rgba(255,255,255,0.05)" }}
                  dataKey="value"
                  cornerRadius={8}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-32 text-center pointer-events-none">
            <div className="font-display text-[32px] font-extrabold text-kviolet">{overall}</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Score
            </div>
          </div>
          <div className="mt-12 flex items-center justify-center gap-2 text-[12px] text-white/55">
            <CheckCircle2 className="h-3.5 w-3.5 text-kcyan" /> Trending up this quarter
          </div>
          <div className="mt-3 flex justify-center">
            <GlowBadge label="High Performer" color="violet" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
