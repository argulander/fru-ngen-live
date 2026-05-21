// deno-lint-ignore-file
// Proxies SL Transport API (transport.integration.sl.se) to avoid potential CORS issues.
// Query: ?siteId=9303&transport=METRO&line=14&direction=2&limit=2

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get("siteId");
    const transport = url.searchParams.get("transport"); // METRO | BUS | TRAIN | TRAM | SHIP
    const line = url.searchParams.get("line");
    const direction = url.searchParams.get("direction");
    const forecast = url.searchParams.get("forecast") ?? "60";

    if (!siteId) {
      return new Response(JSON.stringify({ error: "siteId krävs" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({ forecast });
    if (transport) params.set("transport", transport);
    if (line) params.set("line", line);
    if (direction) params.set("direction", direction);

    const upstream = `https://transport.integration.sl.se/v1/sites/${encodeURIComponent(siteId)}/departures?${params.toString()}`;
    const res = await fetch(upstream, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("SL upstream error", res.status, text);
      return new Response(
        JSON.stringify({ error: `SL svarade ${res.status}`, detail: text.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify({ ...data, fetchedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sl-departures error", e);
    return new Response(JSON.stringify({ error: (e as Error).message ?? "Okänt fel" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
