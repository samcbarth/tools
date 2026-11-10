#!/usr/bin/env python3
"""Static build for Toolbench (tools.samcbarth.com).

Sources:
  content/tools/<slug>/meta.json   tool copy: name, category, how-to, examples, FAQ
  content/tools/<slug>/ui.html     the tool's HTML (inputs, buttons, outputs)
  assets/tools/<slug>.js           the tool's JavaScript (runs in the browser only)
  content/news/<slug>.json         one file per news story
  content/pages/*.html             About, Contact, Privacy, Terms bodies

Outputs (repo root, served by GitHub Pages):
  index.html, <slug>/index.html for each tool, news/, news/<slug>/, news/feed.json,
  feed.xml (RSS), sitemap.xml, robots.txt, llms.txt, 404.html, CNAME

Run:  python build.py
"""
import html
import json
import pathlib
import re
import shutil
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).parent
BASE = "https://tools.samcbarth.com"
SITE_NAME = "Toolbench"
NEWS_NAME = "Toolbench Dispatch"
TAGLINE = "Free browser tools for marketers, developers and small business"
AUTHOR = "Sam Barth"
BUILD_DATE = datetime.now(timezone.utc).strftime("%Y-%m-%d")
def _asset_version():
    """Cache-busting token that only changes when a file under assets/ changes."""
    import hashlib
    h = hashlib.sha1()
    for f in sorted((ROOT / "assets").rglob("*")):
        if f.is_file() and f.name != "og.png":
            h.update(f.read_bytes())
    return h.hexdigest()[:10]


ASSET_V = _asset_version()

GTM = '''<script async src="https://www.googletagmanager.com/gtag/js?id=G-VCRBNP313Y"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-VCRBNP313Y');
</script>'''

NETWORK = [
    ("realestate", "Real Estate"),
    ("tools", "Tools"),
    ("games", "Games"),
    ("streaming", "Streaming"),
    ("homerepair", "Home Repair"),
    ("deals", "Deals"),
    ("news", "News"),
]

CATEGORIES = [
    ("marketing", "Marketing", "Campaign links, list cleanup and HubSpot cost planning."),
    ("seo", "SEO and AI search", "Snippets, structured data and files that search engines and AI assistants read."),
    ("data", "Data and developer", "CSV, JSON and regex work without installing anything."),
    ("text", "Text and writing", "Counting, casing and tidying words."),
    ("images", "Images and design", "Compress images and check color contrast."),
    ("utilities", "Utilities", "Passwords, QR codes and time conversions."),
]
CAT_NAME = {k: n for k, n, _ in CATEGORIES}

esc = html.escape


def j(obj):
    """JSON for a <script type=application/ld+json> block (safe inside HTML)."""
    return json.dumps(obj, indent=1, ensure_ascii=False).replace("</", "<\\/")


def load_tools():
    tools = []
    for d in sorted((ROOT / "content" / "tools").iterdir()):
        if not d.is_dir():
            continue
        meta = json.loads((d / "meta.json").read_text(encoding="utf-8"))
        meta["ui"] = (d / "ui.html").read_text(encoding="utf-8")
        assert meta["slug"] == d.name, f"slug mismatch in {d}"
        assert (ROOT / "assets" / "tools" / f"{d.name}.js").exists(), f"missing JS for {d.name}"
        tools.append(meta)
    order = {k: i for i, (k, _, _) in enumerate(CATEGORIES)}
    tools.sort(key=lambda t: (order[t["category"]], t.get("order", 50), t["name"]))
    return tools


def load_news():
    items = []
    for f in sorted((ROOT / "content" / "news").glob("*.json")):
        n = json.loads(f.read_text(encoding="utf-8"))
        n["slug"] = f.stem
        items.append(n)
    items.sort(key=lambda n: n["date"], reverse=True)
    return items


def fmt_date(iso):
    d = datetime.strptime(iso[:10], "%Y-%m-%d")
    return f"{d.strftime('%B')} {d.day}, {d.year}"


