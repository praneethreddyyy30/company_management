import { create } from "zustand";
import { notificationAPI } from "@/lib/api";

export interface Notification {
  id: string;
  module: string;
  color: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  group: "today" | "earlier";
}

interface AppState {
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  notificationsOpen: boolean;
  commandPaletteOpen: boolean;
  notifications: Notification[];
  toggleSidebar: () => void;
  setAIPanel: (o: boolean) => void;
  setNotifications: (o: boolean) => void;
  setCommandPalette: (o: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const initialNotifications: Notification[] = [
  {
    id: "n1",
    module: "Talent",
    color: "kcyan",
    title: "New AI Top Pick",
    message: "Lakshmi Iyengar — 96% match for Senior PM",
    time: "5m ago",
    read: false,
    group: "today",
  },
  {
    id: "n2",
    module: "Leave",
    color: "kgold",
    title: "Leave request pending",
    message: "Rohan Verma requested 2 days casual leave",
    time: "22m ago",
    read: false,
    group: "today",
  },
  {
    id: "n3",
    module: "LMS",
    color: "kviolet",
    title: "Course completed",
    message: "Arjun Mehta finished React Advanced Patterns",
    time: "1h ago",
    read: false,
    group: "today",
  },
  {
    id: "n4",
    module: "HRM",
    color: "kblue",
    title: "Evaluation due",
    message: "Quarterly review for Ananya Singh in 3 days",
    time: "3h ago",
    read: true,
    group: "today",
  },
  {
    id: "n5",
    module: "Policy",
    color: "korange",
    title: "Policy updated",
    message: "Information Security v3.5 published",
    time: "Yesterday",
    read: false,
    group: "earlier",
  },
  {
    id: "n6",
    module: "ERP",
    color: "kviolet",
    title: "Vendor renewed",
    message: "AWS Enterprise contract renewed",
    time: "Yesterday",
    read: true,
    group: "earlier",
  },
  {
    id: "n7",
    module: "HRM",
    color: "kblue",
    title: "New hire onboarded",
    message: "Lakshmi Iyengar joined as Senior PM",
    time: "2 days ago",
    read: true,
    group: "earlier",
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  aiPanelOpen: false,
  notificationsOpen: false,
  commandPaletteOpen: false,
  notifications: initialNotifications,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setAIPanel: (o) => set({ aiPanelOpen: o }),
  setNotifications: (o) => set({ notificationsOpen: o }),
  setCommandPalette: (o) => set({ commandPaletteOpen: o }),
  fetchNotifications: async () => {
    try {
      const list = await notificationAPI.getAll();
      const today = new Date();
      const mapped = list.map((n: any) => {
        const date = new Date(n.createdAt);
        const isToday = date.toDateString() === today.toDateString();
        const group: "today" | "earlier" = isToday ? "today" : "earlier";

        let color = "kblue";
        if (n.module === "Talent") color = "kcyan";
        else if (n.module === "Leave") color = "kgold";
        else if (n.module === "LMS") color = "kviolet";
        else if (n.module === "HRM") color = "kblue";
        else if (n.module === "Policy") color = "korange";
        else if (n.module === "ERP") color = "kviolet";
        else if (n.module === "Work") color = "kcyan";

        let time = "Just now";
        const diffMs = today.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMins < 1) {
          time = "Just now";
        } else if (diffMins < 60) {
          time = `${diffMins}m ago`;
        } else if (diffHours < 24) {
          time = `${diffHours}h ago`;
        } else if (diffHours < 48) {
          time = "Yesterday";
        } else {
          const diffDays = Math.floor(diffHours / 24);
          time = `${diffDays} days ago`;
        }

        return {
          id: n.id || n._id,
          module: n.module,
          color,
          title: n.title,
          message: n.message,
          time,
          read: n.read,
          group,
        };
      });
      set({ notifications: mapped });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  },
  markRead: async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      set((s) => ({
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },
  clearAll: async () => {
    try {
      const state = get();
      const unread = state.notifications.filter((n) => !n.read);
      for (const n of unread) {
        await notificationAPI.markAsRead(n.id);
      }
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
      }));
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  },
}));
