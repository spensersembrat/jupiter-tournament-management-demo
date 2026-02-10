"use client";

import { useState } from "react";
import { useTournament } from "@/lib/context";
import { Tournament } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { RotateCcw, Menu } from "lucide-react";
import { motion } from "framer-motion";

function TournamentItem({
  tournament,
  isSelected,
  onSelect,
  playerCount,
}: {
  tournament: Tournament;
  isSelected: boolean;
  onSelect: () => void;
  playerCount: number;
}) {
  const isLive = tournament.status === "live";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left px-3 py-3 rounded-lg transition-colors relative",
        "hover:bg-accent/50",
        isSelected && "bg-accent"
      )}
    >
      {isSelected && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-foreground rounded-r-full"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{tournament.name}</span>
        <Badge
          variant={isLive ? "default" : "secondary"}
          className={cn(
            "text-[10px] uppercase tracking-wider px-1.5 py-0",
            isLive && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          )}
        >
          {isLive && (
            <span className="relative flex h-1.5 w-1.5 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
          )}
          {isLive ? "Live" : "Upcoming"}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{tournament.gameType}</span>
        <span>·</span>
        <span>${tournament.buyIn.toLocaleString()}</span>
        {isLive && (
          <>
            <span>·</span>
            <span>{playerCount} players</span>
          </>
        )}
      </div>
    </button>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { state, selectTournament, getPlayerCount, resetDemo } = useTournament();

  const liveTournaments = state.tournaments.filter((t) => t.status === "live");
  const upcomingTournaments = state.tournaments.filter((t) => t.status === "upcoming");

  const handleSelect = (id: string) => {
    selectTournament(id);
    onNavigate?.();
  };

  return (
    <>
      {/* Logo / Title */}
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-base font-semibold tracking-tight">Jupiter</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Tournament Management Demo</p>
        <p className="text-[11px] text-muted-foreground/50 mt-1">
          Built by{" "}
          <a
            href="https://www.juniperapps.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            Juniper Studios
          </a>
        </p>
      </div>

      {/* Tournament List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Live */}
        <div className="mb-1">
          <p className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Live Events
          </p>
          {liveTournaments.map((t) => (
            <TournamentItem
              key={t.id}
              tournament={t}
              isSelected={state.selectedTournamentId === t.id}
              onSelect={() => handleSelect(t.id)}
              playerCount={getPlayerCount(t)}
            />
          ))}
        </div>

        <Separator className="my-2" />

        {/* Upcoming */}
        <div>
          <p className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Upcoming Events
          </p>
          {upcomingTournaments.map((t) => (
            <TournamentItem
              key={t.id}
              tournament={t}
              isSelected={state.selectedTournamentId === t.id}
              onSelect={() => handleSelect(t.id)}
              playerCount={0}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <a
          href="https://www.juniperapps.com/contact.html"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-rose-500/10 px-3 py-3 hover:from-amber-500/20 hover:to-rose-500/20 transition-all"
        >
          <p className="text-[11px] leading-relaxed text-amber-200/80">
            Interested in a fully custom solution for your poker room or tournament series?{" "}
            <span className="text-amber-300 font-semibold">Get in touch &rarr;</span>
          </p>
        </a>
        <a
          href="https://apps.apple.com/us/developer/juniper-studios/id1729037646"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 px-3 py-3 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all"
        >
          <p className="text-[11px] leading-relaxed text-blue-200/80">
            View the player-side demo app{" "}
            <span className="text-blue-300 font-semibold">&rarr;</span>
          </p>
        </a>
        <Separator />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
          onClick={resetDemo}
        >
          <RotateCcw className="h-3.5 w-3.5 mr-2" />
          Reset Demo
        </Button>
      </div>
    </>
  );
}

/** Desktop sidebar — hidden on mobile */
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 h-screen border-r border-border bg-card flex-col shrink-0">
      <SidebarContent />
    </aside>
  );
}

/** Mobile sidebar trigger + drawer */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
