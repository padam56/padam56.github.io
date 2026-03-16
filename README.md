# Padam Jung Thapa - Portfolio

Personal portfolio website focused on AI/ML engineering, computer vision projects, and security-oriented research work.

## What This Site Includes

- About, skills, and research/experience sections
- Threat intel visualization area
- AI Delivery Blueprint and Segmentation Lab demo
- Filterable project showcase across domains
- Contact section with social links

## Tech Stack

- Static site: `HTML`, `CSS`, `JavaScript`
- UI base: `Bootstrap`, `Font Awesome`, `animate.css`
- Custom interactive scripts in `js/`

## Local Development

This is a static website, so you can run it with any simple local server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Threat Intel Map Data Integration

The map now supports two data modes automatically:

- Template mode (fallback): built-in sample view configs.
- Pipeline mode (preferred): your own structured dataset.

Pipeline data sources (checked in this order):

1. `window.THREAT_PIPELINE_DATA`
2. `data/threat-map-data.json`

Quick start:

1. Copy `data/threat-map-data.sample.json` to `data/threat-map-data.json`.
2. Replace values with your pipeline output.
3. Reload the site. The Threat Intel note will show pipeline mode once loaded.

Minimal structure:

```json
{
	"meta": { "updatedAt": "2026-03-16T18:00:00Z", "source": "pipeline-name" },
	"views": {
		"campaign": {
			"kpis": [{ "value": "41", "label": "..." }, { "value": "2.7k", "label": "..." }, { "value": "118", "label": "..." }],
			"victimTitle": "...",
			"victimIntro": "...",
			"victimBars": [{ "region": "North America", "pct": 29 }],
			"infraPoints": [{ "label": "...", "lon": -73.9, "lat": 40.7, "tone": "cyan" }],
			"victimPoints": [{ "label": "...", "lon": -98, "lat": 38, "tone": "amber" }],
			"flows": [{ "from": [-73.9, 40.7], "to": [-98, 38], "tone": "cyan" }],
			"sourceRefs": [{ "label": "FTC Data Book", "url": "https://www.ftc.gov/reports/consumer-sentinel-network-data-book-2023" }],
			"liveContexts": [{ "summary": "...", "region": "North America", "timestamp": "Rolling 7-day snapshot", "severity": "high", "lon": -97, "lat": 37, "tone": "cyan" }]
		}
	}
}
```

Notes:

- `sourceRefs` are rendered as clickable references in the UI.
- `liveContexts` rotates automatically in the map top panel and drives live pulse focus.

## Live Scraped Feed Refresh

The site includes a local live feed panel sourced by a scraper script (currently CISA KEV + Tranco ID):

```bash
node scripts/update-threat-feed.mjs
```

This updates `data/threat-live.json`, which the page auto-loads and auto-refreshes in-browser every 5 minutes.

## TLD Insights Refresh (Tranco Scrape)

```bash
python3 scripts/update_tld_insights.py
```

This scrapes the Tranco Top-1M zip snapshot (sampled rows) and generates `data/tld-insights.json` used by the multi-chart TLD visualization panel:

- Top TLD distribution bars
- gTLD vs ccTLD split donut
- Watchlist/risk-weighted TLD list
- Top-TLD concentration curve

## Deployment

- Hosted with GitHub Pages from the `main` branch
- Custom domain configured via `CNAME`

If style/script updates appear stale in production, clear CDN/browser cache or update asset version query params in `index.html`.
