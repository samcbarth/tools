# Toolbench (tools.samcbarth.com)

20 free browser tools for marketers, developers and small business, plus a news section (Toolbench Dispatch). Part of the samcbarth.com site network; shared rules live in `C:\SamSites\NETWORK.md`.

Every tool runs entirely in the visitor's browser. Nothing a visitor enters is uploaded.

## Build and preview

```
python build.py                       # regenerates every page, feed, sitemap, llms.txt
python -m http.server 8822            # preview at http://localhost:8822/
```

`.claude/launch.json` has the same preview entry (`tools-site`, port 8822). Pillow is optional; it is only used once to draw `assets/og.png`.

Generated output sits at the repo root (GitHub Pages serves `main` root): `index.html`, `<tool-slug>/`, `news/`, `about/`, `contact/`, `privacy/`, `terms/`, `404.html`, `feed.xml`, `news/feed.json`, `sitemap.xml`, `robots.txt`, `llms.txt`, `CNAME`. Do not edit those by hand; edit `content/` and rebuild.

## How to add content

**A news story:** add one file `content/news/<slug>.json`:

```json
{
 "title": "Headline",
 "date": "2026-11-09",
 "tags": ["SEO and AI search"],
 "summary": "One or two sentence answer-first summary.",
 "body": ["What happened, paragraph 1.", "Paragraph 2."],
 "why": ["Why it matters to marketers, devs or small business."],
 "sources": [{"name": "Primary source title", "url": "https://..."}],
 "related_tools": ["utm-builder"]
}
```

Rules from NETWORK.md: original write-up only, every fact from the linked source, at most one short attributed quote (optional `"quote": {"text": "...", "by": "..."}`), no em dashes, no hype verbs. Then run `python build.py`. The story appears on `/news/`, in both feeds, the sitemap, llms.txt, and on the related tool pages.

**A tool:** create three files with the same slug:
- `content/tools/<slug>/meta.json` (name, category, title, description, h1, lede, card, keywords, answer_q, answer, steps, examples, faq, related; see any existing one)
- `content/tools/<slug>/ui.html` (inputs, buttons, outputs)
- `assets/tools/<slug>.js` (the logic; use the `TB` helpers in `assets/site.js` for copy, download, CSV parsing)

Categories: `marketing`, `seo`, `data`, `text`, `images`, `utilities` (defined in `build.py`). Optional `"vendor": ["file.js"]` loads a file from `assets/vendor/`.

In copy fields, `` `code` `` and `[label](url)` are supported.

## Where config ids go

`assets/config.js`:
- `ADSENSE_CLIENT`: the `ca-pub-...` id. Empty means no ad code loads at all.
- `AD_SLOTS`: ad unit ids for `after_intro`, `mid_content`, `end_content`, `sidebar`. Positions are reserved on every page below the tool and its main answer; empty ids render nothing.
- `HUBSPOT_CONTACT_FORM`: a form GUID from portal 20693956. When set, `/contact/` shows the form; until then it shows the meetings link.

Tracking: GTM container `GTM-KMS4X55L` is the first thing in every page's `<head>` (set in `build.py`).

`ads.txt` belongs at the root domain samcbarth.com (HubSpot), not on this subdomain.

## HubSpot seat cost calculator prices

Prices in `assets/tools/hubspot-seat-cost-calculator.js` and the copy in `content/tools/hubspot-seat-cost-calculator/meta.json` came from hubspot.com/pricing (marketing, sales, service), annual billing view, USD, checked **2026-11-09**. When rechecking, update the `CHECKED` constant, the `P` table, the meta.json answer/FAQ, and `updated`.

## DNS record Sam needs (Squarespace)

| Type | Host | Data |
|---|---|---|
| CNAME | `tools` | `samcbarth.github.io` |

Then in the GitHub repo: Settings, Pages, source `main` / root, custom domain `tools.samcbarth.com`, enforce HTTPS once the certificate is issued.

## Waiting on accounts

- AdSense approval and ad unit ids (config above).
- HubSpot contact form GUID (optional; meetings link works now).
- GitHub repo and push: not created yet, waiting on Sam's yes.
