import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: ReactNode;
  className?: string;
  glowColor?: "blue" | "cyan" | "violet" | "gold" | "orange" | "none";
  hover?: boolean;
}

const glowMap: Record<string, string> = {
  blue: "0 24px 70px rgba(26,123,196,0.30)",
  cyan: "0 24px 70px rgba(6,200,216,0.28)",
  violet: "0 24px 70px rgba(124,58,237,0.32)",
  gold: "0 24px 70px rgba(255,184,0,0.26)",
  orange: "0 24px 70px rgba(244,81,30,0.28)",
  none: "0 20px 60px rgba(0,0,0,0.4)",
};

export function GlassCard({
  children,
  className,
  glowColor = "none",
  hover = false,
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, boxShadow: glowMap[glowColor] } : undefined}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={cn(
        "relative rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-2xl",
        "shadow-[0_20px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
