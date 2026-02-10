"use client";

import { useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserPlus, Info } from "lucide-react";
import { toast } from "sonner";
import { getRandomNewPlayerName } from "@/lib/data";

export function AddPlayerModal() {
  const { selectedTournament, addPlayer } = useTournament();
  const [open, setOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");

  const isLive = selectedTournament?.status === "live";

  // Check if there are empty seats
  const hasEmptySeats = selectedTournament?.tables.some((t) =>
    t.seats.some((s) => s.player === null)
  );

  // Check late registration
  const lateRegOpen =
    selectedTournament &&
    selectedTournament.currentLevel <= selectedTournament.lateRegEndLevel;

  const handleAdd = () => {
    const name = playerName.trim() || getRandomNewPlayerName();
    addPlayer(name);

    // Find where they were placed (from the latest notification)
    toast.success(`${name} registered`, {
      description: "Player has been seated at an available table.",
    });

    setPlayerName("");
    setOpen(false);
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) {
      setPlayerName(getRandomNewPlayerName());
    }
  };

  if (!isLive) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!hasEmptySeats || !lateRegOpen}
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Player</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Add Player</DialogTitle>
                <DialogDescription className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>
                    Simulates a player registering at the cage or tournament registration
                    area. The player will be auto-seated at the most balanced table.
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Player Name</label>
                  <Input
                    placeholder="Enter player name..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleAdd}>
                    Register Player
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipTrigger>
      {(!hasEmptySeats || !lateRegOpen) && (
        <TooltipContent>
          {!lateRegOpen
            ? "Late registration has closed"
            : "No empty seats available"}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
