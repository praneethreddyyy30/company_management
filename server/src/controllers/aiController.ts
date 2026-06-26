import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Standup } from "../models/Standup";
import { AIPerformance } from "../models/AIPerformance";
import { Intern } from "../models/Intern";
import { getAIProvider } from "../services/aiService";
import { createNotification } from "../services/notificationService";
import { logActivity } from "../services/activityService";

// GET /api/ai-performance/:internId - View the latest evaluation summary
export const viewPerformanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const { internId } = req.params;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  // Guard: Interns can only view their own AI summary
  if (req.user.role === "Intern" && req.user.id !== internId) {
    res.status(403).json({ message: "Access forbidden: you cannot view other interns' AI reviews." });
    return;
  }

  try {
    const evaluation = await AIPerformance.findOne({ internId }).sort({ compiledDate: -1 });
    if (!evaluation) {
      res.status(404).json({ message: "No AI performance summary has been compiled yet for this intern." });
      return;
    }

    res.status(200).json(evaluation);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// POST /api/ai-performance/:internId/regenerate - Lead manually triggers AI summary rebuild
export const regeneratePerformanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const { internId } = req.params;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Lead") {
    res.status(403).json({ message: "Access forbidden: only Leads can compile performance summaries." });
    return;
  }

  try {
    // 1. Fetch previous 7 standups
    const standups = await Standup.find({ internId }).sort({ date: -1 }).limit(7);
    if (standups.length === 0) {
      res.status(400).json({ message: "This intern has not submitted any standups yet. At least 1 standup is required to generate a performance review." });
      return;
    }

    // Reverse standups to feed chronological order to AI
    const chronologicalStandups = [...standups].reverse();

    // 2. Generate evaluation via configured AI provider
    const aiEngine = getAIProvider();
    const evaluationResult = await aiEngine.generatePerformanceSummary(chronologicalStandups);

    // 3. Save evaluation record
    const performance = new AIPerformance({
      internId,
      compiledDate: new Date(),
      standupsCount: standups.length,
      progressSummary: evaluationResult.progressSummary,
      patternsObserved: evaluationResult.patternsObserved,
      constructiveRecommendation: evaluationResult.constructiveRecommendation,
      grade: evaluationResult.grade,
    });
    await performance.save();

    // 4. Update overall Intern performance score mapping (A=95, B=85, C=75, D=65, F=50)
    let performanceScore = 85;
    if (evaluationResult.grade === "A") performanceScore = 95;
    else if (evaluationResult.grade === "C") performanceScore = 75;
    else if (evaluationResult.grade === "D") performanceScore = 65;
    else if (evaluationResult.grade === "F") performanceScore = 50;

    await Intern.findOneAndUpdate(
      { userId: internId },
      { performance: performanceScore }
    );

    // 5. Notify Intern cardholder
    await createNotification(
      internId,
      "AI Performance Review Compiled",
      `A new weekly performance summary has been compiled. Grade: ${evaluationResult.grade}.`,
      "AI",
      "success"
    );

    // 6. Log central activity
    await logActivity(
      req.user.id,
      req.user.name,
      "AI_PERFORMANCE_GENERATED",
      `Compiled weekly evaluation summary for intern ID: ${internId} (Grade: ${evaluationResult.grade})`,
      "AI",
      "MED",
      req
    );

    res.status(201).json(performance);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// Compile function called by cron scheduler weekly
export const runWeeklyPerformanceAudit = async () => {
  console.log("[AI Cron] Commencing weekly active intern performance evaluations...");
  try {
    const activeInterns = await Intern.find({ status: "active" });
    const aiEngine = getAIProvider();

    let count = 0;
    for (const intern of activeInterns) {
      const standups = await Standup.find({ internId: intern.userId }).sort({ date: -1 }).limit(7);
      if (standups.length > 0) {
        const evaluationResult = await aiEngine.generatePerformanceSummary([...standups].reverse());

        const performance = new AIPerformance({
          internId: intern.userId,
          compiledDate: new Date(),
          standupsCount: standups.length,
          progressSummary: evaluationResult.progressSummary,
          patternsObserved: evaluationResult.patternsObserved,
          constructiveRecommendation: evaluationResult.constructiveRecommendation,
          grade: evaluationResult.grade,
        });
        await performance.save();

        let performanceScore = 85;
        if (evaluationResult.grade === "A") performanceScore = 95;
        else if (evaluationResult.grade === "C") performanceScore = 75;
        else if (evaluationResult.grade === "D") performanceScore = 65;
        else if (evaluationResult.grade === "F") performanceScore = 50;

        intern.performance = performanceScore;
        await intern.save();

        await createNotification(
          intern.userId,
          "Weekly AI Review Published",
          `Weekly review compiled automatically. Grade: ${evaluationResult.grade}.`,
          "AI",
          "success"
        );
        count++;
      }
    }
    console.log(`[AI Cron] Evaluation completed. Summarized ${count} intern(s).`);
  } catch (error) {
    console.error("[AI Cron] Audit trigger error:", error);
  }
};
