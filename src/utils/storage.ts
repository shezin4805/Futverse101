import { Player, PLAYERS } from "../data/players";
import { GameMode, Difficulty } from "./gameHelpers";

export interface UserAccount {
  email: string;
  name: string;
  photoUrl?: string;
  rating: number;
  placementMatchesCount: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  highestStreak: number;
  totalGuesses: number;
  totalCompletionTime: number; // in seconds
  hintsUsed: number;
  achievements: string[];
  lastDailyDate?: string;
  dailyStreak: number;
}

export interface MatchHistoryItem {
  id: string;
  opponent: string;
  opponentRating: number;
  playerScore: number; // rounds won
  opponentScore: number; // rounds won
  rounds: {
    targetPlayer: string;
    playerGuesses: number;
    opponentGuesses: number;
    playerTime: number;
    opponentTime: number;
    winner: "player" | "opponent" | "draw";
  }[];
  ratingChange: number;
  date: string;
}

export interface Tournament {
  id: string;
  name: string;
  status: "scheduled" | "active" | "completed";
  competitors: string[];
  prize: string;
  rounds: {
    roundIndex: number; // 0 for quarter-final, 1 for semi-final, 2 for final
    matches: {
      id: string;
      player1: string;
      player2: string;
      score1?: number;
      score2?: number;
      winner?: string;
      targetPlayerName: string;
    }[];
  }[];
  winner?: string;
}

// Default user state for guest or new signups
export const DEFAULT_USER: UserAccount = {
  email: "guest@futverse.com",
  name: "FutVerse Legend",
  rating: 1000,
  placementMatchesCount: 0,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  currentStreak: 0,
  highestStreak: 0,
  totalGuesses: 0,
  totalCompletionTime: 0,
  hintsUsed: 0,
  achievements: [],
  dailyStreak: 0,
};

// Key list
const KEYS = {
  USER_ACCOUNT: "futverse_user",
  MATCH_HISTORY: "futverse_match_history",
  TOURNAMENTS: "futverse_tournaments",
  CUSTOM_PLAYERS: "futverse_custom_players",
  DAILY_RESULTS: "futverse_daily_results",
};

// Helper to load state
export function loadState<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Helper to save state
export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error saving state to localStorage", e);
  }
}

// Load and save user details
export function getActiveUser(): UserAccount {
  return loadState<UserAccount>(KEYS.USER_ACCOUNT, DEFAULT_USER);
}

export function saveActiveUser(user: UserAccount): void {
  saveState<UserAccount>(KEYS.USER_ACCOUNT, user);
}

// Match History for Ranked mode
export function getMatchHistory(): MatchHistoryItem[] {
  return loadState<MatchHistoryItem[]>(KEYS.MATCH_HISTORY, []);
}

export function saveMatchHistory(history: MatchHistoryItem[]): void {
  saveState<MatchHistoryItem[]>(KEYS.MATCH_HISTORY, history);
}

// Custom players added by admin
export function getCustomPlayers(): Player[] {
  return loadState<Player[]>(KEYS.CUSTOM_PLAYERS, []);
}

export function saveCustomPlayers(players: Player[]): void {
  saveState<Player[]>(KEYS.CUSTOM_PLAYERS, players);
}

// Get total player pool (original database + custom players added by admin)
export function getAllPlayers(): Player[] {
  const custom = getCustomPlayers();
  return [...PLAYERS, ...custom];
}

