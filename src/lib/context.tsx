"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import { Tournament, TournamentState, Notification, Player, NotificationType } from "./types";
import { INITIAL_STATE, generatePlayerId } from "./data";

// ── Actions ─────────────────────────────────────────────────────────

type Action =
  | { type: "SELECT_TOURNAMENT"; tournamentId: string }
  | { type: "BUST_PLAYER"; tournamentId: string; playerId: string }
  | { type: "ADD_PLAYER"; tournamentId: string; playerName: string }
  | { type: "TOGGLE_CLOCK"; tournamentId: string }
  | { type: "TICK_CLOCK"; tournamentId: string }
  | { type: "NEXT_LEVEL"; tournamentId: string }
  | { type: "PREV_LEVEL"; tournamentId: string }
  | { type: "ADD_NOTIFICATION"; notification: Notification }
  | { type: "MARK_NOTIFICATION_READ"; notificationId: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ"; tournamentId: string }
  | { type: "CLEAR_REDRAW"; tournamentId: string }
  | { type: "RESET_DEMO" }
  | { type: "LOAD_STATE"; state: TournamentState };

// ── Helpers ─────────────────────────────────────────────────────────

function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  tournamentId: string
): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    message,
    timestamp: Date.now(),
    read: false,
    tournamentId,
  };
}

function getPlayerCount(tournament: Tournament): number {
  return tournament.tables.reduce(
    (count, table) => count + table.seats.filter((s) => s.player !== null).length,
    0
  );
}

function findEmptySeat(tournament: Tournament): { tableId: string; tableNumber: number; seatPosition: number } | null {
  // Prefer the table with the fewest empty seats (to keep tables balanced)
  const tablesWithEmpty = tournament.tables
    .map((table) => ({
      table,
      emptySeats: table.seats.filter((s) => s.player === null),
      playerCount: table.seats.filter((s) => s.player !== null).length,
    }))
    .filter((t) => t.emptySeats.length > 0)
    .sort((a, b) => a.playerCount - b.playerCount); // fill shortest tables first

  if (tablesWithEmpty.length === 0) return null;

  const target = tablesWithEmpty[0];
  const seat = target.emptySeats[0];

  return {
    tableId: target.table.id,
    tableNumber: target.table.number,
    seatPosition: seat.position,
  };
}

function checkRebalanceNeeded(tournament: Tournament): Notification[] {
  const notifications: Notification[] = [];
  const tableCounts = tournament.tables.map((t) => ({
    table: t,
    count: t.seats.filter((s) => s.player !== null).length,
  }));

  if (tableCounts.length === 0) return notifications;

  const maxCount = Math.max(...tableCounts.map((t) => t.count));

  for (const tc of tableCounts) {
    if (tc.count > 0 && maxCount - tc.count >= 2) {
      // Find a player to suggest moving
      const fullestTable = tableCounts.find((t) => t.count === maxCount);
      if (fullestTable) {
        const playerToMove = fullestTable.table.seats.find((s) => s.player !== null);
        const emptySeat = tc.table.seats.find((s) => s.player === null);
        if (playerToMove?.player && emptySeat) {
          notifications.push(
            createNotification(
              "redraw",
              "Table Rebalance Needed",
              `Table ${tc.table.number} has ${tc.count} players. Move ${playerToMove.player.name} (Table ${fullestTable.table.number}, Seat ${playerToMove.position}) → Table ${tc.table.number}, Seat ${emptySeat.position}`,
              tournament.id
            )
          );
        }
      }
    }
  }

  return notifications;
}

// ── Reducer ─────────────────────────────────────────────────────────

