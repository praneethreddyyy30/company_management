import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check, Shield } from "lucide-react";
import { KlassyLogo } from "@/components/common/KlassyLogo";
import { GlassCard } from "@/components/common/GlassCard";
import { GlowBadge } from "@/components/common/GlowBadge";
import { useAuthStore, type Role } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthFlow,
});

const roles: Role[] = ["Management", "Lead", "Admin", "Employee", "Intern"];

function AuthFlow() {
  const step = useAuthStore((s) => s.authStep);
  const setStep = useAuthStore((s) => s.setStep);
  return (
    <div className="relative min-h-screen overflow-hidden bg-obsidian bg-grid text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-kblue/20 blur-[140px]" />
        <div className="absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-kviolet/20 blur-[140px]" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        <LeftPanel />
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[480px]">
            <ProgressBar step={step} />
            <GlassCard glowColor="blue" className="p-7 mt-5">
              <AnimatePresence mode="wait">
                {step === 1 && <Step1 key="s1" />}
                {step === 2 && <Step2 key="s2" />}
                {step === 3 && <Step3 key="s3" />}
                {step === 4 && <Step4 key="s4" />}
              </AnimatePresence>
            </GlassCard>
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                className="mt-4 flex items-center gap-2 text-[12px] text-white/40 hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: s <= step ? "100%" : "0%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "h-full",
              s === 4 && step === 4 ? "bg-kgold" : "bg-gradient-to-r from-kblue to-kcyan",
            )}
          />
        </div>
      ))}
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="hidden flex-col justify-between p-10 lg:flex">
      <KlassyLogo size={48} />
      <div>
        <h1 className="font-display text-[44px] font-extrabold leading-[1.05] tracking-tight">
          The intelligence layer for your
          <br />
          <span className="bg-gradient-to-r from-kcyan via-kblue-bright to-kviolet bg-clip-text text-transparent">
            entire workforce.
          </span>
        </h1>
        <p className="mt-4 max-w-md text-[14px] font-light text-white/55">
          KLASSYGO unifies HRM, ERP and CRM into one ambient, AI-augmented platform. Simple yet
          sophisticated.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-kgold/30 bg-kgold/8 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-kgold shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-kgold">
            Pre-incubated at BITS Pilani
          </span>
        </div>

        <div className="mt-8 space-y-3">
          {[
            { t: "Unified HRM + ERP + CRM Intelligence", c: "kblue" },
            { t: "AI-powered Workforce Analytics", c: "kviolet" },
            { t: "Enterprise-grade Security & Roles", c: "kcyan" },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border",
                  f.c === "kblue" && "border-kblue/40 bg-kblue/10",
                  f.c === "kviolet" && "border-kviolet/40 bg-kviolet/10",
                  f.c === "kcyan" && "border-kcyan/40 bg-kcyan/10",
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    f.c === "kblue" && "text-kblue-bright",
                    f.c === "kviolet" && "text-kviolet",
                    f.c === "kcyan" && "text-kcyan",
                  )}
                />
              </div>
              <span className="text-[14px] font-light text-white/75">{f.t}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <OrbitArt />
    </div>
  );
}

