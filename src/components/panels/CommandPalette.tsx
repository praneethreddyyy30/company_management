import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Grid2X2,
  Building2,
  UserPlus,
  BookOpen,
  ClipboardList,
  FileText,
  Calendar,
  Activity,
  Target,
  Users,
  Star,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useHRMStore } from "@/stores/hrmStore";
import { useAuthStore } from "@/stores/authStore";
import { searchAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const open = useAppStore((s) => s.commandPaletteOpen);
  const setOpen = useAppStore((s) => s.setCommandPalette);
  const navigate = useNavigate();
  const employees = useHRMStore((s) => s.employees);
  const user = useAuthStore((s) => s.user);
  
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    interns: any[];
    tasks: any[];
    batches: any[];
    announcements: any[];
  }>({ interns: [], tasks: [], batches: [], announcements: [] });

  // Debounced API Search trigger
  useEffect(() => {
    if (!q.trim()) {
      setSearchResults({ interns: [], tasks: [], batches: [], announcements: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await searchAPI.globalSearch(q);
        setSearchResults(results);
      } catch (err) {
        console.error("CommandPalette search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [q]);

  const displayItems: Item[] = useMemo(() => {
    const go = (p: string) => () => {
      navigate({ to: p });
      setOpen(false);
    };

    const nav: Item[] = [
      {
        id: "n1",
        label: "Dashboard",
        group: "NAVIGATION",
        icon: Grid2X2,
        action: go("/dashboard"),
        shortcut: "G D",
      },
      {
        id: "n2",
        label: "HRM Core",
        group: "NAVIGATION",
        icon: Building2,
        action: go("/dashboard/hrm"),
      },
      {
        id: "n3",
        label: "Learning Management",
        group: "NAVIGATION",
        icon: BookOpen,
        action: go("/dashboard/lms"),
      },
      {
        id: "n4",
        label: "Onboarding",
        group: "NAVIGATION",
        icon: UserPlus,
        action: go("/dashboard/onboarding"),
      },
      {
        id: "n5",
        label: "Work Hub",
        group: "NAVIGATION",
        icon: ClipboardList,
        action: go("/dashboard/work"),
      },
      {
        id: "n6",
        label: "Policy Vault",
        group: "NAVIGATION",
        icon: FileText,
        action: go("/dashboard/policies"),
      },
      {
        id: "n7",
        label: "Leave Management",
        group: "NAVIGATION",
        icon: Calendar,
        action: go("/dashboard/leave"),
      },
      {
        id: "n8",
        label: "Live Monitor",
        group: "NAVIGATION",
        icon: Activity,
        action: go("/dashboard/monitor"),
      },
      {
        id: "n9",
        label: "Talent Acquisition",
        group: "NAVIGATION",
        icon: Target,
        action: go("/dashboard/talent"),
      },
      {
        id: "n10",
        label: "Evaluations",
        group: "NAVIGATION",
        icon: Star,
        action: go("/dashboard/evaluations"),
      },
      {
        id: "n11",
        label: "Employee Portal",
        group: "NAVIGATION",
        icon: Users,
        action: go("/employee"),
      },
    ];

    const actions: Item[] = [
      {
        id: "a1",
        label: "Add new employee",
        group: "ACTIONS",
        icon: Plus,
        action: go("/dashboard/hrm"),
      },
      {
        id: "a2",
        label: "Apply for leave",
        group: "ACTIONS",
        icon: Calendar,
        action: go("/employee/leave"),
      },
      {
        id: "a3",
        label: "Create task",
        group: "ACTIONS",
        icon: ClipboardList,
        action: go("/employee/tasks"),
      },
    ];

    // If query is empty, show static navigation, actions, and local employees
    if (!q.trim()) {
      const people: Item[] = employees.slice(0, 6).map((e) => ({
        id: `p-${e.id}`,
        label: `${e.name} — ${e.role}`,
        group: "PEOPLE",
        icon: Users,
        action: go(user?.role === "Lead" ? "/dashboard/hrm" : "/employee"),
      }));
      return [...nav, ...actions, ...people];
    }

    // If query is present, client-filter navigation/actions and show database search results
    const lc = q.toLowerCase();
    const filteredNav = nav.filter((i) => i.label.toLowerCase().includes(lc));
    const filteredActions = actions.filter((i) => i.label.toLowerCase().includes(lc));

    const dbInterns: Item[] = (searchResults.interns || []).map((e: any) => ({
      id: `dbi-${e._id}`,
      label: `${e.userId?.name || "Unknown Intern"} — ${e.track} Track`,
      group: "INTERNS (DATABASE)",
      icon: Users,
      action: go(user?.role === "Lead" ? "/dashboard/hrm" : `/employee/profile`),
    }));

    const dbTasks: Item[] = (searchResults.tasks || []).map((t: any) => ({
      id: `dbt-${t._id}`,
      label: `${t.title} [${t.status}]`,
      group: "TASKS (DATABASE)",
      icon: ClipboardList,
      action: go(user?.role === "Lead" ? "/dashboard/work" : "/employee/tasks"),
    }));

    const dbBatches: Item[] = (searchResults.batches || []).map((b: any) => ({
      id: `dbb-${b._id}`,
      label: b.name,
      group: "BATCHES (DATABASE)",
      icon: Grid2X2,
      action: go("/dashboard/hrm"),
    }));

    const dbAnnouncements: Item[] = (searchResults.announcements || []).map((a: any) => ({
      id: `dba-${a._id}`,
      label: a.title,
      group: "ANNOUNCEMENTS (DATABASE)",
      icon: FileText,
      action: go(user?.role === "Lead" ? "/dashboard" : "/employee"),
    }));

    return [
      ...filteredNav,
      ...filteredActions,
      ...dbInterns,
      ...dbTasks,
      ...dbBatches,
      ...dbAnnouncements,
    ];
  }, [q, navigate, employees, setOpen, searchResults, user]);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, displayItems.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        displayItems[active]?.action();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, displayItems, active, setOpen]);

  const grouped = useMemo(() => {
    const g: Record<string, Item[]> = {};
    displayItems.forEach((i) => {
      (g[i.group] ||= []).push(i);
    });
    return g;
  }, [displayItems]);

  let idx = -1;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[18%] z-[70] w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl border border-kblue/30 bg-carbon/95 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.7),0_0_60px_rgba(26,123,196,0.25)]"
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-5">
              <Search className="h-5 w-5 text-white/40" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search KLASSYGO…"
                className="h-14 flex-1 bg-transparent font-display text-[16px] text-white placeholder:text-white/30 focus:outline-none"
              />
              {loading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-kcyan border-t-transparent" />
              )}
            </div>
            <div className="max-h-[380px] overflow-y-auto p-2">
              {Object.entries(grouped).map(([group, list]) => (
                <div key={group} className="mb-2">
                  <div className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
                    {group}
                  </div>
                  {list.map((it) => {
                    idx++;
                    const isActive = idx === active;
                    const Icon = it.icon;
                    return (
                      <button
                        key={it.id}
                        onClick={it.action}
                        onMouseEnter={() => setActive(idx)}
                        className={cn(
                          "relative flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors",
                          isActive ? "bg-kblue/10" : "hover:bg-white/5",
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-2 h-7 w-[2px] rounded-r bg-kcyan" />
                        )}
                        <Icon
                          className={cn("h-4 w-4", isActive ? "text-kcyan" : "text-white/50")}
                        />
                        <span className="flex-1 text-[13px] text-white/85">{it.label}</span>
                        {it.shortcut && (
                          <span className="font-mono text-[10px] text-white/30">{it.shortcut}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              {displayItems.length === 0 && (
                <div className="px-3 py-8 text-center text-[12px] text-white/40">
                  {loading ? "Searching..." : `No results for "${q}"`}
                </div>
              )}
            </div>
            <div className="border-t border-white/8 px-4 py-2.5 font-mono text-[10px] text-white/30">
              ↑↓ navigate · ↵ select · esc close
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
