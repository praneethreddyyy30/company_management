import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Grid2X2,
  Building2,
  BarChart3,
  Users,
  UserPlus,
  BookOpen,
  ClipboardList,
  Star,
  FileText,
  Calendar,
  Network,
  Activity,
  Sparkles,
  TrendingUp,
  Target,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { KlassyLogo } from "../common/KlassyLogo";
import { Avatar } from "../common/Avatar";
import { GlowBadge } from "../common/GlowBadge";
import { LivePulse } from "../common/LivePulse";
import { useAppStore } from "@/stores/appStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface NavItemDef {
  icon: LucideIcon;
  label: string;
  path?: string;
  badge?: string | number;
  live?: boolean;
  onClick?: () => void;
}

interface NavSection {
  title: string;
  items: NavItemDef[];
}

export function Sidebar() {
  const navigate = useNavigate();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const setAIPanel = useAppStore((s) => s.setAIPanel);
  const user = useAuthStore((s) => s.user);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const sections: NavSection[] = [
    {
      title: "Core Platform",
      items: [
        { icon: Grid2X2, label: "Dashboard", path: "/dashboard" },
        { icon: Building2, label: "HRM Core", path: "/dashboard/hrm" },
        { icon: BarChart3, label: "ERP Suite", path: "/dashboard/erp" },
        { icon: Users, label: "CRM Pipeline", path: "/dashboard/crm" },
      ],
    },
    {
      title: "HR Modules",
      items: [
        { icon: UserPlus, label: "Onboarding", path: "/dashboard/onboarding", badge: 3 },
        { icon: BookOpen, label: "Learning", path: "/dashboard/lms" },
        { icon: ClipboardList, label: "Work Hub", path: "/dashboard/work" },
        { icon: Star, label: "Evaluations", path: "/dashboard/evaluations" },
      ],
    },
    {
      title: "Administration",
      items: [
        { icon: FileText, label: "Policy Vault", path: "/dashboard/policies" },
        { icon: Calendar, label: "Leave Mgmt", path: "/dashboard/leave" },
        { icon: Network, label: "Org Structure", path: "/dashboard/org" },
        { icon: Activity, label: "Live Monitor", path: "/dashboard/monitor", live: true },
      ],
    },
    {
      title: "Intelligence",
      items: [
        { icon: Sparkles, label: "AI Co-Pilot", live: true, onClick: () => setAIPanel(true) },
        { icon: TrendingUp, label: "Reports", path: "/dashboard/reports" },
        { icon: Target, label: "Talent IQ", path: "/dashboard/talent" },
      ],
    },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/5 bg-carbon/95 backdrop-blur-2xl shadow-[2px_0_20px_rgba(26,123,196,0.08)]"
    >
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-4 py-5">
        {!collapsed ? (
          <Link to="/" className="cursor-pointer">
            <KlassyLogo />
          </Link>
        ) : (
          <Link to="/" className="mx-auto cursor-pointer block">
            <KlassyLogo size={32} />
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/5 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* User card */}
      {!collapsed && user && (
        <Link
          to="/dashboard/profile"
          className="mx-3 mb-3 block rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5 backdrop-blur-xl hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-kcyan via-kviolet to-kgold animate-hue" />
              <div className="relative">
                <Avatar initials={user.avatar} size={36} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[13px] font-semibold text-white/90">
                {user.name}
              </div>
              <div className="mt-0.5">
                <GlowBadge label={user.role} color="blue" />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-none pb-3">
        {sections.map((section) => (
          <div key={section.title} className="mt-2">
            {!collapsed && (
              <div className="px-5 py-2 text-[9px] font-mono uppercase tracking-[0.18em] text-white/25">
                {section.title}
              </div>
            )}
            {section.items.map((item) => (
              <NavRow key={item.label} item={item} pathname={pathname} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/5 px-1 py-3">
        <NavRow
          item={{ icon: Settings, label: "Settings", path: "/dashboard/settings" }}
          pathname={pathname}
          collapsed={collapsed}
        />
        <NavRow
          item={{ icon: HelpCircle, label: "Help", path: "/dashboard/help" }}
          pathname={pathname}
          collapsed={collapsed}
        />
        <NavRow
          item={{ 
            icon: LogOut, 
            label: "Logout", 
            onClick: async () => {
              await useAuthStore.getState().logout();
              navigate({ to: "/auth" });
            } 
          }}
          pathname={pathname}
          collapsed={collapsed}
        />
        {!collapsed && (
          <div className="mt-3 px-5 text-center font-mono text-[9px] text-white/20">v2.4.1</div>
        )}
      </div>
    </motion.aside>
  );
}

function NavRow({
  item,
  pathname,
  collapsed,
}: {
  item: NavItemDef;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive = item.path ? pathname === item.path : false;
  const Icon = item.icon;

  const inner = (
    <div
      className={cn(
        "group relative mx-2 flex h-10 items-center gap-3 rounded-[10px] px-3 transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-kblue/15 via-kblue/5 to-transparent"
          : "hover:bg-white/[0.04]",
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1.5 h-7 w-[2.5px] rounded-r-full bg-kcyan shadow-[0_0_10px_rgba(6,200,216,0.7)]" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-kcyan" : "text-white/45 group-hover:text-white/80",
        )}
      />
      {!collapsed && (
        <>
          <span
            className={cn(
              "flex-1 truncate text-[13px] transition-colors",
              isActive ? "font-medium text-white" : "text-white/60 group-hover:text-white/90",
            )}
          >
            {item.label}
          </span>
          {item.badge !== undefined && (
            <span className="rounded-full bg-kgold px-1.5 py-0.5 font-display text-[9px] font-semibold text-black">
              {item.badge}
            </span>
          )}
          {item.live && <LivePulse color="kcyan" />}
        </>
      )}
    </div>
  );

  if (item.path) {
    return (
      <Link to={item.path} title={collapsed ? item.label : undefined}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      onClick={item.onClick}
      className="block w-full text-left"
      title={collapsed ? item.label : undefined}
    >
      {inner}
    </button>
  );
}
