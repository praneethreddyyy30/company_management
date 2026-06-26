import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface Props {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  suffix = "",
  decimals = 0,
  duration = 1.2,
  className,
}: Props) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => {
    if (decimals === 0) return Math.round(v).toLocaleString();
    return v.toFixed(decimals);
  });

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, duration, mv]);

  return (
    <span className={className}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
