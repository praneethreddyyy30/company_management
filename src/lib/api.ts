import { toast } from "sonner";

const API_BASE_URL = "http://localhost:5000/api";

// Helper to get request headers with token
const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Generic request wrapper
async function apiRequest<T>(
  endpoint: string,
  method = "GET",
  body: any = null,
  isMultipart = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: getHeaders(isMultipart),
  };

  if (body) {
    options.body = isMultipart ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    // Handle unauthorized / token expired
    if (response.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth";
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data as T;
  } catch (error) {
    console.error(`API Error on ${method} ${endpoint}:`, error);
    toast.error((error as Error).message || "Connection to server failed.");
    throw error;
  }
}

// Map database Intern to frontend Employee format
export function mapInternToEmployee(intern: any): any {
  if (!intern) return null;
  const user = intern.userId || {};
  return {
    id: intern._id,
    name: user.name || "Unknown Intern",
    email: user.email || "",
    role: `${intern.track || "General"} Intern`,
    department: user.department || "Technology",
    status: intern.status || "active",
    employmentType: "intern",
    avatar: intern.avatar || user.avatar || "II",
    joinedAt: intern.startDate ? new Date(intern.startDate).toISOString().split("T")[0] : "",
    performance: intern.performance ?? 80,
    tasksCompleted: intern.tasksCompleted ?? 0,
    lmsProgress: intern.lmsProgress ?? 0,
    
    // Backend schema specific attributes
    dbId: intern._id,
    userId: user._id,
    batchId: intern.batchId?._id || intern.batchId,
    track: intern.track,
    mentor: intern.mentor,
    startDate: intern.startDate,
    endDate: intern.endDate,
    currentTaskId: intern.currentTaskId,
    taskCompletionPercentage: intern.taskCompletionPercentage ?? 0,
    attendancePercentage: intern.attendancePercentage ?? 100,
  };
}

// Map database Task to frontend Task format
export function mapDbTaskToFrontend(task: any): any {
  if (!task) return null;
  
  // Status mapping: frontend might use todo, in-progress, done.
  // We can maps: 
  // "Not Started" -> "todo"
  // "In Progress" -> "in-progress"
  // "Under Review" -> "in-progress" (or special state)
  // "Done" -> "done"
  let status: "todo" | "in-progress" | "done" = "todo";
  if (task.status === "In Progress" || task.status === "Under Review" || task.status === "in-progress") {
    status = "in-progress";
  } else if (task.status === "Done" || task.status === "done") {
    status = "done";
  }

  return {
    id: task._id,
    title: task.title,
    assignedTo: task.assignedTo?._id || task.assignedTo,
    assignedUser: task.assignedTo, // populated details if available
    priority: task.priority || "medium",
    status, // frontend simplified status
    dbStatus: task.status, // exact backend kanban status
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    module: task.module || "General",
    createdAt: task.createdAt ? new Date(task.createdAt).toISOString().split("T")[0] : "",
  };
}

