import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { GlowBadge } from "@/components/common/GlowBadge";
import { useHRMStore } from "@/stores/hrmStore";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/policies")({ component: Policies });

function Policies() {
  const policies = useHRMStore((s) => s.policies);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight">Policy Vault</h1>
        <p className="mt-1 text-[13px] text-white/55">Centralised governance documents</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {policies.map((p) => (
          <GlassCard key={p.id} className="p-5" hover glowColor="gold">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kgold/15">
                <FileText className="h-5 w-5 text-kgold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[14px] font-semibold leading-tight">
                  {p.title}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-white/50">
                  <GlowBadge label={p.category} color="blue" />
                  <span className="font-mono">{p.version}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-white/50">
              <span>Updated {p.lastUpdated}</span>
              <span className="font-mono">{p.fileSize}</span>
            </div>
            <button
              onClick={() => toast.success("Downloading…", { description: p.title })}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.03] py-2 text-[12px] text-white/70 hover:border-kcyan/30 hover:text-kcyan"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
