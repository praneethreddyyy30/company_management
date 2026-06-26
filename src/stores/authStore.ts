import { create } from "zustand";
import { authAPI } from "@/lib/api";

import { initSocket, disconnectSocket } from "@/lib/socket";

export type Role = "Management" | "Lead" | "Admin" | "Employee" | "Intern";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  avatar: string;
  joinedAt: string;
  status?: string;
  employmentType?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  authStep: 1 | 2 | 3 | 4;
  selectedRole: Role | null;
  formDraft: Record<string, string>;
  setUser: (u: AuthUser) => void;
  setStep: (s: 1 | 2 | 3 | 4) => void;
  setRole: (r: Role) => void;
  setFormDraft: (d: Record<string, string>) => void;
  logout: () => Promise<void>;
  login: (credentials: any) => Promise<AuthUser>;
  register: (userData: any) => Promise<AuthUser>;
  checkSession: () => Promise<void>;
}

const getInitialUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getInitialAuthStatus = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("token");
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: getInitialAuthStatus(),
  authStep: 1,
  selectedRole: null,
  formDraft: {},
  
  setUser: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user, isAuthenticated: true });
    initSocket();
  },
  
  setStep: (authStep) => set({ authStep }),
  setRole: (selectedRole) => set({ selectedRole }),
  
  setFormDraft: (d) => set((s) => ({ 
    formDraft: { ...s.formDraft, ...d } 
  })),
  
  login: async (credentials) => {
    const res = await authAPI.login(credentials);
    const mappedUser: AuthUser = {
      id: res.user.id || res.user._id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role as Role,
      department: res.user.department || "Technology",
      avatar: res.user.avatar || "II",
      joinedAt: res.user.joinedAt || new Date().toISOString(),
    };
    set({ user: mappedUser, isAuthenticated: true, authStep: 4 });
    initSocket();
    return mappedUser;
  },

  register: async (userData) => {
    const res = await authAPI.register(userData);
    const mappedUser: AuthUser = {
      id: res.user.id || res.user._id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role as Role,
      department: res.user.department || "Technology",
      avatar: res.user.avatar || "II",
      joinedAt: res.user.joinedAt || new Date().toISOString(),
    };
    set({ user: mappedUser, isAuthenticated: true });
    initSocket();
    return mappedUser;
  },

  logout: async () => {
    disconnectSocket();
    await authAPI.logout();
    set({ user: null, isAuthenticated: false, authStep: 1, selectedRole: null, formDraft: {} });
  },

  checkSession: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    try {
      const user = await authAPI.getMe();
      const mappedUser: AuthUser = {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
        department: user.department || "Technology",
        avatar: user.avatar || "II",
        joinedAt: user.joinedAt || new Date().toISOString(),
      };
      set({ user: mappedUser, isAuthenticated: true });
      initSocket();
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      disconnectSocket();
      set({ user: null, isAuthenticated: false });
    }
  }
}));
