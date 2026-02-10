"use client";

import { useState } from "react";
import { useTournament } from "@/lib/context";
import { RedrawAssignment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Shuffle, ArrowRight, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function RedrawPanel() {
  const { selectedTournament, dispatch } = useTournament();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  if (!selectedTournament?.pendingRedraw || selectedTournament.pendingRedraw.length === 0) {
    return null;
  }

  const assignments = selectedTournament.pendingRedraw;

  // Group assignments by NEW table
  const byNewTable = new Map<number, RedrawAssignment[]>();
  for (const a of assignments) {
    const existing = byNewTable.get(a.toTable) || [];
    existing.push(a);
    byNewTable.set(a.toTable, existing);
  }
  // Sort tables numerically, seats within each table numerically
  const sortedTables = [...byNewTable.entries()]
    .sort(([a], [b]) => a - b)
    .map(([table, players]) => ({
      table,
      players: [...players].sort((a, b) => a.toSeat - b.toSeat),
    }));

  const totalPlayers = assignments.length;
  const confirmedCount = confirmed.size;
  const allConfirmed = confirmedCount === totalPlayers;

  const toggleConfirm = (playerId: string) => {
    setConfirmed((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const handleCompleteRedraw = () => {
    // In a real app, this would execute the redraw.
    // For demo, we clear the pendingRedraw from the tournament.
    if (selectedTournament) {
      dispatch({
        type: "CLEAR_REDRAW",
        tournamentId: selectedTournament.id,
      } as never);
    }
    setOpen(false);
    setConfirmed(new Set());
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 hover:text-amber-300"
        >
          <Shuffle className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Redraw</span>
          <Badge
            variant="secondary"
            className="ml-2 bg-amber-500/30 text-amber-300 text-[10px] px-1.5"
          >
            {totalPlayers}
          </Badge>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:w-[520px] sm:max-w-[520px] !gap-0 flex flex-col p-0">
        {/* Fixed header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 shrink-0">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-amber-400" />
              3-Table Redraw
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {totalPlayers} players must be reassigned to new seats.
              Direct each player to their new table and seat, then mark them as confirmed.
            </p>
          </SheetHeader>

          {/* Progress bar + Confirm All */}
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>
                <Users className="h-3.5 w-3.5 inline mr-1" />
                {confirmedCount} of {totalPlayers} seated
              </span>
              {!allConfirmed ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-amber-400 hover:text-amber-300 px-2"
                  onClick={() =>
                    setConfirmed(new Set(assignments.map((a) => a.playerId)))
                  }
                >
                  <Check className="h-3 w-3 mr-1" />
                  Confirm All
                </Button>
              ) : (
                <span>{Math.round((confirmedCount / totalPlayers) * 100)}%</span>
              )}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(confirmedCount / totalPlayers) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable assignment list */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="space-y-5">
            {sortedTables.map(({ table, players }) => (
              <div key={table}>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold">Table {table}</h4>
                  <Badge variant="secondary" className="text-[10px]">
                    {players.length} players
                  </Badge>
                  {players.every((p) => confirmed.has(p.playerId)) && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      <Check className="h-3 w-3 mr-0.5" /> Ready
                    </Badge>
                  )}
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  {players.map((assignment, i) => {
                    const isConfirmed = confirmed.has(assignment.playerId);

                    return (
                      <button
                        key={assignment.playerId}
                        onClick={() => toggleConfirm(assignment.playerId)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          "hover:bg-accent/50",
                          i > 0 && "border-t border-border",
                          isConfirmed && "bg-emerald-500/5"
                        )}
                      >
                        {/* Seat number */}
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0",
                            isConfirmed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isConfirmed ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            assignment.toSeat
                          )}
                        </span>

                        {/* Player name + movement */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              isConfirmed && "text-emerald-400"
                            )}
                          >
                            {assignment.playerName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>
                              T{assignment.fromTable} / S{assignment.fromSeat}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                            <span className="text-foreground font-medium">
                              T{assignment.toTable} / S{assignment.toSeat}
                            </span>
                          </p>
                        </div>

                        {/* Confirm indicator */}
                        <AnimatePresence>
                          {isConfirmed && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="text-xs text-emerald-400 font-medium"
                            >
                              Seated
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky bottom button */}
        <div className="shrink-0 border-t border-border px-4 py-4 sm:px-6">
          <Button
            className={cn(
              "w-full",
              allConfirmed
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : ""
            )}
            disabled={!allConfirmed}
            onClick={handleCompleteRedraw}
          >
            {allConfirmed ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Complete Redraw
              </>
            ) : (
              `Confirm all ${totalPlayers} players to complete`
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
