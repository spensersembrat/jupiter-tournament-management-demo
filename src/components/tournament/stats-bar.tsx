"use client";

import { useTournament } from "@/lib/context";
import { Users, Layers, TrendingUp, Timer, Trophy, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Prizepool } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  index: number;
  variant?: "default" | "highlight";
}

function StatCard({ icon, label, value, subtext, index, variant = "default" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
      className={cn(
        "rounded-lg border px-4 py-3",
        variant === "highlight"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={variant === "highlight" ? "text-emerald-400" : "text-muted-foreground"}>{icon}</span>
        <span className={cn("text-xs uppercase tracking-wider", variant === "highlight" ? "text-emerald-400/70" : "text-muted-foreground")}>{label}</span>
      </div>
      <p className={cn("text-xl font-semibold", variant === "highlight" && "text-emerald-400")}>{value}</p>
      {subtext && <p className={cn("text-xs mt-0.5", variant === "highlight" ? "text-emerald-400/60" : "text-muted-foreground")}>{subtext}</p>}
    </motion.div>
  );
}

/** Find the payout for the next player to bust (current player count position). */
function getNextPayout(playerCount: number, prizepool: Prizepool): { amount: number; place: string } | null {
  if (playerCount > prizepool.placesPaid) return null;

  // Parse place strings to determine which range the current playerCount falls into.
  // The next bust-out finishes in `playerCount`th place.
  for (const entry of prizepool.breakdown) {
    const place = entry.place;
    // Match "7th" or "11th-12th" etc.
    const rangeMatch = place.match(/(\d+)\w*(?:\s*-\s*(\d+)\w*)?/);
    if (!rangeMatch) continue;

    const low = parseInt(rangeMatch[1], 10);
    const high = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : low;

    if (playerCount >= low && playerCount <= high) {
      return { amount: entry.amount, place };
    }
  }
  return null;
}

export function StatsBar() {
  const { selectedTournament, getPlayerCount } = useTournament();

  if (!selectedTournament) return null;

  const isLive = selectedTournament.status === "live";

  if (!isLive) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          index={0}
          icon={<Trophy className="h-4 w-4" />}
          label="Buy-in"
          value={`$${selectedTournament.buyIn.toLocaleString()}`}
        />
        <StatCard
          index={1}
          icon={<TrendingUp className="h-4 w-4" />}
          label="Starting Chips"
          value={selectedTournament.startingChips.toLocaleString()}
        />
        <StatCard
          index={2}
          icon={<Layers className="h-4 w-4" />}
          label="Table Size"
          value={`${selectedTournament.handsPerTable}-handed`}
        />
        <StatCard
          index={3}
          icon={<Timer className="h-4 w-4" />}
          label="Guaranteed"
          value={`$${selectedTournament.prizepool.guaranteed.toLocaleString()}`}
        />
      </div>
    );
  }

  const playerCount = getPlayerCount(selectedTournament);
  const activeTables = selectedTournament.tables.filter(
    (t) => t.seats.some((s) => s.player !== null)
  ).length;

  // Calculate average stack
  let totalChips = 0;
  let activeCount = 0;
  for (const table of selectedTournament.tables) {
    for (const seat of table.seats) {
      if (seat.player) {
        totalChips += seat.player.chipCount;
        activeCount++;
      }
    }
  }
  const avgStack = activeCount > 0 ? Math.round(totalChips / activeCount) : 0;

  // Find next break
  const currentLevel = selectedTournament.currentLevel;
  const nextBreak = selectedTournament.blindStructure.find(
    (b) => b.level > currentLevel && b.isBreak
  );

  const lateRegOpen = selectedTournament.currentLevel <= selectedTournament.lateRegEndLevel;

  // Check if tournament is in the money
  const inTheMoney = playerCount <= selectedTournament.prizepool.placesPaid && selectedTournament.prizepool.placesPaid > 0;
  const nextPayout = inTheMoney ? getNextPayout(playerCount, selectedTournament.prizepool) : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full">
      <StatCard
        index={0}
        icon={<Users className="h-4 w-4" />}
        label="Players"
        value={playerCount}
        subtext={`of ${selectedTournament.prizepool.totalEntries} entries`}
      />
      <StatCard
        index={1}
        icon={<Layers className="h-4 w-4" />}
        label="Tables"
        value={activeTables}
        subtext={`${selectedTournament.handsPerTable}-handed`}
      />
      <StatCard
        index={2}
        icon={<TrendingUp className="h-4 w-4" />}
        label="Avg Stack"
        value={avgStack.toLocaleString()}
        subtext={`${Math.round(avgStack / (selectedTournament.blindStructure[currentLevel - 1]?.bigBlind || 1))} BB`}
      />
      {nextPayout ? (
        <StatCard
          index={3}
          icon={<DollarSign className="h-4 w-4" />}
          label="Next Payout"
          value={`$${nextPayout.amount.toLocaleString()}`}
          subtext={`${nextPayout.place} place`}
          variant="highlight"
        />
      ) : (
        <StatCard
          index={3}
          icon={<Timer className="h-4 w-4" />}
          label="Next Break"
          value={nextBreak ? `Level ${nextBreak.level}` : "—"}
          subtext={nextBreak ? `${nextBreak.level - currentLevel} levels away` : "No more breaks"}
        />
      )}
      <StatCard
        index={4}
        icon={<Trophy className="h-4 w-4" />}
        label="Late Reg"
        value={lateRegOpen ? "Open" : "Closed"}
        subtext={lateRegOpen ? `Until Level ${selectedTournament.lateRegEndLevel}` : "Registration closed"}
      />
    </div>
  );
}
