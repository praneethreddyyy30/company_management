import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  kcyan: "bg-kcyan shadow-[0_0_10px_rgba(6,200,216,0.7)]",
  kblue: "bg-kblue-bright shadow-[0_0_10px_rgba(45,156,239,0.7)]",
  kviolet: "bg-kviolet shadow-[0_0_10px_rgba(124,58,237,0.7)]",
  kgold: "bg-kgold shadow-[0_0_10px_rgba(255,184,0,0.7)]",
  korange: "bg-korange shadow-[0_0_10px_rgba(244,81,30,0.7)]",
};

export function LivePulse({
  color = "kcyan",
  size = 8,
}: {
  color?: keyof typeof colorMap;
  size?: number;
}) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <motion.span
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute inset-0 rounded-full", colorMap[color])}
      />
    </span>
  );
}
