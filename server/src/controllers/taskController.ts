import { Response } from "express";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { AuthRequest } from "../middlewares/authMiddleware";

// GET /api/tasks
export const getAllTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    let query: any = {};

    // Interns can only see tasks assigned to them
    if (req.user.role === "Intern") {
      query.assignedTo = req.user.id;
    }

    const tasks = await Task.find(query).populate("assignedTo", "name email role avatar");
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const task = await Task.findById(id).populate("assignedTo", "name email role avatar");
    if (!task) {
      res.status(404).json({ message: "Task not found." });
      return;
    }

    // Interns can only view their own tasks
    if (req.user.role === "Intern" && task.assignedTo._id.toString() !== req.user.id) {
      res.status(403).json({ message: "Access forbidden: you can only view your own tasks." });
      return;
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// POST /api/tasks
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, assignedTo, priority, status, dueDate, module } = req.body;

  if (!title || !assignedTo || !dueDate) {
    res.status(400).json({ message: "Title, assignedTo (user ID), and dueDate are required." });
    return;
  }

  try {
    const userExists = await User.findById(assignedTo);
    if (!userExists) {
      res.status(404).json({ message: "Assigned user not found." });
      return;
    }

    const task = new Task({
      title,
      assignedTo,
      priority: priority || "medium",
      status: status || "Not Started",
      dueDate: new Date(dueDate),
      module: module || "General",
    });
    await task.save();

    const result = await Task.findById(task._id).populate("assignedTo", "name email role avatar");
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, assignedTo, priority, status, dueDate, module } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ message: "Task not found." });
      return;
    }

    // Intern restrictions
    if (req.user.role === "Intern") {
      // Interns can only update their own tasks
      if (task.assignedTo.toString() !== req.user.id) {
        res.status(403).json({ message: "Access forbidden: you cannot modify other users' tasks." });
        return;
      }
      // Interns can ONLY update the task status!
      if (title || assignedTo || priority || dueDate || module) {
        res.status(403).json({ message: "Access forbidden: interns can only modify task status." });
        return;
      }
    }

    // Apply updates
    if (title) task.title = title;
    if (assignedTo) {
      const userExists = await User.findById(assignedTo);
      if (!userExists) {
        res.status(404).json({ message: "Assigned user not found." });
        return;
      }
      task.assignedTo = assignedTo;
    }
    if (priority) task.priority = priority;
    if (status) {
      if (!["Not Started", "In Progress", "Under Review", "Done"].includes(status)) {
        res.status(400).json({ message: "Invalid status value." });
        return;
      }
      task.status = status;
    }
    if (dueDate) task.dueDate = new Date(dueDate);
    if (module) task.module = module;

    await task.save();

    const result = await Task.findById(task._id).populate("assignedTo", "name email role avatar");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ message: "Task not found." });
      return;
    }

    await Task.findByIdAndDelete(id);
    res.status(200).json({ message: "Task deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
