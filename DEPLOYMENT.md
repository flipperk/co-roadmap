# C&O Roadmap — Server-sync Deploy (Cloudflare Workers + KV)

## Wat is veranderd

De C&O Roadmap heeft nu **echte gedeelde opslag** via Cloudflare KV. Alle wijzigingen worden live opgeslagen en zichtbaar voor iedereen.

- Geen localStorage-eilandjes meer per browser
- Geen Exporteren/Importeren nodig (wel nog beschikbaar)
- Sync-status zichtbaar (✓ Gesynchroniseerd / 💾 Opslaan…)

## Deploy (2 commando's vanuit deze map)

```bash
npm install -g wrangler
npx wrangler deploy
```

Dat overschrijft je bestaande `co-roadmap` Worker en zet de versie live op:
https://co-roadmap.slotze.workers.dev

## Hoe het werkt

- Bij laden: app haalt huidige state uit KV via `/api/roadmap/load`
- Bij wijziging: app stuurt naar KV via `/api/roadmap/save`
- Header toont sync-status (✓/💾/⚠)

Twee browsers zien niet realtime dezelfde veranderingen, maar:
- Jij wijzigt → opgeslagen in KV
- Collega refresht → ziet jouw wijziging

Importeren/exporteren blijft als backup beschikbaar.
