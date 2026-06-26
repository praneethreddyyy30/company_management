import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { useHRMStore } from "@/stores/hrmStore";
import type { TaskStatus, Task } from "@/data/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/work")({ component: WorkHub });

const cols: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "border-white/10" },
  { key: "in-progress", label: "In Progress", color: "border-kblue/30" },
  { key: "done", label: "Done", color: "border-kcyan/30" },
];

function WorkHub() {
  const tasks = useHRMStore((s) => s.tasks);
  const employees = useHRMStore((s) => s.employees);
  const updateTaskStatus = useHRMStore((s) => s.updateTaskStatus);
  const addTask = useHRMStore((s) => s.addTask);
  const deleteTask = useHRMStore((s) => s.deleteTask);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");

  // Default to first employee on load
  useEffect(() => {
    if (employees.length > 0 && !newAssignee) {
      setNewAssignee(employees[0].id);
    }
  }, [employees, newAssignee]);

  const add = () => {
    if (!newTitle.trim()) return;
    if (!newAssignee) {
      toast.error("Please select an employee to assign this task.");
      return;
    }
    addTask({
      id: `t${Date.now()}`,
      title: newTitle,
      assignedTo: newAssignee,
      priority: "medium",
      status: "todo",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      module: "General",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setNewTitle("");
    toast.success("Task created");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight">Work Hub</h1>
          <p className="mt-1 text-[13px] text-white/55">Tasks & assignments across teams</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New task title…"
            className="h-10 w-64 rounded-full border border-white/8 bg-white/4 px-4 text-[13px] focus:border-kcyan focus:outline-none"
          />
          <select
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            className="h-10 w-48 rounded-full border border-white/8 bg-carbon px-4 text-[12.5px] text-white/85 focus:border-kcyan focus:outline-none cursor-pointer"
          >
            <option value="">Assign to...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id} className="bg-carbon text-white">
                {emp.name} ({emp.role.replace(" Intern", "")})
              </option>
            ))}
          </select>
          <button
            onClick={add}
            className="flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-kblue to-kviolet px-4 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.3)] shrink-0"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {cols.map((col) => (
          <GlassCard key={col.key} className={cn("p-4 border-t-2", col.color)}>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-display text-[13px] font-semibold uppercase tracking-wider text-white/80">
                {col.label}
              </div>
              <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/50">
                {tasks.filter((t) => t.status === col.key).length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {tasks
                .filter((t) => t.status === col.key)
                .map((t) => (
                  <TaskCard key={t.id} task={t} onMove={updateTaskStatus} onDelete={deleteTask} />
                ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onMove,
  onDelete,
}: {
  task: Task;
  onMove: (id: string, s: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const priorityColor =
    task.priority === "high" ? "bg-korange" : task.priority === "medium" ? "bg-kgold" : "bg-kcyan";
  const nextStatus: TaskStatus | null =
    task.status === "todo" ? "in-progress" : task.status === "in-progress" ? "done" : null;
  return (
    <motion.div layout className="rounded-xl border border-white/6 bg-white/[0.03] p-3 group relative">
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityColor}`} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-white/85 pr-5">{task.title}</div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-white/40">
            <span className="rounded-full bg-white/5 px-1.5 py-0.5">{task.module}</span>
            <span className="font-mono">Due {task.dueDate}</span>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm("Delete this task?")) {
              onDelete(task.id);
              toast.error("Task removed");
            }
          }}
          title="Delete task"
          className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 flex items-center justify-center rounded bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500 text-white/45 hover:text-red-400 cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {nextStatus && (
        <button
          onClick={() => onMove(task.id, nextStatus)}
          className="mt-2 w-full rounded-md border border-white/8 py-1 text-[10.5px] text-white/60 hover:border-kcyan/40 hover:text-kcyan"
        >
          → {nextStatus === "in-progress" ? "Start" : "Complete"}
        </button>
      )}
    </motion.div>
  );
}