def network_bar():
    items = []
    for sub, label in NETWORK:
        if sub == "tools":
            items.append(f'<li><span aria-current="true">{label}</span></li>')
        else:
            items.append(f'<li><a href="https://{sub}.samcbarth.com/">{label}</a></li>')
    return ('<nav class="network" aria-label="samcbarth.com sites"><p>More free sites from samcbarth.com</p><ul>'
            + "".join(items) + "</ul></nav>")


def shell(*, path, title, description, body, jsonld, og_type="website", scripts=(), active="", noindex=False,
          image=None):
    """Wrap a page body in the shared head, header and footer. path is the URL path ('/', '/utm-builder/')."""
    url = BASE + path
    image = image or BASE + "/assets/og.png"
    ld = "\n".join(f'<script type="application/ld+json">{j(x)}</script>' for x in jsonld)
    extra = "\n".join(f'<script src="{s}" defer></script>' for s in scripts)
    robots = '<meta name="robots" content="noindex">' if noindex else '<meta name="robots" content="index,follow,max-image-preview:large">'

    def nav(href, label, key):
        cur = ' aria-current="page"' if key == active else ""
        return f'<a href="{href}"{cur}>{label}</a>'

    return f"""<!doctype html>
<html lang="en">
<head>
{GTM}
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{url}">
{robots}
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#000000">
<meta name="color-scheme" content="dark">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="{NEWS_NAME} RSS" href="/feed.xml">
<link rel="alternate" type="application/feed+json" title="{NEWS_NAME} JSON Feed" href="/news/feed.json">
<link rel="stylesheet" href="/assets/style.css?v={ASSET_V}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Barlow:wght@900&family=Inter:wght@400;500;700&display=swap">
{ld}
<script src="/assets/config.js?v={ASSET_V}" defer></script>
<script src="/assets/site.js?v={ASSET_V}" defer></script>
{extra}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
<a class="brand" href="/"><span class="brand-dot" aria-hidden="true"></span>{SITE_NAME}</a>
<nav class="site-nav" aria-label="Main">
{nav("/", "All tools", "tools")}
{nav("/news/", "News", "news")}
{nav("/about/", "About", "about")}
</nav>
</div></header>
{body}
<footer class="site-foot"><div class="wrap">
<div class="foot-links">
<a href="/">All tools</a><a href="/news/">News</a><a href="/about/">About</a><a href="/contact/">Contact</a>
<a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms</a><a href="/feed.xml">RSS</a><a href="/news/feed.json">JSON Feed</a><a href="/llms.txt">llms.txt</a>
</div>
{network_bar()}
<p class="copyright">&copy; {BUILD_DATE[:4]} Sam Barth. Every tool here runs in your browser; your input is not uploaded.</p>
</div></footer>
</body>
</html>
"""


