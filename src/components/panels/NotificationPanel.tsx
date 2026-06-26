import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCheck, Inbox } from "lucide-react";
import { useAppStore, type Notification } from "@/stores/appStore";
import { cn } from "@/lib/utils";

const colorBar: Record<string, string> = {
  kcyan: "bg-kcyan",
  kblue: "bg-kblue-bright",
  kviolet: "bg-kviolet",
  kgold: "bg-kgold",
  korange: "bg-korange",
};
const colorBg: Record<string, string> = {
  kcyan: "bg-kcyan/15 text-kcyan",
  kblue: "bg-kblue/15 text-kblue-bright",
  kviolet: "bg-kviolet/15 text-kviolet",
  kgold: "bg-kgold/15 text-kgold",
  korange: "bg-korange/15 text-korange",
};

export function NotificationPanel() {
  const open = useAppStore((s) => s.notificationsOpen);
  const setOpen = useAppStore((s) => s.setNotifications);
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markRead);
  const clearAll = useAppStore((s) => s.clearAll);

  const today = notifications.filter((n) => n.group === "today");
  const earlier = notifications.filter((n) => n.group === "earlier");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed inset-y-0 right-0 z-50 flex w-[360px] flex-col border-l border-white/7 bg-carbon/96 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="font-display text-[15px] font-semibold">Notifications</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-[11px] text-kcyan hover:text-kcyan/80"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
                <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {notifications.length === 0 ? (
                <Empty />
              ) : (
                <>
                  {today.length > 0 && <Group title="TODAY" items={today} markRead={markRead} />}
                  {earlier.length > 0 && (
                    <Group title="EARLIER" items={earlier} markRead={markRead} />
                  )}
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Group({
  title,
  items,
  markRead,
}: {
  title: string;
  items: Notification[];
  markRead: (id: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
        {title}
      </div>
      <div className="space-y-1.5">
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            className={cn(
              "relative flex w-full items-start gap-3 rounded-xl border border-white/5 px-3 py-3 text-left transition-colors",
              !n.read
                ? "bg-white/[0.035] hover:bg-white/[0.06]"
                : "bg-transparent hover:bg-white/[0.03]",
            )}
          >
            <span
              className={cn("absolute left-0 top-2 h-9 w-[3px] rounded-r-full", colorBar[n.color])}
            />
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                colorBg[n.color],
              )}
            >
              <span className="font-display text-[10px] font-semibold">{n.module.slice(0, 2)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[13px] font-semibold text-white/95">{n.title}</div>
              <div className="mt-0.5 text-[12px] text-white/55">{n.message}</div>
              <div className="mt-1 font-mono text-[10px] text-white/30">{n.time}</div>
            </div>
            {!n.read && (
              <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-kcyan shadow-[0_0_6px_rgba(6,200,216,0.8)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-white/40">
      <Inbox className="mb-3 h-10 w-10" />
      <div className="font-display text-sm">All caught up!</div>
    </div>
  );
}
