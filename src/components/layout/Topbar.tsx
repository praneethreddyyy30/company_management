import { useRouterState } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { useEffect } from "react";
import { LivePulse } from "../common/LivePulse";
import { Avatar } from "../common/Avatar";
import { useAppStore } from "@/stores/appStore";
import { useAuthStore } from "@/stores/authStore";

function pathToCrumbs(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "));
}

export function Topbar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const crumbs = pathToCrumbs(path);
  const setCommandPalette = useAppStore((s) => s.setCommandPalette);
  const setNotifications = useAppStore((s) => s.setNotifications);
  const notifications = useAppStore((s) => s.notifications);
  const user = useAuthStore((s) => s.user);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPalette(true);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [setCommandPalette]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/5 bg-obsidian/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-2 font-light text-[11px] text-white/35">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-white/20">/</span>}
            <span className={i === crumbs.length - 1 ? "text-white/80" : ""}>{c}</span>
          </span>
        ))}
      </div>

      <button
        onClick={() => setCommandPalette(true)}
        className="group relative hidden h-9 w-[360px] items-center rounded-full border border-white/8 bg-white/5 pl-9 pr-3 text-left text-[13px] text-white/40 transition-all hover:border-kcyan/40 focus:border-kcyan focus:shadow-[0_0_0_3px_rgba(6,200,216,0.1)] md:flex"
      >
        <Search className="absolute left-3.5 h-4 w-4 text-white/30" />
        <span>Search anything…</span>
        <span className="ml-auto rounded bg-white/8 px-1.5 py-0.5 font-mono text-[10px] text-white/40">
          ⌘K
        </span>
      </button>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 md:flex">
          <LivePulse color="kcyan" />
          <span className="font-mono text-[10px] tracking-[0.15em] text-kcyan">LIVE</span>
        </div>
        <button
          onClick={() => setNotifications(true)}
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-br from-korange to-red-500 px-1 font-display text-[9px] font-bold text-white shadow-[0_0_10px_rgba(244,81,30,0.6)]">
              {unread}
            </span>
          )}
        </button>
        {user && <Avatar initials={user.avatar} size={32} />}
      </div>
    </header>
  );
}