def crumbs(items):
    """items: list of (name, path or None). Returns (html, jsonld)."""
    lis = []
    ld_items = []
    for i, (name, p) in enumerate(items, 1):
        if p:
            lis.append(f'<li><a href="{p}">{esc(name)}</a></li>')
            ld_items.append({"@type": "ListItem", "position": i, "name": name, "item": BASE + p})
        else:
            lis.append(f'<li aria-current="page">{esc(name)}</li>')
            ld_items.append({"@type": "ListItem", "position": i, "name": name})
    h = f'<nav class="crumbs" aria-label="Breadcrumb"><ol>{"".join(lis)}</ol></nav>'
    return h, {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": ld_items}


def ad(slot):
    return f'<div class="ad-slot" data-slot="{slot}"></div>'


def inline(text):
    """Tiny markup for copy in JSON: `code` and [label](url). Everything else is escaped."""
    out = esc(text)
    out = re.sub(r"`([^`]+)`", r"<code>\1</code>", out)
    out = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', out)
    return out


def write(path, content):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8", newline="\n")


# ---------------------------------------------------------------- pages

def tool_page(t, tools_by_slug, news):
    path = f"/{t['slug']}/"
    ch, cld = crumbs([(SITE_NAME, "/"), (CAT_NAME[t["category"]], f"/#{t['category']}"), (t["name"], None)])
    steps = "".join(f"<li>{inline(s)}</li>" for s in t["steps"])
    examples = ""
    for ex in t["examples"]:
        examples += f"<h3>{esc(ex['title'])}</h3>"
        if ex.get("text"):
            examples += f"<p>{inline(ex['text'])}</p>"
        if ex.get("input"):
            examples += f"<p><strong>Input</strong></p><pre>{esc(ex['input'])}</pre>"
        if ex.get("output"):
            examples += f"<p><strong>Result</strong></p><pre>{esc(ex['output'])}</pre>"
    faq = "".join(f"<h3>{esc(f['q'])}</h3><p>{inline(f['a'])}</p>" for f in t["faq"])
    extra = "".join(f"<h2>{esc(s['h'])}</h2>" + "".join(f"<p>{inline(p)}</p>" for p in s["p"])
                    for s in t.get("sections", []))
    related = [tools_by_slug[s] for s in t.get("related", []) if s in tools_by_slug]
    rel_html = "".join(f'<a class="card" href="/{r["slug"]}/"><h3>{esc(r["name"])}</h3><p>{esc(r["card"])}</p></a>'
                       for r in related)
    rel_news = [n for n in news if t["slug"] in n.get("related_tools", [])][:3]
    news_html = ""
    if rel_news:
        news_html = "<h2>Related news</h2><ul class=\"news-list\">" + "".join(
            f'<li><h3><a href="/news/{n["slug"]}/">{esc(n["title"])}</a></h3><div class="meta-line">{fmt_date(n["date"])}</div></li>'
            for n in rel_news) + "</ul>"
    side_tools = [x for x in tools_by_slug.values() if x["category"] == t["category"] and x["slug"] != t["slug"]][:6]
    side = ("<aside class=\"side\"><div class=\"side-inner\"><p class=\"side-title\">More "
            + esc(CAT_NAME[t["category"]]) + " tools</p><ul class=\"side-list\">"
            + "".join(f'<li><a href="/{x["slug"]}/">{esc(x["name"])}</a></li>' for x in side_tools)
            + '</ul><p class="side-title">Latest news</p><ul class="side-list">'
            + "".join(f'<li><a href="/news/{n["slug"]}/">{esc(n["title"])}</a></li>' for n in news[:4])
            + "</ul>" + ad("sidebar") + "</div></aside>")
    body = f"""<div class="wrap">{ch}
<div class="layout has-side">
<main id="main">
<h1>{esc(t['h1'])}</h1>
<p class="lede">{inline(t['lede'])}</p>
<p class="privacy-note">Runs entirely in your browser. Nothing you type, paste or open here is uploaded to any server.</p>
<section class="tool" aria-label="{esc(t['name'])}" id="tool">
{t['ui']}
</section>
<article class="prose">
<h2>{esc(t['answer_q'])}</h2>
<p class="answer">{inline(t['answer'])}</p>
<ol>{steps}</ol>
{ad("after_intro")}
<h2>Examples</h2>
{examples}
{extra}
{ad("mid_content")}
<h2>Frequently asked questions</h2>
{faq}
{news_html}
{ad("end_content")}
</article>
<h2>Related tools</h2>
<div class="cards">{rel_html}</div>
</main>
{side}
</div></div>"""
    app = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": t["name"],
        "description": t["description"],
        "url": BASE + path,
        "applicationCategory": t.get("app_category", "UtilitiesApplication"),
        "operatingSystem": "Any (runs in a web browser)",
        "isAccessibleForFree": True,
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "author": {"@type": "Person", "name": AUTHOR, "url": "https://samcbarth.com/"},
        "dateModified": t.get("updated", BUILD_DATE),
    }
    page = {"@context": "https://schema.org", "@type": "WebPage", "name": t["title"], "url": BASE + path,
            "description": t["description"], "isPartOf": {"@type": "WebSite", "name": SITE_NAME, "url": BASE + "/"}}
    scripts = [f"/assets/vendor/{v}?v={ASSET_V}" for v in t.get("vendor", [])] + [f"/assets/tools/{t['slug']}.js?v={ASSET_V}"]
    return shell(path=path, title=t["title"], description=t["description"], body=body,
                 jsonld=[app, page, cld], scripts=scripts, active="tools")


