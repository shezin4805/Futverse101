import React, { useState, useEffect, useRef } from "react";
import { Player } from "../data/players";
import { AutocompleteSearch } from "./AutocompleteSearch";
import { ComparisonRow } from "./ComparisonRow";
import { comparePlayers, PlayerComparison, calculateElo, getRankFromRating } from "../utils/gameHelpers";
import { UserAccount, saveActiveUser, MatchHistoryItem, getMatchHistory, saveMatchHistory } from "../utils/storage";
import { Users, Timer, Trophy, Check, ArrowRight, ShieldAlert, Zap, Compass, Star, Play } from "lucide-react";

interface RankedMatchProps {
  user: UserAccount;
  onUpdateUser: (updated: UserAccount) => void;
  allPlayers: Player[];
  onFinishMatch: () => void;
}

const OPPONENTS = [
  { name: "Erling H.", rating: 1150 },
  { name: "Kylian M.", rating: 1350 },
  { name: "Jude B.", rating: 1220 },
  { name: "Mohamed S.", rating: 1410 },
  { name: "Kevin D.", rating: 1480 },
  { name: "Bukayo S.", rating: 1290 },
  { name: "Virgil V.", rating: 1520 },
  { name: "Rodri G.", rating: 1610 },
  { name: "Luka M.", rating: 1700 },
  { name: "Neymar Jr.", rating: 1850 },
];

