import { useNow } from "@/hooks/useDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DeparturesCard } from "@/components/DeparturesCard";
import { CarCard } from "@/components/CarCard";
import { WeatherCard } from "@/components/WeatherCard";

const FRUANGEN_METRO_SITE = 9260;
const FRUANGSGARDEN_BUS_SITE = 1665;

const Index = () => {
  const now = useNow(1000);
  const dateLabel = now.toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = now.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });

  return (
    <ErrorBoundary>
      <div className="bg-background lg:h-[100dvh] lg:overflow-hidden">
        <div className="mx-auto max-w-[1280px] h-full px-4 sm:px-6 lg:px-8 py-4 lg:py-5 flex flex-col gap-4 lg:gap-5">
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 sm:gap-2 shrink-0">
            <div>
              <p
                className="uppercase tracking-[0.2em] text-muted-foreground mb-0.5"
                style={{ fontSize: "clamp(10px, 1vw, 13px)" }}
              >
                Stockholm · Fruängen
              </p>
              <h1
                className="font-semibold text-primary tracking-tight leading-none"
                style={{ fontSize: "clamp(26px, 3.2vw, 40px)" }}
              >
                Fruängen live
              </h1>
            </div>
            <div className="text-left sm:text-right">
              <div
                className="text-muted-foreground capitalize"
                style={{ fontSize: "clamp(13px, 1.3vw, 17px)" }}
              >
                {dateLabel}
              </div>
              <div
                className="font-medium tabular-nums text-foreground leading-none"
                style={{ fontSize: "clamp(28px, 3.4vw, 44px)" }}
              >
                {timeLabel}
              </div>
            </div>
          </header>

          <main className="flex flex-col gap-4 lg:gap-5 flex-1 min-h-0">
            <div className="lg:basis-[46%] min-h-0">
              <WeatherCard />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 flex-1 min-h-0">
              <DeparturesCard
                title="Buss 173"
                subtitle="Fruängsgården → Fruängen"
                variant="bus"
                siteId={FRUANGSGARDEN_BUS_SITE}
                transport="BUS"
                line="173"
              />
              <DeparturesCard
                title="Tunnelbana 14"
                subtitle="Fruängen → T-Centralen"
                variant="metro"
                siteId={FRUANGEN_METRO_SITE}
                transport="METRO"
                line="14"
              />
              <CarCard />
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
