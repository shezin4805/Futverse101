import React from "react";
import { PlayerComparison } from "../utils/gameHelpers";
import { ArrowUp, ArrowDown, Footprints } from "lucide-react";

interface ComparisonRowProps {
  comparison: PlayerComparison;
}

export const ComparisonRow: React.FC<ComparisonRowProps> = ({ comparison }) => {
  const getStatusBgClass = (status: "correct" | "partial" | "incorrect") => {
    switch (status) {
      case "correct":
        return "bg-emerald-600 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white font-bold animate-pulse-once";
      case "partial":
        return "bg-amber-500 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-slate-900 font-semibold";
      case "incorrect":
      default:
        return "bg-slate-800/80 border-slate-700/60 text-slate-200";
    }
  };

  const renderArrow = (direction?: "up" | "down" | "equal") => {
    if (direction === "up") {
      return <ArrowUp className="h-4 w-4 inline ml-1 text-white animate-bounce" />;
    }
    if (direction === "down") {
      return <ArrowDown className="h-4 w-4 inline ml-1 text-white animate-bounce" />;
    }
    return null;
  };

  return (
    <div className="flex flex-col mb-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 overflow-hidden shadow-md animate-fade-in-down">
      {/* Player guessed name bar */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/60">
        <h4 className="text-white font-bold text-lg tracking-wide">{comparison.name}</h4>
        <div className="text-[10px] text-slate-400 font-semibold uppercase bg-slate-800 px-2.5 py-1 rounded-full">
          Guessed Player
        </div>
      </div>

      {/* Grid of tiles */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
        {/* Nationality */}
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-500 ${getStatusBgClass(comparison.nationality.status)}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Nation</span>
          <span className="text-sm font-semibold truncate max-w-full">{comparison.nationality.value}</span>
          {comparison.nationality.status === "partial" && (
            <span className="text-[9px] mt-0.5 opacity-80 uppercase tracking-widest font-black">Continent</span>
          )}
        </div>

        {/* Club */}
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-500 ${getStatusBgClass(comparison.club.status)}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Club</span>
          <span className="text-sm font-semibold truncate max-w-full">{comparison.club.value}</span>
          {comparison.club.status === "partial" && (
            <span className="text-[9px] mt-0.5 opacity-80 uppercase tracking-widest font-black">Ex-Player</span>
          )}
        </div>

        {/* League */}
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-500 ${getStatusBgClass(comparison.league.status)}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">League</span>
          <span className="text-sm font-semibold truncate max-w-full">{comparison.league.value}</span>
          {comparison.league.status === "partial" && (
            <span className="text-[9px] mt-0.5 opacity-80 uppercase tracking-widest font-black">Top 5</span>
          )}
        </div>

        {/* Position */}
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-500 ${getStatusBgClass(comparison.position.status)}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Pos</span>
          <span className="text-sm font-semibold">{comparison.position.value}</span>
          {comparison.position.status === "partial" && (
            <span className="text-[9px] mt-0.5 opacity-80 uppercase tracking-widest font-black">Same Area</span>
          )}
        </div>

        {/* Age */}
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-500 ${getStatusBgClass(comparison.age.status)}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Age</span>
          <span className="text-sm font-semibold flex items-center">
            {comparison.age.value} {renderArrow(comparison.age.direction)}
          </span>
          {comparison.age.status === "partial" && (
            <span className="text-[9px] mt-0.5 opacity-80 uppercase tracking-widest font-black">±2 Yrs</span>
          )}
        </div>

        {/* Shirt Number */}
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-500 ${getStatusBgClass(comparison.shirtNumber.status)}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Shirt #</span>
          <span className="text-sm font-semibold flex items-center">
            {comparison.shirtNumber.value} {renderArrow(comparison.shirtNumber.direction)}
          </span>
          {comparison.shirtNumber.status === "partial" && (
            <span className="text-[9px] mt-0.5 opacity-80 uppercase tracking-widest font-black">±3 Nos</span>
          )}
        </div>

        {/* Dominant Foot */}
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-500 ${getStatusBgClass(comparison.dominantFoot.status)}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Foot</span>
          <span className="text-sm font-semibold flex items-center justify-center gap-1">
            <Footprints className="h-3.5 w-3.5 opacity-80" /> {comparison.dominantFoot.value}
          </span>
        </div>

        {/* Height */}
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-500 ${getStatusBgClass(comparison.height.status)}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Height</span>
          <span className="text-sm font-semibold flex items-center">
            {comparison.height.value} {renderArrow(comparison.height.direction)}
          </span>
          {comparison.height.status === "partial" && (
            <span className="text-[9px] mt-0.5 opacity-80 uppercase tracking-widest font-black">±5 cm</span>
          )}
        </div>

        {/* Shared Competitions */}
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center col-span-3 sm:col-span-2 md:col-span-1 transition-all duration-500 ${getStatusBgClass(comparison.competitions.status)}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Competitions</span>
          <span className="text-xs font-semibold truncate max-w-full" title={String(comparison.competitions.value)}>
            {comparison.competitions.value}
          </span>
        </div>
      </div>
    </div>
  );
};
