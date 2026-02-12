"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTournament, TournamentContext } from "@/lib/context";
import { StatsBar } from "./stats-bar";
import { TournamentClock } from "./tournament-clock";
import { FloorPlan } from "@/components/tables/floor-plan";
import { BustPlayerModal } from "@/components/admin/bust-player-modal";
import { AddPlayerModal } from "@/components/admin/add-player-modal";
import { RedrawPanel } from "@/components/admin/redraw-panel";
import { TournamentSettings } from "@/components/settings/tournament-settings";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { ReportsPanel } from "@/components/admin/reports-panel";
import { motion, useAnimation } from "framer-motion";

export function TournamentView() {
  const contextValue = useTournament();
  const { selectedTournament, state } = contextValue;

  // Track which tournament is currently *displayed* in the animated area.
  // This only updates AFTER the exit animation completes, so old content
  // stays visible during fade-out instead of flashing new data.
  const [displayedId, setDisplayedId] = useState(selectedTournament?.id ?? "");
  const controls = useAnimation();
  const isTransitioning = useRef(false);

  // Animate out → swap data → animate in when selection changes
  useEffect(() => {
    const newId = selectedTournament?.id ?? "";
    if (newId === displayedId || isTransitioning.current) return;

    isTransitioning.current = true;

    // Phase 1: fade out old content
    controls
      .start({ opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" } })
      .then(() => {
        // Phase 2: swap displayed tournament (children will now render new data)
        setDisplayedId(newId);

        // Phase 3: fade in new content from below
        controls.set({ opacity: 0, y: 10 });
        return controls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 0.25, ease: "easeOut" },
        });
      })
      .then(() => {
        isTransitioning.current = false;
      });
  }, [selectedTournament?.id, displayedId, controls]);

  // Initial appearance
  useEffect(() => {
    controls.set({ opacity: 1, y: 0 });
  }, [controls]);

  // The tournament to render in the animated area
  const displayedTournament = state.tournaments.find((t) => t.id === displayedId);

  // Override context so children inside the animated area see displayedTournament
  // instead of selectedTournament (prevents data flash during exit animation)
  const displayedContext = useMemo(
    () => ({
      ...contextValue,
      selectedTournament: displayedTournament,
    }),
    [contextValue, displayedTournament]
  );

  const isLive = displayedTournament?.status === "live";
  const selectedIsLive = selectedTournament?.status === "live";

  if (!selectedTournament) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a tournament to get started
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Actions bar — uses real selectedTournament for immediate feedback */}
      <div className="px-4 md:px-6 py-3 border-b border-border flex items-center justify-between bg-card/30 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {selectedIsLive && (
            <>
              <BustPlayerModal />
              <AddPlayerModal />
              <RedrawPanel />
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <ReportsPanel />
          <NotificationPanel />
          <TournamentSettings />
        </div>
      </div>

      {/* Scrollable content with animated transitions */}
      <div className="flex-1 overflow-y-auto">
        <motion.div animate={controls} className="p-4 md:p-6 space-y-5">
          {/* key={displayedId} forces a full remount of children when the
              displayed tournament changes, so stagger / entrance animations
              in FloorPlan, StatsBar, etc. replay correctly. */}
          <TournamentContext.Provider key={displayedId} value={displayedContext}>
            {/* Clock + Stats row */}
            {isLive ? (
              <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-4 items-stretch">
                <div className="order-1">
                  <TournamentClock />
                </div>
                <div className="order-2">
                  <StatsBar />
                </div>
              </div>
            ) : (
              displayedTournament && (
                <>
                  <StatsBar />
                  <div className="max-w-sm mx-auto">
                    <TournamentClock />
                  </div>
                </>
              )
            )}

            {/* Floor Plan */}
            {isLive && <FloorPlan />}
          </TournamentContext.Provider>
        </motion.div>
      </div>
    </div>
  );
}
