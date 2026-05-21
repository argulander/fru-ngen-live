import { useNow } from "@/hooks/useDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DeparturesCard } from "@/components/DeparturesCard";
import { CarCard } from "@/components/CarCard";
import { WeatherCard } from "@/components/WeatherCard";

// Known SL site IDs
const FRUANGEN_METRO_SITE = 9260; // Fruängen T-bana (linje 14)
const FRUANGSGARDEN_BUS_SITE = 1665; // Fruängsgården busshållplats (linje 173)

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
    second: "2-digit",
    timeZone: "Europe/Stockholm",
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
                Stockholm · Fruängen
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-primary tracking-tight">
                Fruängen live
              </h1>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-sm text-muted-foreground capitalize">{dateLabel}</div>
              <div className="text-2xl font-medium tabular-nums text-foreground">{timeLabel}</div>
            </div>
          </header>

          <main className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <DeparturesCard
              title="Buss 173"
              subtitle="Fruängsgården (mot Fruängen)"
              variant="bus"
              siteId={FRUANGSGARDEN_BUS_SITE}
              transport="BUS"
              line="173"
            />
            <DeparturesCard
              title="Tunnelbana linje 14"
              subtitle="Fruängen → T-Centralen"
              variant="metro"
              siteId={FRUANGEN_METRO_SITE}
              transport="METRO"
              line="14"
            />
            <CarCard />
            <WeatherCard />
          </main>

          <footer className="mt-10 text-center text-xs text-muted-foreground">
            Data från SL Transport, Open-Meteo och Google Routes / OSRM.
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