def index_page(tools, news):
    sections = ""
    for key, name, blurb in CATEGORIES:
        cards = ""
        for t in [t for t in tools if t["category"] == key]:
            hay = " ".join([t["name"], t["card"], " ".join(t.get("keywords", [])), name]).lower()
            cards += (f'<a class="card" href="/{t["slug"]}/" data-search="{esc(hay)}">'
                      f'<h3>{esc(t["name"])}</h3><p>{esc(t["card"])}</p></a>')
        sections += f'<section class="cat" id="{key}"><h2>{esc(name)}</h2><p class="lede">{esc(blurb)}</p><div class="cards">{cards}</div></section>'
    latest = "".join(
        f'<li><h3><a href="/news/{n["slug"]}/">{esc(n["title"])}</a></h3><div class="meta-line">{fmt_date(n["date"])}</div><p>{esc(n["summary"])}</p></li>'
        for n in news[:3])
    body = f"""<div class="wrap"><main id="main">
<section class="hero">
<h1>Free browser tools for marketing, SEO and data work</h1>
<p class="lede">{len(tools)} free tools that run entirely in your browser. Nothing you paste or open is uploaded. Pick a tool below or search by what you need to do.</p>
<div class="search"><label for="tool-search" class="skip">Search tools</label>
<input id="tool-search" type="search" placeholder="Search tools, for example csv, utm, schema" autocomplete="off"></div>
<p id="no-results" class="empty-msg" hidden>No tools match that search. Try a shorter word.</p>
</section>
{sections}
{ad("mid_content")}
<h2>Latest from {NEWS_NAME}</h2>
<ul class="news-list">{latest}</ul>
<p><a href="/news/">All news</a></p>
<h2>Why do these tools run in the browser?</h2>
<div class="prose"><p class="answer">Every tool on {SITE_NAME} does its work with JavaScript on your own device, so your files, lists and text never leave your computer.</p>
<p>That makes them safe for client data, contact lists and drafts. It also means they work offline once the page has loaded. The only tools that touch the network are the robots.txt and sitemap checker, which asks the site you name for its public file directly from your browser, and the image tools, which never upload anything.</p></div>
</main></div>"""
    site_ld = {"@context": "https://schema.org", "@type": "WebSite", "name": SITE_NAME, "url": BASE + "/",
               "description": TAGLINE, "publisher": {"@type": "Person", "name": AUTHOR},
               "potentialAction": {"@type": "SearchAction", "target": BASE + "/?q={search_term_string}",
                                   "query-input": "required name=search_term_string"}}
    item_list = {"@context": "https://schema.org", "@type": "ItemList", "name": "Free browser tools",
                 "itemListElement": [{"@type": "ListItem", "position": i, "url": f"{BASE}/{t['slug']}/", "name": t["name"]}
                                     for i, t in enumerate(tools, 1)]}
    return shell(path="/", title=f"{SITE_NAME}: Free Browser Tools for Marketing, SEO and Data",
                 description=f"{len(tools)} free tools that run in your browser: UTM builder, CSV cleaner, JSON formatter, schema generator, llms.txt generator and more. Nothing is uploaded.",
                 body=body, jsonld=[site_ld, item_list], active="tools")


