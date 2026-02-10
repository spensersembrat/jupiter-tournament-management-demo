"use client";

import { TournamentProvider } from "@/lib/context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TournamentView } from "@/components/tournament/tournament-view";

export default function Home() {
  return (
    <TournamentProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-grid">
          <Header />
          <TournamentView />
        </div>
      </div>
    </TournamentProvider>
  );
}
