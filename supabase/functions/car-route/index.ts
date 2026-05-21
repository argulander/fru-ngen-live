// deno-lint-ignore-file
// Edge function: returns car travel time + distance from origin to destination
// Uses Google Routes API (with live traffic) if GOOGLE_ROUTES_API_KEY is set,
// otherwise falls back to OSRM (no live traffic).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Hard-coded for this dashboard
const ORIGIN = { lat: 59.28488, lng: 17.96499, label: "Hasselstigen 6, Fruängen, Stockholm" };
const DESTINATION = { lat: 59.33258, lng: 18.00838, label: "Lindhagensgatan 100, Stockholm" };

async function googleRoutes(apiKey: string) {
  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.duration,routes.staticDuration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: ORIGIN.lat, longitude: ORIGIN.lng } } },
        destination: { location: { latLng: { latitude: DESTINATION.lat, longitude: DESTINATION.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        languageCode: "sv-SE",
        units: "METRIC",
      }),
    },
  );
  if (!res.ok) throw new Error(`Google Routes ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("Inga rutter");
  const liveSec = parseInt(String(route.duration ?? "0").replace("s", ""), 10);
  const baseSec = parseInt(String(route.staticDuration ?? route.duration ?? "0").replace("s", ""), 10);
  const distM = route.distanceMeters ?? 0;
  let traffic: "light" | "normal" | "heavy" = "normal";
  if (baseSec > 0) {
    const ratio = liveSec / baseSec;
    if (ratio > 1.25) traffic = "heavy";
    else if (ratio < 1.05) traffic = "light";
  }
  return {
    source: "google" as const,
    durationSec: liveSec,
    baseDurationSec: baseSec,
    distanceMeters: distM,
    trafficAware: true,
    traffic,
  };
}

async function osrmRoute() {
  const url = `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lng},${ORIGIN.lat};${DESTINATION.lng},${DESTINATION.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("Inga rutter");
  return {
    source: "osrm" as const,
    durationSec: Math.round(route.duration),
    baseDurationSec: Math.round(route.duration),
    distanceMeters: Math.round(route.distance),
    trafficAware: false,
    traffic: "normal" as const,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("GOOGLE_ROUTES_API_KEY");
  let result;
  let warning: string | undefined;

  try {
    if (apiKey) {
      try {
        result = await googleRoutes(apiKey);
      } catch (e) {
        console.error("Google Routes misslyckades, faller tillbaka till OSRM:", e);
        warning = "Google Routes misslyckades, använder OSRM utan live-trafik";
        result = await osrmRoute();
      }
    } else {
      warning = "GOOGLE_ROUTES_API_KEY saknas – använder OSRM utan live-trafik";
      result = await osrmRoute();
    }

    return new Response(
      JSON.stringify({
        ...result,
        warning,
        origin: ORIGIN.label,
        destination: DESTINATION.label,
        updatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("car-route error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Okänt fel" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
