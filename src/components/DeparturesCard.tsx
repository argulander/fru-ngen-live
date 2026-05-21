import { Train, Bus } from "lucide-react";
import { DashboardCard, SourceBadge, CardLoading, CardError, CardEmpty } from "./DashboardCard";
import { usePoll } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";

interface Departure {
  destination: string;
  display: string; // e.g. "5 min", "Nu", "12:34"
  scheduled: string; // ISO
  expected?: string; // ISO
  state?: string;
  line: string;
}

interface DeparturesResponse {
  departures?: Array<{
    destination?: string;
    display?: string;
    scheduled?: string;
    expected?: string;
    state?: string;
    line?: { designation?: string; transport_mode?: string };
    direction_code?: number;
  }>;
  fetchedAt?: string;
}

interface Props {
  title: string;
  subtitle: string;
  variant: "metro" | "bus";
  siteId: number;
  transport: "METRO" | "BUS";
  line: string;
  destinationFilter?: string; // optional filter to match destination string
}

function minutesUntil(iso?: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.round((t - Date.now()) / 60000);
}

function formatTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

export function DeparturesCard({ title, subtitle, variant, siteId, transport, line, destinationFilter }: Props) {
  const { data, error, loading, updatedAt } = usePoll<DeparturesResponse>({
    intervalMs: 30_000,
    fetcher: async () => {
      const params = new URLSearchParams({
        siteId: String(siteId),
        transport,
        line,
      });
      const { data, error } = await supabase.functions.invoke(
        `sl-departures?${params.toString()}`,
        { method: "GET" },
      );
      if (error) throw new Error(error.message ?? "Nätverksfel");
      if (data?.error) throw new Error(data.error);
      return data as DeparturesResponse;
    },
  });

  const Icon = variant === "metro" ? Train : Bus;

  let departures: Departure[] = [];
  if (data?.departures) {
    departures = data.departures
      .filter((d) => (d.line?.designation ?? "") === line)
      .filter((d) =>
        destinationFilter
          ? (d.destination ?? "").toLowerCase().includes(destinationFilter.toLowerCase())
          : true,
      )
      .slice(0, 2)
      .map((d) => ({
        destination: d.destination ?? "—",
        display: d.display ?? "—",
        scheduled: d.scheduled ?? "",
        expected: d.expected,
        state: d.state,
        line: d.line?.designation ?? line,
      }));
  }

  return (
    <DashboardCard
      title={title}
      subtitle={subtitle}
      icon={<Icon className="h-5 w-5" />}
      badge={
        error ? (
          <SourceBadge label="Ej tillgänglig" tone="fallback" />
        ) : (
          <SourceBadge label="SL live" tone="live" />
        )
      }
      updatedAt={updatedAt}
    >
      {loading && !data && <CardLoading />}
      {error && <CardError message={error} />}
      {!loading && !error && departures.length === 0 && (
        <CardEmpty message="Inga kommande avgångar hittades." />
      )}
      {departures.length > 0 && (
        <ul className="divide-y divide-border/60">
          {departures.map((d, i) => {
            const mins = minutesUntil(d.expected ?? d.scheduled);
            const minsLabel =
              mins === null ? d.display : mins <= 0 ? "Nu" : `${mins} min`;
            const delayed = d.expected && d.scheduled && d.expected !== d.scheduled;
            return (
              <li key={i} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center text-xs font-semibold rounded-md bg-primary text-primary-foreground px-2 py-0.5">
                      {d.line}
                    </span>
                    <span className="text-sm font-medium truncate">{d.destination}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTime(d.expected ?? d.scheduled)}
                    {delayed && <span className="ml-2 text-[hsl(var(--warning))]">försenad</span>}
                    {d.state && d.state !== "EXPECTED" && (
                      <span className="ml-2">· {d.state.toLowerCase()}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-semibold tabular-nums text-foreground">
                    {minsLabel}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
