import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect } from "react";
import {
  Home,
  BookOpen,
  ClipboardList,
  Calendar,
  User,
  MessageSquare,
  Users,
  Star,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { KlassyLogo } from "../common/KlassyLogo";
import { Avatar } from "../common/Avatar";
import { GlowBadge } from "../common/GlowBadge";
import { useAuthStore } from "@/stores/authStore";
import { useHRMStore } from "@/stores/hrmStore";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";

const navItems: { icon: LucideIcon; label: string; path: string }[] = [
  { icon: Home, label: "Overview", path: "/employee" },
  { icon: BookOpen, label: "My Learning", path: "/employee/lms" },
  { icon: ClipboardList, label: "My Tasks", path: "/employee/tasks" },
  { icon: Calendar, label: "Leave", path: "/employee/leave" },
  { icon: Star, label: "Feedback", path: "/employee/feedback" },
  { icon: User, label: "Profile", path: "/employee/profile" },
  { icon: Users, label: "Directory", path: "/employee/directory" },
  { icon: MessageSquare, label: "Switch to Admin", path: "/dashboard" },
];

export function EmployeeLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    // Automatically load live interns/tasks/batches data from Express backend
    useHRMStore.getState().fetchData();
    useAppStore.getState().fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-obsidian bg-grid text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-kviolet/12 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-kcyan/8 blur-[120px]" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-white/5 bg-carbon/95 backdrop-blur-2xl">
        <div className="px-4 py-5">
          <Link to="/" className="cursor-pointer">
            <KlassyLogo />
          </Link>
        </div>
        {user && (
          <div className="mx-3 mb-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar initials={user.avatar} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[13px] font-semibold">{user.name}</div>
                <div className="mt-0.5">
                  <GlowBadge 
                    label={user.role} 
                    color={user.role === "Intern" ? "cyan" : "violet"} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems
            .filter((it) => {
              if (it.path === "/dashboard") {
                return user && ["Lead", "Admin", "Management"].includes(user.role);
              }
              return true;
            })
            .map((it) => {
              const active = pathname === it.path;
              const Icon = it.icon;
              return (
              <Link
                key={it.path}
                to={it.path}
                className={cn(
                  "relative mx-2 my-0.5 flex h-10 items-center gap-3 rounded-[10px] px-3 transition-colors",
                  active
                    ? "bg-gradient-to-r from-kviolet/15 via-kviolet/5 to-transparent"
                    : "hover:bg-white/4",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 h-7 w-[2.5px] rounded-r-full bg-kviolet shadow-[0_0_10px_rgba(124,58,237,0.7)]" />
                )}
                <Icon className={cn("h-4 w-4", active ? "text-kviolet" : "text-white/45")} />
                <span
                  className={cn("text-[13px]", active ? "font-medium text-white" : "text-white/60")}
                >
                  {it.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/5 px-2 py-2.5">
          <button
            onClick={async () => {
              await useAuthStore.getState().logout();
              window.location.href = "/auth";
            }}
            className="flex w-full h-10 items-center gap-3 rounded-[10px] px-3 text-white/65 hover:bg-white/4 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-white/45" />
            <span className="text-[13px]">Logout</span>
          </button>
        </div>
        <div className="border-t border-white/5 px-5 py-2.5 text-center font-mono text-[9px] text-white/20">
          v2.4.1
        </div>
      </aside>

      <div className="pl-[220px]">
        <main className="px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
