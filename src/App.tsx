import React, { useState, useEffect, useRef } from "react";
import { Player } from "./data/players";
import { AutocompleteSearch } from "./components/AutocompleteSearch";
import { ComparisonRow } from "./components/ComparisonRow";
import { StatWidget } from "./components/StatWidget";
import { AdminDashboard } from "./components/AdminDashboard";
import { RankedMatch } from "./components/RankedMatch";
import { TournamentBrackets } from "./components/TournamentBrackets";
import {
  comparePlayers,
  PlayerComparison,
  filterPlayersByMode,
  getDailyPlayer,
  getRankFromRating,
  GameMode,
  Difficulty,
} from "./utils/gameHelpers";
import {
  UserAccount,
  getActiveUser,
  saveActiveUser,
  DEFAULT_USER,
  ALL_ACHIEVEMENTS,
  checkAchievements,
} from "./utils/storage";
import {
  Trophy,
  Flame,
  Zap,
  Shield,
  Award,
  Calendar,
  Layers,
  Sparkles,
  Globe,
  Settings,
  HelpCircle,
  Eye,
  LogOut,
  Mail,
  User,
  Lock,
  Compass,
  CheckCircle,
  RefreshCw,
  EyeOff,
  Wifi,
  WifiOff,
  Star,
  Plus
} from "lucide-react";

