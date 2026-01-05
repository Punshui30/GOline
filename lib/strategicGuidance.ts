/**
 * Strategic Guidance Layer
 * 
 * LLM output schema for strategic reasoning that shapes how the deterministic
 * engine explores the solution space. The LLM decides what matters and how to
 * approach the problem. The engine decides what is allowed and what the final
 * numbers are.
 */

export interface ClarificationQuestion {
  type: "temporal" | "tradeoff" | "tolerance" | "priority";
  question: string;
  options: string[];
}

export interface StrategicGuidance {
  temporalProfile: "single-phase" | "multi-phase";
  dominantPriorities: string[]; // e.g. ["energy", "clarity", "endurance"]
  strictAvoidances: string[]; // e.g. ["anxiety", "early sedation"]
  acceptableTradeoffs: string[]; // e.g. ["lower peak intensity"]
  suggestedStrategies: string[]; // e.g. ["corrective_blend", "stacked_preferred"]
  riskFlags: string[]; // e.g. ["terpene_overshoot_sensitive", "thc_anxiety_sensitive"]
  clarificationNeeded?: ClarificationQuestion[];
}









