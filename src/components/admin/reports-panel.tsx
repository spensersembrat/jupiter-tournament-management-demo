"use client";

import { useState } from "react";
import { useTournament } from "@/lib/context";
import {
  REPORT_OPTIONS,
  ReportType,
  generateReport,
} from "@/lib/reports";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FileText, Download, FileSpreadsheet, Trophy, Table2, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REPORT_ICONS: Record<ReportType, typeof FileText> = {
  "tournament-summary": List,
  "blind-structure": FileSpreadsheet,
  "payout-schedule": Trophy,
  "seating-chart": Table2,
};

export function ReportsPanel() {
  const { selectedTournament } = useTournament();
  const [open, setOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    if (!selectedTournament || !selectedReport) return;
    setGenerating(true);
    try {
      generateReport(selectedTournament, selectedReport);
      toast.success("Report generated", {
        description: "Your PDF has been downloaded.",
      });
      setOpen(false);
      setSelectedReport(null);
    } catch (err) {
      toast.error("Failed to generate report", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (!selectedTournament) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Reports</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:w-[440px] sm:max-w-[440px] flex flex-col p-0">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-4 sm:px-6 sm:py-5 shrink-0 border-b border-border">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Generate Report
              </SheetTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Choose a report type to generate a PDF for {selectedTournament.name}.
              </p>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <div className="space-y-2">
              {REPORT_OPTIONS.map((opt) => {
                const Icon = REPORT_ICONS[opt.id];
                const isSelected = selectedReport === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedReport(opt.id)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                      "hover:bg-accent/50",
                      isSelected && "border-primary bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                        isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 border-t border-border px-4 py-4 sm:px-6">
            <Button
              className="w-full gap-2"
              disabled={!selectedReport || generating}
              onClick={handleGenerate}
            >
              <Download className="h-4 w-4" />
              {generating ? "Generating…" : "Download PDF"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