// Tournaments storage
export function getTournaments(): Tournament[] {
  // If no tournaments exist, initialize a default scheduled one
  const defaultTournaments: Tournament[] = [
    {
      id: "ucl-masters",
      name: "UEFA Champions Masters Tournament",
      status: "scheduled",
      competitors: ["You", "Erling H.", "Kylian M.", "Jude B.", "Mohamed S.", "Kevin D.", "Harry K.", "Bukayo S."],
      prize: "5,000 Coins + Gold Champion Trophy",
      rounds: [
        {
          roundIndex: 0,
          matches: [
            { id: "qf1", player1: "You", player2: "Erling H.", targetPlayerName: "Lionel Messi" },
            { id: "qf2", player1: "Kylian M.", player2: "Jude B.", targetPlayerName: "Robert Lewandowski" },
            { id: "qf3", player1: "Mohamed S.", player2: "Kevin D.", targetPlayerName: "Vinícius Júnior" },
            { id: "qf4", player1: "Harry K.", player2: "Bukayo S.", targetPlayerName: "Rodri" },
          ]
        }
      ]
    },
    {
      id: "world-cup-clash",
      name: "FIFA World Cup Guessing Cup",
      status: "completed",
      competitors: ["Lionel M.", "Cristiano R.", "Neymar J.", "Luka M.", "Antoine G.", "Luis S.", "Virgil V.", "Joshua K."],
      prize: "FIFA Legend Emblem",
      winner: "Lionel M.",
      rounds: [
        {
          roundIndex: 0,
          matches: [
            { id: "wc-qf1", player1: "Lionel M.", player2: "Cristiano R.", score1: 2, score2: 1, winner: "Lionel M.", targetPlayerName: "Kylian Mbappé" }
          ]
        }
      ]
    }
  ];
  return loadState<Tournament[]>(KEYS.TOURNAMENTS, defaultTournaments);
}

export function saveTournaments(tournaments: Tournament[]): void {
  saveState<Tournament[]>(KEYS.TOURNAMENTS, tournaments);
}

// Achievements list definition
export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: "victory" | "streak" | "difficulty" | "misc";
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first-victory", title: "First Victory", description: "Successfully guess a footballer", iconName: "Trophy", category: "victory" },
  { id: "streak-10", title: "10 Win Streak", description: "Maintain a guessing streak of 10 wins", iconName: "Flame", category: "streak" },
  { id: "wins-50", title: "50 Wins Club", description: "Reach 50 lifetime puzzle wins", iconName: "Target", category: "victory" },
  { id: "wins-100", title: "100 Wins Master", description: "Reach 100 lifetime puzzle wins", iconName: "Award", category: "victory" },
  { id: "hintless-master", title: "Hintless Master", description: "Solve a puzzle without using any hints", iconName: "EyeOff", category: "difficulty" },
  { id: "world-cup-master", title: "World Cup Master", description: "Correctly guess 5 players in World Cup Mode", iconName: "Globe", category: "difficulty" },
  { id: "ucl-expert", title: "UCL Expert", description: "Solve 10 puzzles in UEFA Mode", iconName: "Zap", category: "difficulty" },
  { id: "rank-legend", title: "Legend Rank", description: "Reach a Ranked rating of 2100+", iconName: "ShieldAlert", category: "misc" },
  { id: "rank-goat", title: "GOAT Rank", description: "Reach a Ranked rating of 2500+", iconName: "Crown", category: "misc" },
  { id: "tournament-champion", title: "Tournament Champion", description: "Win a scheduled Knockout Tournament", iconName: "Star", category: "misc" },
];

// Verify and unlock achievements
export function checkAchievements(user: UserAccount): string[] {
  const currentUnlocked = [...user.achievements];
  const newUnlocked: string[] = [];

  const addIfNew = (id: string) => {
    if (!currentUnlocked.includes(id)) {
      newUnlocked.push(id);
    }
  };

  // 1. First victory
  if (user.wins >= 1) {
    addIfNew("first-victory");
  }
  // 2. 10 Win streak
  if (user.highestStreak >= 10) {
    addIfNew("streak-10");
  }
  // 3. 50 Wins
  if (user.wins >= 50) {
    addIfNew("wins-50");
  }
  // 4. 100 Wins
  if (user.wins >= 100) {
    addIfNew("wins-100");
  }
  // 5. Legend Rank (rating >= 2100)
  if (user.rating >= 2100) {
    addIfNew("rank-legend");
  }
  // 6. GOAT Rank (rating >= 2500)
  if (user.rating >= 2500) {
    addIfNew("rank-goat");
  }

  return newUnlocked;
}
