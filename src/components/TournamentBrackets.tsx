import React, { useState } from "react";
import { Tournament, saveTournaments, getTournaments } from "../utils/storage";
import { Player } from "../data/players";
import { comparePlayers, PlayerComparison } from "../utils/gameHelpers";
import { AutocompleteSearch } from "./AutocompleteSearch";
import { ComparisonRow } from "./ComparisonRow";
import { Trophy, Users, ShieldAlert, Award, ChevronRight, Check, Compass, Star } from "lucide-react";

interface TournamentBracketsProps {
  allPlayers: Player[];
  onBackToHome: () => void;
}

export const TournamentBrackets: React.FC<TournamentBracketsProps> = ({ allPlayers, onBackToHome }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(getTournaments());
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(tournaments[0]?.id || "");

  // Active match flow states
  const [activeMatch, setActiveMatch] = useState<{
    tourneyId: string;
    matchId: string;
    player1: string;
    player2: string;
    targetPlayer: Player;
    roundIndex: number;
  } | null>(null);

  const [playerGuesses, setPlayerGuesses] = useState<Player[]>([]);
  const [playerComparisons, setPlayerComparisons] = useState<PlayerComparison[]>([]);
  const [isMatchEnded, setIsMatchEnded] = useState(false);
  const [matchWinnerName, setMatchWinnerName] = useState("");

  const selectedTourney = tournaments.find((t) => t.id === selectedTourneyId);

  const handleStartMatch = (match: any, roundIndex: number) => {
    // Find target player in database
    const target = allPlayers.find((p) => p.name === match.targetPlayerName) || allPlayers[0];

    setActiveMatch({
      tourneyId: selectedTourneyId,
      matchId: match.id,
      player1: match.player1,
      player2: match.player2,
      targetPlayer: target,
      roundIndex,
    });

    setPlayerGuesses([]);
    setPlayerComparisons([]);
    setIsMatchEnded(false);
    setMatchWinnerName("");
  };

  const handleGuess = (guessed: Player) => {
    if (!activeMatch || isMatchEnded) return;

    const updated = [...playerGuesses, guessed];
    setPlayerGuesses(updated);

    const comp = comparePlayers(guessed, activeMatch.targetPlayer);
    setPlayerComparisons((prev) => [comp, ...prev]);

    if (guessed.id === activeMatch.targetPlayer.id) {
      // User wins match!
      setIsMatchEnded(true);
      setMatchWinnerName(activeMatch.player1); // User is player1
      resolveTournamentMatch(activeMatch.tourneyId, activeMatch.roundIndex, activeMatch.matchId, 2, 0, activeMatch.player1);
    } else if (updated.length >= 8) {
      // User fails, opponent wins match
      setIsMatchEnded(true);
      setMatchWinnerName(activeMatch.player2);
      resolveTournamentMatch(activeMatch.tourneyId, activeMatch.roundIndex, activeMatch.matchId, 0, 2, activeMatch.player2);
    }
  };

  const resolveTournamentMatch = (
    tourneyId: string,
    roundIndex: number,
    matchId: string,
    score1: number,
    score2: number,
    winner: string
  ) => {
    const updatedTourneys = tournaments.map((t) => {
      if (t.id !== tourneyId) return t;

      const updatedRounds = t.rounds.map((round, rIdx) => {
        if (rIdx !== roundIndex) return round;

        const updatedMatches = round.matches.map((m) => {
          if (m.id !== matchId) return m;
          return { ...m, score1, score2, winner };
        });

        return { ...round, matches: updatedMatches };
      });

      return { ...t, rounds: updatedRounds };
    });

    setTournaments(updatedTourneys);
    saveTournaments(updatedTourneys);
  };

  const handleAutoSimulateRest = () => {
    if (!selectedTourneyId) return;

    const updatedTourneys = tournaments.map((t) => {
      if (t.id !== selectedTourneyId) return t;
      if (t.status === "completed") return t;

      const currentRoundIndex = t.rounds.length - 1;
      const currentRound = t.rounds[currentRoundIndex];

      // Resolve matches of current round
      const resolvedMatches = currentRound.matches.map((m) => {
        if (m.winner) return m;
        const score1 = Math.floor(Math.random() * 3);
        const score2 = Math.floor(Math.random() * 3);
        const winner = score1 >= score2 ? m.player1 : m.player2;
        return { ...m, score1, score2, winner };
      });

      const updatedRounds = [...t.rounds];
      updatedRounds[currentRoundIndex] = { ...currentRound, matches: resolvedMatches };

      const winners = resolvedMatches.map((m) => m.winner as string);

      if (winners.length === 4) {
        // Create Semi-finals
        updatedRounds.push({
          roundIndex: 1,
          matches: [
            { id: `tsf1-${Date.now()}`, player1: winners[0], player2: winners[1], targetPlayerName: "Mohamed Salah" },
            { id: `tsf2-${Date.now()}`, player1: winners[2], player2: winners[3], targetPlayerName: "Bukayo Saka" },
          ],
        });
        return { ...t, rounds: updatedRounds, status: "active" as const };
      } else if (winners.length === 2) {
        // Create Finals
        updatedRounds.push({
          roundIndex: 2,
          matches: [
            { id: `tf-${Date.now()}`, player1: winners[0], player2: winners[1], targetPlayerName: "Harry Kane" },
          ],
        });
        return { ...t, rounds: updatedRounds, status: "active" as const };
      } else if (winners.length === 1) {
        // Completed
        return { ...t, rounds: updatedRounds, status: "completed" as const, winner: winners[0] };
      }

      return { ...t, rounds: updatedRounds, status: "active" as const };
    });

    setTournaments(updatedTourneys);
    saveTournaments(updatedTourneys);
  };

  const getRoundLabel = (index: number) => {
    if (index === 0) return "Quarter-Finals";
    if (index === 1) return "Semi-Finals";
    return "Knockout Final";
  };

  return (
    <div className="w-full">
      {activeMatch && activeMatch.targetPlayer ? (
        // ACTIVE MATCH SCREEN
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-6 shadow-2xl animate-fade-in">
          <div className="text-center space-y-2 border-b border-slate-800 pb-4">
            <span className="text-[10px] text-red-500 font-extrabold tracking-widest uppercase">
              Tournament Match • {getRoundLabel(activeMatch.roundIndex)}
            </span>
            <h3 className="text-white text-2xl font-black">
              {activeMatch.player1} <span className="text-red-500">vs</span> {activeMatch.player2}
            </h3>
            <p className="text-xs text-slate-400">
              Guess the hidden tournament footballer in fewer than 8 attempts to secure victory!
            </p>
          </div>

          {!isMatchEnded ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center">Enter your guess</p>
              <AutocompleteSearch
                players={allPlayers}
                onSelectPlayer={handleGuess}
                guessedPlayerIds={playerGuesses.map((p) => p.id)}
              />
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              {matchWinnerName === "You" ? (
                <>
                  <Trophy className="h-14 w-14 text-yellow-500 mx-auto animate-bounce" />
                  <h4 className="text-emerald-400 text-xl font-bold">You Won and Advanced!</h4>
                  <p className="text-sm text-slate-300">
                    Excellent display! You correctly identified <strong className="text-white">{activeMatch.targetPlayer.name}</strong>.
                  </p>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-14 w-14 text-red-500 mx-auto" />
                  <h4 className="text-red-500 text-xl font-bold">Defeat! Eliminated</h4>
                  <p className="text-sm text-slate-300">
                    Your opponent guessed faster! The target was <strong className="text-white">{activeMatch.targetPlayer.name}</strong>.
                  </p>
                </>
              )}

              <button
                onClick={() => setActiveMatch(null)}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all inline-flex items-center gap-1"
              >
                Return to Bracket <Check className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Guesses details list */}
          <div className="space-y-4">
            <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your Guess Matrix ({playerGuesses.length})</h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
              {playerComparisons.map((comp, idx) => (
                <ComparisonRow key={idx} comparison={comp} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        // BRACKET DISPLAY
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h2 className="text-2xl font-black text-white tracking-wide uppercase">FutVerse Knockout Cup</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Compete against top computer simulations or other players to win exclusive configured rewards.
              </p>
            </div>

            {/* Select Tournament dropdown */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedTourneyId}
                onChange={(e) => setSelectedTourneyId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-red-500"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAutoSimulateRest}
                className="bg-slate-850 hover:bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all border border-slate-750"
              >
                Simulate Rounds
              </button>
            </div>
          </div>

          {selectedTourney ? (
            <div className="space-y-6">
              {/* Prize ribbon */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-500/10 text-yellow-500 p-2.5 rounded-xl border border-yellow-500/20">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Reward Configuration</p>
                    <h4 className="text-white text-sm font-bold mt-0.5">{selectedTourney.prize}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                  <span className={`text-xs font-black uppercase tracking-wider ${
                    selectedTourney.status === "completed" ? "text-emerald-400" : "text-amber-500"
                  }`}>
                    {selectedTourney.status}
                  </span>
                </div>
              </div>

              {/* Bracket grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {selectedTourney.rounds.map((round, rIdx) => (
                  <div key={rIdx} className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
                      {getRoundLabel(round.roundIndex)}
                    </h4>

                    <div className="space-y-3">
                      {round.matches.map((m) => (
                        <div
                          key={m.id}
                          className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl p-3.5 space-y-2.5 transition-all shadow-md"
                        >
                          <div className="space-y-1.5">
                            {/* Player 1 slot */}
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold truncate max-w-[130px] ${
                                m.winner === m.player1 ? "text-emerald-400 font-black" : "text-slate-300"
                              }`}>
                                {m.player1}
                              </span>
                              <span className="text-xs font-bold text-slate-400">{m.score1 !== undefined ? m.score1 : "-"}</span>
                            </div>

                            {/* Player 2 slot */}
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold truncate max-w-[130px] ${
                                m.winner === m.player2 ? "text-emerald-400 font-black" : "text-slate-300"
                              }`}>
                                {m.player2}
                              </span>
                              <span className="text-xs font-bold text-slate-400">{m.score2 !== undefined ? m.score2 : "-"}</span>
                            </div>
                          </div>

                          {/* Action button */}
                          {!m.winner && (m.player1 === "You" || m.player2 === "You") ? (
                            <button
                              onClick={() => handleStartMatch(m, round.roundIndex)}
                              className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] py-1.5 rounded-lg transition-all uppercase tracking-wider"
                            >
                              Play Your Match
                            </button>
                          ) : m.winner ? (
                            <div className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-widest text-right">
                              Winner: {m.winner} ✔
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest text-center">
                              Scheduled
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedTourney.status === "completed" && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center max-w-sm mx-auto space-y-2 animate-pulse-once">
                  <Trophy className="h-10 w-10 text-yellow-500 mx-auto" />
                  <h4 className="text-white font-bold text-base">Tournament Champion Winner!</h4>
                  <p className="text-xs text-slate-400">
                    The trophy is awarded to <strong className="text-white text-sm font-black">{selectedTourney.winner}</strong>!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              No tournaments registered in storage. Create one in the admin dashboard!
            </div>
          )}

          <div className="text-center">
            <button
              onClick={onBackToHome}
              className="text-xs text-slate-400 hover:text-white font-bold underline transition-colors"
            >
              Return to Landing Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
