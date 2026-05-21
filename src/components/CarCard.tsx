import { Car } from "lucide-react";
import { DashboardCard, SourceBadge, CardLoading, CardError } from "./DashboardCard";
import { usePoll } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";

interface RouteResp {
  source: "google" | "osrm";
  durationSec: number;
  baseDurationSec: number;
  distanceMeters: number;
  trafficAware: boolean;
  traffic: "light" | "normal" | "heavy";
  warning?: string;
  origin: string;
  destination: string;
}

function fmtDistance(m: number) {
  return `${(m / 1000).toFixed(1)} km`;
}

const trafficLabel: Record<RouteResp["traffic"], { text: string; tone: string }> = {
  light: { text: "Lätt trafik", tone: "text-accent" },
  normal: { text: "Normal trafik", tone: "text-muted-foreground" },
  heavy: { text: "Tät trafik", tone: "text-[hsl(var(--warning))]" },
};

export function CarCard() {
  const { data, error, loading, updatedAt } = usePoll<RouteResp>({
    intervalMs: 60_000,
    fetcher: async () => {
      const { data, error } = await supabase.functions.invoke("car-route", { method: "GET" });
      if (error) throw new Error(error.message ?? "Nätverksfel");
      if (data?.error) throw new Error(data.error);
      return data as RouteResp;
    },
  });

  const isFallback = data?.source === "osrm";
  const badge = error
    ? <SourceBadge label="Ej tillgänglig" tone="fallback" />
    : isFallback
      ? <SourceBadge label="Utan live-trafik" tone="fallback" />
      : <SourceBadge label="Live-trafik" tone="live" />;

  const minutes = data ? Math.round(data.durationSec / 60) : null;
  const baseMin = data ? Math.round(data.baseDurationSec / 60) : null;

  return (
    <DashboardCard
      title="Bil till jobbet"
      subtitle="Hasselstigen 6 → Lindhagensgatan 100"
      icon={<Car className="h-7 w-7 lg:h-8 lg:w-8" strokeWidth={1.75} />}
      badge={badge}
      updatedAt={updatedAt}
    >
      {loading && !data && <CardLoading />}
      {error && <CardError message={error} />}
      {data && minutes !== null && (
        <div className="flex flex-col h-full justify-between gap-4">
          <div>
            <div className="text-sm lg:text-base uppercase tracking-widest text-muted-foreground">
              Restid nu
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-7xl lg:text-9xl font-semibold tabular-nums text-foreground leading-none">
                {minutes}
              </span>
              <span className="text-2xl lg:text-3xl text-muted-foreground">min</span>
            </div>
            <div className="text-lg lg:text-xl text-foreground/80 mt-1">
              {fmtDistance(data.distanceMeters)}
              {data.trafficAware && baseMin !== null && (
                <span className="text-muted-foreground"> · normalt {baseMin} min</span>
              )}
            </div>
          </div>

          <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-3">
            <span className={`text-lg lg:text-xl font-medium ${data.trafficAware ? trafficLabel[data.traffic].tone : "text-muted-foreground"}`}>
              {data.trafficAware ? trafficLabel[data.traffic].text : "Restid utan live-trafik"}
            </span>
            {data.warning && (
              <span className="text-xs text-muted-foreground italic truncate max-w-[40%]">{data.warning}</span>
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
