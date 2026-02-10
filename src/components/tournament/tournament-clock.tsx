"use client";

import { useTournament } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipBack, SkipForward, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function formatTime(seconds: number): { minutes: string; secs: string } {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return {
    minutes: m.toString().padStart(2, "0"),
    secs: s.toString().padStart(2, "0"),
  };
}

function AnimatedDigit({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("inline-block relative overflow-hidden", className)}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function TournamentClock() {
  const { selectedTournament, toggleClock, nextLevel, prevLevel } = useTournament();

  if (!selectedTournament) return null;

  const currentBlind = selectedTournament.blindStructure[selectedTournament.currentLevel - 1];
  const nextBlindLevel = selectedTournament.blindStructure[selectedTournament.currentLevel];
  const isLive = selectedTournament.status === "live";
  const isBreak = currentBlind?.isBreak;

  if (!isLive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="rounded-xl border border-border bg-card p-6 text-center"
      >
        <p className="text-sm text-muted-foreground mb-1">Tournament starts soon</p>
        <p className="text-3xl font-mono font-bold tracking-wider text-muted-foreground/50">
          --:--
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Starting chips: {selectedTournament.startingChips.toLocaleString()}
        </p>
      </motion.div>
    );
  }

  const { minutes, secs } = formatTime(selectedTournament.clockTimeRemaining);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-xl border border-border bg-card p-5 h-full flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <AnimatePresence mode="wait">
            {isBreak ? (
              <motion.div
                key="break"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-center gap-2 text-amber-400"
              >
                <Coffee className="h-4 w-4" />
                <span className="text-sm font-medium">Break</span>
              </motion.div>
            ) : (
              <motion.div
                key={`level-${selectedTournament.currentLevel}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Level {selectedTournament.currentLevel}
                </p>
                <p className="text-sm font-medium">
                  Blinds {currentBlind.smallBlind.toLocaleString()}/{currentBlind.bigBlind.toLocaleString()}
                  {currentBlind.ante > 0 && (
                    <span className="text-muted-foreground"> / {currentBlind.ante.toLocaleString()} ante</span>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clock controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={prevLevel}
            disabled={selectedTournament.currentLevel <= 1}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              selectedTournament.clockRunning && "text-emerald-400"
            )}
            onClick={toggleClock}
          >
            {selectedTournament.clockRunning ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={nextLevel}
            disabled={selectedTournament.currentLevel >= selectedTournament.blindStructure.length}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Large clock display with animated digits */}
      <div className="text-center mb-3 flex-1 flex flex-col items-center justify-center">
        <div
          className={cn(
            "text-5xl font-mono font-bold tracking-wider inline-flex items-center",
            !selectedTournament.clockRunning && "text-muted-foreground",
            isBreak && "text-amber-400"
          )}
        >
          <AnimatedDigit value={minutes[0]} />
          <AnimatedDigit value={minutes[1]} />
          <span className="mx-0.5">:</span>
          <AnimatedDigit value={secs[0]} />
          <AnimatedDigit value={secs[1]} />
        </div>
        <p
          className={cn(
            "text-xs mt-1 uppercase tracking-wider transition-opacity duration-200",
            selectedTournament.clockRunning ? "opacity-0" : "opacity-100 text-amber-400"
          )}
          aria-hidden={selectedTournament.clockRunning}
        >
          Paused
        </p>
      </div>

      {/* Next level info */}
      {nextBlindLevel && (
        <div className="text-center border-t border-border pt-3 mt-auto">
          <p className="text-xs text-muted-foreground">
            {nextBlindLevel.isBreak ? (
              "Next: Break"
            ) : (
              <>
                Next: Level {selectedTournament.currentLevel + 1} —{" "}
                {nextBlindLevel.smallBlind.toLocaleString()}/{nextBlindLevel.bigBlind.toLocaleString()}
                {nextBlindLevel.ante > 0 && ` / ${nextBlindLevel.ante.toLocaleString()}`}
              </>
            )}
          </p>
        </div>
      )}
    </motion.div>
  );
}