// API Services
export const authAPI = {
  login: async (credentials: any) => {
    const res = await apiRequest<{ token: string; user: any }>("/auth/login", "POST", credentials);
    if (res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
    }
    return res;
  },
  register: async (userData: any) => {
    const res = await apiRequest<{ token: string; user: any }>("/auth/register", "POST", userData);
    if (res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
    }
    return res;
  },
  getMe: async () => {
    return apiRequest<any>("/auth/me", "GET");
  },
  logout: async () => {
    try {
      await apiRequest<any>("/auth/logout", "POST");
    } catch (e) {
      console.warn("Server-side logout request failed, clearing client state.", e);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

export const internAPI = {
  getAll: async (filters: any = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/interns${queryParams ? `?${queryParams}` : ""}`;
    const list = await apiRequest<any[]>(endpoint, "GET");
    return list.map(mapInternToEmployee);
  },
  getById: async (id: string) => {
    const intern = await apiRequest<any>(`/interns/${id}`, "GET");
    return mapInternToEmployee(intern);
  },
  create: async (data: any) => {
    const intern = await apiRequest<any>("/interns", "POST", data);
    return mapInternToEmployee(intern);
  },
  update: async (id: string, data: any) => {
    const intern = await apiRequest<any>(`/interns/${id}`, "PUT", data);
    return mapInternToEmployee(intern);
  },
  delete: async (id: string) => {
    return apiRequest<any>(`/interns/${id}`, "DELETE");
  },
  getOnboardingStatus: async () => {
    return apiRequest<any>("/interns/me/onboarding", "GET");
  },
  completeOnboardingStep: async (step: string) => {
    return apiRequest<any>("/interns/me/onboarding/complete-step", "POST", { step });
  }
};

export const batchAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/batches", "GET");
  },
  getById: async (id: string) => {
    return apiRequest<any>(`/batches/${id}`, "GET");
  },
  create: async (data: any) => {
    return apiRequest<any>("/batches", "POST", data);
  },
  update: async (id: string, data: any) => {
    return apiRequest<any>(`/batches/${id}`, "PUT", data);
  },
  delete: async (id: string) => {
    return apiRequest<any>(`/batches/${id}`, "DELETE");
  },
  getInterns: async (id: string) => {
    const list = await apiRequest<any[]>(`/batches/${id}/interns`, "GET");
    return list.map(mapInternToEmployee);
  }
};

export const taskAPI = {
  getAll: async () => {
    const list = await apiRequest<any[]>("/tasks", "GET");
    return list.map(mapDbTaskToFrontend);
  },
  getById: async (id: string) => {
    const task = await apiRequest<any>(`/tasks/${id}`, "GET");
    return mapDbTaskToFrontend(task);
  },
  create: async (data: any) => {
    const task = await apiRequest<any>("/tasks", "POST", data);
    return mapDbTaskToFrontend(task);
  },
  update: async (id: string, data: any) => {
    const task = await apiRequest<any>(`/tasks/${id}`, "PUT", data);
    return mapDbTaskToFrontend(task);
  },
  delete: async (id: string) => {
    return apiRequest<any>(`/tasks/${id}`, "DELETE");
  }
};

export const standupAPI = {
  submit: async (data: any) => {
    return apiRequest<any>("/standups", "POST", data);
  },
  getAll: async () => {
    return apiRequest<any[]>("/standups", "GET");
  },
  getByIntern: async (internId: string) => {
    return apiRequest<any[]>(`/standups/${internId}`, "GET");
  }
};

export const leaveAPI = {
  apply: async (data: any) => {
    return apiRequest<any>("/leaves", "POST", data);
  },
  getAll: async () => {
    return apiRequest<any[]>("/leaves", "GET");
  },
  updateStatus: async (id: string, status: "Approved" | "Rejected") => {
    return apiRequest<any>(`/leaves/${id}/status`, "PUT", { status });
  }
};

export const notificationAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/notifications", "GET");
  },
  getUnreadCount: async () => {
    return apiRequest<{ count: number }>("/notifications/unread-count", "GET");
  },
  markAsRead: async (id: string) => {
    return apiRequest<any>(`/notifications/${id}/read`, "PUT");
  }
};

export const attendanceAPI = {
  checkIn: async () => {
    return apiRequest<any>("/attendance/check-in", "POST");
  },
  checkOut: async () => {
    return apiRequest<any>("/attendance/check-out", "POST");
  },
  getHistory: async (internId?: string) => {
    const query = internId ? `?internId=${internId}` : "";
    return apiRequest<any[]>(`/attendance/history${query}`, "GET");
  },
  getHeatmap: async () => {
    return apiRequest<any[]>("/attendance/heatmap", "GET");
  }
};

export const aiPerformanceAPI = {
  getByIntern: async (internId: string) => {
    return apiRequest<any>(`/ai-performance/${internId}`, "GET");
  },
  regenerate: async (internId: string) => {
    return apiRequest<any>(`/ai-performance/${internId}/regenerate`, "POST");
  }
};

export const certificateAPI = {
  checkEligibility: async () => {
    return apiRequest<any>("/certificates/eligibility", "GET");
  },
  request: async () => {
    return apiRequest<any>("/certificates/request", "POST");
  },
  approve: async (id: string, grade: string) => {
    return apiRequest<any>(`/certificates/${id}/approve`, "PUT", { grade });
  },
  reject: async (id: string, reason: string) => {
    return apiRequest<any>(`/certificates/${id}/reject`, "PUT", { reason });
  },
  getAll: async () => {
    return apiRequest<any[]>("/certificates", "GET");
  },
  getDownloadUrl: (id: string) => {
    const token = localStorage.getItem("token") || "";
    return `${API_BASE_URL}/certificates/download/${id}?token=${encodeURIComponent(token)}`;
  }
};

export const offerLetterAPI = {
  generate: async (data: { internId: string; salaryDetails: string; startDate: string }) => {
    return apiRequest<any>("/offer-letters", "POST", data);
  },
  getAll: async () => {
    return apiRequest<any[]>("/offer-letters", "GET");
  },
  getDownloadUrl: (id: string) => {
    const token = localStorage.getItem("token") || "";
    return `${API_BASE_URL}/offer-letters/download/${id}?token=${encodeURIComponent(token)}`;
  }
};

export const activityAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/activity", "GET");
  }
};

export const analyticsAPI = {
  getAttendanceChart: async (filters: { batchId?: string; track?: string; startDate?: string; endDate?: string } = {}) => {
    const cleanFilters: any = {};
    Object.keys(filters).forEach(k => {
      if ((filters as any)[k]) cleanFilters[k] = (filters as any)[k];
    });
    const query = new URLSearchParams(cleanFilters).toString();
    return apiRequest<any>(`/analytics/attendance-chart${query ? `?${query}` : ""}`, "GET");
  },
  getTaskChart: async (filters: { batchId?: string; track?: string; startDate?: string; endDate?: string } = {}) => {
    const cleanFilters: any = {};
    Object.keys(filters).forEach(k => {
      if ((filters as any)[k]) cleanFilters[k] = (filters as any)[k];
    });
    const query = new URLSearchParams(cleanFilters).toString();
    return apiRequest<any>(`/analytics/task-chart${query ? `?${query}` : ""}`, "GET");
  },
  getStandupTrend: async (filters: { batchId?: string; track?: string; startDate?: string; endDate?: string } = {}) => {
    const cleanFilters: any = {};
    Object.keys(filters).forEach(k => {
      if ((filters as any)[k]) cleanFilters[k] = (filters as any)[k];
    });
    const query = new URLSearchParams(cleanFilters).toString();
    return apiRequest<any>(`/analytics/standup-trend${query ? `?${query}` : ""}`, "GET");
  },
  getLeaderboard: async () => {
    return apiRequest<any[]>("/analytics/leaderboard", "GET");
  },
  getExportUrl: (type: "attendance" | "tasks" | "standups" | "leaderboard", filters: { batchId?: string; track?: string; startDate?: string; endDate?: string } = {}) => {
    const cleanFilters: any = { type };
    Object.keys(filters).forEach(k => {
      if ((filters as any)[k]) cleanFilters[k] = (filters as any)[k];
    });
    const query = new URLSearchParams(cleanFilters).toString();
    const token = localStorage.getItem("token") || "";
    return `${API_BASE_URL}/analytics/export?${query}&token=${encodeURIComponent(token)}`;
  }
};

export const dashboardAPI = {
  getStats: async () => {
    return apiRequest<any>("/dashboard", "GET");
  }
};

export const searchAPI = {
  globalSearch: async (q: string) => {
    return apiRequest<any>(`/search?q=${encodeURIComponent(q)}`, "GET");
  }
};

export const evaluationAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/evaluations", "GET");
  },
  create: async (data: any) => {
    return apiRequest<any>("/evaluations", "POST", data);
  }
};

export const policyAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/policies", "GET");
  },
  create: async (data: any) => {
    return apiRequest<any>("/policies", "POST", data);
  }
};

export const candidateAPI = {
  getAll: async () => {
    return apiRequest<any[]>("/candidates", "GET");
  },
  create: async (data: any) => {
    return apiRequest<any>("/candidates", "POST", data);
  },
  updateStage: async (id: string, stage: string) => {
    return apiRequest<any>(`/candidates/${id}/stage`, "PUT", { stage });
  }
};