def news_index(news, tools_by_slug):
    ch, cld = crumbs([(SITE_NAME, "/"), (NEWS_NAME, None)])
    items = "".join(
        f'<li><h3><a href="/news/{n["slug"]}/">{esc(n["title"])}</a></h3>'
        f'<div class="meta-line">{fmt_date(n["date"])} &middot; {esc(", ".join(n["tags"]))}</div><p>{esc(n["summary"])}</p></li>'
        for n in news)
    body = f"""<div class="wrap">{ch}<main id="main" class="prose">
<h1>{NEWS_NAME}</h1>
<p class="lede">Short, sourced write-ups on marketing tech, SEO and AI search, and developer tools. Each story says what happened, why it matters, and links the primary source.</p>
{ad("after_intro")}
<ul class="news-list">{items}</ul>
<p>Follow along by <a href="/feed.xml">RSS</a> or <a href="/news/feed.json">JSON Feed</a>.</p>
</main></div>"""
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": NEWS_NAME, "url": BASE + "/news/",
          "isPartOf": {"@type": "WebSite", "name": SITE_NAME, "url": BASE + "/"}}
    return shell(path="/news/", title=f"{NEWS_NAME}: Marketing Tech, SEO and Dev Tools News",
                 description="Short, sourced news on marketing tech, SEO and AI search, and developer tools, with links to the primary sources.",
                 body=body, jsonld=[ld, cld], active="news")


def news_page(n, tools_by_slug, news):
    path = f"/news/{n['slug']}/"
    ch, cld = crumbs([(SITE_NAME, "/"), (NEWS_NAME, "/news/"), (n["title"], None)])
    paras = "".join(f"<p>{inline(p)}</p>" for p in n["body"])
    why = "".join(f"<p>{inline(p)}</p>" for p in n.get("why", []))
    quote = ""
    if n.get("quote"):
        quote = f'<blockquote><p>"{esc(n["quote"]["text"])}"</p><footer>{esc(n["quote"]["by"])}</footer></blockquote>'
    rel = [tools_by_slug[s] for s in n.get("related_tools", []) if s in tools_by_slug]
    rel_html = ""
    if rel:
        rel_html = "<h2>Tools for this</h2><div class=\"cards\">" + "".join(
            f'<a class="card" href="/{r["slug"]}/"><h3>{esc(r["name"])}</h3><p>{esc(r["card"])}</p></a>' for r in rel) + "</div>"
    others = [x for x in news if x["slug"] != n["slug"]][:4]
    more = "".join(f'<li><a href="/news/{x["slug"]}/">{esc(x["title"])}</a></li>' for x in others)
    sources = "".join(f'<li><a href="{esc(s["url"])}" rel="noopener">{esc(s["name"])}</a></li>' for s in n["sources"])
    body = f"""<div class="wrap">{ch}<div class="layout has-side"><main id="main"><article class="prose">
<h1>{esc(n['title'])}</h1>
<div class="meta-line">{fmt_date(n['date'])} &middot; {NEWS_NAME}</div>
<div class="tagrow">{"".join(f'<span class="pill">{esc(t)}</span>' for t in n["tags"])}</div>
<p class="answer">{inline(n['summary'])}</p>
<h2>What happened</h2>
{paras}
{quote}
{ad("after_intro")}
<h2>Why it matters</h2>
{why}
<div class="source-box"><strong>Sources</strong><ul>{sources}</ul></div>
{ad("end_content")}
</article>
{rel_html}
</main>
<aside class="side"><div class="side-inner"><p class="side-title">More news</p><ul class="side-list">{more}</ul>{ad("sidebar")}</div></aside>
</div></div>"""
    art = {"@context": "https://schema.org", "@type": "NewsArticle", "headline": n["title"][:110],
           "description": n["summary"], "datePublished": n["date"], "dateModified": n.get("updated", n["date"]),
           "url": BASE + path, "mainEntityOfPage": BASE + path, "image": [BASE + "/assets/og.png"],
           "author": {"@type": "Person", "name": AUTHOR},
           "publisher": {"@type": "Organization", "name": SITE_NAME, "logo": {"@type": "ImageObject", "url": BASE + "/assets/og.png"}},
           "citation": [s["url"] for s in n["sources"]]}
    return shell(path=path, title=f"{n['title']} | {NEWS_NAME}", description=n["summary"][:300], body=body,
                 jsonld=[art, cld], og_type="article", active="news")


