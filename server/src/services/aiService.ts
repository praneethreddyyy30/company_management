import dotenv from "dotenv";

dotenv.config();

export interface AIPerformanceResult {
  progressSummary: string;
  patternsObserved: string;
  constructiveRecommendation: string;
  grade: string;
}

export interface IAIProvider {
  generatePerformanceSummary(standups: any[]): Promise<AIPerformanceResult>;
  chat(message: string, context: string): Promise<string>;
}

// 1. Mock Provider Implementation
class MockProvider implements IAIProvider {
  async generatePerformanceSummary(standups: any[]): Promise<AIPerformanceResult> {
    console.log("[AI] Using Mock Provider to generate summary.");
    const count = standups.length;
    const avgCompletion = standups.reduce((sum, s) => sum + (s.completionPercentage || 0), 0) / Math.max(1, count);
    
    // Choose appropriate mock text based on average completion
    let grade = "B";
    let progressSummary = "The intern has shown steady progress over the week, successfully contributing to core module API integrations.";
    let constructiveRecommendation = "Ensure unit tests are written for all new database controllers and schemas.";
    
    if (avgCompletion >= 90) {
      grade = "A";
      progressSummary = "Exceptional progress this week. Outstanding commitment to delivering fully functional features ahead of schedule, with robust schema validations.";
      constructiveRecommendation = "Take on more complex architectural tasks, such as designing notification webhooks and optimizing database lookups.";
    } else if (avgCompletion < 70) {
      grade = "C";
      progressSummary = "Modest progress this week. Focused on resolving bugs but completion percentage has remained relatively low.";
      constructiveRecommendation = "Discuss blockers early with the mentor and break down tasks into smaller, manageable sub-tasks.";
    }

    const moods = standups.map(s => s.mood).filter(Boolean);
    const primaryMood = moods.length > 0 ? moods.reduce((a, b, _, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b) : "productive";
    const patternsObserved = `Consistently checked in on time. Daily mood trend was mostly '${primaryMood}'. Handled blocker states independently.`;

    return {
      progressSummary,
      patternsObserved,
      constructiveRecommendation,
      grade
    };
  }

  async chat(message: string, context: string): Promise<string> {
    const lc = message.toLowerCase();
    try {
      const parsed = JSON.parse(context);
      if (lc.includes("task")) {
        const pending = parsed.tasks.filter((t: any) => t.status !== "done" && t.status !== "Done").length;
        const total = parsed.tasks.length;
        return `There are currently ${pending} pending tasks out of ${total} total assignments in flight.`;
      }
      if (lc.includes("evaluat")) {
        const evalsCount = parsed.evaluations.length;
        const activeInterns = parsed.interns.length;
        return `We have recorded ${evalsCount} evaluations across the current cohort of ${activeInterns} active interns.`;
      }
      if (lc.includes("perform")) {
        const sorted = [...parsed.interns].sort((a: any, b: any) => b.performance - a.performance);
        if (sorted.length > 0) {
          const top = sorted[0];
          return `Top performer is currently ${top.name || "Unknown"} with a score of ${top.performance}%.`;
        }
        return "No interns are currently listed in the database to calculate top performers.";
      }
    } catch (e) {
      console.warn("Failed to parse mock context:", e);
    }
    return "I've checked the live workforce data. Let me know if you need specific metrics about task completions, leave approvals, or performance scores.";
  }
}

// 2. Gemini Provider Implementation
class GeminiProvider implements IAIProvider {
  async generatePerformanceSummary(standups: any[]): Promise<AIPerformanceResult> {
    console.log("[AI] Using Gemini Provider to generate summary.");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[AI] GEMINI_API_KEY is missing. Falling back to Mock Provider.");
      return new MockProvider().generatePerformanceSummary(standups);
    }

    const prompt = getPrompt(standups);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const responseData = await response.json();
      const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("No content received from Gemini API");
      }

      return JSON.parse(text) as AIPerformanceResult;
    } catch (error) {
      console.error("[AI] Gemini evaluation failed, falling back to mock:", error);
      return new MockProvider().generatePerformanceSummary(standups);
    }
  }

  async chat(message: string, context: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new MockProvider().chat(message, context);
    }
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are KLASSYGO AI, an intelligent co-pilot for an Internship Management Platform.
You have access to the following live database context (JSON format):
${context}

User question: "${message}"

Answer the user question concisely, referencing the live database metrics, names, tasks, or evaluations. Keep the response to 1-3 sentences. Formatting should be simple and elegant.`
            }]
          }]
        })
      });
      const responseData = await response.json();
      return responseData.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (e) {
      console.error("[AI] Gemini Copilot failed, falling back to mock:", e);
      return new MockProvider().chat(message, context);
    }
  }
}

// 3. OpenAI Provider Implementation
class OpenAIProvider implements IAIProvider {
  async generatePerformanceSummary(standups: any[]): Promise<AIPerformanceResult> {
    console.log("[AI] Using OpenAI Provider to generate summary.");
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("[AI] OPENAI_API_KEY is missing. Falling back to Mock Provider.");
      return new MockProvider().generatePerformanceSummary(standups);
    }

    const prompt = getPrompt(standups);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are a helpful HR evaluator assistant." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with status ${response.status}`);
      }

      const responseData = await response.json();
      const text = responseData.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("No content received from OpenAI API");
      }

      return JSON.parse(text) as AIPerformanceResult;
    } catch (error) {
      console.error("[AI] OpenAI evaluation failed, falling back to mock:", error);
      return new MockProvider().generatePerformanceSummary(standups);
    }
  }

  async chat(message: string, context: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new MockProvider().chat(message, context);
    }
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are KLASSYGO AI, an intelligent co-pilot for an Internship Management Platform.
You have access to the following live database context:
${context}`
            },
            { role: "user", content: message }
          ]
        })
      });
      const responseData = await response.json();
      return responseData.choices?.[0]?.message?.content || "No response generated.";
    } catch (e) {
      console.error("[AI] OpenAI Copilot failed, falling back to mock:", e);
      return new MockProvider().chat(message, context);
    }
  }
}

// Helper to formulate AI Prompt
function getPrompt(standups: any[]): string {
  const serialized = standups.map((s, i) => `
Standup Log #${i + 1}:
- Date: ${s.date ? new Date(s.date).toISOString().slice(0,10) : "N/A"}
- Yesterday's Work: ${s.yesterdayWork}
- Today's Plan: ${s.todayPlan}
- Blockers: ${s.blockers || "None"}
- Mood: ${s.mood || "N/A"}
- Completion rate: ${s.completionPercentage || 0}%
`).join("\n");

  return `You are an AI Performance Evaluator engine for KLASSYGO Interns.
Analyze the following daily standup logs from the past week:
${serialized}

Evaluate the intern's progress, identify behavioral or technical patterns, and draft recommendations.
You must respond with a JSON object containing exactly these keys:
{
  "progressSummary": "A concise summary of the progress made this week.",
  "patternsObserved": "Patterns observed (e.g. daily mood shifts, productivity spikes, handling of blockers).",
  "constructiveRecommendation": "A constructive recommendation for next week.",
  "grade": "A single letter grade: A, B, C, D, or F based on performance."
}`;
}

// Factory function to get active AI provider
export const getAIProvider = (): IAIProvider => {
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  if (provider === "gemini") {
    return new GeminiProvider();
  }
  if (provider === "openai") {
    return new OpenAIProvider();
  }
  return new MockProvider();
};