export const RankedMatch: React.FC<RankedMatchProps> = ({
  user,
  onUpdateUser,
  allPlayers,
  onFinishMatch,
}) => {
  // Multiplayer Stages: "lobby" | "matchmaking" | "round_playing" | "round_results" | "match_results"
  const [stage, setStage] = useState<"lobby" | "matchmaking" | "round_playing" | "round_results" | "match_results">("lobby");
  const [matchmakingProgress, setMatchmakingProgress] = useState(0);

  // Opponent detail
  const [opponent, setOpponent] = useState<{ name: string; rating: number } | null>(null);

  // Match details (Best of 3 rounds)
  const [currentRound, setCurrentRound] = useState(1);
  const [playerRoundWins, setPlayerRoundWins] = useState(0);
  const [opponentRoundWins, setOpponentRoundWins] = useState(0);
  const [roundWinner, setRoundWinner] = useState<"player" | "opponent" | "draw" | null>(null);

  // Game/Round details
  const [targetPlayer, setTargetPlayer] = useState<Player | null>(null);
  const [playerGuesses, setPlayerGuesses] = useState<Player[]>([]);
  const [playerComparisons, setPlayerComparisons] = useState<PlayerComparison[]>([]);
  const [opponentGuesses, setOpponentGuesses] = useState<{ name: string; matchCount: number }[]>([]);
  const [roundTime, setRoundTime] = useState(0);
  const [isRoundEnded, setIsRoundEnded] = useState(false);

  // Elo rating updates at the end
  const [eloChange, setEloChange] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  // Sound effects: none (as requested)
  // Use timers for matchmaking and round progression
  const timerRef = useRef<any>(null);
  const opponentGuessTimerRef = useRef<any>(null);

  // Matchmaking effect
  useEffect(() => {
    if (stage === "matchmaking") {
      setMatchmakingProgress(0);
      const interval = setInterval(() => {
        setMatchmakingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // Select suitable opponent based on user's rating
            const sortedByRatingDiff = [...OPPONENTS].sort(
              (a, b) => Math.abs(a.rating - user.rating) - Math.abs(b.rating - user.rating)
            );
            const selectedOpponent = sortedByRatingDiff[0] || OPPONENTS[0];
            setOpponent(selectedOpponent);
            setStage("round_playing");
            startNewRound(1);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [stage, user.rating]);

  // Round timer effect
  useEffect(() => {
    if (stage === "round_playing" && !isRoundEnded) {
      timerRef.current = setInterval(() => {
        setRoundTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, isRoundEnded]);

  // Opponent simulated guesses effect
  useEffect(() => {
    if (stage === "round_playing" && !isRoundEnded && targetPlayer) {
      // Opponent makes a guess every 10 to 18 seconds
      const delay = Math.random() * 8000 + 10000;
      opponentGuessTimerRef.current = setTimeout(() => {
        simulateOpponentGuess();
      }, delay);
    } else {
      if (opponentGuessTimerRef.current) clearTimeout(opponentGuessTimerRef.current);
    }

    return () => {
      if (opponentGuessTimerRef.current) clearTimeout(opponentGuessTimerRef.current);
    };
  }, [stage, isRoundEnded, targetPlayer, opponentGuesses]);

  const startNewRound = (roundNum: number) => {
    setCurrentRound(roundNum);
    setPlayerGuesses([]);
    setPlayerComparisons([]);
    setOpponentGuesses([]);
    setRoundTime(0);
    setIsRoundEnded(false);
    setRoundWinner(null);

    // Filter target players - easy or medium stars for multiplayer
    const targetPool = allPlayers.filter((p) => p.difficulty !== "Hard");
    const randomIndex = Math.floor(Math.random() * targetPool.length);
    setTargetPlayer(targetPool[randomIndex] || allPlayers[0]);
  };

  const simulateOpponentGuess = () => {
    if (!targetPlayer || isRoundEnded) return;

    // Filter potential guessed players
    const otherPlayers = allPlayers.filter((p) => p.id !== targetPlayer.id);
    const isCorrectGuess = Math.random() < 0.2 + (opponent?.rating ? opponent.rating / 5000 : 0.2); // Better opponents guess faster and more accurately

    if (isCorrectGuess) {
      // Opponent gets it correct!
      setOpponentGuesses((prev) => [
        ...prev,
        { name: targetPlayer.name, matchCount: 9 },
      ]);
      endRound("opponent");
    } else {
      // Opponent makes a semi-accurate guess
      const randomOpponentGuess = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
      const comp = comparePlayers(randomOpponentGuess, targetPlayer);
      let matchCount = 0;
      if (comp.nationality.status === "correct") matchCount++;
      if (comp.club.status === "correct") matchCount++;
      if (comp.league.status === "correct") matchCount++;
      if (comp.position.status === "correct") matchCount++;

      setOpponentGuesses((prev) => [
        ...prev,
        { name: randomOpponentGuess.name, matchCount },
      ]);

      // Schedule another guess
      const nextDelay = Math.random() * 8000 + 10000;
      opponentGuessTimerRef.current = setTimeout(() => {
        simulateOpponentGuess();
      }, nextDelay);
    }
  };

  const handlePlayerGuess = (guessed: Player) => {
    if (!targetPlayer || isRoundEnded) return;

    const updatedGuesses = [...playerGuesses, guessed];
    setPlayerGuesses(updatedGuesses);

    const comp = comparePlayers(guessed, targetPlayer);
    setPlayerComparisons((prev) => [comp, ...prev]);

    if (guessed.id === targetPlayer.id) {
      // Player wins the round!
      endRound("player");
    } else if (updatedGuesses.length >= 8) {
      // Max guesses exceeded
      endRound("draw");
    }
  };

  const endRound = (winner: "player" | "opponent" | "draw") => {
    setIsRoundEnded(true);
    setRoundWinner(winner);

    if (winner === "player") {
      setPlayerRoundWins((p) => p + 1);
    } else if (winner === "opponent") {
      setOpponentRoundWins((o) => o + 1);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (opponentGuessTimerRef.current) clearTimeout(opponentGuessTimerRef.current);
  };

  const handleNextRound = () => {
    const nextRoundIndex = currentRound + 1;

    // Check if match has finished (Best of 3)
    const isMatchEnded =
      playerRoundWins >= 2 ||
      opponentRoundWins >= 2 ||
      (nextRoundIndex > 3 && playerRoundWins !== opponentRoundWins) ||
      nextRoundIndex > 3;

    if (isMatchEnded) {
      resolveMatch();
    } else {
      setStage("round_playing");
      startNewRound(nextRoundIndex);
    }
  };

  const resolveMatch = () => {
    setStage("match_results");

    const playerWonMatch = playerRoundWins > opponentRoundWins;
    const isDrawMatch = playerRoundWins === opponentRoundWins;

    // Calculate rating changes
    const won = playerWonMatch;
    const solvedWithoutHints = playerGuesses.length < 5; // Simulating hintless
    const solvedQuickly = roundTime < 45;

    let ratingPoints = 0;
    if (playerWonMatch) {
      ratingPoints = 25;
      if (solvedWithoutHints) ratingPoints += 5;
      if (solvedQuickly) ratingPoints += 5;
    } else if (isDrawMatch) {
      ratingPoints = 10;
    } else {
      ratingPoints = -15;
    }

    const newRating = Math.max(100, user.rating + ratingPoints);
    const newPlacementCount = user.placementMatchesCount + 1;

    // Update user stats
    const updatedUser: UserAccount = {
      ...user,
      rating: newRating,
      placementMatchesCount: newPlacementCount,
      gamesPlayed: user.gamesPlayed + 1,
      wins: playerWonMatch ? user.wins + 1 : user.wins,
      losses: !playerWonMatch && !isDrawMatch ? user.losses + 1 : user.losses,
      draws: isDrawMatch ? user.draws + 1 : user.draws,
      currentStreak: playerWonMatch ? user.currentStreak + 1 : 0,
      highestStreak: Math.max(user.highestStreak, playerWonMatch ? user.currentStreak + 1 : 0),
    };

    onUpdateUser(updatedUser);
    saveActiveUser(updatedUser);
    setEloChange(ratingPoints);

    // Save to match history
    const historyItem: MatchHistoryItem = {
      id: `match-${Date.now()}`,
      opponent: opponent?.name || "AI Opponent",
      opponentRating: opponent?.rating || 1000,
      playerScore: playerRoundWins,
      opponentScore: opponentRoundWins,
      rounds: [], // Simple placeholder for history
      ratingChange: ratingPoints,
      date: new Date().toLocaleDateString(),
    };

    const history = getMatchHistory();
    saveMatchHistory([historyItem, ...history]);
  };

  return (
    <div className="w-full">
      {/* LOBBY VIEW */}
      {stage === "lobby" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6 shadow-xl animate-fade-in">
          <div className="mx-auto bg-emerald-500/10 text-emerald-400 p-4 rounded-full w-16 h-16 flex items-center justify-center">
            <Users className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-wide uppercase">FutVerse Arena</h2>
            <p className="text-sm text-slate-400">
              Compete live head-to-head in real-time. Guess the same footballer as your opponent. Best of 3 rounds wins.
            </p>
          </div>

          {/* Rank Badge */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex justify-between items-center text-left">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Rating Rank</p>
              <h3 className="text-white text-xl font-extrabold mt-0.5">{getRankFromRating(user.rating)}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Elo Rating</p>
              <span className="text-emerald-400 text-2xl font-black">{user.rating}</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs text-left text-slate-400 space-y-1">
            <p className="font-bold text-slate-300">🎮 Match Rules:</p>
            <p>• Placement Matches: {user.placementMatchesCount}/10 matches completed</p>
            <p>• Winning a match boosts your Elo rating by +25. Defeat lowers it by -15.</p>
            <p>• Solved without using hints or very quickly adds a bonus of +5 points.</p>
          </div>

          <button
            onClick={() => setStage("matchmaking")}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 px-6 rounded-2xl text-base tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
          >
            <Play className="h-5 w-5 fill-current" /> Match Me Now
          </button>
        </div>
      )}

      {/* MATCHMAKING VIEW */}
      {stage === "matchmaking" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 max-w-xl mx-auto text-center space-y-8 shadow-xl animate-pulse">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-emerald-500 border-r-emerald-500 rounded-full animate-spin"></div>
            <Users className="h-10 w-10 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white uppercase tracking-wider">Finding Match...</h3>
            <p className="text-sm text-slate-400">Searching within rating band {user.rating - 150} - {user.rating + 150}</p>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-850">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${matchmakingProgress}%` }}
            ></div>
          </div>

          <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Connecting to FutVerse Pitch</p>
        </div>
      )}

      {/* ROUND PLAYING VIEW */}
      {stage === "round_playing" && targetPlayer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Game panel */}
          <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            {/* Round info bar */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800/60">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Ranked Match • Round {currentRound}/3</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <h3 className="text-white text-xl font-black">Score: {playerRoundWins} - {opponentRoundWins}</h3>
                </div>
              </div>

              <div className="flex items-center bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 space-x-2">
                <Timer className="h-4 w-4 text-emerald-400 animate-spin-slow" />
                <span className="text-white font-bold text-sm tracking-widest">{roundTime}s</span>
              </div>
            </div>

            {/* Input bar */}
            {!isRoundEnded ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Who is the hidden footballer?</p>
                <AutocompleteSearch
                  players={allPlayers}
                  onSelectPlayer={handlePlayerGuess}
                  guessedPlayerIds={playerGuesses.map((p) => p.id)}
                />
              </div>
            ) : (
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-3">
                <Check className="h-8 w-8 text-emerald-400 mx-auto" />
                <h4 className="text-white font-bold text-lg">
                  Round Resolved: {roundWinner === "player" ? "You Won!" : roundWinner === "opponent" ? `${opponent?.name} Won!` : "Draw!"}
                </h4>
                <p className="text-xs text-slate-400">
                  The hidden footballer was <strong className="text-white">{targetPlayer.name}</strong> ({targetPlayer.club})
                </p>
                <button
                  onClick={() => {
                    setStage("round_results");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-5 rounded-xl transition-colors inline-flex items-center gap-1"
                >
                  Continue to Results <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Guesses comparison rows */}
            <div className="space-y-4">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your Comparison Clues ({playerGuesses.length})</h4>
              {playerGuesses.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
                  Make a guess in the search bar above to generate football metric comparison clues!
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                  {playerComparisons.map((comp, idx) => (
                    <ComparisonRow key={idx} comparison={comp} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Opponent side monitoring feed */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-850">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">{opponent?.name}</h4>
                <p className="text-[10px] text-slate-400">Opponent • Rating: {opponent?.rating}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Opponent Live Activity Feed</h5>
              {opponentGuesses.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  Opponent is analysing and planning their first pitch transfer...
                </div>
              ) : (
                <div className="space-y-2.5">
                  {opponentGuesses.map((g, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center animate-fade-in-down">
                      <div>
                        <p className="text-xs text-slate-400">Guessed</p>
                        <p className="text-white font-bold text-xs mt-0.5">{g.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold">
                          {g.matchCount}/9 matches
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROUND RESULTS VIEW */}
      {stage === "round_results" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6 shadow-xl animate-fade-in">
          <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
          <h2 className="text-2xl font-black text-white uppercase tracking-wide">
            Round {currentRound} Resolved
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold uppercase">Your Guess Count</p>
              <p className="text-2xl font-black text-white mt-1">{playerGuesses.length}</p>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold uppercase">Opponent Guess Count</p>
              <p className="text-2xl font-black text-white mt-1">{opponentGuesses.length}</p>
            </div>
          </div>

          <p className="text-sm text-slate-300">
            Current Match Progression Standings:<br />
            You: <strong className="text-emerald-400 font-bold">{playerRoundWins}</strong> | {opponent?.name}: <strong className="text-red-400 font-bold">{opponentRoundWins}</strong>
          </p>

          <button
            onClick={handleNextRound}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            Advance to Next Pitch <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MATCH RESULTS VIEW */}
      {stage === "match_results" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6 shadow-xl animate-fade-in">
          {playerRoundWins > opponentRoundWins ? (
            <div className="space-y-4">
              <div className="inline-block bg-emerald-500/15 text-emerald-400 p-5 rounded-full animate-bounce">
                <Trophy className="h-16 w-16" />
              </div>
              <h2 className="text-3xl font-black text-emerald-400 tracking-wide uppercase">Match Victory!</h2>
              <p className="text-sm text-slate-300">
                Congratulations! You outperformed {opponent?.name} with a round score of {playerRoundWins} - {opponentRoundWins}.
              </p>
            </div>
          ) : playerRoundWins === opponentRoundWins ? (
            <div className="space-y-4">
              <div className="inline-block bg-amber-500/15 text-amber-400 p-5 rounded-full">
                <Compass className="h-16 w-16" />
              </div>
              <h2 className="text-3xl font-black text-amber-400 tracking-wide uppercase">Match Draw!</h2>
              <p className="text-sm text-slate-300">
                You tied with {opponent?.name} at {playerRoundWins} - {opponentRoundWins}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-block bg-rose-500/15 text-rose-400 p-5 rounded-full">
                <ShieldAlert className="h-16 w-16" />
              </div>
              <h2 className="text-3xl font-black text-rose-400 tracking-wide uppercase">Match Defeat</h2>
              <p className="text-sm text-slate-300">
                {opponent?.name} won the best of 3 with a round score of {opponentRoundWins} - {playerRoundWins}. Keep training!
              </p>
            </div>
          )}

          {/* Elo change animation */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center justify-between text-left">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Elo Rating Updated</p>
              <h4 className="text-white text-lg font-bold mt-1">
                {user.rating} <span className="text-xs text-slate-400 font-normal">({getRankFromRating(user.rating)})</span>
              </h4>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-black ${eloChange >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                {eloChange >= 0 ? `+${eloChange}` : eloChange} Elo
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setStage("lobby");
                setPlayerRoundWins(0);
                setOpponentRoundWins(0);
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all"
            >
              Play Again
            </button>
            <button
              onClick={onFinishMatch}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-4 rounded-xl text-sm transition-all"
            >
              Exit to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