function reducer(state: TournamentState, action: Action): TournamentState {
  switch (action.type) {
    case "SELECT_TOURNAMENT":
      return { ...state, selectedTournamentId: action.tournamentId };

    case "BUST_PLAYER": {
      let bustedPlayer: Player | null = null;
      let bustedTableNumber = 0;

      const tournaments = state.tournaments.map((t) => {
        if (t.id !== action.tournamentId) return t;
        return {
          ...t,
          tables: t.tables.map((table) => ({
            ...table,
            seats: table.seats.map((seat) => {
              if (seat.player?.id === action.playerId) {
                bustedPlayer = seat.player;
                bustedTableNumber = table.number;
                return { ...seat, player: null };
              }
              return seat;
            }),
          })),
        };
      });

      const updatedTournament = tournaments.find((t) => t.id === action.tournamentId);
      let newNotifications = [...state.notifications];

      if (bustedPlayer) {
        newNotifications.push(
          createNotification(
            "action",
            "Player Busted",
            `${(bustedPlayer as Player).name} eliminated from Table ${bustedTableNumber}, Seat ${(bustedPlayer as Player).seatNumber}`,
            action.tournamentId
          )
        );

        // Check if rebalance is needed
        if (updatedTournament) {
          const rebalanceNotifs = checkRebalanceNeeded(updatedTournament);
          newNotifications = [...newNotifications, ...rebalanceNotifs];
        }
      }

      return { ...state, tournaments, notifications: newNotifications };
    }

    case "ADD_PLAYER": {
      const tournament = state.tournaments.find((t) => t.id === action.tournamentId);
      if (!tournament) return state;

      const emptySeat = findEmptySeat(tournament);
      if (!emptySeat) return state;

      const newPlayer: Player = {
        id: generatePlayerId(),
        name: action.playerName,
        chipCount: tournament.startingChips,
        tableId: emptySeat.tableId,
        seatNumber: emptySeat.seatPosition,
      };

      const tournaments = state.tournaments.map((t) => {
        if (t.id !== action.tournamentId) return t;
        return {
          ...t,
          tables: t.tables.map((table) => {
            if (table.id !== emptySeat.tableId) return table;
            return {
              ...table,
              seats: table.seats.map((seat) => {
                if (seat.position === emptySeat.seatPosition) {
                  return { ...seat, player: newPlayer };
                }
                return seat;
              }),
            };
          }),
        };
      });

      const notification = createNotification(
        "action",
        "Player Added",
        `${action.playerName} seated at Table ${emptySeat.tableNumber}, Seat ${emptySeat.seatPosition}`,
        action.tournamentId
      );

      return {
        ...state,
        tournaments,
        notifications: [...state.notifications, notification],
      };
    }

    case "TOGGLE_CLOCK": {
      const tournaments = state.tournaments.map((t) => {
        if (t.id !== action.tournamentId) return t;
        return { ...t, clockRunning: !t.clockRunning };
      });
      return { ...state, tournaments };
    }

    case "TICK_CLOCK": {
      const tournaments = state.tournaments.map((t) => {
        if (t.id !== action.tournamentId || !t.clockRunning) return t;
        if (t.clockTimeRemaining <= 1) {
          // Move to next level
          const nextLevel = t.currentLevel + 1;
          if (nextLevel > t.blindStructure.length) {
            return { ...t, clockRunning: false, clockTimeRemaining: 0 };
          }
          const nextBlind = t.blindStructure[nextLevel - 1];
          return {
            ...t,
            currentLevel: nextLevel,
            clockTimeRemaining: nextBlind.duration * 60,
          };
        }
        return { ...t, clockTimeRemaining: t.clockTimeRemaining - 1 };
      });

      // Check if level changed and add notification
      const oldT = state.tournaments.find((t) => t.id === action.tournamentId);
      const newT = tournaments.find((t) => t.id === action.tournamentId);
      let notifications = state.notifications;

      if (oldT && newT && oldT.currentLevel !== newT.currentLevel) {
        const blind = newT.blindStructure[newT.currentLevel - 1];
        const msg = blind.isBreak
          ? `Break time — ${blind.duration} minutes`
          : `Level ${newT.currentLevel} starting — Blinds ${blind.smallBlind.toLocaleString()}/${blind.bigBlind.toLocaleString()}/${blind.ante.toLocaleString()}`;

        notifications = [
          ...notifications,
          createNotification("level", blind.isBreak ? "Break" : "Level Change", msg, newT.id),
        ];
      }

      return { ...state, tournaments, notifications };
    }

    case "NEXT_LEVEL": {
      const tournaments = state.tournaments.map((t) => {
        if (t.id !== action.tournamentId) return t;
        const nextLevel = Math.min(t.currentLevel + 1, t.blindStructure.length);
        const nextBlind = t.blindStructure[nextLevel - 1];
        return {
          ...t,
          currentLevel: nextLevel,
          clockTimeRemaining: nextBlind.duration * 60,
        };
      });

      const newT = tournaments.find((t) => t.id === action.tournamentId);
      let notifications = state.notifications;
      if (newT) {
        const blind = newT.blindStructure[newT.currentLevel - 1];
        const msg = blind.isBreak
          ? `Break time — ${blind.duration} minutes`
          : `Level ${newT.currentLevel} starting — Blinds ${blind.smallBlind.toLocaleString()}/${blind.bigBlind.toLocaleString()}/${blind.ante.toLocaleString()}`;
        notifications = [
          ...notifications,
          createNotification("level", blind.isBreak ? "Break" : "Level Change", msg, newT.id),
        ];
      }

      return { ...state, tournaments, notifications };
    }

    case "PREV_LEVEL": {
      const tournaments = state.tournaments.map((t) => {
        if (t.id !== action.tournamentId) return t;
        const prevLevel = Math.max(t.currentLevel - 1, 1);
        const prevBlind = t.blindStructure[prevLevel - 1];
        return {
          ...t,
          currentLevel: prevLevel,
          clockTimeRemaining: prevBlind.duration * 60,
        };
      });
      return { ...state, tournaments };
    }

    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.notification] };

    case "MARK_NOTIFICATION_READ": {
      const notifications = state.notifications.map((n) =>
        n.id === action.notificationId ? { ...n, read: true } : n
      );
      return { ...state, notifications };
    }

    case "MARK_ALL_NOTIFICATIONS_READ": {
      const notifications = state.notifications.map((n) =>
        n.tournamentId === action.tournamentId ? { ...n, read: true } : n
      );
      return { ...state, notifications };
    }

    case "CLEAR_REDRAW": {
      const tournaments = state.tournaments.map((t) => {
        if (t.id !== action.tournamentId) return t;
        return { ...t, pendingRedraw: undefined, clockRunning: true };
      });
      const notification = createNotification(
        "redraw",
        "Redraw Complete",
        "All players have been redrawn to their new seats. Clock resumed.",
        action.tournamentId
      );
      return {
        ...state,
        tournaments,
        notifications: [...state.notifications, notification],
      };
    }

    case "RESET_DEMO":
      if (typeof window !== "undefined") {
        localStorage.removeItem("jupiter-demo-state");
      }
      return INITIAL_STATE;

    case "LOAD_STATE":
      return action.state;

    default:
      return state;
  }
}

