export function KlassyLogo({ size = 38 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        style={{ width: size, height: size, borderRadius: size * 0.27 }}
        className="relative flex items-center justify-center bg-gradient-to-br from-kblue via-kviolet to-korange shadow-[0_8px_24px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]"
      >
        <span className="font-display font-extrabold text-white" style={{ fontSize: size * 0.42 }}>
          K
        </span>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-kcyan shadow-[0_0_10px_rgba(6,200,216,0.9)]" />
      </div>
      <div className="flex items-baseline" style={{ letterSpacing: "-0.03em" }}>
        <span className="font-display font-bold text-white text-[18px]">KLASSY</span>
        <span className="font-display font-bold text-kgold text-[18px]">GO</span>
      </div>
    </div>
  );
}
