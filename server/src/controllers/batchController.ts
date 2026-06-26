import { Response } from "express";
import { Batch } from "../models/Batch";
import { Intern } from "../models/Intern";
import { AuthRequest } from "../middlewares/authMiddleware";

// GET /api/batches
export const getAllBatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batches = await Batch.find().populate("mentorId", "name email avatar");
    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/batches/:id
export const getBatchById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const batch = await Batch.findById(id).populate("mentorId", "name email avatar");
    if (!batch) {
      res.status(404).json({ message: "Batch not found." });
      return;
    }
    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// POST /api/batches
export const createBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, startDate, endDate, mentorId, isActive } = req.body;

  if (!name || !startDate || !endDate || !mentorId) {
    res.status(400).json({ message: "Name, startDate, endDate, and mentorId are required." });
    return;
  }

  try {
    const existing = await Batch.findOne({ name });
    if (existing) {
      res.status(400).json({ message: "Batch with this name already exists." });
      return;
    }

    const batch = new Batch({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      mentorId,
      isActive: isActive !== undefined ? isActive : true,
    });
    await batch.save();

    const result = await Batch.findById(batch._id).populate("mentorId", "name email avatar");
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// PUT /api/batches/:id
export const updateBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, startDate, endDate, mentorId, isActive } = req.body;

  try {
    const batch = await Batch.findById(id);
    if (!batch) {
      res.status(404).json({ message: "Batch not found." });
      return;
    }

    if (name) {
      const existing = await Batch.findOne({ name, _id: { $ne: id } });
      if (existing) {
        res.status(400).json({ message: "Batch name is already in use." });
        return;
      }
      batch.name = name;
    }
    if (startDate) batch.startDate = new Date(startDate);
    if (endDate) batch.endDate = new Date(endDate);
    if (mentorId) batch.mentorId = mentorId;
    if (isActive !== undefined) batch.isActive = isActive;

    await batch.save();

    const result = await Batch.findById(batch._id).populate("mentorId", "name email avatar");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// DELETE /api/batches/:id
export const deleteBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const batch = await Batch.findById(id);
    if (!batch) {
      res.status(404).json({ message: "Batch not found." });
      return;
    }

    // Check if there are interns associated with this batch
    const associatedInternsCount = await Intern.countDocuments({ batchId: id });
    if (associatedInternsCount > 0) {
      res.status(400).json({
        message: `Cannot delete batch. There are ${associatedInternsCount} interns enrolled in this batch.`,
      });
      return;
    }

    await Batch.findByIdAndDelete(id);
    res.status(200).json({ message: "Batch deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/batches/:id/interns
export const getInternsByBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const batch = await Batch.findById(id);
    if (!batch) {
      res.status(404).json({ message: "Batch not found." });
      return;
    }

    const interns = await Intern.find({ batchId: id })
      .populate("userId", "-password")
      .populate("batchId");

    res.status(200).json(interns);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
