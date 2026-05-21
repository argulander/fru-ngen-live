import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudSun,
  CloudFog,
  CloudLightning,
  Umbrella,
  Wind,
  Droplets,
} from "lucide-react";
import { DashboardCard, SourceBadge, CardLoading, CardError } from "./DashboardCard";
import { usePoll } from "@/hooks/useDashboard";
import { ReactNode } from "react";
import { getWeatherAdvice } from "@/lib/weatherAdvice";

interface WeatherResp {
  current: {
    temperature_2m: number;
    weather_code: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
}

const codeToText = (c: number): string => {
  if (c === 0) return "Klart";
  if ([1, 2].includes(c)) return "Mestadels klart";
  if (c === 3) return "Mulet";
  if ([45, 48].includes(c)) return "Dimma";
  if ([51, 53, 55, 56, 57].includes(c)) return "Duggregn";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return "Regn";
  if ([71, 73, 75, 77, 85, 86].includes(c)) return "Snö";
  if ([95, 96, 99].includes(c)) return "Åska";
  return "—";
};

const codeToIcon = (c: number, cls = "h-5 w-5"): ReactNode => {
  if (c === 0) return <Sun className={cls} strokeWidth={1.75} />;
  if ([1, 2].includes(c)) return <CloudSun className={cls} strokeWidth={1.75} />;
  if (c === 3) return <Cloud className={cls} strokeWidth={1.75} />;
  if ([45, 48].includes(c)) return <CloudFog className={cls} strokeWidth={1.75} />;
  if ([71, 73, 75, 77, 85, 86].includes(c)) {
    return <CloudSnow className={cls} strokeWidth={1.75} />;
  }
  if ([95, 96, 99].includes(c)) return <CloudLightning className={cls} strokeWidth={1.75} />;
  return <CloudRain className={cls} strokeWidth={1.75} />;
};

export function WeatherCard() {
  const { data, error, loading, updatedAt } = usePoll<WeatherResp>({
    intervalMs: 10 * 60_000,
    fetcher: async () => {
      const url =
        "https://api.open-meteo.com/v1/forecast?latitude=59.2852&longitude=17.9642" +
        "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m" +
        "&hourly=temperature_2m,precipitation_probability,weather_code" +
        "&forecast_hours=12&timezone=Europe%2FStockholm";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo svarade ${res.status}`);
      return res.json();
    },
  });

  const hours = data?.hourly?.time
    ?.map((t, i) => ({
      time: t,
      temp: data.hourly.temperature_2m[i],
      pop: data.hourly.precipitation_probability?.[i] ?? 0,
      code: data.hourly.weather_code[i],
    }))
    .filter((h) => new Date(h.time).getTime() >= Date.now() - 30 * 60_000)
    .slice(0, 8);

  const advice = data
    ? getWeatherAdvice({
        temp: data.current.temperature_2m,
        windMs: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        popNext: (hours ?? []).slice(0, 6).map((h) => h.pop),
      })
    : null;

  const umbrellaTone =
    advice?.umbrella === "Ja"
      ? "bg-accent/15 text-accent"
      : advice?.umbrella === "Kanske"
        ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]"
        : "bg-secondary text-muted-foreground";

  const maxPop = hours?.length ? Math.max(...hours.slice(0, 6).map((h) => h.pop)) : 0;

  return (
    <DashboardCard
      title="Väder"
      subtitle="Kläder, paraply och kommande timmar"
      icon={
        data ? (
          codeToIcon(data.current.weather_code, "h-6 w-6")
        ) : (
          <Cloud className="h-6 w-6" strokeWidth={1.75} />
        )
      }
      badge={
        error ? (
          <SourceBadge label="Ej tillgänglig" tone="fallback" />
        ) : (
          <SourceBadge label="Open-Meteo" tone="live" />
        )
      }
      updatedAt={updatedAt}
    >
      {loading && !data && <CardLoading />}
      {error && <CardError message={error} />}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.15fr_1.25fr] gap-3 lg:gap-6 h-full min-h-0 items-center">
          <div className="flex items-center gap-3 lg:gap-5 min-w-0">
            <span
              className="font-semibold tabular-nums text-foreground leading-none"
              style={{ fontSize: "clamp(64px, 11vh, 112px)" }}
            >
              {Math.round(data.current.temperature_2m)}°
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-primary">
                {codeToIcon(data.current.weather_code, "h-9 w-9 lg:h-12 lg:w-12")}
              </span>
              <span
                className="text-foreground/80 font-medium leading-tight"
                style={{ fontSize: "clamp(15px, 2.1vh, 21px)" }}
              >
                {codeToText(data.current.weather_code)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <p
              className="text-foreground leading-tight font-medium"
              style={{ fontSize: "clamp(18px, 2.5vh, 26px)" }}
            >
              {advice?.comment}
            </p>
            <p
              className="text-muted-foreground leading-snug"
              style={{ fontSize: "clamp(13px, 1.8vh, 17px)" }}
            >
              {advice?.clothing}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${umbrellaTone}`}>
                <Umbrella className="h-4 w-4" strokeWidth={2} />
                Paraply: {advice?.umbrella}
              </span>
              {typeof data.current.wind_speed_10m === "number" && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm bg-secondary text-muted-foreground">
                  <Wind className="h-4 w-4" strokeWidth={2} />
                  {Math.round(data.current.wind_speed_10m)} m/s
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm bg-secondary text-muted-foreground">
                <Droplets className="h-4 w-4" strokeWidth={2} />
                {maxPop}%
              </span>
            </div>
          </div>

          {hours && hours.length > 0 && (
            <div className="overflow-hidden min-w-0">
              <div className="grid grid-cols-4 xl:grid-cols-8 gap-1.5 lg:gap-2">
                {hours.map((h) => {
                  const d = new Date(h.time);
                  const label = d.toLocaleTimeString("sv-SE", { hour: "2-digit" });
                  return (
                    <div
                      key={h.time}
                      className="rounded-2xl bg-secondary/60 px-2 py-2 flex flex-col items-center gap-0.5 min-w-0"
                    >
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-primary">{codeToIcon(h.code, "h-5 w-5")}</span>
                      <span
                        className="font-medium tabular-nums"
                        style={{ fontSize: "clamp(14px, 2vh, 18px)" }}
                      >
                        {Math.round(h.temp)}°
                      </span>
                      <span
                        className={`text-xs tabular-nums ${
                          h.pop >= 40 ? "text-accent font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {h.pop}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
