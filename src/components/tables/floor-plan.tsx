"use client";

import { useTournament } from "@/lib/context";
import { PokerTableView } from "./poker-table";
import { motion } from "framer-motion";
import { Shuffle } from "lucide-react";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export function FloorPlan() {
  const { selectedTournament } = useTournament();

  if (!selectedTournament) return null;

  const isLive = selectedTournament.status === "live";

  if (!isLive || selectedTournament.tables.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground text-sm">
          No active tables. Tournament has not started yet.
        </p>
      </div>
    );
  }

  // Determine if any tables are imbalanced
  const tableCounts = selectedTournament.tables.map((t) =>
    t.seats.filter((s) => s.player !== null).length
  );
  const maxCount = Math.max(...tableCounts);
  const imbalancedTables = new Set(
    selectedTournament.tables
      .filter((_, i) => tableCounts[i] > 0 && maxCount - tableCounts[i] >= 2)
      .map((t) => t.id)
  );

  const hasRedraw = !!selectedTournament.pendingRedraw && selectedTournament.pendingRedraw.length > 0;

  return (
    <div>
      {/* Redraw banner */}
      {hasRedraw && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center gap-3"
        >
          <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Shuffle className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-300">
              Complete Redraw Required
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedTournament.pendingRedraw!.length} players must be reassigned to new seats.
              Clock is paused — use the Redraw button above to direct players.
            </p>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Floor Plan</h3>
        {!hasRedraw && imbalancedTables.size > 0 && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs text-amber-400"
          >
            {imbalancedTables.size} table{imbalancedTables.size > 1 ? "s" : ""} need rebalancing
          </motion.span>
        )}
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {selectedTournament.tables.map((table) => (
          <motion.div key={table.id} variants={item} className="h-full">
            <PokerTableView
              table={table}
              handsPerTable={selectedTournament.handsPerTable}
              isImbalanced={imbalancedTables.has(table.id)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
