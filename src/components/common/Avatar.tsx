import { cn } from "@/lib/utils";

const palette = [
  "from-kblue to-kviolet",
  "from-kcyan to-kblue",
  "from-kviolet to-korange",
  "from-kgold to-korange",
  "from-kcyan to-kviolet",
  "from-korange to-kgold",
];

export function Avatar({
  initials,
  size = 40,
  className,
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  const hash = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const grad = palette[hash % palette.length];
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-display font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        grad,
        className,
      )}
    >
      {initials}
    </div>
  );
}
