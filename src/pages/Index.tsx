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
      <div className="min-h-screen lg:h-screen bg-background lg:overflow-hidden">
        <div className="mx-auto max-w-[1280px] h-full px-4 sm:px-6 lg:px-8 py-6 lg:py-6 flex flex-col">
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5 lg:mb-6 shrink-0">
            <div>
              <p className="text-xs lg:text-sm uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Stockholm · Fruängen
              </p>
              <h1 className="text-4xl lg:text-5xl font-semibold text-primary tracking-tight">
                Fruängen live
              </h1>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-base lg:text-lg text-muted-foreground capitalize">{dateLabel}</div>
              <div className="text-4xl lg:text-5xl font-medium tabular-nums text-foreground leading-none">
                {timeLabel}
              </div>
            </div>
          </header>

          <main className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 flex-1 min-h-0 md:grid-rows-2">
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
            <WeatherCard />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