function OrbitArt() {
  const nodes = ["HRM", "LMS", "ERP", "CRM", "TAL", "OPS"];
  return (
    <div className="relative mx-auto h-[220px] w-[220px]">
      <div className="absolute inset-0 animate-spin-slow">
        {nodes.map((n, i) => {
          const angle = (i / nodes.length) * Math.PI * 2;
          const r = 95;
          const x = 50 + (Math.cos(angle) * r) / 2.2;
          const y = 50 + (Math.sin(angle) * r) / 2.2;
          return (
            <div
              key={n}
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/5 backdrop-blur-md"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="flex h-full items-center justify-center font-mono text-[9px] text-kcyan">
                {n}
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-kblue via-kviolet to-korange shadow-[0_0_40px_rgba(124,58,237,0.5)]">
          <span className="font-display text-[18px] font-extrabold">K</span>
        </div>
      </div>
    </div>
  );
}

const step1Schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});

function Step1() {
  const setStep = useAuthStore((s) => s.setStep);
  const selectedRole = useAuthStore((s) => s.selectedRole);
  const setRole = useAuthStore((s) => s.setRole);
  const setFormDraft = useAuthStore((s) => s.setFormDraft);
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState, watch } = useForm({
    resolver: zodResolver(step1Schema),
  });
  const pw = watch("password") || "";
  const strength = Math.min(4, Math.floor(pw.length / 3));

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      await useAuthStore.getState().login({ email: data.email, password: data.password });
      toast.success("Welcome back! Login successful.");
      setStep(4);
    } catch (err) {
      setFormDraft({ email: data.email, password: data.password });
      setStep(2);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <h2 className="font-display text-[24px] font-bold tracking-tight">Welcome to KLASSYGO</h2>
      <p className="mt-1 text-[13px] text-white/50">Sign in to your workspace</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
            I am a…
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((r) => {
              const active = selectedRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all duration-200",
                    active
                      ? "border-kblue bg-kblue/15 text-kblue-bright shadow-[0_0_16px_rgba(26,123,196,0.35)]"
                      : "border-white/10 bg-white/4 text-white/60 hover:border-white/20 hover:text-white",
                  )}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <FloatField
          label="Email"
          type="email"
          {...register("email")}
          error={formState.errors.email?.message}
        />
        <FloatField
          label="Password"
          type={showPw ? "text" : "password"}
          {...register("password")}
          error={formState.errors.password?.message}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="text-white/40 hover:text-white"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ scaleX: i < strength ? 1 : 0.15, opacity: i < strength ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "h-1 flex-1 origin-left rounded-full",
                i === 0 && "bg-red-500",
                i === 1 && "bg-korange",
                i === 2 && "bg-kgold",
                i === 3 && "bg-kcyan",
              )}
            />
          ))}
        </div>

        <PrimaryButton type="submit" disabled={!selectedRole}>
          Continue <ArrowRight className="h-4 w-4" />
        </PrimaryButton>

        <div className="text-center text-[12px] text-white/40">
          New to KLASSYGO?{" "}
          <button type="button" className="text-kcyan hover:underline">
            Request access
          </button>
        </div>
      </form>
    </motion.div>
  );
}

const step2Schema = z.object({
  fullName: z.string().min(2, "Required"),
  email: z.string().email(),
  phone: z.string().min(7),
  city: z.string().min(2),
  state: z.string().min(2),
  address: z.string().min(5),
  degree: z.string().min(2),
  subject: z.string().min(2),
  institution: z.string().min(2),
  year: z.string().min(4),
  cgpa: z.string().min(1),
  declare: z.boolean().refine((v) => v === true, { message: "Required" }),
});

function Step2() {
  const setStep = useAuthStore((s) => s.setStep);
  const formDraft = useAuthStore((s) => s.formDraft);
  const setFormDraft = useAuthStore((s) => s.setFormDraft);
  type Step2Data = z.infer<typeof step2Schema>;
  const { register, handleSubmit, formState, setValue, watch } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema) as never,
    defaultValues: { email: formDraft.email || "" } as Partial<Step2Data>,
  });
  const declare = watch("declare");

  const onSubmit = (data: Step2Data) => {
    setFormDraft({
      fullName: String(data.fullName),
      city: String(data.city),
      state: String(data.state),
    });
    setStep(3);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <h2 className="font-display text-[22px] font-bold tracking-tight">Personal Information</h2>
      <p className="mt-1 text-[13px] text-white/50">Tell us a bit about yourself.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3.5">
        <FloatField
          label="Full Name"
          {...register("fullName")}
          error={formState.errors.fullName?.message}
        />
        <div className="grid gap-3.5 md:grid-cols-2">
          <FloatField
            label="Email"
            type="email"
            {...register("email")}
            error={formState.errors.email?.message}
          />
          <FloatField
            label="Contact Number"
            {...register("phone")}
            error={formState.errors.phone?.message}
          />
        </div>
        <div className="grid gap-3.5 md:grid-cols-2">
          <FloatField label="City" {...register("city")} error={formState.errors.city?.message} />
          <FloatField
            label="State"
            {...register("state")}
            error={formState.errors.state?.message}
          />
        </div>
        <FloatField
          label="Full Address"
          textarea
          {...register("address")}
          error={formState.errors.address?.message}
        />
        <div className="grid gap-3.5 md:grid-cols-2">
          <FloatField
            label="Degree / Qualification"
            {...register("degree")}
            error={formState.errors.degree?.message}
          />
          <FloatField
            label="Specialisation"
            {...register("subject")}
            error={formState.errors.subject?.message}
          />
        </div>
        <FloatField
          label="Institution Name"
          {...register("institution")}
          error={formState.errors.institution?.message}
        />
        <div className="grid gap-3.5 md:grid-cols-2">
          <FloatField
            label="Year of Graduation"
            {...register("year")}
            error={formState.errors.year?.message}
          />
          <FloatField label="CGPA" {...register("cgpa")} error={formState.errors.cgpa?.message} />
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setValue("declare", !declare as never, { shouldValidate: true })}
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                declare
                  ? "border-kcyan bg-kcyan shadow-[0_0_12px_rgba(6,200,216,0.4)]"
                  : "border-white/20 bg-transparent",
              )}
            >
              {declare && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  viewBox="0 0 24 24"
                  className="h-3 w-3 text-black"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              )}
            </button>
            <span className="text-[12px] leading-relaxed text-white/65">
              I hereby declare that all information provided is accurate and complete.
            </span>
          </label>
          {formState.errors.declare && (
            <div className="mt-1 text-[11px] text-korange">
              {String(formState.errors.declare.message)}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <SecondaryButton type="button" onClick={() => setStep(1)}>
            Back
          </SecondaryButton>
          <PrimaryButton type="submit">
            Continue <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </div>
      </form>
    </motion.div>
  );
}

