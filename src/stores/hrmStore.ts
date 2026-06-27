import { create } from "zustand";
import {
  employees as initialEmployees,
  tasks as initialTasks,
  leaves as initialLeaves,
  candidates as initialCandidates,
  courses as initialCourses,
  policies as initialPolicies,
  evaluations as initialEvaluations,
  type Employee,
  type Task,
  type Leave,
  type Candidate,
  type Course,
  type Policy,
  type Evaluation,
  type CandidateStage,
  type TaskStatus,
  type LeaveStatus,
} from "@/data/mockData";
import { internAPI, taskAPI, batchAPI, leaveAPI, candidateAPI, policyAPI, evaluationAPI, authAPI } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "./authStore";

interface HRMState {
  employees: Employee[];
  leads: any[];
  tasks: Task[];
  batches: any[];
  leaves: Leave[];
  candidates: Candidate[];
  courses: Course[];
  policies: Policy[];
  evaluations: Evaluation[];
  
  isLoading: boolean;
  fetchData: () => Promise<void>;
  
  addEmployee: (e: Employee) => Promise<void>;
  updateEmployee: (id: string, updated: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  addTask: (t: Task) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  toggleTaskDone: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  addLeave: (l: Leave) => Promise<void>;
  setLeaveStatus: (id: string, status: LeaveStatus) => Promise<void>;
  moveCandidate: (id: string, next: CandidateStage) => Promise<void>;
  addEvaluation: (ev: Evaluation) => Promise<void>;
}

const STAGES: CandidateStage[] = ["applied", "screening", "interview", "offer", "onboarded"];

export const useHRMStore = create<HRMState>((set, get) => ({
  employees: [], // loaded from API
  leads: [], // loaded from API
  tasks: [], // loaded from API
  batches: [], // loaded from API
  leaves: [],
  candidates: [],
  courses: initialCourses,
  policies: [],
  evaluations: [],
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    const user = useAuthStore.getState().user;
    const isLead = user && ["Lead", "Admin", "Management"].includes(user.role);
    try {
      // 1. Fetch Batches
      let batches: any[] = [];
      try {
        batches = await batchAPI.getAll();
      } catch (err) {
        console.warn("Failed to fetch batches from server, attempting to seed default batch.");
      }

      // If no batches exist, create a default cohort batch
      if (batches.length === 0) {
        try {
          const defaultBatch = await batchAPI.create({
            name: "Winter 2026 Batch",
            startDate: new Date("2026-01-01").toISOString(),
            endDate: new Date("2026-06-30").toISOString(),
            isActive: true
          });
          batches = [defaultBatch];
        } catch (err) {
          console.error("Could not create default batch:", err);
        }
      }
      set({ batches });

      // 2. Fetch Leads
      let leadsList: any[] = [];
      if (isLead) {
        try {
          leadsList = await authAPI.getLeads();
        } catch (err) {
          console.warn("Failed to fetch leads list:", err);
        }
      }
      set({ leads: leadsList });

      // 3. Fetch Interns
      const employees = await internAPI.getAll();
      set({ employees });

      // 4. Fetch Tasks
      const tasks = await taskAPI.getAll();
      
      // Map task.assignedTo (User ID) to intern._id (Employee ID) for frontend matching
      const mappedTasks = tasks.map((t: any) => {
        const assignedIntern = employees.find((emp: any) => emp.userId === t.assignedTo);
        return {
          ...t,
          assignedTo: assignedIntern ? assignedIntern.id : t.assignedTo
        };
      });

      set({ tasks: mappedTasks });

      // 4. Fetch Leaves
      try {
        const leavesData = await leaveAPI.getAll();
        const mappedLeaves = leavesData.map((l: any) => ({
          id: l._id || l.id,
          employeeId: l.employeeId,
          employeeName: l.employeeName,
          type: l.type,
          fromDate: l.fromDate ? new Date(l.fromDate).toISOString().slice(0, 10) : "",
          toDate: l.toDate ? new Date(l.toDate).toISOString().slice(0, 10) : "",
          days: l.days,
          reason: l.reason,
          status: l.status,
          appliedAt: l.appliedAt ? new Date(l.appliedAt).toISOString().slice(0, 10) : "",
          approvedBy: l.approvedBy,
        }));
        set({ leaves: mappedLeaves });
      } catch (err) {
        console.warn("Failed to fetch leaves from backend, using initial mock leaves.", err);
        set({ leaves: initialLeaves });
      }

      // 5. Fetch Candidates
      if (isLead) {
        try {
          const candidatesData = await candidateAPI.getAll();
          const mappedCandidates = candidatesData.map((c: any) => ({
            id: c._id || c.id,
            name: c.name,
            role: c.role,
            stage: c.stage,
            aiMatchScore: c.aiMatchScore,
            appliedAt: c.appliedAt ? new Date(c.appliedAt).toISOString().slice(0, 10) : "",
            resumeStrength: c.resumeStrength,
            interviewScheduled: c.interviewScheduled
          }));
          set({ candidates: mappedCandidates });
        } catch (err) {
          console.warn("Failed to fetch candidates from backend.", err);
        }
      }

      // 6. Fetch Policies
      try {
        const policiesData = await policyAPI.getAll();
        const mappedPolicies = policiesData.map((p: any) => ({
          id: p._id || p.id,
          title: p.title,
          category: p.category,
          lastUpdated: p.lastUpdated ? new Date(p.lastUpdated).toISOString().slice(0, 10) : "",
          version: p.version,
          fileSize: p.fileSize
        }));
        set({ policies: mappedPolicies });
      } catch (err) {
        console.warn("Failed to fetch policies from backend.", err);
      }

      // 7. Fetch Evaluations
      try {
        const evalsData = await evaluationAPI.getAll();
        const mappedEvals = evalsData.map((e: any) => ({
          id: e._id || e.id,
          employeeId: e.internId,
          evaluator: e.evaluator,
          date: e.date ? new Date(e.date).toISOString().slice(0, 10) : "",
          rating: e.rating,
          comment: e.comment,
          category: e.category
        }));
        set({ evaluations: mappedEvals });
      } catch (err) {
        console.warn("Failed to fetch evaluations from backend.", err);
      }
    } catch (error) {
      console.error("HRM fetchData error, falling back to mock data:", error);
      // Fallback to local mock data to prevent app crashes when server is unreachable
      set({ 
        employees: initialEmployees, 
        tasks: initialTasks,
        leaves: initialLeaves
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addEmployee: async (empRecord) => {
    try {
      const state = get();
      let batchId = state.batches[0]?._id;
      
      if (!batchId) {
        // Create batch if none exists
        const defaultBatch = await batchAPI.create({
          name: "Winter 2026 Batch",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true
        });
        batchId = defaultBatch._id;
        set({ batches: [defaultBatch] });
      }

      // Extract track name from role string (e.g. "Frontend Developer" -> "Frontend")
      let track = empRecord.role.replace(" Developer", "").replace(" Intern", "").replace(" Engineer", "");
      if (!track || track === empRecord.role) track = "Technology";

      const apiPayload = {
        name: empRecord.name,
        email: empRecord.email,
        track,
        department: empRecord.department,
        mentor: empRecord.mentor || "Unassigned",
        mentorId: empRecord.mentorId || undefined,
        batchId,
        startDate: empRecord.joinedAt || new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        avatar: empRecord.avatar,
        status: empRecord.status || "active",
        employmentType: empRecord.employmentType || "intern",
      };

      const newEmp = await internAPI.create(apiPayload);
      set((s) => ({ employees: [newEmp, ...s.employees] }));
    } catch (error) {
      console.error("addEmployee API error, using memory fallback:", error);
      set((s) => ({ employees: [empRecord, ...s.employees] }));
    }
  },

  updateEmployee: async (id, updatedFields) => {
    try {
      // Find database ID (mapped as id)
      const state = get();
      const existing = state.employees.find(e => e.id === id);
      if (!existing) return;

      const apiPayload: any = {};
      if (updatedFields.name) apiPayload.name = updatedFields.name;
      if (updatedFields.email) apiPayload.email = updatedFields.email;
      if (updatedFields.department) apiPayload.department = updatedFields.department;
      if (updatedFields.status) apiPayload.status = updatedFields.status;
      if (updatedFields.employmentType) apiPayload.employmentType = updatedFields.employmentType;
      if (updatedFields.performance !== undefined) apiPayload.performance = updatedFields.performance;
      if (updatedFields.lmsProgress !== undefined) apiPayload.lmsProgress = updatedFields.lmsProgress;
      if (updatedFields.tasksCompleted !== undefined) apiPayload.tasksCompleted = updatedFields.tasksCompleted;
      if (updatedFields.mentorId !== undefined) {
        apiPayload.mentorId = updatedFields.mentorId; // can be null/empty
      }
      
      // If status leaves or off-active
      if (updatedFields.status === "leave" || updatedFields.status === "off-active") {
        apiPayload.status = updatedFields.status;
      }

      const updatedEmp = await internAPI.update(id, apiPayload);
      set((s) => ({
        employees: s.employees.map((e) => (e.id === id ? { ...e, ...updatedEmp } : e)),
      }));
    } catch (error) {
      console.error("updateEmployee API error, using memory fallback:", error);
      set((s) => ({
        employees: s.employees.map((e) => (e.id === id ? { ...e, ...updatedFields } : e)),
      }));
    }
  },

  deleteEmployee: async (id) => {
    try {
      await internAPI.delete(id);
      set((s) => ({
        employees: s.employees.filter((e) => e.id !== id),
      }));
    } catch (error) {
      console.error("deleteEmployee API error, using memory fallback:", error);
      set((s) => ({
        employees: s.employees.filter((e) => e.id !== id),
      }));
    }
  },

  addTask: async (taskRecord) => {
    try {
      const state = get();
      // Look up target intern user by Employee ID (taskRecord.assignedTo)
      const assignedIntern = state.employees.find((emp) => emp.id === taskRecord.assignedTo);
      const assignedToUserId = assignedIntern ? (assignedIntern.userId || assignedIntern.id) : taskRecord.assignedTo;

      const apiPayload = {
        title: taskRecord.title,
        assignedTo: assignedToUserId,
        priority: taskRecord.priority || "medium",
        status: "Not Started",
        dueDate: taskRecord.dueDate || new Date().toISOString(),
        module: taskRecord.module || "General"
      };

      const dbTask = await taskAPI.create(apiPayload);
      
      // Map back to frontend Employee ID referencing
      const frontendTask = {
        ...dbTask,
        assignedTo: assignedIntern ? assignedIntern.id : taskRecord.assignedTo
      };

      set((s) => ({ tasks: [frontendTask, ...s.tasks] }));
    } catch (error) {
      console.error("addTask API error, using memory fallback:", error);
      set((s) => ({ tasks: [taskRecord, ...s.tasks] }));
    }
  },

  updateTaskStatus: async (id, status) => {
    try {
      // Map frontend status (todo, in-progress, done) to backend status (Not Started, In Progress, Under Review, Done)
      let backendStatus = "Not Started";
      if (status === "in-progress") {
        backendStatus = "In Progress";
      } else if (status === "done") {
        backendStatus = "Done";
      }

      const dbTask = await taskAPI.update(id, { status: backendStatus });
      const state = get();
      const assignedIntern = state.employees.find((emp) => emp.userId === dbTask.assignedTo);

      const frontendTask = {
        ...dbTask,
        assignedTo: assignedIntern ? assignedIntern.id : dbTask.assignedTo
      };

      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? frontendTask : t)),
      }));
      toast.success("Task status updated!");
    } catch (error) {
      console.error("updateTaskStatus API error, using memory fallback:", error);
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }));
    }
  },

  toggleTaskDone: async (id) => {
    try {
      const state = get();
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return;

      const newStatus = task.status === "done" ? "todo" : "done";
      await get().updateTaskStatus(id, newStatus);
    } catch (error) {
      console.error("toggleTaskDone error:", error);
    }
  },

  deleteTask: async (id) => {
    try {
      await taskAPI.delete(id);
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error("deleteTask API error, using memory fallback:", error);
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
      }));
    }
  },

  addLeave: async (l) => {
    try {
      const apiPayload = {
        type: l.type,
        fromDate: l.fromDate,
        toDate: l.toDate,
        reason: l.reason,
      };
      const created = await leaveAPI.apply(apiPayload);
      const mapped = {
        id: created._id || created.id,
        employeeId: created.employeeId,
        employeeName: created.employeeName,
        type: created.type,
        fromDate: new Date(created.fromDate).toISOString().slice(0, 10),
        toDate: new Date(created.toDate).toISOString().slice(0, 10),
        days: created.days,
        reason: created.reason,
        status: created.status,
        appliedAt: new Date(created.appliedAt).toISOString().slice(0, 10),
      };
      set((s) => ({ leaves: [mapped, ...s.leaves] }));
    } catch (error: any) {
      console.error("addLeave API error:", error);
      toast.error(error.message || "Failed to apply for leave");
      throw error;
    }
  },
  setLeaveStatus: async (id, status) => {
    try {
      const updated = await leaveAPI.updateStatus(id, status as "Approved" | "Rejected");
      const mapped = {
        id: updated._id || updated.id,
        employeeId: updated.employeeId,
        employeeName: updated.employeeName,
        type: updated.type,
        fromDate: new Date(updated.fromDate).toISOString().slice(0, 10),
        toDate: new Date(updated.toDate).toISOString().slice(0, 10),
        days: updated.days,
        reason: updated.reason,
        status: updated.status,
        appliedAt: new Date(updated.appliedAt).toISOString().slice(0, 10),
        approvedBy: updated.approvedBy,
      };
      set((s) => ({
        leaves: s.leaves.map((l) => (l.id === id ? mapped : l)),
      }));
      await get().fetchData();
    } catch (error: any) {
      console.error("setLeaveStatus API error:", error);
      toast.error(error.message || "Failed to update leave status");
    }
  },
  moveCandidate: async (id, next) => {
    try {
      const updated = await candidateAPI.updateStage(id, next);
      set((s) => ({
        candidates: s.candidates.map((c) =>
          c.id === id ? { ...c, stage: updated.stage, interviewScheduled: updated.interviewScheduled } : c
        ),
      }));
      toast.success("Candidate stage updated!");
    } catch (error: any) {
      console.error("Failed to move candidate:", error);
      toast.error(error.message || "Failed to update candidate stage");
    }
  },
  addEvaluation: async (ev) => {
    try {
      const apiPayload = {
        internId: ev.employeeId,
        rating: ev.rating,
        comment: ev.comment,
        category: ev.category || "Technical",
      };
      const created = await evaluationAPI.create(apiPayload);
      const mapped = {
        id: created._id || created.id,
        employeeId: created.internId,
        evaluator: created.evaluator,
        date: new Date(created.date).toISOString().slice(0, 10),
        rating: created.rating,
        comment: created.comment,
        category: created.category,
      };
      set((s) => ({ evaluations: [mapped, ...s.evaluations] }));
      toast.success("Evaluation submitted successfully!");
    } catch (error: any) {
      console.error("Failed to submit evaluation:", error);
      toast.error(error.message || "Failed to submit evaluation");
    }
  },
}));

export { STAGES };
