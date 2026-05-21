import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SourceBadgeProps {
  label: string;
  tone?: "live" | "fallback" | "info";
}

export function SourceBadge({ label, tone = "info" }: SourceBadgeProps) {
  const styles = {
    live: "bg-accent/15 text-accent",
    fallback: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    info: "bg-secondary text-muted-foreground",
  }[tone];
  return (
    <span className={cn("badge-soft", styles)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  updatedAt?: Date | null;
  children: ReactNode;
  className?: string;
}

function formatUpdated(d: Date) {
  return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

export function DashboardCard({ title, subtitle, icon, badge, updatedAt, children, className }: DashboardCardProps) {
  return (
    <section className={cn("card-surface p-6 lg:p-8 flex flex-col gap-4 lg:gap-5 min-h-0 h-full", className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          {icon && (
            <div className="shrink-0 h-12 w-12 lg:h-14 lg:w-14 rounded-2xl bg-secondary flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-2xl lg:text-3xl font-semibold text-foreground leading-tight truncate">{title}</h2>
            {subtitle && <p className="text-base lg:text-lg text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </header>

      <div className="flex-1 min-h-0 flex flex-col">{children}</div>

      {updatedAt && (
        <footer className="text-[11px] lg:text-xs text-muted-foreground/70">
          Uppdaterad {formatUpdated(updatedAt)}
        </footer>
      )}
    </section>
  );
}

export function CardLoading({ label = "Hämtar…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-base text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse" />
      {label}
    </div>
  );
}

export function CardError({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/30 px-3 py-2 text-sm text-foreground/80">
      <span className="font-medium text-[hsl(var(--warning))]">Kunde inte hämta data.</span>{" "}
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
}

export function CardEmpty({ message }: { message: string }) {
  return <div className="text-base text-muted-foreground">{message}</div>;
}