const ALL_PERMS = [
  "View Dashboard",
  "Manage Employees",
  "Approve Leaves",
  "Upload Reports",
  "Access LMS",
  "Manage Policies",
  "View Analytics",
  "Talent Acquisition",
  "Org Chart Access",
  "Evaluation Access",
  "Real-time Monitor",
  "System Settings",
];
const ROLE_DEFAULTS: Record<Role, string[]> = {
  Management: ALL_PERMS,
  Admin: ALL_PERMS,
  Lead: ALL_PERMS.slice(0, 8),
  Employee: ["View Dashboard", "Access LMS", "Org Chart Access", "View Analytics"],
  Intern: ["View Dashboard", "Access LMS", "Org Chart Access"],
};

function Step3() {
  const setStep = useAuthStore((s) => s.setStep);
  const role = useAuthStore((s) => s.selectedRole) || "Employee";
  const [perms, setPerms] = useState<string[]>(ROLE_DEFAULTS[role]);
  const [dept, setDept] = useState("Technology");

  const toggle = (p: string) =>
    setPerms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <h2 className="font-display text-[22px] font-bold tracking-tight">Role & Responsibilities</h2>
      <p className="mt-1 text-[13px] text-white/50">Configure your access scope.</p>

      <div className="mt-5 relative rounded-2xl p-[1px] bg-gradient-to-br from-kblue via-kviolet to-kcyan">
        <div className="rounded-2xl bg-carbon px-5 py-4 text-center">
          <div className="font-display text-[22px] font-extrabold">{role}</div>
          <div className="mt-2 flex justify-center">
            <GlowBadge label={dept} color="cyan" />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
          Your Access Permissions
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PERMS.map((p) => {
            const on = perms.includes(p);
            return (
              <div
                key={p}
                className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.03] px-3 py-2"
              >
                <span className="text-[11.5px] text-white/75">{p}</span>
                <button
                  onClick={() => toggle(p)}
                  type="button"
                  className={cn(
                    "relative h-[22px] w-[40px] rounded-full transition-colors",
                    on ? "bg-kcyan shadow-[0_0_10px_rgba(6,200,216,0.45)]" : "bg-surface3",
                  )}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                      "absolute top-[3px] h-4 w-4 rounded-full bg-white shadow",
                      on ? "right-[3px]" : "left-[3px]",
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
          Department
        </div>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="w-full rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2.5 text-[13px] text-white backdrop-blur focus:border-kcyan focus:outline-none"
        >
          {[
            "Technology",
            "Human Resources",
            "Operations",
            "Design",
            "Marketing",
            "Finance",
            "Product",
            "Sales",
            "Executive",
          ].map((d) => (
            <option key={d} value={d} className="bg-carbon">
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex gap-2">
        <SecondaryButton type="button" onClick={() => setStep(2)}>
          Back
        </SecondaryButton>
        <PrimaryButton onClick={() => setStep(4)}>
          Verify Identity <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </motion.div>
  );
}

function Step4() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.selectedRole) || "Employee";
  const formDraft = useAuthStore((s) => s.formDraft);
  const setUser = useAuthStore((s) => s.setUser);
  const [bursting, setBursting] = useState(false);

  const enter = async () => {
    setBursting(true);
    const currentUser = useAuthStore.getState().user;
    const isIntern = currentUser?.role === "Intern";
    const targetRoute = isIntern ? "/employee" : "/dashboard";

    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (isAuthenticated) {
      setTimeout(() => navigate({ to: targetRoute }), 600);
      return;
    }

    try {
      const mappedRole = (role === "Admin" || role === "Management") ? "Admin" : (role === "Lead" ? "Lead" : "Intern");
      
      const res = await useAuthStore.getState().register({
        name: formDraft.fullName || "Arjun Mehta",
        email: formDraft.email || "arjun@klassygo.com",
        password: formDraft.password || "password123",
        role: mappedRole,
        department: "Technology",
      });
      
      const finalRoute = res?.role === "Intern" ? "/employee" : "/dashboard";
      toast.success("Registration successful!");
      setTimeout(() => navigate({ to: finalRoute }), 600);
    } catch (err) {
      setBursting(false);
      console.error("Registration error:", err);
    }
  };

  const rows = [
    { k: "Name", v: formDraft.fullName || "Arjun Mehta" },
    { k: "Role", v: role },
    { k: "Department", v: "Technology" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="text-center"
    >
      <div className="relative mx-auto h-[88px] w-[88px]">
        <motion.svg viewBox="0 0 100 100" className="h-full w-full">
          <motion.circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#06c8d8"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: "drop-shadow(0 0 8px rgba(6,200,216,0.6))" }}
          />
          <motion.path
            d="M 30 52 L 45 66 L 72 38"
            fill="none"
            stroke="#06c8d8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.svg>
      </div>

      <h2 className="mt-4 font-display text-[24px] font-bold">Identity Verified</h2>
      <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-white/45">
        <Shield className="h-3 w-3" /> Enterprise-grade authentication complete
      </div>

      <div className="mt-5 space-y-2">
        {rows.map((r, i) => (
          <motion.div
            key={r.k}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + i * 0.15, duration: 0.45 }}
            className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-4 py-2.5"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/40">
              {r.k}
            </span>
            <span className="flex items-center gap-2 text-[13px] font-medium text-white">
              {r.v} <Check className="h-3.5 w-3.5 text-kcyan" />
            </span>
          </motion.div>
        ))}
      </div>

      <div className="relative mt-7">
        {bursting && (
          <>
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i / 10) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{
                    opacity: 0,
                    x: Math.cos(angle) * 80,
                    y: Math.sin(angle) * 80,
                    scale: 0.4,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-kcyan shadow-[0_0_8px_rgba(6,200,216,0.9)]"
                />
              );
            })}
          </>
        )}
        <PrimaryButton onClick={enter}>
          Enter Platform <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </motion.div>
  );
}

