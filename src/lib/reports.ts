import { jsPDF } from "jspdf";
import type { Tournament } from "./types";

export type ReportType =
  | "tournament-summary"
  | "blind-structure"
  | "payout-schedule"
  | "seating-chart";

export interface ReportOption {
  id: ReportType;
  label: string;
  description: string;
}

export const REPORT_OPTIONS: ReportOption[] = [
  {
    id: "tournament-summary",
    label: "Tournament Summary",
    description: "Overview of event details, current level, players, and clock",
  },
  {
    id: "blind-structure",
    label: "Blind Structure",
    description: "Full schedule of blinds and antes",
  },
  {
    id: "payout-schedule",
    label: "Payout Schedule",
    description: "Prizepool breakdown and place payouts",
  },
  {
    id: "seating-chart",
    label: "Seating Chart",
    description: "Tables and player assignments",
  },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCurrency(n: number): string {
  return "$" + n.toLocaleString();
}

function formatChips(n: number): string {
  return n.toLocaleString();
}

export function generateReport(tournament: Tournament, reportType: ReportType): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addTitle = (text: string) => {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 28;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(text, margin, y);
    y += 18;
    doc.setTextColor(0, 0, 0);
  };

  const addSection = (title: string) => {
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, y);
    y += 20;
  };

  const addLine = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(label, margin, y);
    doc.text(value, margin + 120, y);
    y += 16;
  };

  const addTableHeader = (cols: string[]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 6, contentWidth, 18, "F");
    const colWidth = contentWidth / cols.length;
    cols.forEach((col, i) => {
      doc.text(col, margin + colWidth * i + 8, y + 4);
    });
    y += 22;
  };

  const addTableRow = (cells: string[], colWidths?: number[]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const w = colWidths ?? Array(cells.length).fill(contentWidth / cells.length);
    cells.forEach((cell, i) => {
      doc.text(cell, margin + w.slice(0, i).reduce((a, b) => a + b, 0) + 8, y + 4);
    });
    y += 14;
  };

  const checkPageBreak = (needed: number = 40) => {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = margin;
    }
  };

  // Header for all reports
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(tournament.name, margin, y);
  y += 24;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated ${new Date().toLocaleString()} · ${tournament.status.toUpperCase()} Event`,
    margin,
    y
  );
  doc.setTextColor(0, 0, 0);
  y += 28;

  switch (reportType) {
    case "tournament-summary": {
      addTitle("Tournament Summary");

      addSection("Event Details");
      addLine("Buy-in", formatCurrency(tournament.buyIn));
      addLine("Game Type", tournament.gameType);
      addLine("Starting Chips", formatChips(tournament.startingChips));
      addLine("Late Registration Ends", `Level ${tournament.lateRegEndLevel}`);

      addSection("Current Status");
      const totalPlayers = tournament.tables.reduce(
        (sum, t) => sum + t.seats.filter((s) => s.player).length,
        0
      );
      addLine("Players Remaining", totalPlayers.toString());
      addLine("Tables", tournament.tables.length.toString());
      addLine("Current Level", tournament.currentLevel.toString());

      const currentBlind = tournament.blindStructure[tournament.currentLevel - 1];
      if (currentBlind && !currentBlind.isBreak) {
        addLine(
          "Blinds",
          `${formatChips(currentBlind.smallBlind)} / ${formatChips(currentBlind.bigBlind)}`
        );
        if (currentBlind.ante > 0) addLine("Ante", formatChips(currentBlind.ante));
        addLine("Level Duration", `${currentBlind.duration} min`);
      }

      if (tournament.status === "live") {
        addLine("Clock", formatTime(tournament.clockTimeRemaining));
        addLine("Clock Status", tournament.clockRunning ? "Running" : "Paused");
      }

      addSection("Prizepool");
      addLine("Guaranteed", formatCurrency(tournament.prizepool.guaranteed));
      addLine("Total Pool", formatCurrency(tournament.prizepool.totalPool));
      addLine("Places Paid", tournament.prizepool.placesPaid.toString());

      if (tournament.paidOutPlayers?.length) {
        addSection("Payouts Awarded");
        for (const p of tournament.paidOutPlayers) {
          checkPageBreak();
          addLine(`${p.placeLabel} place`, `${p.playerName} — ${formatCurrency(p.amount)}`);
        }
      }
      break;
    }

    case "blind-structure": {
      addTitle("Blind Structure");

      addTableHeader(["Level", "Small Blind", "Big Blind", "Ante", "Duration"]);
      for (const level of tournament.blindStructure) {
        checkPageBreak();
        if (level.isBreak) {
          addTableRow(["Break", "—", "—", "—", `${level.duration} min`]);
        } else {
          addTableRow(
            [
              level.level.toString(),
              formatChips(level.smallBlind),
              formatChips(level.bigBlind),
              level.ante > 0 ? formatChips(level.ante) : "—",
              `${level.duration} min`,
            ],
            [40, 80, 80, 60, 60]
          );
        }
      }
      break;
    }

    case "payout-schedule": {
      addTitle("Payout Schedule");

      addSubtitle(`Total Prizepool: ${formatCurrency(tournament.prizepool.totalPool)}`);
      addSubtitle(`Places Paid: ${tournament.prizepool.placesPaid}`);

      addTableHeader(["Place", "Amount", "Percentage"]);
      for (const entry of tournament.prizepool.breakdown) {
        checkPageBreak();
        addTableRow([
          entry.place,
          formatCurrency(entry.amount),
          `${entry.percentage}%`,
        ]);
      }
      break;
    }

    case "seating-chart": {
      addTitle("Seating Chart");

      for (const table of tournament.tables) {
        checkPageBreak(80);
        addSection(`Table ${table.number}`);
        addTableHeader(["Seat", "Player", "Chips"]);

        const colWidths = [40, contentWidth - 40 - 80, 80];
        for (const seat of table.seats) {
          if (seat.player) {
            addTableRow(
              [
                seat.position.toString(),
                seat.player.name,
                formatChips(seat.player.chipCount),
              ],
              colWidths
            );
          } else {
            addTableRow([seat.position.toString(), "—", "—"], colWidths);
          }
        }
        y += 8;
      }
      break;
    }
  }

  const filename = `${tournament.name.replace(/[^a-z0-9]/gi, "-")}-${reportType}.pdf`;
  doc.save(filename);
}
