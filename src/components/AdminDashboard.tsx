import React, { useState } from "react";
import { Player } from "../data/players";
import { getCustomPlayers, saveCustomPlayers, getTournaments, saveTournaments, Tournament } from "../utils/storage";
import { Plus, Trash, Edit, Check, Settings, Shield, Award, Calendar, Users, Eye, EyeOff } from "lucide-react";

interface AdminDashboardProps {
  onRefreshPlayers: () => void;
  allPlayers: Player[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onRefreshPlayers, allPlayers }) => {
  const [customPlayers, setCustomPlayers] = useState<Player[]>(getCustomPlayers());
  const [tournaments, setTournaments] = useState<Tournament[]>(getTournaments());
  const [activeTab, setActiveTab] = useState<"players" | "tournaments" | "rewards">("players");

  // Form states for player
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerNationality, setPlayerNationality] = useState("");
  const [playerClub, setPlayerClub] = useState("");
  const [playerLeague, setPlayerLeague] = useState("Premier League");
  const [playerPosition, setPlayerPosition] = useState("ST");
  const [playerPositionGroup, setPlayerPositionGroup] = useState<"GK" | "DF" | "MF" | "FW">("FW");
  const [playerShirtNumber, setPlayerShirtNumber] = useState(9);
  const [playerAge, setPlayerAge] = useState(25);
  const [playerHeight, setPlayerHeight] = useState(180);
  const [playerFoot, setPlayerFoot] = useState<"Left" | "Right" | "Ambidextrous">("Right");
  const [playerValue, setPlayerValue] = useState("€50M");
  const [playerTransferHistory, setPlayerTransferHistory] = useState("");
  const [playerCompetitions, setPlayerCompetitions] = useState("Premier League, UEFA Champions League");
  const [playerDifficulty, setPlayerDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");

  // Form states for tournament
  const [tourneyName, setTourneyName] = useState("");
  const [tourneyPrize, setTourneyPrize] = useState("Gold Trophy + €50M budget");
  const [tourneyCompetitors, setTourneyCompetitors] = useState("You, Mbappe, Haaland, Bellingham, Saka, Rodri, Kane, Messi");

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Reset form
  const resetPlayerForm = () => {
    setEditingPlayerId(null);
    setPlayerName("");
    setPlayerNationality("");
    setPlayerClub("");
    setPlayerLeague("Premier League");
    setPlayerPosition("ST");
    setPlayerPositionGroup("FW");
    setPlayerShirtNumber(9);
    setPlayerAge(25);
    setPlayerHeight(180);
    setPlayerFoot("Right");
    setPlayerValue("€50M");
    setPlayerTransferHistory("");
    setPlayerCompetitions("Premier League, UEFA Champions League");
    setPlayerDifficulty("Medium");
  };

  // Player CRUD
  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !playerNationality || !playerClub) {
      showMessage("Please fill out name, nationality, and club!", "error");
      return;
    }

    const newPlayer: Player = {
      id: editingPlayerId || `custom-${Date.now()}`,
      name: playerName,
      nationality: playerNationality,
      continent: "Europe", // Standard default
      club: playerClub,
      league: playerLeague,
      position: playerPosition,
      positionGroup: playerPositionGroup,
      shirtNumber: Number(playerShirtNumber),
      age: Number(playerAge),
      height: Number(playerHeight),
      dominantFoot: playerFoot,
      season: "2024-2025",
      appearances: 35,
      goals: playerPositionGroup === "FW" ? 18 : 2,
      assists: playerPositionGroup === "FW" ? 8 : 4,
      marketValue: playerValue,
      marketValueNumeric: parseFloat(playerValue.replace(/[^0-9.]/g, "")) || 50,
      transferHistory: playerTransferHistory ? playerTransferHistory.split(",").map(c => c.trim()) : [playerClub],
      competitions: playerCompetitions.split(",").map(c => c.trim()),
      difficulty: playerDifficulty,
    };

    let updatedList: Player[];
    if (editingPlayerId) {
      updatedList = customPlayers.map((p) => (p.id === editingPlayerId ? newPlayer : p));
      showMessage("Player details updated successfully!");
    } else {
      updatedList = [...customPlayers, newPlayer];
      showMessage("New custom player added successfully!");
    }

    setCustomPlayers(updatedList);
    saveCustomPlayers(updatedList);
    onRefreshPlayers();
    resetPlayerForm();
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setPlayerName(player.name);
    setPlayerNationality(player.nationality);
    setPlayerClub(player.club);
    setPlayerLeague(player.league);
    setPlayerPosition(player.position);
    setPlayerPositionGroup(player.positionGroup);
    setPlayerShirtNumber(player.shirtNumber);
    setPlayerAge(player.age);
    setPlayerHeight(player.height);
    setPlayerFoot(player.dominantFoot);
    setPlayerValue(player.marketValue);
    setPlayerTransferHistory(player.transferHistory.join(", "));
    setPlayerCompetitions(player.competitions.join(", "));
    setPlayerDifficulty(player.difficulty);
  };

  const handleDeletePlayer = (id: string) => {
    if (confirm("Are you sure you want to delete this custom player?")) {
      const updatedList = customPlayers.filter((p) => p.id !== id);
      setCustomPlayers(updatedList);
      saveCustomPlayers(updatedList);
      onRefreshPlayers();
      showMessage("Player removed from database.");
    }
  };

  // Tournament Administration
  const handleScheduleTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourneyName) {
      showMessage("Tournament name is required!", "error");
      return;
    }

    const competitorsList = tourneyCompetitors.split(",").map(c => c.trim()).filter(Boolean);
    if (competitorsList.length !== 8) {
      showMessage("Knockout bracket requires exactly 8 competitors!", "error");
      return;
    }

    const newTournament: Tournament = {
      id: `tourney-${Date.now()}`,
      name: tourneyName,
      status: "scheduled",
      competitors: competitorsList,
      prize: tourneyPrize,
      rounds: [
        {
          roundIndex: 0,
          matches: [
            { id: `tq1-${Date.now()}`, player1: competitorsList[0], player2: competitorsList[1], targetPlayerName: "Lionel Messi" },
            { id: `tq2-${Date.now()}`, player1: competitorsList[2], player2: competitorsList[3], targetPlayerName: "Kylian Mbappé" },
            { id: `tq3-${Date.now()}`, player1: competitorsList[4], player2: competitorsList[5], targetPlayerName: "Erling Haaland" },
            { id: `tq4-${Date.now()}`, player1: competitorsList[6], player2: competitorsList[7], targetPlayerName: "Jude Bellingham" },
          ]
        }
      ]
    };

    const updatedTourneys = [newTournament, ...tournaments];
    setTournaments(updatedTourneys);
    saveTournaments(updatedTourneys);
    setTourneyName("");
    showMessage("New Tournament scheduled and knockout bracket drawn!");
  };

  const handleAdvanceTournamentRound = (tourneyId: string) => {
    const tourney = tournaments.find(t => t.id === tourneyId);
    if (!tourney) return;

    const updatedTourneys = tournaments.map((t) => {
      if (t.id !== tourneyId) return t;

      const currentRoundIndex = t.rounds.length - 1;
      const currentRound = t.rounds[currentRoundIndex];

      // If already completed or active, advance
      if (t.status === "scheduled") {
        return { ...t, status: "active" as const };
      }

      // 1. Resolve current matches with simulated winners
      const resolvedMatches = currentRound.matches.map(m => {
        const score1 = Math.floor(Math.random() * 4);
        const score2 = Math.floor(Math.random() * 4);
        const winner = score1 >= score2 ? m.player1 : m.player2;
        return { ...m, score1, score2, winner };
      });

      const updatedRounds = [...t.rounds];
      updatedRounds[currentRoundIndex] = { ...currentRound, matches: resolvedMatches };

      // 2. Build the next round if possible
      const winners = resolvedMatches.map(m => m.winner as string);
      
      if (winners.length === 4) {
        // Semi-finals
        updatedRounds.push({
          roundIndex: 1,
          matches: [
            { id: `tsf1-${Date.now()}`, player1: winners[0], player2: winners[1], targetPlayerName: "Mohamed Salah" },
            { id: `tsf2-${Date.now()}`, player1: winners[2], player2: winners[3], targetPlayerName: "Bukayo Saka" },
          ]
        });
        return { ...t, rounds: updatedRounds };
      } else if (winners.length === 2) {
        // Finals
        updatedRounds.push({
          roundIndex: 2,
          matches: [
            { id: `tf-${Date.now()}`, player1: winners[0], player2: winners[1], targetPlayerName: "Harry Kane" }
          ]
        });
        return { ...t, rounds: updatedRounds };
      } else if (winners.length === 1) {
        // Tournament Finished
        return { ...t, rounds: updatedRounds, status: "completed" as const, winner: winners[0] };
      }

      return t;
    });

    setTournaments(updatedTourneys);
    saveTournaments(updatedTourneys);
    showMessage("Simulated tournament round results updated!");
  };

  const handleDeleteTournament = (id: string) => {
    if (confirm("Delete this tournament record?")) {
      const updated = tournaments.filter(t => t.id !== id);
      setTournaments(updated);
      saveTournaments(updated);
      showMessage("Tournament record deleted.");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-black text-white tracking-wide uppercase">FutVerse Federation Console</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official admin dashboard to regulate league settings, transfer data imports, custom prize matrices, and schedule matches.
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab("players")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "players" ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Manage Stars
          </button>
          <button
            onClick={() => setActiveTab("tournaments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "tournaments" ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Tournament Coordinator
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "rewards" ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Special Rewards & Features
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 mb-5 rounded-xl text-sm font-bold border ${
          message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {message.text}
        </div>
      )}

      {/* MANAGING PLAYERS */}
      {activeTab === "players" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Add / Edit Form */}
          <form onSubmit={handleSavePlayer} className="lg:col-span-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" />
              {editingPlayerId ? "Edit Custom Star Info" : "Register a New Star"}
            </h3>

            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1.5">Full Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g., Ronaldinho"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">Nationality</label>
                <input
                  type="text"
                  value={playerNationality}
                  onChange={(e) => setPlayerNationality(e.target.value)}
                  placeholder="e.g., Brazil"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">Current Club</label>
                <input
                  type="text"
                  value={playerClub}
                  onChange={(e) => setPlayerClub(e.target.value)}
                  placeholder="e.g., Barcelona"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">League Group</label>
                <select
                  value={playerLeague}
                  onChange={(e) => setPlayerLeague(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Premier League">Premier League</option>
                  <option value="La Liga">La Liga</option>
                  <option value="Serie A">Serie A</option>
                  <option value="Bundesliga">Bundesliga</option>
                  <option value="Ligue 1">Ligue 1</option>
                  <option value="Saudi Pro League">Saudi Pro League</option>
                  <option value="MLS">MLS</option>
                  <option value="Eredivisie">Eredivisie</option>
                  <option value="Primeira Liga">Primeira Liga</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">Difficulty Tier</label>
                <select
                  value={playerDifficulty}
                  onChange={(e) => setPlayerDifficulty(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Easy">Easy (Global Superstars)</option>
                  <option value="Medium">Medium (Regular First Team)</option>
                  <option value="Hard">Hard (Obscure But Recognized)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Pos</label>
                <input
                  type="text"
                  value={playerPosition}
                  onChange={(e) => setPlayerPosition(e.target.value)}
                  placeholder="ST"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Area</label>
                <select
                  value={playerPositionGroup}
                  onChange={(e) => setPlayerPositionGroup(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-1 py-1.5 text-[10px] text-white"
                >
                  <option value="GK">GK</option>
                  <option value="DF">DF</option>
                  <option value="MF">MF</option>
                  <option value="FW">FW</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Shirt #</label>
                <input
                  type="number"
                  value={playerShirtNumber}
                  onChange={(e) => setPlayerShirtNumber(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Age</label>
                <input
                  type="number"
                  value={playerAge}
                  onChange={(e) => setPlayerAge(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={playerHeight}
                  onChange={(e) => setPlayerHeight(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Foot</label>
                <select
                  value={playerFoot}
                  onChange={(e) => setPlayerFoot(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-1.5 py-1.5 text-xs text-white"
                >
                  <option value="Left">Left</option>
                  <option value="Right">Right</option>
                  <option value="Ambidextrous">Ambidextrous</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Market Val</label>
                <input
                  type="text"
                  value={playerValue}
                  onChange={(e) => setPlayerValue(e.target.value)}
                  placeholder="€85M"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1.5">Transfer History (Comma separated)</label>
              <input
                type="text"
                value={playerTransferHistory}
                onChange={(e) => setPlayerTransferHistory(e.target.value)}
                placeholder="Santos, Barcelona, Paris Saint-Germain"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1.5">Competitions List (Comma separated)</label>
              <input
                type="text"
                value={playerCompetitions}
                onChange={(e) => setPlayerCompetitions(e.target.value)}
                placeholder="La Liga, Copa del Rey, UEFA Champions League, FIFA World Cup"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                {editingPlayerId ? "Save Changes" : "Register Star"}
              </button>
              {editingPlayerId && (
                <button
                  type="button"
                  onClick={resetPlayerForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* RIGHT: List of Custom / Active Players */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Database Pools ({allPlayers.length} total, {customPlayers.length} custom)</span>
              <span className="text-[10px] text-amber-400 font-semibold px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full uppercase">Live Sync</span>
            </h3>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2 max-h-[460px] overflow-y-auto no-scrollbar">
              {customPlayers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  <Settings className="h-8 w-8 mx-auto text-slate-600 mb-2 animate-spin-slow" />
                  No custom players registered yet.<br/>Use the registration panel to append custom footballers!
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {customPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between py-3.5 px-4 hover:bg-slate-900/60 rounded-xl transition-all">
                      <div>
                        <h4 className="text-white font-bold text-sm">{player.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {player.nationality} • {player.club} ({player.league})
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                          {player.position}
                        </span>
                        <button
                          onClick={() => handleEditPlayer(player)}
                          className="p-1.5 hover:bg-slate-800 text-blue-400 hover:text-blue-300 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="p-1.5 hover:bg-slate-800 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOURNAMENT COORDINATOR */}
      {activeTab === "tournaments" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Form */}
          <form onSubmit={handleScheduleTournament} className="lg:col-span-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-400" />
              Schedule New Bracket
            </h3>

            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1.5">Tournament Name</label>
              <input
                type="text"
                value={tourneyName}
                onChange={(e) => setTourneyName(e.target.value)}
                placeholder="e.g., Summer Legends Supercup"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1.5">Allocated Prizes (Customizable)</label>
              <input
                type="text"
                value={tourneyPrize}
                onChange={(e) => setTourneyPrize(e.target.value)}
                placeholder="e.g., 20,000 Coins + Gold Champion Emblem"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1.5">Competitors List (8 players, comma separated)</label>
              <textarea
                value={tourneyCompetitors}
                onChange={(e) => setTourneyCompetitors(e.target.value)}
                rows={3}
                placeholder="You, Mbappe, Haaland, Bellingham, Saka, Rodri, Kane, Messi"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Make sure "You" is one of the competitors to participate directly!
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              Draw Knockout Bracket
            </button>
          </form>

          {/* List of active/inactive tournaments */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2">
              Active Brackets Coordinator
            </h3>

            <div className="space-y-4 max-h-[460px] overflow-y-auto no-scrollbar">
              {tournaments.map((tourney) => (
                <div key={tourney.id} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-base">{tourney.name}</h4>
                      <p className="text-xs text-slate-400">Prize: {tourney.prize}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        tourney.status === "scheduled"
                          ? "bg-slate-800 text-slate-300"
                          : tourney.status === "active"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {tourney.status}
                      </span>
                      <button
                        onClick={() => handleDeleteTournament(tourney.id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                        title="Delete Tournament"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {tourney.status !== "completed" ? (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <p className="text-xs text-slate-400">
                        Rounds Drawn: <span className="text-white font-bold">{tourney.rounds.length}</span>
                      </p>
                      <button
                        onClick={() => handleAdvanceTournamentRound(tourney.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Users className="h-3 w-3" />
                        {tourney.status === "scheduled" ? "Activate Bracket" : "Simulate Round Matches"}
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-800/60 text-xs flex justify-between items-center text-slate-400">
                      <span>Champion: <strong className="text-emerald-400 font-bold">{tourney.winner}</strong></span>
                      <span className="text-emerald-500">Completed ✔</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL REWARDS & FEATURES */}
      {activeTab === "rewards" && (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 text-center space-y-6">
          <Award className="h-16 w-16 mx-auto text-yellow-500 animate-pulse" />
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-white font-bold text-lg">Featured Events & Prize Matrix</h3>
            <p className="text-sm text-slate-400">
              Configure active bonus reward campaigns, daily XP multipliers, and featured players.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="text-white font-bold text-sm mb-1">Double XP Campaign</h4>
              <p className="text-xs text-slate-400">Apply a 2x coefficient to all win rewards for guessing without hints.</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                <button className="text-slate-500 hover:text-white text-xs">Toggle Campaign</button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="text-white font-bold text-sm mb-1">Daily Challenge Streak Reward</h4>
              <p className="text-xs text-slate-400">Allocate special bonus titles for players with 5+ day streaks.</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                <button className="text-slate-500 hover:text-white text-xs">Configure Prizes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