def static_page(slug, title, description, body_html, active=""):
    path = f"/{slug}/"
    ch, cld = crumbs([(SITE_NAME, "/"), (title, None)])
    body = f'<div class="wrap">{ch}<main id="main" class="prose">{body_html}</main></div>'
    art = {"@context": "https://schema.org", "@type": "Article", "headline": title, "description": description,
           "url": BASE + path, "author": {"@type": "Person", "name": AUTHOR}, "dateModified": BUILD_DATE,
           "publisher": {"@type": "Organization", "name": SITE_NAME}}
    return shell(path=path, title=f"{title} | {SITE_NAME}", description=description, body=body,
                 jsonld=[art, cld], active=active)


# ---------------------------------------------------------------- feeds

def json_feed(news):
    return json.dumps({
        "version": "https://jsonfeed.org/version/1.1",
        "title": NEWS_NAME,
        "home_page_url": BASE + "/news/",
        "feed_url": BASE + "/news/feed.json",
        "description": "Marketing tech, SEO and AI search, and developer tools news from tools.samcbarth.com.",
        "icon": BASE + "/assets/og.png",
        "favicon": BASE + "/assets/favicon.svg",
        "language": "en-US",
        "authors": [{"name": AUTHOR, "url": "https://samcbarth.com/"}],
        "items": [{
            "id": f"{BASE}/news/{n['slug']}/",
            "url": f"{BASE}/news/{n['slug']}/",
            "title": n["title"],
            "summary": n["summary"],
            "content_text": n["summary"] + "\n\n" + "\n\n".join(n["body"]),
            "date_published": n["date"] + "T12:00:00Z" if len(n["date"]) == 10 else n["date"],
            "image": BASE + "/assets/og.png",
            "tags": n["tags"],
            "external_url": n["sources"][0]["url"],
        } for n in news],
    }, indent=2, ensure_ascii=False)


