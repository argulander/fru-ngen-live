import { Cloud, CloudRain, CloudSnow, Sun, CloudSun, CloudFog, CloudLightning } from "lucide-react";
import { DashboardCard, SourceBadge, CardLoading, CardError } from "./DashboardCard";
import { usePoll } from "@/hooks/useDashboard";
import { ReactNode } from "react";

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
  if ([71, 73, 75, 77, 85, 86].includes(c)) return <CloudSnow className={cls} strokeWidth={1.75} />;
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

  return (
    <DashboardCard
      title="Väder i Fruängen"
      subtitle="Just nu"
      icon={data ? codeToIcon(data.current.weather_code, "h-7 w-7 lg:h-8 lg:w-8") : <Cloud className="h-7 w-7 lg:h-8 lg:w-8" strokeWidth={1.75} />}
      badge={
        error ? <SourceBadge label="Ej tillgänglig" tone="fallback" /> : <SourceBadge label="Open-Meteo" tone="live" />
      }
      updatedAt={updatedAt}
    >
      {loading && !data && <CardLoading />}
      {error && <CardError message={error} />}
      {data && (
        <div className="flex flex-col h-full justify-between gap-4">
          <div className="flex items-center gap-5">
            <span className="text-7xl lg:text-9xl font-semibold tabular-nums text-foreground leading-none">
              {Math.round(data.current.temperature_2m)}°
            </span>
            <div className="flex flex-col">
              <span className="text-xl lg:text-2xl text-foreground/80">
                {codeToText(data.current.weather_code)}
              </span>
              {typeof data.current.wind_speed_10m === "number" && (
                <span className="text-base lg:text-lg text-muted-foreground">
                  {Math.round(data.current.wind_speed_10m)} m/s vind
                </span>
              )}
            </div>
          </div>

          {hours && hours.length > 0 && (
            <div className="-mx-1 overflow-x-auto">
              <div className="flex gap-2 px-1 min-w-full">
                {hours.map((h) => {
                  const d = new Date(h.time);
                  const label = d.toLocaleTimeString("sv-SE", { hour: "2-digit" });
                  return (
                    <div
                      key={h.time}
                      className="flex-1 min-w-[72px] rounded-2xl bg-secondary/60 px-2 py-3 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs lg:text-sm text-muted-foreground">{label}</span>
                      <span className="text-primary">{codeToIcon(h.code, "h-5 w-5 lg:h-6 lg:w-6")}</span>
                      <span className="text-lg lg:text-xl font-medium tabular-nums">
                        {Math.round(h.temp)}°
                      </span>
                      <span
                        className={`text-xs tabular-nums ${
                          h.pop >= 40 ? "text-accent" : "text-muted-foreground"
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
