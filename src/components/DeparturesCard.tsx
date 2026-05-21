import { Train, Bus } from "lucide-react";
import { DashboardCard, SourceBadge, CardLoading, CardError, CardEmpty } from "./DashboardCard";
import { usePoll } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";

interface Departure {
  destination: string;
  display: string;
  scheduled: string;
  expected?: string;
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
  destinationFilter?: string;
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

  const next = departures[0];
  const second = departures[1];
  const nextMins = next ? minutesUntil(next.expected ?? next.scheduled) : null;
  const secondMins = second ? minutesUntil(second.expected ?? second.scheduled) : null;
  const nextDelayed = next?.expected && next?.scheduled && next.expected !== next.scheduled;

  // Color identity per line
  const lineBg = variant === "metro" ? "bg-[hsl(158_55%_30%)]" : "bg-[hsl(210_70%_45%)]";

  return (
    <DashboardCard
      title={title}
      subtitle={subtitle}
      icon={<Icon className="h-7 w-7 lg:h-8 lg:w-8" strokeWidth={1.75} />}
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
      {next && (
        <div className="flex flex-col h-full justify-between gap-4">
          <div className="flex items-stretch gap-5">
            <div
              className={`shrink-0 ${lineBg} text-primary-foreground rounded-2xl flex items-center justify-center px-5 min-w-[96px] lg:min-w-[120px]`}
            >
              <span className="text-5xl lg:text-7xl font-bold tabular-nums leading-none">
                {line}
              </span>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-sm lg:text-base uppercase tracking-widest text-muted-foreground">
                Nästa
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-6xl lg:text-8xl font-semibold tabular-nums text-foreground leading-none">
                  {nextMins === null
                    ? next.display
                    : nextMins <= 0
                    ? "Nu"
                    : nextMins}
                </span>
                {nextMins !== null && nextMins > 0 && (
                  <span className="text-2xl lg:text-3xl text-muted-foreground">min</span>
                )}
              </div>
              <div className="text-lg lg:text-xl text-foreground/80 mt-1 truncate">
                {next.destination}
                <span className="text-muted-foreground"> · {formatTime(next.expected ?? next.scheduled)}</span>
                {nextDelayed && (
                  <span className="ml-2 text-[hsl(var(--warning))] text-base">försenad</span>
                )}
              </div>
            </div>
          </div>

          {second && (
            <div className="border-t border-border/60 pt-3 flex items-baseline justify-between gap-3">
              <div className="text-base lg:text-lg text-muted-foreground">
                Sedan{" "}
                <span className="text-foreground/80">{second.destination}</span>
                <span className="text-muted-foreground"> · {formatTime(second.expected ?? second.scheduled)}</span>
              </div>
              <div className="text-2xl lg:text-3xl font-semibold tabular-nums text-foreground">
                {secondMins === null
                  ? second.display
                  : secondMins <= 0
                  ? "Nu"
                  : `${secondMins} min`}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
