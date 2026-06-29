import { AnimatePresence, motion } from "framer-motion";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NotificationPanel } from "../panels/NotificationPanel";
import { AICopilot } from "../panels/AICopilot";
import { CommandPalette } from "../panels/CommandPalette";
import { useAppStore } from "@/stores/appStore";
import { useHRMStore } from "@/stores/hrmStore";
import { useAuthStore } from "@/stores/authStore";

export function MainLayout({ children }: { children: ReactNode }) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate({ to: "/auth" });
      return;
    }
    if (user.role === "Intern") {
      navigate({ to: "/employee" });
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Automatically load live interns/tasks/batches data from Express backend
      useHRMStore.getState().fetchData();
      useAppStore.getState().fetchNotifications();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user || user.role === "Intern") {
    return null;
  }

  return (
    <div className="min-h-screen bg-obsidian bg-grid text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-kblue/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[480px] w-[480px] rounded-full bg-kviolet/10 blur-[120px]" />
      </div>
      <Sidebar />
      <div
        style={{ paddingLeft: collapsed ? 72 : 240 }}
        className="transition-[padding] duration-300"
      >
        <Topbar />
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
      <NotificationPanel />
      <AICopilot />
      <CommandPalette />
    </div>
  );
}
