import { cn } from "@/lib/utils";

type Color = "blue" | "cyan" | "violet" | "gold" | "orange";

const map: Record<Color, string> = {
  blue: "bg-kblue/12 border-kblue/40 text-kblue-bright shadow-[0_0_18px_rgba(26,123,196,0.25)]",
  cyan: "bg-kcyan/12 border-kcyan/40 text-kcyan shadow-[0_0_18px_rgba(6,200,216,0.25)]",
  violet: "bg-kviolet/12 border-kviolet/40 text-kviolet shadow-[0_0_18px_rgba(124,58,237,0.30)]",
  gold: "bg-kgold/12 border-kgold/40 text-kgold shadow-[0_0_18px_rgba(255,184,0,0.25)]",
  orange: "bg-korange/12 border-korange/40 text-korange shadow-[0_0_18px_rgba(244,81,30,0.25)]",
};

export function GlowBadge({
  label,
  color = "blue",
  className,
}: {
  label: string;
  color?: Color;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-[3px]",
        "text-[10px] font-display font-semibold uppercase tracking-[0.14em]",
        map[color],
        className,
      )}
    >
      {label}
    </span>
  );
}
