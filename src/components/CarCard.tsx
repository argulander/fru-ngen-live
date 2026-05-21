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

const trafficTone: Record<RouteResp["traffic"], string> = {
  light: "text-accent",
  normal: "text-muted-foreground",
  heavy: "text-[hsl(var(--warning))]",
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
  const badge = error ? (
    <SourceBadge label="Ej tillgänglig" tone="fallback" />
  ) : isFallback ? (
    <SourceBadge label="Utan live-trafik" tone="fallback" />
  ) : (
    <SourceBadge label="Live-trafik" tone="live" />
  );

  const minutes = data ? Math.round(data.durationSec / 60) : null;
  const baseMin = data ? Math.round(data.baseDurationSec / 60) : null;
  const delayMin = data && baseMin !== null && minutes !== null ? minutes - baseMin : 0;

  let delayText: { text: string; tone: string } | null = null;
  if (data?.trafficAware && baseMin !== null && minutes !== null) {
    if (delayMin >= 2) {
      delayText = { text: `+${delayMin} min trafik`, tone: trafficTone[data.traffic] };
    } else if (delayMin <= -2) {
      delayText = { text: `${delayMin} min mot normalt`, tone: "text-accent" };
    } else {
      delayText = { text: "Normalt trafikläge", tone: "text-muted-foreground" };
    }
  }

  return (
    <DashboardCard
      title="Bil"
      subtitle="Hasselstigen → Lindhagen"
      icon={<Car className="h-5 w-5" strokeWidth={1.75} />}
      badge={badge}
      updatedAt={updatedAt}
    >
      {loading && !data && <CardLoading />}
      {error && <CardError message={error} />}

      {data && minutes !== null && (
        <div className="flex flex-col h-full justify-between gap-2 min-h-0">
          <div className="flex flex-col gap-2">
            <span
              className="uppercase tracking-widest text-muted-foreground"
              style={{ fontSize: "clamp(11px, 1.7vh, 14px)" }}
            >
              Restid nu
            </span>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="font-semibold tabular-nums text-foreground leading-none"
                style={{ fontSize: "clamp(64px, 10.5vh, 104px)" }}
              >
                {minutes}
              </span>
              <span
                className="text-muted-foreground"
                style={{ fontSize: "clamp(20px, 3vh, 30px)" }}
              >
                min
              </span>
            </div>

            <div
              className="text-foreground/80"
              style={{ fontSize: "clamp(14px, 2vh, 19px)" }}
            >
              {fmtDistance(data.distanceMeters)}
              {baseMin !== null && data.trafficAware && (
                <span className="text-muted-foreground"> · normalt {baseMin} min</span>
              )}
            </div>
          </div>

          <div className="border-t border-border/60 pt-2 flex items-baseline justify-between gap-3 shrink-0">
            {data.trafficAware && delayText ? (
              <span
                className={`font-medium ${delayText.tone}`}
                style={{ fontSize: "clamp(13px, 2vh, 17px)" }}
              >
                {delayText.text}
              </span>
            ) : (
              <span
                className="text-muted-foreground"
                style={{ fontSize: "clamp(13px, 2vh, 17px)" }}
              >
                Restid utan live-trafik
              </span>
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