def rss(news):
    def rfc(d):
        return datetime.strptime(d[:10], "%Y-%m-%d").strftime("%a, %d %b %Y 12:00:00 +0000")
    items = "".join(f"""
  <item>
    <title>{esc(n['title'])}</title>
    <link>{BASE}/news/{n['slug']}/</link>
    <guid isPermaLink="true">{BASE}/news/{n['slug']}/</guid>
    <pubDate>{rfc(n['date'])}</pubDate>
    <description>{esc(n['summary'])}</description>
    {''.join(f'<category>{esc(t)}</category>' for t in n['tags'])}
  </item>""" for n in news)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>{NEWS_NAME}</title>
  <link>{BASE}/news/</link>
  <atom:link href="{BASE}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Marketing tech, SEO and AI search, and developer tools news from {SITE_NAME}.</description>
  <language>en-us</language>
  <lastBuildDate>{datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")}</lastBuildDate>{items}
</channel>
</rss>
"""


def sitemap(paths):
    urls = "".join(f"\n  <url><loc>{BASE}{p}</loc><lastmod>{m}</lastmod></url>" for p, m in paths)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}\n</urlset>\n'


def llms(tools, news):
    lines = [f"# {SITE_NAME} (tools.samcbarth.com)", "",
             f"> {TAGLINE}. Every tool runs in the visitor's browser; input is never uploaded. Free, no sign-up.", "",
             "Built and maintained by Sam Barth, a HubSpot consultant. Each tool page has the tool, an answer-first how-to, examples and an FAQ.", ""]
    for key, name, _ in CATEGORIES:
        lines.append(f"## {name}")
        for t in [t for t in tools if t["category"] == key]:
            lines.append(f"- [{t['name']}]({BASE}/{t['slug']}/): {t['description']}")
        lines.append("")
    lines.append(f"## {NEWS_NAME}")
    for n in news:
        lines.append(f"- [{n['title']}]({BASE}/news/{n['slug']}/): {n['summary']}")
    lines += ["", "## Site", f"- [About]({BASE}/about/)", f"- [Privacy Policy]({BASE}/privacy/)",
              f"- [JSON Feed]({BASE}/news/feed.json)", f"- [RSS]({BASE}/feed.xml)", ""]
    return "\n".join(lines)


def og_image():
    """Draw the default share image once (needs Pillow). Skipped if it already exists."""
    out = ROOT / "assets" / "og.png"
    if out.exists():
        return
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("Pillow not installed; skipping og.png")
        return
    img = Image.new("RGB", (1200, 630), "#000000")
    d = ImageDraw.Draw(img)

    def font(size, bold=False):
        for name in (["segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"]):
            try:
                return ImageFont.truetype(name, size)
            except OSError:
                continue
        return ImageFont.load_default()
    d.rectangle((0, 0, 1200, 8), fill="#9a00ff")
    d.ellipse((80, 120, 112, 152), fill="#9a00ff")
    d.text((80, 230), SITE_NAME, fill="#ffffff", font=font(96, True))
    d.text((80, 360), "Free browser tools for marketing,", fill="#c8c8c8", font=font(48))
    d.text((80, 420), "SEO and data work. Nothing uploaded.", fill="#c8c8c8", font=font(48))
    d.text((80, 540), "tools.samcbarth.com", fill="#ffffff", font=font(36, True))
    img.save(out, optimize=True)


# ---------------------------------------------------------------- main

def main():
    tools = load_tools()
    news = load_news()
    by_slug = {t["slug"]: t for t in tools}
    for n in news:
        for s in n.get("related_tools", []):
            assert s in by_slug, f"{n['slug']} links unknown tool {s}"
    for t in tools:
        for s in t.get("related", []):
            assert s in by_slug, f"{t['slug']} links unknown tool {s}"

    # Clean previously generated tool and news folders so removed items disappear.
    manifest = ROOT / ".generated.json"
    if manifest.exists():
        for rel in json.loads(manifest.read_text()):
            p = ROOT / rel
            if p.is_dir():
                shutil.rmtree(p)
    generated = []

    og_image()
    write("index.html", index_page(tools, news))
    sm = [("/", BUILD_DATE)]
    for t in tools:
        write(f"{t['slug']}/index.html", tool_page(t, by_slug, news))
        generated.append(t["slug"])
        sm.append((f"/{t['slug']}/", t.get("updated", BUILD_DATE)))
    write("news/index.html", news_index(news, by_slug))
    write("news/feed.json", json_feed(news))
    generated.append("news")
    sm.append(("/news/", news[0]["date"] if news else BUILD_DATE))
    for n in news:
        write(f"news/{n['slug']}/index.html", news_page(n, by_slug, news))
        sm.append((f"/news/{n['slug']}/", n.get("updated", n["date"])))

    pages = json.loads((ROOT / "content" / "pages" / "pages.json").read_text(encoding="utf-8"))
    for p in pages:
        body = (ROOT / "content" / "pages" / f"{p['slug']}.html").read_text(encoding="utf-8")
        body = body.replace("{{TOOL_COUNT}}", str(len(tools))).replace("{{UPDATED}}", fmt_date(BUILD_DATE))
        write(f"{p['slug']}/index.html", static_page(p["slug"], p["title"], p["description"], body, p.get("active", "")))
        generated.append(p["slug"])
        sm.append((f"/{p['slug']}/", BUILD_DATE))

    nf_body = """<div class="wrap"><main id="main" class="prose"><h1>Page not found</h1>
<p>That page does not exist. It may have moved. Try the <a href="/">full list of tools</a> or search below.</p>
<form action="/" method="get"><input type="search" name="q" placeholder="Search tools" aria-label="Search tools"></form></main></div>"""
    write("404.html", shell(path="/404.html", title=f"Page not found | {SITE_NAME}", description="Page not found.",
                            body=nf_body, jsonld=[], noindex=True))
    write("feed.xml", rss(news))
    write("sitemap.xml", sitemap(sm))
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")
    write("llms.txt", llms(tools, news))
    write("CNAME", "tools.samcbarth.com\n")
    manifest.write_text(json.dumps(sorted(generated), indent=1))
    print(f"Built {len(tools)} tools, {len(news)} news stories, {len(pages)} pages.")


if __name__ == "__main__":
    main()
