import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Package, Wallet, Truck, Receipt } from "lucide-react";

export const Route = createFileRoute("/dashboard/erp")({ component: ERP });

const modules = [
  { name: "Finance", icon: Wallet, color: "kcyan", desc: "Ledger, AP/AR, payroll" },
  { name: "Procurement", icon: Package, color: "kblue", desc: "Vendors, POs, contracts" },
  { name: "Inventory", icon: Truck, color: "kviolet", desc: "Stock, warehouses, SKUs" },
  { name: "Billing", icon: Receipt, color: "kgold", desc: "Invoices, taxes, payments" },
];

function ERP() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight">ERP Suite</h1>
        <p className="mt-1 text-[13px] text-white/55">Enterprise resource planning</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly Revenue"
          value={420}
          suffix="K"
          icon={Wallet}
          color="cyan"
          index={0}
          delta="+8%"
        />
        <StatCard label="Open POs" value={18} icon={Package} color="violet" index={1} />
        <StatCard label="Invoices Due" value={7} icon={Receipt} color="gold" index={2} />
        <StatCard
          label="Cost Saved"
          value={64}
          suffix="K"
          icon={Truck}
          color="blue"
          index={3}
          delta="+12%"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <GlassCard key={m.name} className="p-5" hover glowColor="blue">
              <Icon
                className={`h-7 w-7 ${m.color === "kcyan" ? "text-kcyan" : m.color === "kblue" ? "text-kblue-bright" : m.color === "kviolet" ? "text-kviolet" : "text-kgold"}`}
              />
              <div className="mt-3 font-display text-[15px] font-semibold">{m.name}</div>
              <div className="mt-1 text-[12px] text-white/55">{m.desc}</div>
              <button className="mt-4 w-full rounded-lg border border-white/8 bg-white/[0.03] py-2 text-[12px] text-white/70 hover:border-kcyan/30 hover:text-kcyan">
                Open module →
              </button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
