"use client";

import { useState } from "react";
import { PokerTable as PokerTableType } from "@/lib/types";
import { useTournament } from "@/lib/context";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PokerTableProps {
  table: PokerTableType;
  handsPerTable: number;
  isImbalanced?: boolean;
}

function getSeatPositions(count: number): { x: number; y: number }[] {
  const cx = 200;
  const cy = 115;
  const rx = 145;
  const ry = 78;
  const positions: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    positions.push({ x, y });
  }

  return positions;
}

function TableSVG({
  table,
  handsPerTable,
}: {
  table: PokerTableType;
  handsPerTable: number;
}) {
  const positions = getSeatPositions(handsPerTable);

  return (
    <svg viewBox="0 0 400 230" className="w-full">
      {/* Table felt */}
      <ellipse
        cx="200"
        cy="115"
        rx="95"
        ry="48"
        className="fill-emerald-950/50"
        stroke="rgba(16,185,129,0.25)"
        strokeWidth="2"
      />
      <ellipse
        cx="200"
        cy="115"
        rx="85"
        ry="38"
        className="fill-emerald-900/30"
      />

      {/* Table number in center */}
      <text
        x="200"
        y="119"
        textAnchor="middle"
        fill="rgba(16,185,129,0.4)"
        fontSize="14"
        fontWeight="600"
        fontFamily="var(--font-geist-mono), monospace"
      >
        T{table.number}
      </text>

      {/* Seats */}
      {positions.map((pos, i) => {
        const seat = table.seats[i];
        const hasPlayer = seat?.player !== null;
        const isAboveTable = pos.y < 115;

        return (
          <g key={i}>
            {/* Seat chip / marker */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="13"
              fill={hasPlayer ? "rgba(255,255,255,0.08)" : "transparent"}
              stroke={
                hasPlayer ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"
              }
              strokeWidth="1"
              strokeDasharray={hasPlayer ? "none" : "3,3"}
            />

            {/* Seat number inside circle */}
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill={
                hasPlayer ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)"
              }
              fontSize="9"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {i + 1}
            </text>

            {/* Player name label */}
            {hasPlayer && seat?.player && (
              <text
                x={pos.x}
                y={isAboveTable ? pos.y - 19 : pos.y + 21}
                textAnchor="middle"
                fill="rgba(255,255,255,0.75)"
                fontSize="10"
                fontFamily="var(--font-geist-sans), sans-serif"
              >
                {seat.player.name.length > 14
                  ? seat.player.name.slice(0, 12) + "…"
                  : seat.player.name}
              </text>
            )}

            {/* Empty seat indicator */}
            {!hasPlayer && (
              <text
                x={pos.x}
                y={isAboveTable ? pos.y - 19 : pos.y + 21}
                textAnchor="middle"
                fill="rgba(255,255,255,0.12)"
                fontSize="9"
                fontFamily="var(--font-geist-sans), sans-serif"
              >
                Empty
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function PokerTableView({
  table,
  handsPerTable,
  isImbalanced,
}: PokerTableProps) {
  const [open, setOpen] = useState(false);
  const { selectedTournament } = useTournament();
  const playerCount = table.seats.filter((s) => s.player !== null).length;

  // Tournament-wide average stack
  let totalChips = 0;
  let totalPlayers = 0;
  if (selectedTournament) {
    for (const t of selectedTournament.tables) {
      for (const s of t.seats) {
        if (s.player) {
          totalChips += s.player.chipCount;
          totalPlayers++;
        }
      }
    }
  }
  const tournamentAvgStack = totalPlayers > 0 ? Math.round(totalChips / totalPlayers) : 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "rounded-xl border bg-card p-1.5 transition-all text-left cursor-pointer w-full h-full",
          "hover:border-foreground/20 hover:bg-card/80",
          isImbalanced
            ? "border-amber-500/40 hover:border-amber-500/60"
            : "border-border"
        )}
      >
        {/* Table header */}
        <div className="flex items-center justify-between mb-1 px-1.5">
          <span className="text-xs font-medium text-foreground/80">
            Table {table.number}
          </span>
          <span
            className={cn(
              "text-[10px] tabular-nums",
              isImbalanced ? "text-amber-400" : "text-muted-foreground"
            )}
          >
            {playerCount}/{handsPerTable}
          </span>
        </div>

        <TableSVG table={table} handsPerTable={handsPerTable} />
      </button>

      {/* Detail popup */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Table {table.number}
              <Badge variant="secondary" className="text-xs font-normal">
                {playerCount}/{handsPerTable} seated
              </Badge>
              {isImbalanced && (
                <Badge className="text-xs font-normal bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Needs rebalancing
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Player list */}
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[48px_1fr_80px] gap-2 px-4 py-2 text-xs text-muted-foreground font-medium bg-muted/30 border-b border-border">
              <span>Seat</span>
              <span>Player</span>
              <span className="text-right">Status</span>
            </div>

            {/* Seat rows */}
            {table.seats.map((seat, i) => (
              <div
                key={i}
                className={cn(
                  "grid grid-cols-[48px_1fr_80px] gap-2 px-4 py-2.5 text-sm border-b border-border last:border-0 items-center",
                  !seat.player && "opacity-40"
                )}
              >
                <span className="text-muted-foreground font-mono text-xs">
                  #{seat.position}
                </span>
                <span className={cn(seat.player ? "font-medium" : "text-muted-foreground italic")}>
                  {seat.player ? seat.player.name : "Empty"}
                </span>
                <span className="text-right">
                  {seat.player ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Open</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Table summary */}
          <div className="text-xs text-muted-foreground pt-1">
            <span>
              Avg stack:{" "}
              <span className="text-foreground font-medium font-mono">
                {tournamentAvgStack > 0 ? tournamentAvgStack.toLocaleString() : "—"}
              </span>
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
