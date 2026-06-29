import type { MatchMode } from "./types.js";

export type Difficulty = "easy" | "medium" | "hard" | "legend";

export type HandBias = "weak" | "balanced" | "strong" | "brutal";

const VALID: Difficulty[] = ["easy", "medium", "hard", "legend"];

export function parseDifficulty(value: string | null): Difficulty {
  if (value && VALID.includes(value as Difficulty)) {
    return value as Difficulty;
  }
  return "medium";
}

export function difficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "legend":
      return "Legend";
  }
}

/** Map difficulty + role to card-strength bias (rarity weights). */
export function handBiasFor(
  mode: MatchMode,
  difficulty: Difficulty,
  role: "human" | "cpu" | "pvp",
): HandBias {
  if (mode === "pvp" || role === "pvp") {
    return "balanced";
  }

  if (role === "human") {
    switch (difficulty) {
      case "easy":
        return "strong";
      case "medium":
        return "balanced";
      case "hard":
        return "weak";
      case "legend":
        return "weak";
    }
  }

  // CPU opponent
  switch (difficulty) {
    case "easy":
      return "weak";
    case "medium":
      return "balanced";
    case "hard":
      return "strong";
    case "legend":
      return "brutal";
  }
}