export default function App() {
  // Navigation tabs: "dashboard" | "play" | "daily" | "ranked" | "tournaments" | "achievements" | "leaderboards" | "admin" | "offline"
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // User Auth & State
  const [user, setUser] = useState<UserAccount>(getActiveUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // DB Sync state
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>("Premier League");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");

  // Core Guessing Game States (Unlimited / Normal Mode)
  const [targetPlayer, setTargetPlayer] = useState<Player | null>(null);
  const [guesses, setGuesses] = useState<Player[]>([]);
  const [comparisons, setComparisons] = useState<PlayerComparison[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  // Daily Mode States
  const [dailyPlayer, setDailyPlayer] = useState<Player | null>(null);
  const [dailyGuesses, setDailyGuesses] = useState<Player[]>([]);
  const [dailyComparisons, setDailyComparisons] = useState<PlayerComparison[]>([]);
  const [dailyEnded, setDailyEnded] = useState(false);
  const [dailyWon, setDailyWon] = useState(false);
  const [dailyStartTime, setDailyStartTime] = useState<number>(0);

  // Hints State
  const [manualHintsUnlocked, setManualHintsUnlocked] = useState<string[]>([]);

  // Time-left until next daily player (refreshes live)
  const [timeLeftDaily, setTimeLeftDaily] = useState("");

  // Refresh DB players lists
  const refreshPlayersFromDB = () => {
    // Read list combining hardcoded & admin custom
    try {
      const custom = localStorage.getItem("futverse_custom_players");
      const customPlayers: Player[] = custom ? JSON.parse(custom) : [];
      import("./data/players").then(({ PLAYERS }) => {
        setAllPlayers([...PLAYERS, ...customPlayers]);
      });
    } catch {
      import("./data/players").then(({ PLAYERS }) => {
        setAllPlayers(PLAYERS);
      });
    }
  };

  useEffect(() => {
    refreshPlayersFromDB();
  }, []);

  // Update Daily Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeftDaily(
        `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Trigger achievement checks
  const verifyAchievements = (updatedUser: UserAccount) => {
    const newlyUnlocked = checkAchievements(updatedUser);
    if (newlyUnlocked.length > 0) {
      const merged = Array.from(new Set([...updatedUser.achievements, ...newlyUnlocked]));
      const finalUser = { ...updatedUser, achievements: merged };
      setUser(finalUser);
      saveActiveUser(finalUser);
    }
  };

  // Auth Operations
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Simulate Auth
    const accountName = name || email.split("@")[0] || "Star Guesser";
    const loggedInUser: UserAccount = {
      ...DEFAULT_USER,
      email,
      name: accountName,
    };

    setUser(loggedInUser);
    saveActiveUser(loggedInUser);
    setIsAuthModalOpen(false);
    resetAuthForm();
  };

  const resetAuthForm = () => {
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleLogout = () => {
    setUser(DEFAULT_USER);
    saveActiveUser(DEFAULT_USER);
  };

  // Start Unlimited Game
  const handleStartUnlimitedGame = () => {
    setGuesses([]);
    setComparisons([]);
    setGameEnded(false);
    setGameWon(false);
    setManualHintsUnlocked([]);

    // Filter by mode and difficulty
    const eligible = filterPlayersByMode(allPlayers, gameMode).filter(
      (p) => p.difficulty === difficulty
    );

    if (eligible.length === 0) {
      // Fallback
      const fallback = allPlayers.filter((p) => p.difficulty === difficulty);
      const chosen = fallback[Math.floor(Math.random() * fallback.length)] || allPlayers[0];
      setTargetPlayer(chosen);
    } else {
      const chosen = eligible[Math.floor(Math.random() * eligible.length)];
      setTargetPlayer(chosen);
    }

    setStartTime(Date.now());
    setActiveTab("play");
  };

  // Start Daily Game
  const handleStartDailyGame = () => {
    setDailyGuesses([]);
    setDailyComparisons([]);
    setDailyEnded(false);
    setDailyWon(false);
    setManualHintsUnlocked([]);

    const daily = getDailyPlayer(allPlayers);
    setDailyPlayer(daily);
    setDailyStartTime(Date.now());
    setActiveTab("daily");
  };

  // Handle Guess Submission (Unlimited mode)
  const handleGuessSubmit = (guessed: Player) => {
    if (!targetPlayer || gameEnded) return;

    const newGuesses = [...guesses, guessed];
    setGuesses(newGuesses);

    const comp = comparePlayers(guessed, targetPlayer);
    setComparisons((prev) => [comp, ...prev]);

    if (guessed.id === targetPlayer.id) {
      // WIN GAME
      const duration = Math.round((Date.now() - startTime) / 1000);
      setGameEnded(true);
      setGameWon(true);

      // Save statistics
      const updatedUser: UserAccount = {
        ...user,
        gamesPlayed: user.gamesPlayed + 1,
        wins: user.wins + 1,
        currentStreak: user.currentStreak + 1,
        highestStreak: Math.max(user.highestStreak, user.currentStreak + 1),
        totalGuesses: user.totalGuesses + newGuesses.length,
        totalCompletionTime: user.totalCompletionTime + duration,
        hintsUsed: user.hintsUsed + manualHintsUnlocked.length,
      };

      setUser(updatedUser);
      saveActiveUser(updatedUser);
      verifyAchievements(updatedUser);
    } else if (newGuesses.length >= 8) {
      // LOSE GAME
      setGameEnded(true);
      setGameWon(false);

      const updatedUser: UserAccount = {
        ...user,
        gamesPlayed: user.gamesPlayed + 1,
        losses: user.losses + 1,
        currentStreak: 0,
        hintsUsed: user.hintsUsed + manualHintsUnlocked.length,
      };

      setUser(updatedUser);
      saveActiveUser(updatedUser);
    }
  };

  // Handle Daily Guess Submission
  const handleDailyGuessSubmit = (guessed: Player) => {
    if (!dailyPlayer || dailyEnded) return;

    const newGuesses = [...dailyGuesses, guessed];
    setDailyGuesses(newGuesses);

    const comp = comparePlayers(guessed, dailyPlayer);
    setDailyComparisons((prev) => [comp, ...prev]);

    if (guessed.id === dailyPlayer.id) {
      // WIN DAILY GAME
      const duration = Math.round((Date.now() - dailyStartTime) / 1000);
      setDailyEnded(true);
      setDailyWon(true);

      // Verify streak
      const todayString = new Date().toLocaleDateString();
      const streakIncrement = user.lastDailyDate !== todayString ? 1 : 0;

      const updatedUser: UserAccount = {
        ...user,
        gamesPlayed: user.gamesPlayed + 1,
        wins: user.wins + 1,
        currentStreak: user.currentStreak + 1,
        highestStreak: Math.max(user.highestStreak, user.currentStreak + 1),
        totalGuesses: user.totalGuesses + newGuesses.length,
        totalCompletionTime: user.totalCompletionTime + duration,
        hintsUsed: user.hintsUsed + manualHintsUnlocked.length,
        lastDailyDate: todayString,
        dailyStreak: user.dailyStreak + streakIncrement,
      };

      setUser(updatedUser);
      saveActiveUser(updatedUser);
      verifyAchievements(updatedUser);
    } else if (newGuesses.length >= 8) {
      // LOSE DAILY
      setDailyEnded(true);
      setDailyWon(false);

      const updatedUser: UserAccount = {
        ...user,
        gamesPlayed: user.gamesPlayed + 1,
        losses: user.losses + 1,
        currentStreak: 0,
        dailyStreak: 0,
      };

      setUser(updatedUser);
      saveActiveUser(updatedUser);
    }
  };

  // Hint Reveal logic (both auto and manual)
  const isHintUnlocked = (hintCategory: string, guessCount: number) => {
    // 1. Check if manually unlocked
    if (manualHintsUnlocked.includes(hintCategory)) return true;

    // 2. Check automatic release milestones
    if (hintCategory === "position" && guessCount >= 1) return true;
    if (hintCategory === "nationality" && guessCount >= 2) return true;
    if (hintCategory === "club" && guessCount >= 3) return true;
    if (hintCategory === "league" && guessCount >= 4) return true;
    if (hintCategory === "shirtNumber" && guessCount >= 5) return true;
    if (hintCategory === "age" && guessCount >= 6) return true;
    if (hintCategory === "appearances" && guessCount >= 7) return true;

    return false;
  };

  const handleManualUnlockHint = (hintCategory: string) => {
    if (manualHintsUnlocked.includes(hintCategory)) return;
    setManualHintsUnlocked((prev) => [...prev, hintCategory]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060a12] via-[#090e1a] to-[#04060b] text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-900 pb-12">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 bg-[#090e1a]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-4 md:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center space-x-2.5 group hover:opacity-90 transition-opacity"
          >
            <div className="bg-emerald-500 text-slate-900 font-black p-2.5 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:rotate-6 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black text-white tracking-widest uppercase block leading-none">
                Fut<span className="text-emerald-400">Verse</span>
              </span>
              <span className="text-[9px] text-emerald-500 font-extrabold tracking-widest uppercase block mt-0.5">
                Pro Football Guessing Pitch
              </span>
            </div>
          </button>

          {/* Nav items desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: Layers },
              { id: "ranked", label: "Ranked Arena", icon: Shield },
              { id: "tournaments", label: "Tournaments", icon: Trophy },
              { id: "achievements", label: "Achievements", icon: Award },
              { id: "leaderboards", label: "Leaderboards", icon: Globe },
              { id: "offline", label: "Offline Play", icon: WifiOff },
              { id: "admin", label: "Federation Console", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide uppercase flex items-center gap-1.5 transition-all ${
                    activeTab === tab.id
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* User profile section */}
          <div className="flex items-center space-x-3">
            {user.email !== "guest@futverse.com" ? (
              <div className="flex items-center space-x-2.5">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-white font-extrabold">{user.name}</p>
                  <p className="text-[9px] text-emerald-400 font-bold uppercase">
                    {getRankFromRating(user.rating)} ({user.rating} Elo)
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl border border-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] uppercase tracking-wider"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Responsive sub-nav for mobile/tablet */}
        <div className="lg:hidden flex items-center space-x-2 overflow-x-auto no-scrollbar mt-3 pt-3 border-t border-slate-800/40">
          {[
            { id: "dashboard", label: "Dashboard", icon: Layers },
            { id: "ranked", label: "Ranked", icon: Shield },
            { id: "tournaments", label: "Tournaments", icon: Trophy },
            { id: "achievements", label: "Achievements", icon: Award },
            { id: "leaderboards", label: "Leaderboards", icon: Globe },
            { id: "offline", label: "Offline", icon: WifiOff },
            { id: "admin", label: "Console", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase flex items-center gap-1 transition-all ${
                  activeTab === tab.id
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* CORE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        {/* DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Greeting Panel */}
            <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl animate-premium-gradient">
              <div className="space-y-3 text-center md:text-left">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-emerald-500/20">
                  Daily Challenge active
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-wide">
                  Master the Soccer Pitch
                </h1>
                <p className="text-slate-300 text-sm max-w-lg leading-relaxed">
                  Join millions of scouts. Identify hidden stars, unlock tournament knockout tiers, build streaks, and dominate leaderboards!
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2 justify-center md:justify-start">
                  <button
                    onClick={handleStartDailyGame}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-5 py-3 rounded-xl transition-all shadow-md uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Star className="h-4 w-4 fill-current" /> Play Daily Challenge
                  </button>
                </div>
              </div>

              {/* Live Count */}
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-center min-w-[180px]">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Next Daily Reset</p>
                <p className="text-xl font-black text-emerald-400 font-mono mt-1">{timeLeftDaily}</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">1 Shared Player</p>
              </div>
            </div>

            {/* Quick Stats snippet */}
            <StatWidget user={user} />

            {/* Selection Grid for Unlimited Modes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <Layers className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-black text-white tracking-wide uppercase">Unlimited Pitch Replays</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left: Configuration options */}
                <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b border-slate-800 pb-2">
                    Pitch Filters
                  </h4>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                        Competition Mode
                      </label>
                      <select
                        value={gameMode}
                        onChange={(e) => setGameMode(e.target.value as GameMode)}
                        className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Premier League">Premier League</option>
                        <option value="La Liga">La Liga</option>
                        <option value="Serie A">Serie A</option>
                        <option value="Bundesliga">Bundesliga</option>
                        <option value="Ligue 1">Ligue 1</option>
                        <option value="All Leagues">All Leagues</option>
                        <option value="UEFA Mode">UEFA Champions/Europa</option>
                        <option value="FIFA Club World Cup">FIFA Club World Cup</option>
                        <option value="FIFA World Cup">FIFA World Cup</option>
                        <option value="Everything Mode">Everything Mode</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                        Difficulty Level
                      </label>
                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                        {["Easy", "Medium", "Hard"].map((level) => (
                          <button
                            key={level}
                            onClick={() => setDifficulty(level as Difficulty)}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                              difficulty === level
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartUnlimitedGame}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl text-xs tracking-wider uppercase transition-all shadow flex items-center justify-center gap-1.5"
                  >
                    Start Replay Game
                  </button>
                </div>

                {/* Right: Quick tips and active pool summary */}
                <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b border-slate-800 pb-2">
                      Competition Pool Overview
                    </h4>
                    <p className="text-xs text-slate-400 mt-2">
                      Currently loading <strong className="text-emerald-400 font-bold">{allPlayers.length} famous professional footballers</strong>. 
                      You have selected <strong className="text-white font-bold">{gameMode}</strong> under <strong className="text-white font-bold">{difficulty}</strong> tier.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-400 uppercase">Easy Tier Stars</span>
                        <p className="text-lg font-black text-white mt-1">Globally Famous</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-400 uppercase">Medium Tier Stars</span>
                        <p className="text-lg font-black text-white mt-1">First-Team Heroes</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/80 text-[11px] text-slate-400 mt-4">
                    💡 <strong>Pro Scout Hint:</strong> Pay close attention to comparison colors! Green means an exact match, yellow indicates a partial match (e.g. same continent or ex-club), and arrows indicate height, age, or shirt number differences.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PLAY (UNLIMITED GUESSING) VIEW */}
        {activeTab === "play" && targetPlayer && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Play header details */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex justify-between items-center shadow-lg">
              <div>
                <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">
                  Pitch Mode: {gameMode}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">Identify Hidden Footballer</h2>
              </div>
              <span className="text-xs font-bold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl uppercase border border-slate-700">
                Difficulty: {difficulty}
              </span>
            </div>

            {/* Input area */}
            {!gameEnded ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center">
                  Search & Guess Player
                </p>
                <AutocompleteSearch
                  players={allPlayers}
                  onSelectPlayer={handleGuessSubmit}
                  guessedPlayerIds={guesses.map((g) => g.id)}
                />
              </div>
            ) : (
              // WIN / DEFEAT MESSAGE
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-gold-gradient">
                {gameWon ? (
                  <>
                    <div className="inline-block bg-emerald-500/15 text-emerald-400 p-5 rounded-full animate-bounce">
                      <Trophy className="h-16 w-16" />
                    </div>
                    <h2 className="text-3xl font-black text-emerald-400 tracking-wide uppercase">
                      Congratulations!
                    </h2>
                    <p className="text-sm text-slate-300">
                      You identified <strong className="text-white">{targetPlayer.name}</strong> successfully in{" "}
                      <strong className="text-white">{guesses.length}</strong> attempts!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-block bg-rose-500/15 text-rose-400 p-5 rounded-full">
                      <Shield className="h-16 w-16" />
                    </div>
                    <h2 className="text-3xl font-black text-rose-400 tracking-wide uppercase">
                      Defeat! Max Guesses Exceeded
                    </h2>
                    <p className="text-sm text-slate-300">
                      You were unable to identify the footballer. The player was{" "}
                      <strong className="text-white">{targetPlayer.name}</strong> ({targetPlayer.club}).
                    </p>
                  </>
                )}

                {/* Target player detail card summary */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Club</span>
                    <p className="text-xs font-bold text-white">{targetPlayer.club}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Nationality</span>
                    <p className="text-xs font-bold text-white">{targetPlayer.nationality}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Height / Age</span>
                    <p className="text-xs font-bold text-white">{targetPlayer.height}cm / {targetPlayer.age}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Shirt Number</span>
                    <p className="text-xs font-bold text-white">#{targetPlayer.shirtNumber}</p>
                  </div>
                </div>

                {/* Required Buttons on Win/Game Over */}
                <div className="flex flex-wrap items-center justify-center gap-3 max-w-md mx-auto pt-2">
                  <button
                    onClick={handleStartUnlimitedGame}
                    className="flex-1 min-w-[120px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="flex-1 min-w-[120px] bg-slate-850 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    New Game
                  </button>
                  <button
                    onClick={() => setActiveTab("ranked")}
                    className="flex-1 min-w-[120px] bg-emerald-500/15 text-emerald-400 font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-500/25 transition-all"
                  >
                    Ranked Mode
                  </button>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="flex-1 min-w-[120px] bg-slate-950 hover:bg-slate-900 text-slate-400 font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Home
                  </button>
                </div>
              </div>
            )}

            {/* Hint reveal system (supports manual and automatic reveal) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
                Player Hint & Metric Board
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: "position", label: "Position" },
                  { id: "nationality", label: "Nationality" },
                  { id: "club", label: "Club" },
                  { id: "league", label: "League" },
                  { id: "shirtNumber", label: "Shirt Number" },
                  { id: "age", label: "Age" },
                  { id: "appearances", label: "Appearances" },
                ].map((hint) => {
                  const unlocked = isHintUnlocked(hint.id, guesses.length);
                  return (
                    <div
                      key={hint.id}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        unlocked
                          ? "bg-slate-950 border-emerald-500/30"
                          : "bg-slate-950/40 border-slate-850"
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">{hint.label}</span>
                      {unlocked ? (
                        <span className="text-xs font-bold text-emerald-400 mt-1 block">
                          {(targetPlayer as any)[hint.id]}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleManualUnlockHint(hint.id)}
                          className="mt-1 text-[9px] text-slate-400 font-bold bg-slate-850 hover:bg-slate-800 py-1 px-2.5 rounded border border-slate-750 uppercase tracking-widest transition-all"
                        >
                          Reveal
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-semibold">
                *Hints unlock automatically as guesses pile up, or click reveal manually!
              </p>
            </div>

            {/* Comparison Rows */}
            <div className="space-y-4">
              <h3 className="text-xs text-slate-400 font-black uppercase tracking-widest">
                Guesses Clues List ({guesses.length})
              </h3>
              {guesses.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-850 rounded-2xl text-slate-500 text-sm">
                  Search and select any famous player to view the clue rows.
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar">
                  {comparisons.map((comp, idx) => (
                    <ComparisonRow key={idx} comparison={comp} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DAILY CHALLENGE GAME MODE */}
        {activeTab === "daily" && dailyPlayer && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Daily stats summary panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
              <div>
                <span className="text-[10px] text-amber-400 font-black tracking-widest uppercase">
                  Daily Challenge
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">Identical Hidden Player for Everyone Today!</h2>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 uppercase font-semibold">Daily Streak</p>
                  <p className="text-sm font-bold text-white">{user.dailyStreak} Days 🔥</p>
                </div>
                <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 block">Next Reset</span>
                  <span className="text-xs font-black text-emerald-400 font-mono">{timeLeftDaily}</span>
                </div>
              </div>
            </div>

            {/* Input / results area */}
            {!dailyEnded ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center">
                  Search & Guess Today's Player
                </p>
                <AutocompleteSearch
                  players={allPlayers}
                  onSelectPlayer={handleDailyGuessSubmit}
                  guessedPlayerIds={dailyGuesses.map((g) => g.id)}
                />
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-gold-gradient">
                {dailyWon ? (
                  <>
                    <div className="inline-block bg-emerald-500/15 text-emerald-400 p-5 rounded-full animate-bounce">
                      <Trophy className="h-16 w-16" />
                    </div>
                    <h2 className="text-3xl font-black text-emerald-400 tracking-wide uppercase">
                      Daily Challenge Solved!
                    </h2>
                    <p className="text-sm text-slate-300">
                      Awesome effort! Today's hidden master was <strong className="text-white">{dailyPlayer.name}</strong>.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-block bg-rose-500/15 text-rose-400 p-5 rounded-full">
                      <Shield className="h-16 w-16" />
                    </div>
                    <h2 className="text-3xl font-black text-rose-400 tracking-wide uppercase">
                      Defeat! Challenge Failed
                    </h2>
                    <p className="text-sm text-slate-300">
                      The daily star was <strong className="text-white">{dailyPlayer.name}</strong> ({dailyPlayer.club}).
                    </p>
                  </>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 max-w-md mx-auto pt-2">
                  <button
                    onClick={() => setActiveTab("leaderboards")}
                    className="flex-1 min-w-[120px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    View Daily Leaderboards
                  </button>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="flex-1 min-w-[120px] bg-slate-850 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* Hints row */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
                Daily Board Hints
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: "position", label: "Position" },
                  { id: "nationality", label: "Nationality" },
                  { id: "club", label: "Club" },
                  { id: "league", label: "League" },
                ].map((hint) => {
                  const unlocked = isHintUnlocked(hint.id, dailyGuesses.length);
                  return (
                    <div
                      key={hint.id}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        unlocked
                          ? "bg-slate-950 border-emerald-500/30"
                          : "bg-slate-950/40 border-slate-850"
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">{hint.label}</span>
                      {unlocked ? (
                        <span className="text-xs font-bold text-emerald-400 mt-1 block">
                          {(dailyPlayer as any)[hint.id]}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleManualUnlockHint(hint.id)}
                          className="mt-1 text-[9px] text-slate-400 font-bold bg-slate-850 hover:bg-slate-800 py-1 px-2.5 rounded border border-slate-750 uppercase tracking-widest transition-all"
                        >
                          Reveal
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparisons list */}
            <div className="space-y-4">
              <h3 className="text-xs text-slate-400 font-black uppercase tracking-widest">
                Daily Guess Rows ({dailyGuesses.length})
              </h3>
              {dailyGuesses.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-850 rounded-2xl text-slate-500 text-sm">
                  Search and select today's footballer to view comparison tiles.
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar">
                  {dailyComparisons.map((comp, idx) => (
                    <ComparisonRow key={idx} comparison={comp} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RANKED ARENA VIEW */}
        {activeTab === "ranked" && (
          <div className="w-full">
            <RankedMatch
              user={user}
              onUpdateUser={setUser}
              allPlayers={allPlayers}
              onFinishMatch={() => setActiveTab("dashboard")}
            />
          </div>
        )}

        {/* TOURNAMENT BRACKETS VIEW */}
        {activeTab === "tournaments" && (
          <div className="w-full">
            <TournamentBrackets
              allPlayers={allPlayers}
              onBackToHome={() => setActiveTab("dashboard")}
            />
          </div>
        )}

        {/* ACHIEVEMENTS VIEW */}
        {activeTab === "achievements" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl animate-fade-in w-full">
            <div className="border-b border-slate-800 pb-5">
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-500 animate-spin-slow" />
                <h2 className="text-2xl font-black text-white tracking-wide uppercase">Your Unlockable Titles</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Maintain win streaks, claim Elo ranking goals, and solve puzzles to unlock premium accolades.
              </p>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ALL_ACHIEVEMENTS.map((ach) => {
                const isUnlocked = user.achievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-5 rounded-2xl border transition-all flex items-start space-x-4 ${
                      isUnlocked
                        ? "bg-emerald-950/15 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                        : "bg-slate-950/40 border-slate-850 opacity-60 hover:opacity-85"
                    }`}
                  >
                    <div className={`p-3.5 rounded-xl border ${
                      isUnlocked
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}>
                      <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-sm text-white">{ach.title}</h4>
                        {isUnlocked && (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-black uppercase">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEADERBOARDS VIEW */}
        {activeTab === "leaderboards" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl animate-fade-in w-full">
            <div className="border-b border-slate-800 pb-5">
              <div className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-emerald-400 animate-pulse" />
                <h2 className="text-2xl font-black text-white tracking-wide uppercase">Rankings and Standings</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                View real-time daily challenge and ranked arena performance lists. Leaderboards refresh automatically.
              </p>
            </div>

            {/* Leaderboards layout with 3 tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Leaderboard */}
              <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5">
                <h3 className="text-white font-extrabold text-base border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
                  <span>Today's Challenge Leaderboard</span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full uppercase font-bold">Auto Reset</span>
                </h3>

                <div className="space-y-2.5">
                  {[
                    { rank: 1, name: "Lionel M. (Barcelona)", score: "1 guess • 12s" },
                    { rank: 2, name: "Kylian M. (Madrid)", score: "2 guesses • 18s" },
                    { rank: 3, name: "Erling H. (Norway)", score: "2 guesses • 22s" },
                    { rank: 4, name: "Jude B. (Madrid)", score: "3 guesses • 31s" },
                    { rank: 5, name: "Your Rival AI", score: "4 guesses • 45s" },
                  ].map((lead, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900 border border-slate-850 p-3 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-black text-emerald-400">{lead.rank}</span>
                        <span className="text-xs font-bold text-slate-200">{lead.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{lead.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ranked Arena Leaderboard */}
              <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5">
                <h3 className="text-white font-extrabold text-base border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
                  <span>Global Ranked Leaderboard</span>
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2.5 py-0.5 rounded-full uppercase font-bold">Elo Rank</span>
                </h3>

                <div className="space-y-2.5">
                  {[
                    { rank: 1, name: "ScoutMaster99", rating: 2820, rankBadge: "GOAT" },
                    { rank: 2, name: "PitchTactician", rating: 2590, rankBadge: "Legend" },
                    { rank: 3, name: "FutVerseGod", rating: 2510, rankBadge: "Legend" },
                    { rank: 4, name: "BellinghamFan", rating: 2320, rankBadge: "Legend" },
                    { rank: 5, name: "DribbleExpert", rating: 2150, rankBadge: "Elite" },
                  ].map((lead, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900 border border-slate-850 p-3 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-black text-amber-500">{lead.rank}</span>
                        <span className="text-xs font-bold text-slate-200">{lead.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400">{lead.rating} Elo</span>
                        <span className="text-[9px] block text-slate-400 uppercase font-bold">{lead.rankBadge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OFFLINE MODE VIEW */}
        {activeTab === "offline" && (
          <div className="max-w-xl mx-auto space-y-6 text-center animate-fade-in pt-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 shadow-xl">
              <div className="inline-block bg-emerald-500/10 text-emerald-400 p-5 rounded-full">
                <Wifi className="h-12 w-12" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-wide">Offline Mode Active</h3>
                <p className="text-sm text-slate-400">
                  You are playing with our locally saved cached football player database. No external APIs or active connections are required!
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-left space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Cached Data Pools Sync Status: Synchronized ✔</span>
                </div>
                <p>• Local Database Pool Size: {allPlayers.length} famous stars available.</p>
                <p>• Game progress and win rates are saved locally to your browser disk.</p>
              </div>

              <button
                onClick={() => {
                  setGameMode("Everything Mode");
                  handleStartUnlimitedGame();
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow"
              >
                Launch Offline Replay Mode
              </button>
            </div>
          </div>
        )}

        {/* ADMIN/CONSCIOLE DASHBOARD VIEW */}
        {activeTab === "admin" && (
          <div className="w-full">
            <AdminDashboard
              onRefreshPlayers={refreshPlayersFromDB}
              allPlayers={allPlayers}
            />
          </div>
        )}
      </main>

      {/* AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md space-y-5 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-extrabold text-sm"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-wide">
                {isSignUp ? "Create FutVerse ID" : "Access FutVerse ID"}
              </h3>
              <p className="text-xs text-slate-400">
                Access your global leaderboard placements, streak histories, achievements, and Elo rating rank!
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wide">Scout Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., TacticalScout"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wide">Scout Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="scout@futverse.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wide">Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                {isSignUp ? "Sign Up & Sync" : "Access Account"}
              </button>

              <button
                type="button"
                onClick={() => {
                  // Simulate google auth
                  setUser({
                    ...DEFAULT_USER,
                    email: "starscout_google@gmail.com",
                    name: "Google Guesser",
                  });
                  saveActiveUser({
                    ...DEFAULT_USER,
                    email: "starscout_google@gmail.com",
                    name: "Google Guesser",
                  });
                  setIsAuthModalOpen(false);
                }}
                className="w-full bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all border border-slate-800 flex items-center justify-center gap-2"
              >
                <Globe className="h-4 w-4 text-red-400" /> Sign In with Google
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-bold underline"
              >
                {isSignUp ? "Already registered? Sign In here" : "Don't have a scout card? Register here"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
