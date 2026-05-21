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

  const lineBg = variant === "metro" ? "bg-[hsl(158_55%_30%)]" : "bg-[hsl(210_70%_45%)]";

  return (
    <DashboardCard
      title={title}
      subtitle={subtitle}
      icon={<Icon className="h-6 w-6" strokeWidth={1.75} />}
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
        <div className="flex flex-col h-full justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center justify-center ${lineBg} text-primary-foreground rounded-xl px-3 py-1 font-bold tabular-nums leading-none`}
                style={{ fontSize: "clamp(22px, 2.4vw, 32px)" }}
              >
                {line}
              </span>
              <span
                className="uppercase tracking-widest text-muted-foreground"
                style={{ fontSize: "clamp(11px, 1vw, 14px)" }}
              >
                Nästa
              </span>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="font-semibold tabular-nums text-foreground leading-none"
                style={{ fontSize: "clamp(56px, 7.5vw, 104px)" }}
              >
                {nextMins === null ? next.display : nextMins <= 0 ? "Nu" : nextMins}
              </span>
              {nextMins !== null && nextMins > 0 && (
                <span
                  className="text-muted-foreground"
                  style={{ fontSize: "clamp(18px, 1.8vw, 26px)" }}
                >
                  min
                </span>
              )}
            </div>

            <div
              className="text-foreground/80 truncate"
              style={{ fontSize: "clamp(13px, 1.25vw, 17px)" }}
            >
              {next.destination}
              <span className="text-muted-foreground"> · {formatTime(next.expected ?? next.scheduled)}</span>
              {nextDelayed && (
                <span className="ml-2 text-[hsl(var(--warning))]">försenad</span>
              )}
            </div>
          </div>

          {second && (
            <div className="border-t border-border/60 pt-2 flex items-baseline justify-between gap-3">
              <div
                className="text-muted-foreground truncate"
                style={{ fontSize: "clamp(12px, 1.1vw, 15px)" }}
              >
                Sedan {formatTime(second.expected ?? second.scheduled)}
              </div>
              <div
                className="font-semibold tabular-nums text-foreground"
                style={{ fontSize: "clamp(18px, 1.8vw, 24px)" }}
              >
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
