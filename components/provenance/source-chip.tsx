import type { ProvenanceSource } from "@/lib/provenance/types";
import { cn } from "@/lib/utils";

const LABELS: Record<ProvenanceSource, string> = {
  ntrr: "ntrr",
  google: "Google",
  microsoft: "Microsoft",
  apple_caldav: "Apple",
  zapier: "Zapier",
};

export function SourceChip({ source }: { source: ProvenanceSource }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        source === "ntrr" && "bg-primary/10 text-primary",
        source === "google" && "bg-brand/10 text-brand",
        source !== "ntrr" && source !== "google" && "bg-muted text-muted-foreground",
      )}
    >
      {LABELS[source]}
    </span>
  );
}