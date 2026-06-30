/**
 * C&O Roadmap Worker
 * Serves static HTML + API endpoints voor KV sync
 */

const KV_NAMESPACE = 'CO_ROADMAP_DATA'; // gekoppeld via wrangler.toml
const STORAGE_KEY = 'co-roadmap-state';

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    // API endpoints voor sync met KV
    if (path === '/api/roadmap/load') {
      return handleLoad(env);
    }
    if (path === '/api/roadmap/save' && req.method === 'POST') {
      return handleSave(req, env);
    }

    // Alles anders → static assets (HTML)
    // Dit zou in een echte setup door Cloudflare Pages of een asset handler worden gedaan,
    // maar voor dev serveren we de index.html voor root-paden
    if (path === '/' || path === '/index.html') {
      try {
        const html = await env.ASSETS.fetch(new Request('file:///index.html', req));
        return html;
      } catch (e) {
        // Fallback: simpele HTML als ASSETS niet beschikbaar
        return new Response('<!DOCTYPE html><p>Asset niet gevonden</p>', { status: 404, headers: { 'Content-Type': 'text/html' } });
      }
    }

    // Static assets (CSS, JS etc bundled in index.html)
    return new Response('Not found', { status: 404 });
  }
};

async function handleLoad(env) {
  try {
    const data = await env[KV_NAMESPACE].get(STORAGE_KEY);
    const state = data ? JSON.parse(data) : null;
    return jsonResponse({ success: true, state });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

async function handleSave(req, env) {
  try {
    const { state } = await req.json();
    if (!state) throw new Error('No state provided');
    await env[KV_NAMESPACE].put(STORAGE_KEY, JSON.stringify(state));
    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 400);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
