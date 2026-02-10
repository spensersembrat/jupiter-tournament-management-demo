"use client";

import { useState } from "react";
import { useTournament } from "@/lib/context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function TournamentSettings() {
  const { selectedTournament } = useTournament();
  const [blindsExpanded, setBlindsExpanded] = useState(false);
  const [prizepoolExpanded, setPrizepoolExpanded] = useState(false);

  if (!selectedTournament) return null;

  const currentBlind = selectedTournament.blindStructure[selectedTournament.currentLevel - 1];
  const lateRegOpen = selectedTournament.currentLevel <= selectedTournament.lateRegEndLevel;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[440px] sm:max-w-[440px] p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle>{selectedTournament.name} — Settings</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Table Configuration */}
            <section>
              <h4 className="text-sm font-medium mb-3">Table Configuration</h4>
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Game Type</span>
                  <span className="text-sm font-medium">{selectedTournament.gameType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Table Size</span>
                  <span className="text-sm font-medium">{selectedTournament.handsPerTable}-handed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Starting Chips</span>
                  <span className="text-sm font-medium">{selectedTournament.startingChips.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Buy-in</span>
                  <span className="text-sm font-medium">${selectedTournament.buyIn.toLocaleString()}</span>
                </div>
              </div>
            </section>

            <Separator />

            {/* Late Registration */}
            <section>
              <h4 className="text-sm font-medium mb-3">Late Registration</h4>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={lateRegOpen ? "default" : "secondary"}
                    className={cn(
                      lateRegOpen && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    )}
                  >
                    {lateRegOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-muted-foreground">Closes at</span>
                  <span className="text-sm font-medium">
                    End of Level {selectedTournament.lateRegEndLevel}
                  </span>
                </div>
              </div>
            </section>

            <Separator />

            {/* Prizepool */}
            <section>
              <button
                className="flex items-center justify-between w-full mb-3"
                onClick={() => setPrizepoolExpanded(!prizepoolExpanded)}
              >
                <h4 className="text-sm font-medium">Prizepool</h4>
                {prizepoolExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Guaranteed</span>
                  <span className="text-sm font-medium">
                    ${selectedTournament.prizepool.guaranteed.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Entries</span>
                  <span className="text-sm font-medium">
                    {selectedTournament.prizepool.totalEntries || "TBD"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Pool</span>
                  <span className="text-sm font-medium">
                    ${selectedTournament.prizepool.totalPool.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Places Paid</span>
                  <span className="text-sm font-medium">
                    {selectedTournament.prizepool.placesPaid}
                  </span>
                </div>

                {prizepoolExpanded && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                        <span>Place</span>
                        <div className="flex gap-8">
                          <span>%</span>
                          <span className="w-20 text-right">Amount</span>
                        </div>
                      </div>
                      {selectedTournament.prizepool.breakdown.map((entry) => (
                        <div
                          key={entry.place}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">{entry.place}</span>
                          <div className="flex gap-8">
                            <span className="text-muted-foreground">{entry.percentage}%</span>
                            <span className="w-20 text-right font-medium">
                              ${entry.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            <Separator />

            {/* Blind Structure */}
            <section>
              <button
                className="flex items-center justify-between w-full mb-3"
                onClick={() => setBlindsExpanded(!blindsExpanded)}
              >
                <h4 className="text-sm font-medium">Blind Structure</h4>
                {blindsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              <div className="rounded-lg border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs text-muted-foreground font-medium border-b border-border bg-muted/30">
                  <span>Level</span>
                  <span>SB</span>
                  <span>BB</span>
                  <span>Ante</span>
                  <span className="text-right">Time</span>
                </div>

                {/* Show first few levels + current level context, or all if expanded */}
                {(blindsExpanded
                  ? selectedTournament.blindStructure
                  : selectedTournament.blindStructure.slice(
                      0,
                      Math.max(selectedTournament.currentLevel + 2, 6)
                    )
                ).map((level) => (
                  <div
                    key={level.level}
                    className={cn(
                      "grid grid-cols-5 gap-2 px-4 py-2 text-sm border-b border-border last:border-0",
                      level.level === selectedTournament.currentLevel &&
                        "bg-primary/10 font-medium",
                      level.isBreak && "bg-amber-500/5 text-amber-400"
                    )}
                  >
                    {level.isBreak ? (
                      <>
                        <span className="col-span-4">Break</span>
                        <span className="text-right">{level.duration}m</span>
                      </>
                    ) : (
                      <>
                        <span className={cn(
                          level.level === selectedTournament.currentLevel && "text-foreground"
                        )}>
                          {level.level}
                          {level.level === selectedTournament.currentLevel && (
                            <span className="text-emerald-400 ml-1">●</span>
                          )}
                        </span>
                        <span>{level.smallBlind.toLocaleString()}</span>
                        <span>{level.bigBlind.toLocaleString()}</span>
                        <span>{level.ante.toLocaleString()}</span>
                        <span className="text-right text-muted-foreground">{level.duration}m</span>
                      </>
                    )}
                  </div>
                ))}

                {!blindsExpanded && selectedTournament.blindStructure.length > 6 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                    +{selectedTournament.blindStructure.length - Math.max(selectedTournament.currentLevel + 2, 6)} more levels
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
