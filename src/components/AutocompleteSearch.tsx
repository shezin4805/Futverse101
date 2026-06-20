import React, { useState, useEffect, useRef } from "react";
import { Player } from "../data/players";
import { Search } from "lucide-react";

interface AutocompleteSearchProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  guessedPlayerIds: string[];
}

export const AutocompleteSearch: React.FC<AutocompleteSearchProps> = ({
  players,
  onSelectPlayer,
  guessedPlayerIds,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Compute suggestions based on query
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();

    // Fuzzy Search / Typo Tolerance Matching
    const matched = players
      .filter((p) => !guessedPlayerIds.includes(p.id))
      .map((p) => {
        const nameLower = p.name.toLowerCase();
        let score = 0;

        if (nameLower === lowerQuery) {
          score = 100; // Exact match
        } else if (nameLower.startsWith(lowerQuery)) {
          score = 80; // Starts with
        } else if (nameLower.includes(lowerQuery)) {
          score = 50; // Contains
        } else {
          // Check for matching initials or sub-words (e.g., "ron" matches "Ronald Araújo")
          const parts = nameLower.split(/\s+/);
          const partsMatch = parts.some((part) => part.startsWith(lowerQuery));
          if (partsMatch) {
            score = 60;
          } else {
            // Very basic typo tolerance: count character overlaps
            let matches = 0;
            const queryChars = Array.from(lowerQuery);
            queryChars.forEach((char) => {
              if (nameLower.includes(char)) {
                matches++;
              }
            });
            const ratio = matches / Math.max(nameLower.length, lowerQuery.length);
            if (ratio > 0.6) {
              score = Math.round(ratio * 40);
            }
          }
        }

        return { player: p, score };
      })
      .filter((item) => item.score > 10)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.player)
      .slice(0, 6); // Limit to 6 suggestions for sleek appearance

    setSuggestions(matched);
  }, [query, players, guessedPlayerIds]);

  const handleSelect = (player: Player) => {
    onSelectPlayer(player);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto z-40">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-emerald-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search active football stars (e.g. Messi, Mbappe, Saka...)"
          className="block w-full pl-12 pr-4 py-3.5 bg-slate-900/95 text-white placeholder-slate-400 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-emerald-500 transition-all shadow-lg text-lg"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute mt-2 w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800">
          {suggestions.map((player) => (
            <button
              key={player.id}
              onClick={() => handleSelect(player)}
              className="w-full text-left px-5 py-4 hover:bg-emerald-950/40 transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="font-semibold text-white text-base group-hover:text-emerald-400 transition-colors">
                  {player.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {player.position} • {player.club} ({player.league})
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {player.nationality}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                  player.difficulty === "Easy"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : player.difficulty === "Medium"
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {player.difficulty}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute mt-2 w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-5 text-center text-slate-400 z-50">
          No matching active football stars found. Try another search!
        </div>
      )}
    </div>
  );
};
