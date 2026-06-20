import React from "react";
import { UserAccount } from "../utils/storage";
import { Trophy, Flame, Zap, HelpCircle, Hourglass, TrendingUp, CheckCircle, Award } from "lucide-react";

interface StatWidgetProps {
  user: UserAccount;
}

export const StatWidget: React.FC<StatWidgetProps> = ({ user }) => {
  const winRate = user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0;
  const avgGuesses = user.wins > 0 ? (user.totalGuesses / user.wins).toFixed(1) : "0";
  const avgTime = user.wins > 0 ? Math.round(user.totalCompletionTime / user.wins) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {/* Games Played & Wins */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-start space-x-4 hover:border-emerald-500/30 transition-all shadow-md group">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Victories</p>
          <p className="text-2xl font-bold text-white mt-1">
            {user.wins} <span className="text-xs font-normal text-slate-400">/ {user.gamesPlayed} games</span>
          </p>
          <div className="flex items-center space-x-1.5 mt-1">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs text-slate-300 font-medium">{winRate}% Win Ratio</span>
          </div>
        </div>
      </div>

      {/* Current and Highest Streak */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-start space-x-4 hover:border-amber-500/30 transition-all shadow-md group">
        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl group-hover:bg-amber-500/20 transition-colors">
          <Flame className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Streak</p>
          <p className="text-2xl font-bold text-white mt-1">
            {user.currentStreak} <span className="text-xs font-normal text-slate-400">wins now</span>
          </p>
          <div className="flex items-center space-x-1.5 mt-1">
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs text-slate-300 font-medium">{user.highestStreak} Record Max</span>
          </div>
        </div>
      </div>

      {/* Average Guesses */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-start space-x-4 hover:border-blue-500/30 transition-all shadow-md group">
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl group-hover:bg-blue-500/20 transition-colors">
          <Zap className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Guesses</p>
          <p className="text-2xl font-bold text-white mt-1">
            {avgGuesses} <span className="text-xs font-normal text-slate-400">guesses</span>
          </p>
          <div className="flex items-center space-x-1.5 mt-1">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs text-slate-300 font-medium">To Solve Puzzle</span>
          </div>
        </div>
      </div>

      {/* Average Completion Time */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-start space-x-4 hover:border-indigo-500/30 transition-all shadow-md group">
        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
          <Hourglass className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Solve Speed</p>
          <p className="text-2xl font-bold text-white mt-1">
            {avgTime} <span className="text-xs font-normal text-slate-400">seconds</span>
          </p>
          <div className="flex items-center space-x-1.5 mt-1">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs text-slate-300 font-medium">{user.hintsUsed} total hints used</span>
          </div>
        </div>
      </div>
    </div>
  );
};
