// Cloudflare Worker: serves the built SPA and proxies AI calls to Anthropic.
// The Anthropic API key lives only here as a secret (env.ANTHROPIC_API_KEY) —
// never in the browser bundle. Browsers can't call api.anthropic.com directly
// (CORS + key exposure), so the frontend calls same-origin /api/chat instead.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      if (!env.ANTHROPIC_API_KEY) {
        return json({ error: { message: 'AI is not configured yet — the ANTHROPIC_API_KEY secret is missing on this Worker.' } }, 503);
      }
      let body;
      try { body = await request.text(); } catch { return json({ error: { message: 'Invalid request body.' } }, 400); }
      try {
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body,
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return json({ error: { message: 'Upstream AI request failed: ' + (e?.message || 'unknown error') } }, 502);
      }
    }

    // Everything else: static assets (SPA fallback handled by the assets binding).
    return env.ASSETS.fetch(request);
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
