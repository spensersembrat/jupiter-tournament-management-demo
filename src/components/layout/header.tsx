"use client";

import { useTournament } from "@/lib/context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { MobileSidebar } from "./sidebar";

export function Header() {
  const { selectedTournament, getPlayerCount } = useTournament();

  if (!selectedTournament) return null;

  const isLive = selectedTournament.status === "live";
  const playerCount = getPlayerCount(selectedTournament);
  const tableCount = selectedTournament.tables.filter(
    (t) => t.seats.some((s) => s.player !== null)
  ).length;

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <MobileSidebar />

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTournament.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center gap-2 md:gap-3 min-w-0"
          >
            <h2 className="text-base md:text-lg font-semibold truncate">{selectedTournament.name}</h2>
            <Badge
              variant={isLive ? "default" : "secondary"}
              className={cn(
                "text-[10px] uppercase tracking-wider shrink-0",
                isLive && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              )}
            >
              {isLive ? "Live" : "Upcoming"}
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline truncate">
              {selectedTournament.gameType}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {isLive && (
          <motion.div
            key={`stats-${selectedTournament.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="hidden sm:flex items-center gap-4 md:gap-6 text-sm shrink-0"
          >
            <div className="text-muted-foreground">
              <span className="text-foreground font-medium">{playerCount}</span> players
            </div>
            <div className="text-muted-foreground">
              <span className="text-foreground font-medium">{tableCount}</span> tables
            </div>
            <div className="text-muted-foreground hidden md:block">
              <span className="text-foreground font-medium">{selectedTournament.handsPerTable}</span>-handed
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
