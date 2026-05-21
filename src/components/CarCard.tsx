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

function fmtDuration(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} tim ${m % 60} min`;
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
      ? <SourceBadge label="OSRM fallback" tone="fallback" />
      : <SourceBadge label="Google Routes" tone="live" />;

  return (
    <DashboardCard
      title="Bil till jobbet"
      subtitle="Hasselstigen 6 → Lindhagensgatan 100"
      icon={<Car className="h-5 w-5" />}
      badge={badge}
      updatedAt={updatedAt}
    >
      {loading && !data && <CardLoading />}
      {error && <CardError message={error} />}
      {data && (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-semibold tabular-nums text-foreground">
              {fmtDuration(data.durationSec)}
            </span>
            <span className="text-sm text-muted-foreground">{fmtDistance(data.distanceMeters)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-medium ${trafficLabel[data.traffic].tone}`}>
              {data.trafficAware ? trafficLabel[data.traffic].text : "Restid utan live-trafik"}
            </span>
            {data.trafficAware && data.baseDurationSec > 0 && (
              <span className="text-xs text-muted-foreground">
                · normalt {fmtDuration(data.baseDurationSec)}
              </span>
            )}
          </div>
          {!data.trafficAware && (
            <p className="text-xs text-muted-foreground">
              Trafik-medveten data är inte tillgänglig just nu.
            </p>
          )}
          {data.warning && (
            <p className="text-xs text-muted-foreground italic">{data.warning}</p>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