/* ─────────── Form atoms ─────────── */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
  textarea?: boolean;
};
const FloatField = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, rightSlot, textarea, className, ...rest }, ref) => {
    const [focus, setFocus] = useState(false);
    const [filled, setFilled] = useState(false);

    React.useEffect(() => {
      if (rest.defaultValue || rest.value) {
        setFilled(true);
      }
    }, [rest.defaultValue, rest.value]);

    const handleFocus = (e: React.FocusEvent<any>) => {
      setFocus(true);
      rest.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<any>) => {
      setFocus(false);
      setFilled(!!e.target.value);
      rest.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<any>) => {
      setFilled(!!e.target.value);
      rest.onChange?.(e);
    };

    const float = focus || filled;
    const sharedCls = cn(
      "peer w-full border-b bg-transparent pt-5 pb-1.5 text-[14px] text-white placeholder-transparent focus:outline-none transition-colors",
      error ? "border-korange" : "border-white/10 focus:border-kcyan",
      className,
    );

    return (
      <div className="relative">
        {textarea ? (
          <textarea
            ref={ref as any}
            rows={3}
            className={sharedCls + " resize-none"}
            placeholder=" "
            {...(rest as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        ) : (
          <input
            ref={ref}
            className={sharedCls}
            placeholder=" "
            {...rest}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        )}
        <label
          className={cn(
            "pointer-events-none absolute left-0 transition-all duration-200",
            float
              ? "top-0 text-[10px] font-mono uppercase tracking-[0.15em] text-white/40"
              : "top-5 text-[14px] text-white/35",
          )}
        >
          {label}
        </label>
        {rightSlot && <div className="absolute right-0 top-5">{rightSlot}</div>}
        <motion.div
          layoutId={undefined}
          initial={false}
          animate={{ scaleX: focus ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="absolute bottom-0 left-0 right-0 h-[1.5px] origin-left bg-kcyan shadow-[0_0_8px_rgba(6,200,216,0.5)]"
        />
        {error && <div className="mt-1 text-[11px] text-korange">{error}</div>}
      </div>
    );
  },
);
FloatField.displayName = "FloatField";

function PrimaryButton({
  children,
  className,
  onClick,
  disabled,
  type,
}: React.PropsWithChildren<{
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}>) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-kblue to-kviolet font-display text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.4)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
function SecondaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        "flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 text-[14px] font-medium text-white/80 hover:bg-white/[0.06]",
        className,
      )}
    >
      {children}
    </button>
  );
}
