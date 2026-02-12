"use client";

import { useState, useMemo } from "react";
import { useTournament } from "@/lib/context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserMinus, Search } from "lucide-react";
import { toast } from "sonner";
import { Player } from "@/lib/types";

interface PlayerRow {
  player: Player;
  tableNumber: number;
}

export function BustPlayerModal() {
  const { selectedTournament, bustPlayer } = useTournament();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmPlayer, setConfirmPlayer] = useState<PlayerRow | null>(null);

  const isLive = selectedTournament?.status === "live";

  const allPlayers = useMemo(() => {
    if (!selectedTournament) return [];
    const players: PlayerRow[] = [];
    for (const table of selectedTournament.tables) {
      for (const seat of table.seats) {
        if (seat.player) {
          players.push({ player: seat.player, tableNumber: table.number });
        }
      }
    }
    return players.sort((a, b) => a.player.name.localeCompare(b.player.name));
  }, [selectedTournament]);

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return allPlayers;
    const q = search.toLowerCase();
    return allPlayers.filter(
      (p) =>
        p.player.name.toLowerCase().includes(q) ||
        `table ${p.tableNumber}`.includes(q) ||
        `seat ${p.player.seatNumber}`.includes(q)
    );
  }, [allPlayers, search]);

  const handleBust = (row: PlayerRow) => {
    bustPlayer(row.player.id);
    toast.success(`${row.player.name} eliminated`, {
      description: `Table ${row.tableNumber}, Seat ${row.player.seatNumber}`,
    });
    setConfirmPlayer(null);
    setSearch("");
    setOpen(false);
  };

  if (!isLive) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmPlayer(null); setSearch(""); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserMinus className="h-4 w-4" />
          <span className="hidden sm:inline">Bust Player</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bust Player</DialogTitle>
          <DialogDescription>
            Select a player to eliminate from the tournament.
          </DialogDescription>
        </DialogHeader>

        {!confirmPlayer ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, table, or seat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="max-h-80">
              <div className="space-y-0.5">
                {filteredPlayers.map((row) => (
                  <button
                    key={row.player.id}
                    onClick={() => setConfirmPlayer(row)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left"
                  >
                    <span className="text-sm font-medium">{row.player.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Table {row.tableNumber}, Seat {row.player.seatNumber}
                    </span>
                  </button>
                ))}
                {filteredPlayers.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    No players found
                  </p>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Confirm elimination</p>
              <p className="text-lg font-semibold">{confirmPlayer.player.name}</p>
              <p className="text-sm text-muted-foreground">
                Table {confirmPlayer.tableNumber}, Seat {confirmPlayer.player.seatNumber}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmPlayer(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleBust(confirmPlayer)}
              >
                Confirm Bust
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