// ── Context ─────────────────────────────────────────────────────────

interface TournamentContextType {
  state: TournamentState;
  selectedTournament: Tournament | undefined;
  dispatch: React.Dispatch<Action>;
  selectTournament: (id: string) => void;
  bustPlayer: (playerId: string) => void;
  addPlayer: (name: string) => void;
  toggleClock: () => void;
  nextLevel: () => void;
  prevLevel: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemo: () => void;
  getPlayerCount: (tournament: Tournament) => number;
  unreadNotificationCount: number;
  tournamentNotifications: Notification[];
}

export const TournamentContext = createContext<TournamentContextType | null>(null);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [mounted, setMounted] = React.useState(false);
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const saved = localStorage.getItem("jupiter-demo-state");
      if (saved) {
        const parsed = JSON.parse(saved) as TournamentState;
        dispatch({ type: "LOAD_STATE", state: parsed });
      }
    } catch {
      // ignore parse errors
    }
    setMounted(true);
  }, []);

  // Save to localStorage on every state change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("jupiter-demo-state", JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, mounted]);

  // Clock tick interval
  useEffect(() => {
    const runningTournaments = state.tournaments.filter((t) => t.clockRunning);
    if (runningTournaments.length === 0) return;

    const interval = setInterval(() => {
      for (const t of runningTournaments) {
        dispatch({ type: "TICK_CLOCK", tournamentId: t.id });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.tournaments]);

  const selectedTournament = state.tournaments.find(
    (t) => t.id === state.selectedTournamentId
  );

  const tournamentNotifications = state.notifications
    .filter((n) => n.tournamentId === state.selectedTournamentId)
    .sort((a, b) => b.timestamp - a.timestamp);

  const unreadNotificationCount = tournamentNotifications.filter((n) => !n.read).length;

  const selectTournament = useCallback(
    (id: string) => dispatch({ type: "SELECT_TOURNAMENT", tournamentId: id }),
    []
  );

  const bustPlayer = useCallback(
    (playerId: string) => {
      if (!selectedTournament) return;
      dispatch({ type: "BUST_PLAYER", tournamentId: selectedTournament.id, playerId });
    },
    [selectedTournament]
  );

  const addPlayer = useCallback(
    (name: string) => {
      if (!selectedTournament) return;
      dispatch({ type: "ADD_PLAYER", tournamentId: selectedTournament.id, playerName: name });
    },
    [selectedTournament]
  );

  const toggleClock = useCallback(() => {
    if (!selectedTournament) return;
    dispatch({ type: "TOGGLE_CLOCK", tournamentId: selectedTournament.id });
  }, [selectedTournament]);

  const nextLevel = useCallback(() => {
    if (!selectedTournament) return;
    dispatch({ type: "NEXT_LEVEL", tournamentId: selectedTournament.id });
  }, [selectedTournament]);

  const prevLevel = useCallback(() => {
    if (!selectedTournament) return;
    dispatch({ type: "PREV_LEVEL", tournamentId: selectedTournament.id });
  }, [selectedTournament]);

  const markNotificationRead = useCallback(
    (id: string) => dispatch({ type: "MARK_NOTIFICATION_READ", notificationId: id }),
    []
  );

  const markAllNotificationsRead = useCallback(() => {
    if (!selectedTournament) return;
    dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ", tournamentId: selectedTournament.id });
  }, [selectedTournament]);

  const resetDemo = useCallback(() => dispatch({ type: "RESET_DEMO" }), []);

  // Show nothing during SSR / before hydration to avoid mismatch
  // (demo data uses Math.random for chip counts)
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          <p className="text-sm text-muted-foreground">Loading tournament data…</p>
        </div>
      </div>
    );
  }

  return (
    <TournamentContext.Provider
      value={{
        state,
        selectedTournament,
        dispatch,
        selectTournament,
        bustPlayer,
        addPlayer,
        toggleClock,
        nextLevel,
        prevLevel,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemo,
        getPlayerCount,
        unreadNotificationCount,
        tournamentNotifications,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error("useTournament must be used within TournamentProvider");
  }
  return context;
}
