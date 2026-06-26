import { createFileRoute, Link } from "@tanstack/react-router";
import React, { Component, useState, useEffect, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  UserCheck,
  Building,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  UserPlus,
  Calendar,
  Star,
  ClipboardList,
  CheckCircle2,
  X,
  Briefcase,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Activity,
  Filter,
  BarChart3,
  List,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { StatCard } from "@/components/common/StatCard";
import { Avatar } from "@/components/common/Avatar";
import { GlowBadge } from "@/components/common/GlowBadge";
import { useHRMStore } from "@/stores/hrmStore";
import { toast } from "sonner";
import { aiPerformanceAPI, standupAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type {
  Employee,
  Task,
  Leave,
  Evaluation,
  EmployeeStatus,
  EmploymentType,
  Priority,
  TaskStatus,
  LeaveType,
} from "@/data/mockData";

// Error Boundary wrapper to ensure stability
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-red-500/20 bg-red-500/10 rounded-xl text-red-200">
          <h2 className="text-lg font-bold">HRM Core component crashed!</h2>
          <p className="text-sm mt-2 font-mono">{this.state.error?.toString()}</p>
          <pre className="text-xs mt-4 p-4 bg-black/40 rounded overflow-auto max-h-[300px]">
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Route = createFileRoute("/dashboard/hrm")({
  component: () => (
    <ErrorBoundary>
      <HRMCore />
    </ErrorBoundary>
  ),
});

type HRMTab = "directory" | "analytics" | "logs" | "standups";

function HRMCore() {
  const employees = useHRMStore((s) => s.employees) || [];
  const tasks = useHRMStore((s) => s.tasks) || [];
  const leaves = useHRMStore((s) => s.leaves) || [];
  const evaluations = useHRMStore((s) => s.evaluations) || [];

  const addEmployee = useHRMStore((s) => s.addEmployee);
  const updateEmployee = useHRMStore((s) => s.updateEmployee);
  const deleteEmployee = useHRMStore((s) => s.deleteEmployee);
  const addTask = useHRMStore((s) => s.addTask);
  const updateTaskStatus = useHRMStore((s) => s.updateTaskStatus);
  const deleteTask = useHRMStore((s) => s.deleteTask);
  const addLeave = useHRMStore((s) => s.addLeave);
  const addEvaluation = useHRMStore((s) => s.addEvaluation);

  // Search & Filter State
  const [activeTab, setActiveTab] = useState<HRMTab>("directory");
  const [q, setQ] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [perfMin, setPerfMin] = useState(0);
  const [sortBy, setSortBy] = useState<"name" | "performance" | "joined">("name");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Modals state
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isEditingEmp, setIsEditingEmp] = useState(false);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [showAddEvalModal, setShowAddEvalModal] = useState(false);

  // AI Performance State
  const [aiPerformance, setAiPerformance] = useState<any | null>(null);
  const [loadingAiPerformance, setLoadingAiPerformance] = useState(false);

  // Standup History State
  const [standupHistory, setStandupHistory] = useState<any[]>([]);
  const [loadingStandups, setLoadingStandups] = useState(false);

  // All Standups Feed State (For Feed Tab)
  const [allStandups, setAllStandups] = useState<any[]>([]);
  const [loadingAllStandups, setLoadingAllStandups] = useState(false);

  // Add Employee Form State
  const [newEmp, setNewEmp] = useState({
    name: "",
    email: "",
    role: "",
    department: "Technology",
    status: "active" as EmployeeStatus,
    employmentType: "full-time" as EmploymentType,
    performance: 85,
    lmsProgress: 50,
  });

  // Add Task Form State - using static dates to prevent timezone hydration mismatch
  const [newTask, setNewTask] = useState({
    title: "",
    assignedTo: "",
    priority: "medium" as Priority,
    dueDate: "2025-05-30",
    module: "Engineering",
  });

  // Add Leave Form State - using static dates to prevent timezone hydration mismatch
  const [newLeave, setNewLeave] = useState({
    employeeId: "",
    type: "casual" as LeaveType,
    fromDate: "2025-05-20",
    toDate: "2025-05-22",
    reason: "",
  });

  // Add Evaluation Form State
  const [newEval, setNewEval] = useState({
    employeeId: "",
    evaluator: "System Admin",
    rating: 5,
    comment: "",
    category: "Quarterly",
  });

  // Edit Employee Form State
  const [editEmpForm, setEditEmpForm] = useState<Partial<Employee>>({});

  // Computed data defensively
  const depts = useMemo(
    () => ["All", ...Array.from(new Set(employees.map((e) => e?.department).filter(Boolean)))],
    [employees],
  );
  const statuses = ["All", "active", "leave", "off-active"];
  const employmentTypes = ["All", "full-time", "intern", "part-time", "contract"];

  const filteredEmployees = useMemo(() => {
    const result = employees.filter((e) => {
      if (!e) return false;
      const nameMatch = (e.name || "").toLowerCase().includes(q.toLowerCase());
      const roleMatch = (e.role || "").toLowerCase().includes(q.toLowerCase());
      const matchQ = nameMatch || roleMatch;
      const matchDept = deptFilter === "All" || e.department === deptFilter;
      const matchStatus = statusFilter === "All" || e.status === statusFilter;
      const matchType = typeFilter === "All" || e.employmentType === typeFilter;
      const matchPerf = (e.performance || 0) >= perfMin;
      return matchQ && matchDept && matchStatus && matchType && matchPerf;
    });

    if (sortBy === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "performance") {
      result.sort((a, b) => (b.performance || 0) - (a.performance || 0));
    } else if (sortBy === "joined") {
      result.sort((a, b) => (b.joinedAt || "").localeCompare(a.joinedAt || ""));
    }
    return result;
  }, [employees, q, deptFilter, statusFilter, typeFilter, perfMin, sortBy]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e && e.status === "active").length;
    const avgPerf =
      total > 0
        ? Math.round(employees.reduce((acc, curr) => acc + (curr?.performance || 0), 0) / total)
        : 0;
    return { total, active, avgPerf };
  }, [employees]);

  // HR Activity logs built defensively
  const hrLogs = useMemo(() => {
    const logs: {
      id: string;
      type: string;
      title: string;
      desc: string;
      date: string;
      tagColor: "blue" | "cyan" | "violet" | "gold" | "orange";
    }[] = [];

    evaluations.forEach((ev) => {
      if (!ev) return;
      const emp = employees.find((e) => e.id === ev.employeeId);
      logs.push({
        id: `ev-${ev.id}`,
        type: "Evaluation",
        title: `Performance review for ${emp?.name || "Employee"}`,
        desc: `Rated ${ev.rating || 0}/5 by ${ev.evaluator || "Admin"} (${ev.category || "General"}) - "${ev.comment || ""}"`,
        date: ev.date || "2025-05-15",
        tagColor: "gold",
      });
    });

    leaves.forEach((l) => {
      if (!l) return;
      logs.push({
        id: `lv-${l.id}`,
        type: "Leave",
        title: `Leave ${l.status || "approved"} for ${l.employeeName || "Employee"}`,
        desc: `${(l.type || "").toUpperCase()} leave request: ${l.fromDate || ""} to ${l.toDate || ""} (${l.days || 0} days) - "${l.reason || ""}"`,
        date: l.appliedAt || "2025-05-15",
        tagColor: l.status === "Approved" ? "cyan" : l.status === "Rejected" ? "orange" : "violet",
      });
    });

    tasks
      .filter((t) => t && (t.module === "HR" || t.status === "done"))
      .forEach((t) => {
        if (!t) return;
        const emp = employees.find((e) => e.id === t.assignedTo);
        logs.push({
          id: `tk-${t.id}`,
          type: "Work",
          title: `Task status update: ${t.title || ""}`,
          desc: `Assigned to ${emp?.name || "Employee"}. Status is now: ${(t.status || "").toUpperCase()}`,
          date: t.dueDate || "2025-05-15",
          tagColor: "blue",
        });
      });

    return logs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [evaluations, leaves, tasks, employees]);

  // Handlers
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.email || !newEmp.role) {
      toast.error("Please fill in all required fields");
      return;
    }
    const initials = newEmp.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const newEmployeeRecord: Employee = {
      id: `e${Date.now()}`,
      name: newEmp.name,
      email: newEmp.email,
      role: newEmp.role,
      department: newEmp.department,
      status: newEmp.status,
      employmentType: newEmp.employmentType,
      avatar: initials || "EE",
      joinedAt: new Date().toISOString().slice(0, 10),
      performance: Number(newEmp.performance),
      lmsProgress: Number(newEmp.lmsProgress),
      tasksCompleted: 0,
    };
    addEmployee(newEmployeeRecord);
    toast.success("Employee successfully added!");
    setShowAddEmpModal(false);
    setNewEmp({
      name: "",
      email: "",
      role: "",
      department: "Technology",
      status: "active",
      employmentType: "full-time",
      performance: 85,
      lmsProgress: 50,
    });
  };

  useEffect(() => {
    if (selectedEmp && selectedEmp.employmentType === "intern" && selectedEmp.userId) {
      setLoadingAiPerformance(true);
      setAiPerformance(null);
      aiPerformanceAPI
        .getByIntern(selectedEmp.userId)
        .then((res) => {
          setAiPerformance(res);
        })
        .catch((err) => {
          console.warn("Failed to fetch AI performance summary:", err);
          setAiPerformance(null);
        })
        .finally(() => {
          setLoadingAiPerformance(false);
        });

      setLoadingStandups(true);
      setStandupHistory([]);
      standupAPI
        .getByIntern(selectedEmp.userId)
        .then((res) => {
          setStandupHistory(res || []);
        })
        .catch((err) => {
          console.warn("Failed to fetch standup history:", err);
          setStandupHistory([]);
        })
        .finally(() => {
          setLoadingStandups(false);
        });
    } else {
      setAiPerformance(null);
      setStandupHistory([]);
    }
  }, [selectedEmp]);

  useEffect(() => {
    if (activeTab === "standups") {
      setLoadingAllStandups(true);
      standupAPI
        .getAll()
        .then((res) => {
          setAllStandups(res || []);
        })
        .catch((err) => {
          console.error("Failed to load all standups:", err);
          setAllStandups([]);
        })
        .finally(() => {
          setLoadingAllStandups(false);
        });
    }
  }, [activeTab]);

  const handleRegenerateAiPerformance = async () => {
    if (!selectedEmp || !selectedEmp.userId) return;
    const loadingToast = toast.loading("Analyzing standups via AI...");
    try {
      const res = await aiPerformanceAPI.regenerate(selectedEmp.userId);
      setAiPerformance(res);
      await useHRMStore.getState().fetchData();
      toast.success("AI Standup performance summary updated!", { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze standups.", { id: loadingToast });
    }
  };

  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    updateEmployee(selectedEmp.id, editEmpForm);
    toast.success("Employee profile updated!");
    setSelectedEmp((prev) => (prev ? { ...prev, ...editEmpForm } : null));
    setIsEditingEmp(false);
  };

  const handleDeleteEmployee = (id: string) => {
    if (
      confirm(
        "Are you sure you want to terminate this employee's contract? This action is irreversible.",
      )
    ) {
      deleteEmployee(id);
      toast.error("Employee contract terminated.");
      setSelectedEmp(null);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedTo) {
      toast.error("Please fill in all fields");
      return;
    }
    const taskRecord: Task = {
      id: `t${Date.now()}`,
      title: newTask.title,
      assignedTo: newTask.assignedTo,
      priority: newTask.priority,
      status: "todo",
      dueDate: newTask.dueDate,
      module: newTask.module,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    addTask(taskRecord);
    toast.success("Task assigned successfully!");
    setShowAddTaskModal(false);
    setNewTask({
      title: "",
      assignedTo: "",
      priority: "medium",
      dueDate: "2025-05-30",
      module: "Engineering",
    });
  };

  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.employeeId || !newLeave.reason) {
      toast.error("Please fill in all fields");
      return;
    }
    const emp = employees.find((x) => x.id === newLeave.employeeId);
    if (!emp) return;

    const fromDateObj = new Date(newLeave.fromDate);
    const toDateObj = new Date(newLeave.toDate);
    const days = Math.max(
      1,
      Math.round((toDateObj.getTime() - fromDateObj.getTime()) / 86400000) + 1,
    );

    const leaveRecord: Leave = {
      id: `l${Date.now()}`,
      employeeId: newLeave.employeeId,
      employeeName: emp.name,
      type: newLeave.type,
      fromDate: newLeave.fromDate,
      toDate: newLeave.toDate,
      days,
      reason: newLeave.reason,
      status: "Approved",
      appliedAt: new Date().toISOString().slice(0, 10),
      approvedBy: "Admin",
    };
    addLeave(leaveRecord);
    updateEmployee(newLeave.employeeId, { status: "leave" });
    toast.success(`Leave logged & approved for ${emp.name}`);
    setShowAddLeaveModal(false);
    setNewLeave({
      employeeId: "",
      type: "casual",
      fromDate: "2025-05-20",
      toDate: "2025-05-22",
      reason: "",
    });
  };

  const handleAddEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEval.employeeId || !newEval.comment) {
      toast.error("Please enter a review comment");
      return;
    }
    const evalRecord: Evaluation = {
      id: `ev${Date.now()}`,
      employeeId: newEval.employeeId,
      evaluator: newEval.evaluator,
      date: new Date().toISOString().slice(0, 10),
      rating: Number(newEval.rating),
      comment: newEval.comment,
      category: newEval.category,
    };
    addEvaluation(evalRecord);

    const emp = employees.find((x) => x.id === newEval.employeeId);
    if (emp) {
      const currentRating = Number(newEval.rating);
      const mappedPerformance = currentRating * 20;
      const updatedPerf = Math.round(((emp.performance || 80) + mappedPerformance) / 2);
      updateEmployee(emp.id, { performance: updatedPerf });
    }

    toast.success("Performance review recorded!");
    setShowAddEvalModal(false);
    setNewEval({
      employeeId: "",
      evaluator: "System Admin",
      rating: 5,
      comment: "",
      category: "Quarterly",
    });
  };

  // Specific employee task analytics
  const getEmployeeTasks = (empId: string) => {
    const list = tasks.filter((t) => t && t.assignedTo === empId);
    const completed = list.filter((t) => t.status === "done");
    const left = list.filter((t) => t.status !== "done");
    const total = list.length;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    return { list, completed, left, total, completionRate };
  };

  const getEmployeeEvaluations = (empId: string) => {
    return evaluations.filter((ev) => ev && ev.employeeId === empId);
  };

  const getEmployeeLeaves = (empId: string) => {
    return leaves.filter((l) => l && l.employeeId === empId);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
            HRM Core
          </h1>
          <p className="mt-1 text-[13px] text-white/55">
            Centralised workforce intelligence and operations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddEmpModal(true)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-kcyan to-kblue px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(6,200,216,0.2)] hover:opacity-90 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add Employee
          </button>
          <button
            onClick={() => {
              setNewTask((prev) => ({ ...prev, assignedTo: "" }));
              setShowAddTaskModal(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3.5 text-[12px] font-medium text-white/80 hover:bg-white/8 hover:text-white cursor-pointer"
          >
            <ClipboardList className="h-3.5 w-3.5" /> Assign Task
          </button>
          <button
            onClick={() => {
              setNewLeave((prev) => ({ ...prev, employeeId: "" }));
              setShowAddLeaveModal(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3.5 text-[12px] font-medium text-white/80 hover:bg-white/8 hover:text-white cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5" /> Log Leave
          </button>
          <button
            onClick={() => {
              setNewEval((prev) => ({ ...prev, employeeId: "" }));
              setShowAddEvalModal(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3.5 text-[12px] font-medium text-white/80 hover:bg-white/8 hover:text-white cursor-pointer"
          >
            <Star className="h-3.5 w-3.5" /> Review
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Workforce" value={stats.total} icon={Users} color="cyan" index={0} />
        <StatCard
          label="Active Status"
          value={stats.active}
          icon={UserCheck}
          color="violet"
          index={1}
        />
        <StatCard
          label="Departments"
          value={depts.length - 1}
          icon={Building}
          color="gold"
          index={2}
        />
        <StatCard
          label="Avg Performance"
          value={stats.avgPerf}
          suffix="%"
          icon={TrendingUp}
          color="blue"
          index={3}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/5 pb-px">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("directory")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium transition-all cursor-pointer ${
              activeTab === "directory"
                ? "border-kcyan text-kcyan"
                : "border-transparent text-white/55 hover:text-white/80"
            }`}
          >
            <Users className="h-4 w-4" /> Workforce Directory
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "border-kcyan text-kcyan"
                : "border-transparent text-white/55 hover:text-white/80"
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Department Insights
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium transition-all cursor-pointer ${
              activeTab === "logs"
                ? "border-kcyan text-kcyan"
                : "border-transparent text-white/55 hover:text-white/80"
            }`}
          >
            <List className="h-4 w-4" /> HR Logs & Audit
          </button>
          <button
            onClick={() => setActiveTab("standups")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium transition-all cursor-pointer ${
              activeTab === "standups"
                ? "border-kcyan text-kcyan"
                : "border-transparent text-white/55 hover:text-white/80"
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Daily Standups Feed
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1">
        {/* Tab 1: Directory */}
        {activeTab === "directory" && (
          <div className="flex flex-col gap-4">
            {/* Search, Filter Toggles */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, role, email..."
                  className="h-10 w-full rounded-full border border-white/8 bg-white/4 pl-10 pr-4 text-[13px] text-white focus:border-kcyan focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className={`flex h-10 items-center gap-1.5 rounded-full border px-4 text-[12px] font-medium transition-all cursor-pointer ${
                    showFiltersPanel ||
                    deptFilter !== "All" ||
                    statusFilter !== "All" ||
                    perfMin > 0
                      ? "border-kcyan/40 bg-kcyan/10 text-kcyan"
                      : "border-white/8 bg-white/4 text-white/60 hover:text-white"
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" /> Filters
                </button>
                <div className="flex items-center rounded-full border border-white/8 bg-white/4 px-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "name" | "performance" | "joined")}
                    className="bg-transparent py-2 pl-2 pr-6 text-[12px] text-white/70 outline-none cursor-pointer"
                  >
                    <option value="name" className="bg-carbon text-white">
                      Sort: A-Z
                    </option>
                    <option value="performance" className="bg-carbon text-white">
                      Sort: Performance
                    </option>
                    <option value="joined" className="bg-carbon text-white">
                      Sort: Joined Date
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Department tags filter */}
            <div className="flex flex-wrap gap-1.5 pb-2">
              {depts.map((d) => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className={`rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer ${
                    deptFilter === d
                      ? "border-kcyan bg-kcyan/15 text-kcyan"
                      : "border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {d === "All" ? "All Depts" : d}
                </button>
              ))}
            </div>

            {/* Collapsible Filter Panel */}
            <AnimatePresence>
              {showFiltersPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <GlassCard className="p-4 grid gap-5 sm:grid-cols-3 border-white/5">
                    <div>
                      <label className="text-[11px] font-mono uppercase tracking-wider text-white/40">
                        Status
                      </label>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {statuses.map((st) => (
                          <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`rounded-lg border px-2.5 py-1.5 text-[10.5px] font-medium capitalize transition-all cursor-pointer ${
                              statusFilter === st
                                ? "border-kcyan bg-kcyan/10 text-kcyan"
                                : "border-white/5 bg-white/[0.02] text-white/60 hover:text-white"
                            }`}
                          >
                            {st === "All"
                              ? "All"
                              : st === "leave"
                                ? "On Leave"
                                : st === "off-active"
                                  ? "Off Active"
                                  : st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono uppercase tracking-wider text-white/40">
                        Employment Type
                      </label>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {employmentTypes.map((et) => (
                          <button
                            key={et}
                            onClick={() => setTypeFilter(et)}
                            className={`rounded-lg border px-2.5 py-1.5 text-[10.5px] font-medium capitalize transition-all cursor-pointer ${
                              typeFilter === et
                                ? "border-kcyan bg-kcyan/10 text-kcyan"
                                : "border-white/5 bg-white/[0.02] text-white/60 hover:text-white"
                            }`}
                          >
                            {et === "All"
                              ? "All"
                              : et === "full-time"
                                ? "Full-Time"
                                : et === "part-time"
                                  ? "Part-Time"
                                  : et}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-white/40">
                          Minimum Performance Rating
                        </label>
                        <span className="text-[12px] font-semibold text-kcyan">{perfMin}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={perfMin}
                        onChange={(e) => setPerfMin(Number(e.target.value))}
                        className="mt-4 h-1.5 w-full cursor-pointer rounded-full bg-white/10 accent-kcyan"
                      />
                      <div className="mt-1.5 flex justify-between text-[9px] font-mono text-white/25">
                        <span>0%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Employee grid list */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredEmployees.map((e) => {
                const { completionRate, total } = getEmployeeTasks(e.id);
                return (
                  <GlassCard
                    key={e.id}
                    className="p-4 flex flex-col justify-between hover border-white/6 cursor-pointer"
                    onClick={() => {
                      setSelectedEmp(e);
                      setEditEmpForm(e);
                    }}
                    glowColor="cyan"
                  >
                    <div>
                      {/* Card Header Profile */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <Avatar initials={e.avatar} size={42} />
                          <div>
                            <h3 className="font-display text-[14px] font-bold text-white/90">
                              {e.name}
                            </h3>
                            <p className="text-[11px] text-white/50">{e.role}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <GlowBadge
                            label={
                              e.status === "active"
                                ? "active"
                                : e.status === "leave"
                                  ? "on leave"
                                  : "off active"
                            }
                            color={
                              e.status === "active"
                                ? "cyan"
                                : e.status === "leave"
                                  ? "orange"
                                  : "violet"
                            }
                          />
                          <span className="text-[9px] font-mono text-white/45 uppercase tracking-wide">
                            {e.employmentType}
                          </span>
                        </div>
                      </div>

                      {/* Department details */}
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-white/[0.02] p-2 text-[11px] border border-white/4">
                        <div>
                          <span className="block text-white/35 font-mono uppercase text-[9px]">
                            Department
                          </span>
                          <span className="font-medium text-white/70">{e.department}</span>
                        </div>
                        <div>
                          <span className="block text-white/35 font-mono uppercase text-[9px]">
                            Joined Date
                          </span>
                          <span className="font-medium text-white/70">{e.joinedAt}</span>
                        </div>
                      </div>

                      {/* Work workload details */}
                      <div className="mt-4 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-white/45 flex items-center gap-1">
                            <ClipboardList className="h-3.5 w-3.5" /> Tasks Done
                          </span>
                          <span className="font-semibold text-kcyan">
                            {completionRate}% ({total} assigned)
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-kblue to-kcyan"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer performance rating */}
                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-white/35 uppercase">
                          Performance
                        </span>
                        <div className="h-2 w-16 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-kblue to-kcyan"
                            style={{ width: `${e.performance}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11.5px] font-semibold text-kcyan">
                          {e.performance}%
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/30" />
                    </div>
                  </GlassCard>
                );
              })}

              {filteredEmployees.length === 0 && (
                <div className="col-span-full rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center text-white/40">
                  No employees matched the query or filters 📭
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Department Insights */}
        {activeTab === "analytics" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {depts
              .filter((d) => d !== "All")
              .map((deptName) => {
                const deptEmps = employees.filter((e) => e && e.department === deptName);
                const headCount = deptEmps.length;
                const avgPerformance =
                  headCount > 0
                    ? Math.round(
                        deptEmps.reduce((s, x) => s + (x?.performance || 0), 0) / headCount,
                      )
                    : 0;
                const avgLMS =
                  headCount > 0
                    ? Math.round(
                        deptEmps.reduce((s, x) => s + (x?.lmsProgress || 0), 0) / headCount,
                      )
                    : 0;

                // Get tasks stats for the dept
                const deptEmpIds = deptEmps.map((x) => x.id);
                const deptTasks = tasks.filter((t) => t && deptEmpIds.includes(t.assignedTo));
                const openTasksCount = deptTasks.filter((t) => t.status !== "done").length;

                const getDeptUrl = (name: string) => {
                  switch (name) {
                    case "Technology": return "/dashboard/work";
                    case "Human Resources": return "/dashboard/leave";
                    case "Operations":
                    case "Finance": return "/dashboard/erp";
                    case "Marketing":
                    case "Sales": return "/dashboard/crm";
                    case "Design": return "/dashboard/talent";
                    case "Executive": return "/dashboard/org";
                    default: return "/dashboard/work";
                  }
                };

                return (
                  <GlassCard key={deptName} className="p-5 border-white/5" glowColor="cyan" hover>
                    <div className="flex items-start justify-between">
                      <Link 
                        to={getDeptUrl(deptName)} 
                        className="hover:text-kcyan hover:underline transition-all cursor-pointer group flex-1"
                      >
                        <h3 className="font-display text-[15px] font-bold text-white/95 group-hover:text-kcyan flex items-center gap-1.5">
                          {deptName}
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-[11.5px] text-white/45 mt-0.5">
                          {headCount} Active Headcount
                        </p>
                      </Link>
                      <div className="rounded-xl bg-kcyan/10 p-2 text-kcyan">
                        <Building className="h-4.5 w-4.5" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {/* Performance bar */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-white/60">
                          <span>Avg Performance</span>
                          <span className="text-kcyan font-mono">{avgPerformance}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-kblue to-kcyan"
                            style={{ width: `${avgPerformance}%` }}
                          />
                        </div>
                      </div>

                      {/* LMS Progress */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-white/60">
                          <span>Avg LMS Course Completion</span>
                          <span className="text-violet-400 font-mono">{avgLMS}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-kblue to-kviolet"
                            style={{ width: `${avgLMS}%` }}
                          />
                        </div>
                      </div>

                      {/* Task Stats badge */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[11px]">
                        <span className="text-white/40 flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" /> Active Tasks Pending
                        </span>
                        <GlowBadge
                          label={`${openTasksCount} left`}
                          color={openTasksCount > 2 ? "orange" : "blue"}
                        />
                      </div>

                      {/* Navigation links */}
                      <div className="flex justify-end gap-2 border-t border-white/5 pt-2.5 mt-2.5">
                        {deptName === "Technology" && (
                          <>
                            <Link
                              to="/dashboard/work"
                              className="text-[10px] text-kcyan hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              Work Hub <ArrowUpRight className="h-2.5 w-2.5" />
                            </Link>
                            <span className="text-white/20 text-[10px]">|</span>
                            <Link
                              to="/dashboard/monitor"
                              className="text-[10px] text-kcyan hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              API Monitor <ArrowUpRight className="h-2.5 w-2.5" />
                            </Link>
                          </>
                        )}
                        {deptName === "Human Resources" && (
                          <>
                            <Link
                              to="/dashboard/leave"
                              className="text-[10px] text-kcyan hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              Leave Mgmt <ArrowUpRight className="h-2.5 w-2.5" />
                            </Link>
                          </>
                        )}
                        {(deptName === "Operations" || deptName === "Finance") && (
                          <Link
                            to="/dashboard/erp"
                            className="text-[10px] text-kcyan hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            ERP Suite <ArrowUpRight className="h-2.5 w-2.5" />
                          </Link>
                        )}
                        {(deptName === "Marketing" || deptName === "Sales") && (
                          <Link
                            to="/dashboard/crm"
                            className="text-[10px] text-kcyan hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            CRM Pipeline <ArrowUpRight className="h-2.5 w-2.5" />
                          </Link>
                        )}
                        {deptName === "Design" && (
                          <Link
                            to="/dashboard/talent"
                            className="text-[10px] text-kcyan hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            Talent IQ <ArrowUpRight className="h-2.5 w-2.5" />
                          </Link>
                        )}
                        {deptName === "Executive" && (
                          <Link
                            to="/dashboard/org"
                            className="text-[10px] text-kcyan hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            Org Structure <ArrowUpRight className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
          </div>
        )}

        {/* Tab 3: HR Logs & Audit Feed */}
        {activeTab === "logs" && (
          <GlassCard className="p-5 border-white/5 max-w-4xl mx-auto">
            <h3 className="font-display text-[15px] font-bold text-white/90">HR Logs & Timeline</h3>
            <p className="text-[11.5px] text-white/45 mt-0.5 mb-5">
              System records of approvals, reviews, and allocations
            </p>

            <div className="relative border-l border-white/10 pl-5 space-y-6">
              {hrLogs.map((log) => (
                <div key={log.id} className="relative">
                  {/* Timeline point */}
                  <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border border-carbon bg-kcyan shadow-[0_0_10px_rgba(6,200,216,0.6)]" />

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <GlowBadge label={log.type} color={log.tagColor} className="scale-90" />
                      <span className="text-[13px] font-semibold text-white/85">{log.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/35">{log.date}</span>
                  </div>
                  <p className="text-[11.5px] text-white/55 mt-1">{log.desc}</p>
                </div>
              ))}

              {hrLogs.length === 0 && (
                <div className="py-6 text-center text-[12px] text-white/35">
                  No logs recorded yet.
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Tab 4: Daily Standups Feed */}
        {activeTab === "standups" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="font-display text-[16px] font-bold text-white/90">Original Daily Standups</h3>
                <p className="text-[12px] text-white/50">Direct feed of daily standup logs submitted by interns</p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter by intern name or keywords..."
                  className="h-10 w-full rounded-full border border-white/8 bg-white/4 pl-10 pr-4 text-[13px] text-white focus:border-kcyan focus:outline-none"
                />
              </div>
            </div>

            {loadingAllStandups ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-kcyan border-t-transparent" />
                <span className="text-[12.5px] text-white/45">Loading original standups feed...</span>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {allStandups
                  .filter((s) => {
                    if (!s) return false;
                    const internName = (s.internId?.name || "").toLowerCase();
                    const textMatch =
                      (s.yesterdayWork || "").toLowerCase().includes(q.toLowerCase()) ||
                      (s.todayPlan || "").toLowerCase().includes(q.toLowerCase()) ||
                      (s.blockers || "").toLowerCase().includes(q.toLowerCase());
                    return internName.includes(q.toLowerCase()) || textMatch;
                  })
                  .map((s) => {
                    const moodEmoji =
                      s.mood === "productive"
                        ? "🚀"
                        : s.mood === "happy"
                          ? "😊"
                          : s.mood === "neutral"
                            ? "😐"
                            : s.mood === "tired"
                              ? "😴"
                              : s.mood === "stressed"
                                ? "🤯"
                                : "📝";
                    return (
                      <GlassCard key={s._id || s.id} className="p-5 border-white/5 hover:border-kcyan/20 flex flex-col gap-3 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Avatar initials={s.internId?.avatar || "??"} size={40} />
                            <div>
                              <h4 className="font-display text-[13.5px] font-semibold text-white/90">
                                {s.internId?.name || "Unknown Intern"}
                              </h4>
                              <p className="text-[10px] text-white/40">
                                {s.internId?.email || ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10.5px] text-white/40 font-mono">
                              {s.date ? new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ""}
                            </div>
                            <div className="mt-1 flex items-center justify-end gap-1.5">
                              <span title={`Mood: ${s.mood || 'neutral'}`} className="text-[13px]">{moodEmoji}</span>
                              <GlowBadge label={`${s.completionPercentage || 0}% Done`} color="cyan" className="scale-75 origin-right" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mt-1 text-[12px] border-t border-white/5 pt-3">
                          <div>
                            <span className="text-[9.5px] uppercase font-mono text-white/30 block mb-0.5">
                              Yesterday's Work (Original Submission)
                            </span>
                            <p className="text-white/85 leading-relaxed bg-white/[0.01] border border-white/5 rounded-lg p-2.5">
                              {s.yesterdayWork}
                            </p>
                          </div>
                          <div>
                            <span className="text-[9.5px] uppercase font-mono text-white/30 block mb-0.5">
                              Today's Plan (Original Submission)
                            </span>
                            <p className="text-white/85 leading-relaxed bg-white/[0.01] border border-white/5 rounded-lg p-2.5">
                              {s.todayPlan}
                            </p>
                          </div>
                          {s.blockers && s.blockers.toLowerCase() !== "none" && s.blockers.trim() !== "" && (
                            <div>
                              <span className="text-[9.5px] uppercase font-mono text-orange-400 block mb-0.5">
                                Active Blockers
                              </span>
                              <p className="text-orange-300/90 leading-relaxed bg-orange-500/[0.02] border border-orange-500/10 rounded-lg p-2.5 italic">
                                "{s.blockers}"
                              </p>
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    );
                  })}

                {allStandups.length === 0 && (
                  <div className="col-span-2 py-20 text-center text-white/30 text-[13px] italic bg-white/[0.01] border border-dashed border-white/5 rounded-xl">
                    No standups have been submitted by any interns yet.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* 1. Add Employee Dialog */}
      <Dialog open={showAddEmpModal} onOpenChange={setShowAddEmpModal}>
        <DialogContent className="border border-white/15 bg-carbon/95 text-white backdrop-blur-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-white">
              Add New Employee
            </DialogTitle>
            <DialogDescription className="text-white/50 text-[12px]">
              Onboard a new hire to the database.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4 text-[13px] mt-2">
            <div>
              <label className="block text-white/60 mb-1">Full Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Rahul Sen"
                value={newEmp.name}
                onChange={(e) => setNewEmp((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 focus:border-kcyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white/60 mb-1">Company Email *</label>
              <input
                required
                type="email"
                placeholder="e.g. rahul@klassygo.com"
                value={newEmp.email}
                onChange={(e) => setNewEmp((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 focus:border-kcyan focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 mb-1">Role/Job Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. SDE-1"
                  value={newEmp.role}
                  onChange={(e) => setNewEmp((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 focus:border-kcyan focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1">Department</label>
                <select
                  value={newEmp.department}
                  onChange={(e) => setNewEmp((prev) => ({ ...prev, department: e.target.value }))}
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-2 text-white/80 focus:border-kcyan focus:outline-none cursor-pointer"
                >
                  <option value="Technology" className="bg-carbon">
                    Technology
                  </option>
                  <option value="Human Resources" className="bg-carbon">
                    Human Resources
                  </option>
                  <option value="Operations" className="bg-carbon">
                    Operations
                  </option>
                  <option value="Marketing" className="bg-carbon">
                    Marketing
                  </option>
                  <option value="Design" className="bg-carbon">
                    Design
                  </option>
                  <option value="Finance" className="bg-carbon">
                    Finance
                  </option>
                  <option value="Sales" className="bg-carbon">
                    Sales
                  </option>
                  <option value="Executive" className="bg-carbon">
                    Executive
                  </option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 mb-1">Status</label>
                <select
                  value={newEmp.status}
                  onChange={(e) =>
                    setNewEmp((prev) => ({
                      ...prev,
                      status: e.target.value as EmployeeStatus,
                    }))
                  }
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-2 text-white/80 focus:border-kcyan focus:outline-none cursor-pointer"
                >
                  <option value="active" className="bg-carbon">
                    Active
                  </option>
                  <option value="leave" className="bg-carbon">
                    On Leave
                  </option>
                  <option value="off-active" className="bg-carbon">
                    Off Active
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-white/60 mb-1">Employment Type</label>
                <select
                  value={newEmp.employmentType}
                  onChange={(e) =>
                    setNewEmp((prev) => ({
                      ...prev,
                      employmentType: e.target.value as EmploymentType,
                    }))
                  }
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-2 text-white/80 focus:border-kcyan focus:outline-none cursor-pointer"
                >
                  <option value="full-time" className="bg-carbon">
                    Full-Time
                  </option>
                  <option value="intern" className="bg-carbon">
                    Intern
                  </option>
                  <option value="part-time" className="bg-carbon">
                    Part-Time
                  </option>
                  <option value="contract" className="bg-carbon">
                    Contract
                  </option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 mb-1">Initial Performance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newEmp.performance}
                  onChange={(e) =>
                    setNewEmp((prev) => ({ ...prev, performance: Number(e.target.value) }))
                  }
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 focus:border-kcyan focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAddEmpModal(false)}
                className="px-4 py-2 rounded-md bg-white/5 text-white/70 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-gradient-to-r from-kcyan to-kblue text-white font-semibold cursor-pointer"
              >
                Add Hire
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Assign Task Dialog */}
      <Dialog open={showAddTaskModal} onOpenChange={(open) => {
        setShowAddTaskModal(open);
        if (!open) {
          setNewTask({
            title: "",
            assignedTo: "",
            priority: "medium",
            dueDate: "2025-05-30",
            module: "Engineering",
          });
        }
      }}>
        <DialogContent className="border border-white/15 bg-carbon/95 text-white backdrop-blur-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-white">
              Assign New Task
            </DialogTitle>
            <DialogDescription className="text-white/50 text-[12px]">
              {newTask.assignedTo
                ? `Allocate work to ${employees.find((x) => x.id === newTask.assignedTo)?.name || "selected employee"}.`
                : "Allocate work to a specific employee."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4 text-[13px] mt-2">
            {!newTask.assignedTo && (
              <div>
                <label className="block text-white/60 mb-1">Select Employee *</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-2 text-white/80 focus:border-kcyan focus:outline-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-carbon">
                    -- Choose Employee --
                  </option>
                  {employees.map((x) => (
                    <option key={x.id} value={x.id} className="bg-carbon">
                      {x.name} ({x.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-white/60 mb-1">Task Title *</label>
              <input
                required
                type="text"
                placeholder="e.g. Refactor API routes"
                value={newTask.title}
                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 focus:border-kcyan focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 mb-1">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, priority: e.target.value as Priority }))
                  }
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-2 text-white/80 focus:border-kcyan focus:outline-none cursor-pointer"
                >
                  <option value="high" className="bg-carbon">
                    High
                  </option>
                  <option value="medium" className="bg-carbon">
                    Medium
                  </option>
                  <option value="low" className="bg-carbon">
                    Low
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-white/60 mb-1">Module / Area</label>
                <select
                  value={newTask.module}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, module: e.target.value }))}
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-2 text-white/80 focus:border-kcyan focus:outline-none cursor-pointer"
                >
                  <option value="Engineering" className="bg-carbon">
                    Engineering
                  </option>
                  <option value="Design" className="bg-carbon">
                    Design
                  </option>
                  <option value="HR" className="bg-carbon">
                    HR
                  </option>
                  <option value="Finance" className="bg-carbon">
                    Finance
                  </option>
                  <option value="Marketing" className="bg-carbon">
                    Marketing
                  </option>
                  <option value="Sales" className="bg-carbon">
                    Sales
                  </option>
                  <option value="Operations" className="bg-carbon">
                    Operations
                  </option>
                  <option value="Executive" className="bg-carbon">
                    Executive
                  </option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-white/60 mb-1">Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 focus:border-kcyan focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-2 rounded-md bg-white/5 text-white/70 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-gradient-to-r from-kcyan to-kblue text-white font-semibold cursor-pointer"
              >
                Assign Work
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Log Leave Dialog */}
      <Dialog open={showAddLeaveModal} onOpenChange={(open) => {
        setShowAddLeaveModal(open);
        if (!open) {
          setNewLeave({
            employeeId: "",
            type: "casual",
            fromDate: "2025-05-20",
            toDate: "2025-05-22",
            reason: "",
          });
        }
      }}>
        <DialogContent className="border border-white/15 bg-carbon/95 text-white backdrop-blur-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-white">
              Log Leave Request
            </DialogTitle>
            <DialogDescription className="text-white/50 text-[12px]">
              {newLeave.employeeId
                ? `Directly record and approve leaves for ${employees.find((x) => x.id === newLeave.employeeId)?.name || "selected employee"}.`
                : "Directly record and approve leaves."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLeave} className="space-y-4 text-[13px] mt-2">
            {!newLeave.employeeId && (
              <div>
                <label className="block text-white/60 mb-1">Select Employee *</label>
                <select
                  value={newLeave.employeeId}
                  onChange={(e) => setNewLeave((prev) => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-2 text-white/80 focus:border-kcyan focus:outline-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-carbon">
                    -- Choose Employee --
                  </option>
                  {employees.map((x) => (
                    <option key={x.id} value={x.id} className="bg-carbon">
                      {x.name} ({x.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-white/60 mb-1">Leave Type</label>
              <select
                value={newLeave.type}
                onChange={(e) =>
                  setNewLeave((prev) => ({ ...prev, type: e.target.value as LeaveType }))
                }
                className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-2 text-white/80 focus:border-kcyan focus:outline-none cursor-pointer"
              >
                <option value="casual" className="bg-carbon">
                  Casual Leave
                </option>
                <option value="sick" className="bg-carbon">
                  Sick Leave
                </option>
                <option value="earned" className="bg-carbon">
                  Earned Leave
                </option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 mb-1">From Date</label>
                <input
                  type="date"
                  value={newLeave.fromDate}
                  onChange={(e) => setNewLeave((prev) => ({ ...prev, fromDate: e.target.value }))}
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 focus:border-kcyan focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1">To Date</label>
                <input
                  type="date"
                  value={newLeave.toDate}
                  onChange={(e) => setNewLeave((prev) => ({ ...prev, toDate: e.target.value }))}
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 focus:border-kcyan focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/60 mb-1">Reason / Notes *</label>
              <textarea
                required
                placeholder="Reason for logging leave..."
                value={newLeave.reason}
                onChange={(e) => setNewLeave((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full h-16 rounded-md border border-white/10 bg-white/5 p-3 focus:border-kcyan focus:outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAddLeaveModal(false)}
                className="px-4 py-2 rounded-md bg-white/5 text-white/70 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-gradient-to-r from-kcyan to-kblue text-white font-semibold cursor-pointer"
              >
                Record Leave
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Record Evaluation Dialog */}
      <Dialog open={showAddEvalModal} onOpenChange={(open) => {
        setShowAddEvalModal(open);
        if (!open) {
          setNewEval({
            employeeId: "",
            evaluator: "System Admin",
            rating: 5,
            comment: "",
            category: "Quarterly",
          });
        }
      }}>
        <DialogContent className="border border-white/15 bg-carbon/95 text-white backdrop-blur-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-white">
              Record Performance Review
            </DialogTitle>
            <DialogDescription className="text-white/50 text-[12px]">
              {newEval.employeeId
                ? `Submit formal performance score and commentary for ${employees.find((x) => x.id === newEval.employeeId)?.name || "selected employee"}.`
                : "Submit formal performance score and commentary."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEval} className="space-y-4 text-[13px] mt-2">
            {!newEval.employeeId && (
              <div>
                <label className="block text-white/60 mb-1">Select Employee *</label>
                <select
                  value={newEval.employeeId}
                  onChange={(e) => setNewEval((prev) => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-2 text-white/80 focus:border-kcyan focus:outline-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-carbon">
                    -- Choose Employee --
                  </option>
                  {employees.map((x) => (
                    <option key={x.id} value={x.id} className="bg-carbon">
                      {x.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 mb-1">Review Category</label>
                <select
                  value={newEval.category}
                  onChange={(e) => setNewEval((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-2 text-white/80 focus:border-kcyan focus:outline-none cursor-pointer"
                >
                  <option value="Quarterly" className="bg-carbon">
                    Quarterly Review
                  </option>
                  <option value="Peer" className="bg-carbon">
                    Peer Review
                  </option>
                  <option value="Leadership" className="bg-carbon">
                    Leadership Assessment
                  </option>
                  <option value="Annual" className="bg-carbon">
                    Annual Review
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-white/60 mb-1">Evaluator Rating (1-5)</label>
                <div className="flex gap-1.5 h-9 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewEval((prev) => ({ ...prev, rating: star }))}
                      className="focus:outline-none hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= newEval.rating ? "text-kgold fill-kgold" : "text-white/20"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-white/60 mb-1">Commentary / Feedback *</label>
              <textarea
                required
                placeholder="Write specific performance comments..."
                value={newEval.comment}
                onChange={(e) => setNewEval((prev) => ({ ...prev, comment: e.target.value }))}
                className="w-full h-20 rounded-md border border-white/10 bg-white/5 p-3 focus:border-kcyan focus:outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAddEvalModal(false)}
                className="px-4 py-2 rounded-md bg-white/5 text-white/70 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-gradient-to-r from-kcyan to-kblue text-white font-semibold cursor-pointer"
              >
                Log Review
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Employee Details & Profile Dialog (Task Workload Tracker & Editor) */}
      <Dialog
        open={selectedEmp !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEmp(null);
            setIsEditingEmp(false);
          }
        }}
      >
        {selectedEmp && (
          <DialogContent className="border border-white/15 bg-carbon/95 text-white backdrop-blur-3xl max-w-3xl w-[90vw] p-5 md:p-6 overflow-y-auto max-h-[90vh]">
            <DialogHeader className="flex justify-between items-start flex-row border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Avatar initials={selectedEmp.avatar} size={50} />
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="font-display text-lg font-bold text-white">
                      {selectedEmp.name}
                    </DialogTitle>
                    <GlowBadge
                      label={selectedEmp.status === "active" ? "Active" : selectedEmp.status === "leave" ? "On Leave" : "Off Active"}
                      color={selectedEmp.status === "active" ? "cyan" : selectedEmp.status === "leave" ? "orange" : "violet"}
                      className="scale-75 origin-left"
                    />
                    <GlowBadge
                      label={selectedEmp.employmentType === "full-time" ? "Full-Time" : selectedEmp.employmentType === "intern" ? "Intern" : selectedEmp.employmentType === "part-time" ? "Part-Time" : "Contract"}
                      color="blue"
                      className="scale-75 origin-left"
                    />
                  </div>
                  <p className="text-[12px] text-white/55">
                    {selectedEmp.role} · {selectedEmp.department}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mr-6 scale-90">
                <button
                  onClick={() => {
                    setIsEditingEmp(!isEditingEmp);
                    setEditEmpForm(selectedEmp);
                  }}
                  className="flex h-8 items-center gap-1 rounded-md border border-white/10 bg-white/4 px-2.5 text-[11px] text-white/70 hover:text-white cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteEmployee(selectedEmp.id)}
                  className="flex h-8 items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 text-[11px] text-red-400 hover:bg-red-500/20 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Terminate
                </button>
              </div>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-5 mt-4 text-[13px]">
              {/* Left Column: Stats & Edit Profile */}
              <div className="md:col-span-2 flex flex-col gap-4 border-r border-white/5 pr-4 md:pr-6">
                {isEditingEmp ? (
                  <form onSubmit={handleUpdateEmployee} className="space-y-3">
                    <h4 className="font-semibold text-kcyan text-[12px] uppercase font-mono tracking-wider">
                      Edit Profile
                    </h4>
                    <div>
                      <label className="text-[11px] text-white/50">Name</label>
                      <input
                        type="text"
                        value={editEmpForm.name || ""}
                        onChange={(e) =>
                          setEditEmpForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full h-8 rounded border border-white/10 bg-white/5 px-2 mt-1 focus:outline-none focus:border-kcyan"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/50">Role</label>
                      <input
                        type="text"
                        value={editEmpForm.role || ""}
                        onChange={(e) =>
                          setEditEmpForm((prev) => ({ ...prev, role: e.target.value }))
                        }
                        className="w-full h-8 rounded border border-white/10 bg-white/5 px-2 mt-1 focus:outline-none focus:border-kcyan"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/50">Department</label>
                      <select
                        value={editEmpForm.department}
                        onChange={(e) =>
                          setEditEmpForm((prev) => ({ ...prev, department: e.target.value }))
                        }
                        className="w-full h-8 rounded border border-white/10 bg-white/5 px-1.5 mt-1 focus:outline-none focus:border-kcyan text-white/80 cursor-pointer"
                      >
                        {depts
                          .filter((d) => d !== "All")
                          .map((d) => (
                            <option key={d} value={d} className="bg-carbon">
                              {d}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-white/50">Status</label>
                      <select
                        value={editEmpForm.status}
                        onChange={(e) =>
                          setEditEmpForm((prev) => ({
                            ...prev,
                            status: e.target.value as EmployeeStatus,
                          }))
                        }
                        className="w-full h-8 rounded border border-white/10 bg-white/5 px-1.5 mt-1 focus:outline-none focus:border-kcyan text-white/80 cursor-pointer"
                      >
                        <option value="active" className="bg-carbon">
                          Active
                        </option>
                        <option value="leave" className="bg-carbon">
                          On Leave
                        </option>
                        <option value="off-active" className="bg-carbon">
                          Off Active
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-white/50">Employment Type</label>
                      <select
                        value={editEmpForm.employmentType}
                        onChange={(e) =>
                          setEditEmpForm((prev) => ({
                            ...prev,
                            employmentType: e.target.value as EmploymentType,
                          }))
                        }
                        className="w-full h-8 rounded border border-white/10 bg-white/5 px-1.5 mt-1 focus:outline-none focus:border-kcyan text-white/80 cursor-pointer"
                      >
                        <option value="full-time" className="bg-carbon">
                          Full-Time
                        </option>
                        <option value="intern" className="bg-carbon">
                          Intern
                        </option>
                        <option value="part-time" className="bg-carbon">
                          Part-Time
                        </option>
                        <option value="contract" className="bg-carbon">
                          Contract
                        </option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded bg-kcyan text-black font-semibold text-[11px] cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingEmp(false)}
                        className="px-3 py-1.5 rounded bg-white/5 text-white/70 text-[11px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white/40 text-[10px] uppercase font-mono tracking-wider">
                        Contact details
                      </h4>
                      <p className="mt-1 font-mono text-[11.5px] text-white/80">
                        {selectedEmp.email}
                      </p>
                      <p className="mt-1 text-[11px] text-white/55">
                        Joined on {selectedEmp.joinedAt}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <h4 className="font-semibold text-white/40 text-[10px] uppercase font-mono tracking-wider">
                        Key Metrics
                      </h4>
                      <div className="grid grid-cols-2 gap-3 mt-2.5">
                        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
                          <span className="text-[10px] text-white/40 uppercase block">
                            Performance
                          </span>
                          <span className="text-[16px] font-extrabold text-kcyan font-display">
                            {selectedEmp.performance}%
                          </span>
                        </div>
                        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
                          <span className="text-[10px] text-white/40 uppercase block">
                            LMS Progress
                          </span>
                          <span className="text-[16px] font-extrabold text-violet-400 font-display">
                            {selectedEmp.lmsProgress}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <h4 className="font-semibold text-white/40 text-[10px] uppercase font-mono tracking-wider">
                        Log shortcuts
                      </h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          onClick={() => {
                            setNewTask((prev) => ({ ...prev, assignedTo: selectedEmp.id }));
                            setShowAddTaskModal(true);
                          }}
                          className="flex h-8 items-center justify-center gap-1 rounded bg-white/5 border border-white/6 text-[11px] text-white hover:bg-white/10 cursor-pointer"
                        >
                          <ClipboardList className="h-3.5 w-3.5" /> Assign Task
                        </button>
                        <button
                          onClick={() => {
                            setNewLeave((prev) => ({ ...prev, employeeId: selectedEmp.id }));
                            setShowAddLeaveModal(true);
                          }}
                          className="flex h-8 items-center justify-center gap-1 rounded bg-white/5 border border-white/6 text-[11px] text-white hover:bg-white/10 cursor-pointer"
                        >
                          <Calendar className="h-3.5 w-3.5" /> Log Leave
                        </button>
                        <button
                          onClick={() => {
                            setNewEval((prev) => ({ ...prev, employeeId: selectedEmp.id }));
                            setShowAddEvalModal(true);
                          }}
                          className="flex h-8 items-center justify-center gap-1 rounded bg-white/5 border border-white/6 text-[11px] text-white hover:bg-white/10 col-span-2 cursor-pointer"
                        >
                          <Star className="h-3.5 w-3.5" /> Add Performance Review
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evaluations history */}
                <div className="border-t border-white/5 pt-3 flex-1 flex flex-col min-h-[160px]">
                  <h4 className="font-semibold text-white/40 text-[10px] uppercase font-mono tracking-wider mb-2">
                    Performance History
                  </h4>
                  <div className="space-y-2 overflow-y-auto max-h-[160px] flex-1 scrollbar-none pr-1">
                    {getEmployeeEvaluations(selectedEmp.id).map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-lg bg-white/[0.01] border border-white/5 p-2 text-[11px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-white/80">{ev.category} Review</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < ev.rating ? "text-kgold fill-kgold" : "text-white/15"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-white/60 italic mt-1 font-sans">"{ev.comment}"</p>
                        <div className="text-[9px] text-white/30 text-right mt-1">
                          — {ev.evaluator}, {ev.date}
                        </div>
                      </div>
                    ))}
                    {getEmployeeEvaluations(selectedEmp.id).length === 0 && (
                      <div className="text-white/30 text-center py-4 text-[11px] italic">
                        No reviews recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Leaves history */}
                <div className="border-t border-white/5 pt-3 flex-1 flex flex-col min-h-[140px]">
                  <h4 className="font-semibold text-white/40 text-[10px] uppercase font-mono tracking-wider mb-2">
                    Leave History
                  </h4>
                  <div className="space-y-2 overflow-y-auto max-h-[140px] flex-1 scrollbar-none pr-1">
                    {getEmployeeLeaves(selectedEmp.id).map((l) => (
                      <div
                        key={l.id}
                        className="rounded-lg bg-white/[0.01] border border-white/5 p-2 text-[11px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-white/80 capitalize">
                            {l.type} Leave
                          </span>
                          <GlowBadge
                            label={l.status}
                            color={
                              l.status === "Approved"
                                ? "cyan"
                                : l.status === "Rejected"
                                  ? "orange"
                                  : "violet"
                            }
                            className="scale-[0.8] origin-right"
                          />
                        </div>
                        <p className="text-white/60 mt-1 font-sans">
                          {l.fromDate} to {l.toDate} ({l.days} days)
                        </p>
                        {l.reason && (
                          <p className="text-[10px] text-white/40 italic mt-0.5 font-sans">
                            "{l.reason}"
                          </p>
                        )}
                      </div>
                    ))}
                    {getEmployeeLeaves(selectedEmp.id).length === 0 && (
                      <div className="text-white/30 text-center py-4 text-[11px] italic">
                        No leaves logged.
                      </div>
                    )}
                  </div>
                </div>

                {/* Standup Submissions (Interns Only) */}
                {selectedEmp.employmentType === "intern" && (
                  <div className="border-t border-white/5 pt-3 flex-1 flex flex-col min-h-[180px]">
                    <h4 className="font-semibold text-white/40 text-[10px] uppercase font-mono tracking-wider mb-2">
                      Daily Standups
                    </h4>
                    <div className="space-y-2 overflow-y-auto max-h-[180px] flex-1 scrollbar-none pr-1">
                      {loadingStandups ? (
                        <div className="text-white/30 text-center py-4 text-[11px] italic">
                          Loading standups...
                        </div>
                      ) : standupHistory.length > 0 ? (
                        standupHistory.map((s) => {
                          const moodEmoji =
                            s.mood === "productive"
                              ? "🚀"
                              : s.mood === "happy"
                                ? "😊"
                                : s.mood === "neutral"
                                  ? "😐"
                                  : s.mood === "tired"
                                    ? "😴"
                                    : s.mood === "stressed"
                                      ? "🤯"
                                      : "📝";
                          return (
                            <div
                              key={s._id || s.id}
                              className="rounded-lg bg-white/[0.01] border border-white/5 p-2.5 text-[11px] space-y-1.5"
                            >
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono text-white/40">
                                  {s.date ? new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : "Date missing"}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span title={`Mood: ${s.mood || 'neutral'}`}>{moodEmoji}</span>
                                  <span className="text-kcyan font-mono font-semibold">
                                    {s.completionPercentage || 0}%
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div>
                                  <span className="text-[9.5px] uppercase font-mono text-white/30 block">
                                    Yesterday
                                  </span>
                                  <p className="text-white/70">{s.yesterdayWork}</p>
                                </div>
                                <div>
                                  <span className="text-[9.5px] uppercase font-mono text-white/30 block">
                                    Today
                                  </span>
                                  <p className="text-white/70">{s.todayPlan}</p>
                                </div>
                                {s.blockers && s.blockers.toLowerCase() !== "none" && s.blockers.trim() !== "" && (
                                  <div>
                                    <span className="text-[9.5px] uppercase font-mono text-orange-400/70 block">
                                      Blockers
                                    </span>
                                    <p className="text-orange-300/80 italic">"{s.blockers}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-white/30 text-center py-4 text-[11px] italic">
                          No standups submitted yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Workload Tracker */}
              <div className="md:col-span-3 flex flex-col gap-4">
                {/* AI Standup Insights (Interns Only) */}
                {selectedEmp.employmentType === "intern" && (
                  <div className="rounded-xl border border-kcyan/20 bg-kcyan/[0.02] p-4 flex flex-col gap-3 relative overflow-hidden backdrop-blur-sm">
                    {/* Glass backdrop glow */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-kcyan/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4.5 w-4.5 text-kcyan animate-pulse" />
                        <div>
                          <h4 className="font-semibold text-white/90 text-[13px] font-display">
                            AI Standup Insights
                          </h4>
                          <p className="text-[10px] text-white/45">
                            Weekly automated review & recommendations
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleRegenerateAiPerformance}
                        disabled={loadingAiPerformance}
                        className="flex h-7 items-center gap-1 rounded bg-kcyan/10 border border-kcyan/20 hover:bg-kcyan/25 px-2.5 text-[10px] text-kcyan hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" />
                        {loadingAiPerformance ? "Analyzing..." : "Re-evaluate"}
                      </button>
                    </div>

                    {loadingAiPerformance ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-kcyan border-t-transparent" />
                        <span className="text-[11px] text-white/40">Compiling standup metrics...</span>
                      </div>
                    ) : aiPerformance ? (
                      <div className="space-y-3 mt-1 text-[12px]">
                        <div className="flex items-center justify-between">
                          <span className="text-white/50 text-[11.5px]">Overall Standup Grade</span>
                          <span className="text-[14px] font-bold text-kcyan font-display bg-kcyan/10 px-2 py-0.5 rounded border border-kcyan/20">
                            {aiPerformance.grade || "B"}
                          </span>
                        </div>

                        <div className="space-y-1 bg-white/[0.01] border border-white/5 rounded-lg p-2.5">
                          <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">
                            Progress Summary
                          </span>
                          <p className="text-white/70 leading-relaxed">
                            {aiPerformance.progressSummary}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-1 bg-white/[0.01] border border-white/5 rounded-lg p-2.5">
                            <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">
                              Patterns Observed
                            </span>
                            <p className="text-white/70 leading-relaxed">
                              {aiPerformance.patternsObserved}
                            </p>
                          </div>
                          <div className="space-y-1 bg-white/[0.01] border border-white/5 rounded-lg p-2.5">
                            <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">
                              Recommendations
                            </span>
                            <p className="text-kcyan/80 leading-relaxed font-sans italic">
                              "{aiPerformance.constructiveRecommendation || aiPerformance.recommendations}"
                            </p>
                          </div>
                        </div>

                        <div className="text-[9px] text-white/30 text-right">
                          Evaluated {aiPerformance.compiledDate ? new Date(aiPerformance.compiledDate).toLocaleDateString() : "Just now"} from {aiPerformance.standupsCount || 7} standups
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-white/40 text-[11px] italic bg-white/[0.01] border border-dashed border-white/5 rounded-lg">
                        No AI standup insights generated yet. Click "Re-evaluate" to run analysis.
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-white/85 text-[13px] font-display flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-kcyan" /> Workload Tracker
                  </h4>
                  <p className="text-[11.5px] text-white/55">
                    Current assignments and completion details
                  </p>
                </div>

                {/* Visual statistics */}
                {(() => {
                  const { completed, left, total, completionRate } = getEmployeeTasks(
                    selectedEmp.id,
                  );
                  return (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                          <span className="block text-[9px] font-mono uppercase text-white/35">
                            Total Tasks
                          </span>
                          <span className="text-[20px] font-bold text-white font-display">
                            {total}
                          </span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                          <span className="block text-[9px] font-mono uppercase text-white/35">
                            Completed
                          </span>
                          <span className="text-[20px] font-bold text-kcyan font-display">
                            {completed.length}
                          </span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                          <span className="block text-[9px] font-mono uppercase text-white/35">
                            Pending / Left
                          </span>
                          <span className="text-[20px] font-bold text-violet-400 font-display">
                            {left.length}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-white/45">Completion Ratio</span>
                          <span className="text-kcyan font-mono font-semibold">
                            {completionRate}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-kblue via-kcyan to-kcyan"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Task breakdown list */}
                      <div className="border-t border-white/5 pt-3 grid gap-4 md:grid-cols-2 flex-1">
                        {/* Pending Task Box */}
                        <div className="flex flex-col gap-2">
                          <h5 className="font-semibold text-white/70 text-[11.5px] uppercase font-mono tracking-wider flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-violet-400" /> Pending Work (
                            {left.length})
                          </h5>
                          <div className="space-y-2 overflow-y-auto max-h-[220px] flex-1 pr-1 scrollbar-none">
                            {left.map((t) => (
                              <div
                                key={t.id}
                                className="rounded-lg border border-white/6 bg-white/[0.03] p-2.5 flex flex-col gap-1.5"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="text-[12px] font-medium text-white/80 line-clamp-2">
                                    {t.title}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => {
                                        updateTaskStatus(t.id, "done");
                                        toast.success("Task completed!");
                                      }}
                                      title="Mark completed"
                                      className="h-5 w-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-kcyan/20 border border-white/10 hover:border-kcyan hover:text-kcyan text-white/60 transition-colors cursor-pointer"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Delete this task?")) {
                                          deleteTask(t.id);
                                          toast.error("Task removed.");
                                        }
                                      }}
                                      title="Delete task"
                                      className="h-5 w-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500 hover:text-red-400 text-white/45 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-white/35 font-mono">Due {t.dueDate}</span>
                                  <GlowBadge
                                    label={t.priority}
                                    color={
                                      t.priority === "high"
                                        ? "orange"
                                        : t.priority === "medium"
                                          ? "gold"
                                          : "cyan"
                                    }
                                    className="scale-[0.8] origin-right"
                                  />
                                </div>
                              </div>
                            ))}
                            {left.length === 0 && (
                              <div className="py-8 text-center text-white/30 text-[11px] italic bg-white/[0.01] border border-dashed border-white/5 rounded-lg">
                                No pending work assigned. All clear! ✨
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Completed Task Box */}
                        <div className="flex flex-col gap-2">
                          <h5 className="font-semibold text-white/70 text-[11.5px] uppercase font-mono tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-kcyan" /> Completed Work (
                            {completed.length})
                          </h5>
                          <div className="space-y-2 overflow-y-auto max-h-[220px] flex-1 pr-1 scrollbar-none">
                            {completed.map((t) => (
                              <div
                                key={t.id}
                                className="rounded-lg border border-white/4 bg-white/[0.01] p-2.5 flex flex-col gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="text-[12px] text-white/70 line-through decoration-white/20 line-clamp-2">
                                    {t.title}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => {
                                        updateTaskStatus(t.id, "todo");
                                        toast.warning("Task reopened.");
                                      }}
                                      title="Reopen task"
                                      className="text-[9.5px] font-mono font-medium text-kcyan hover:underline cursor-pointer"
                                    >
                                      Reopen
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Delete this task?")) {
                                          deleteTask(t.id);
                                          toast.error("Task removed.");
                                        }
                                      }}
                                      title="Delete task"
                                      className="h-5 w-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500 hover:text-red-400 text-white/40 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="text-[9.5px] text-white/30 font-mono">
                                  Done · {t.dueDate}
                                  {t.priority && (
                                    <span className="ml-1 text-[9.5px] capitalize">
                                      · {t.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                            {completed.length === 0 && (
                              <div className="py-8 text-center text-white/30 text-[11px] italic bg-white/[0.01] border border-dashed border-white/5 rounded-lg">
                                No work completed yet.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
