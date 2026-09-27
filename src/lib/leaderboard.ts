// Shared leaderboard types (API route + client).
export type Board = "streak" | "best" | "week";

export interface LeaderRow {
  name: string;
  city?: string;
  streak: number;
  best: number;
  week: number;
  total: number;
  rank: number;
  /** this row is the person asking */
  you?: true;
}

export interface LeaderboardResponse {
  configured: boolean;
  boards?: Record<Board, LeaderRow[]>;
  me?: Partial<Record<Board, number>>;
  players?: number;
}

export const BOARDS: { id: Board; label: string; unit: string; hint: string }[] = [
  { id: "streak", label: "Current streak", unit: "day streak", hint: "Workouts in a row (up to 2 rest days allowed)" },
  { id: "best", label: "Longest streak", unit: "best streak", hint: "Everyone's all-time best run" },
  { id: "week", label: "This week", unit: "workouts", hint: "Workouts logged since Monday" },
];
