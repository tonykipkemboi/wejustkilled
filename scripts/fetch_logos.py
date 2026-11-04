"""Fetch and self-host logos for named victims (build-time only, never at runtime).

Usage: python3 scripts/fetch_logos.py
Writes site/assets/logos/<slug>.webp (128 px) for victims, site/assets/logos/k/<handle>.webp (96 px)
for killers (their own X avatar, which is the account's chosen logo), and site/assets/logos/logos.json.
Domains are a hand-checked map; anything ambiguous is left out and gets a monogram.
Source: each domain's favicon via Google's public favicon service (sz=128), or the site's own\napple-touch-icon / large icon link, downloaded once here.
Logos are shown as nominative use in a parody; no endorsement is implied.
"""

import io
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "assets" / "logos"

DOMAINS = {
    "Ahrefs": "ahrefs.com",
    "Apollo": "apollo.io",
    "Base44": "base44.com",
    "Blacksmith": "blacksmith.sh",
    "Brandwatch": "brandwatch.com",
    "Brave Search": "search.brave.com",
    "Calendly": "calendly.com",
    "Canva": "canva.com",
    "CapCut": "capcut.com",
    "Careerflow": "careerflow.ai",
    "ChatGPT": "chatgpt.com",
    "ChatGPT Spaces": "chatgpt.com",
    "Claude": "claude.ai",
    "Claude Code": "claude.ai",
    "Claude Duet": "claude.ai",
    "Clay": "clay.com",
    "Cloudflare": "cloudflare.com",
    "Cluely": "cluely.com",
    "Cursor": "cursor.com",
    "Dexscreener Ads": "dexscreener.com",
    "Dropbox": "dropbox.com",
    "Duolingo": "duolingo.com",
    "Exa": "exa.ai",
    "Fal": "fal.ai",
    "GRIN": "grin.co",
    "Gemini": "gemini.google.com",
    "GitHub Actions": "github.com",
    "Google Docs": "docs.google.com",
    "Google Drive": "drive.google.com",
    "Google Fonts": "fonts.google.com",
    "Google Translate": "translate.google.com",
    "Google Workspace": "workspace.google.com",
    "Grammarly": "grammarly.com",
    "Granola": "granola.ai",
    "Hevy": "hevyapp.com",
    "Higgsfield": "higgsfield.ai",
    "HubSpot": "hubspot.com",
    "Indeed": "indeed.com",
    "Instantly": "instantly.ai",
    "Interview Coder": "interviewcoder.co",
    "Jira": "atlassian.com",
    "Jobscan": "jobscan.co",
    "Kickresume": "kickresume.com",
    "Ladders": "theladders.com",
    "Lemlist": "lemlist.com",
    "LinkedIn": "linkedin.com",
    "LinkedIn Helper": "linkedhelper.com",
    "LinkedIn Recruiter": "linkedin.com",
    "LinkedIn Sales Navigator": "linkedin.com",
    "Linktree": "linktr.ee",
    "Loom": "loom.com",
    "Lovable": "lovable.dev",
    "Mailchimp": "mailchimp.com",
    "MakeUGC": "makeugc.ai",
    "Manus": "manus.im",
    "ManyChat": "manychat.com",
    "Meta Ads Manager": "meta.com",
    "Mobbin": "mobbin.com",
    "Modash": "modash.io",
    "Monster": "monster.com",
    "Moz": "moz.com",
    "Notion": "notion.so",
    "Obsidian": "obsidian.md",
    "OpenAI Deep Research": "openai.com",
    "OpenAI Pages": "openai.com",
    "OpenAI Prism": "openai.com",
    "OpenArt": "openart.ai",
    "OpenRouter": "openrouter.ai",
    "Opus Clip": "opus.pro",
    "Overleaf": "overleaf.com",
    "Palantir": "palantir.com",
    "Pangram": "pangram.com",
    "Plausible": "plausible.io",
    "Profound": "tryprofound.com",
    "Remotion": "remotion.dev",
    "Retool": "retool.com",
    "Runway": "runwayml.com",
    "Salesforce": "salesforce.com",
    "Screen Studio": "screen.studio",
    "Semrush": "semrush.com",
    "SerpAPI": "serpapi.com",
    "Shopify": "shopify.com",
    "Skool": "skool.com",
    "Skydo": "skydo.com",
    "Sprout Social": "sproutsocial.com",
    "Stripe": "stripe.com",
    "Superhuman": "superhuman.com",
    "Superwhisper": "superwhisper.com",
    "Tavily": "tavily.com",
    "Teal": "tealhq.com",
    "The Bloomberg Terminal": "bloomberg.com",
    "The Chrome Web Store": "chromewebstore.google.com",
    "Tinder": "tinder.com",
    "TopView": "topview.ai",
    "Typeform": "typeform.com",
    "Whop": "whop.com",
    "Willow Voice": "willowvoice.com",
    "Wise": "wise.com",
    "Wispr Flow": "wisprflow.ai",
    "Yahoo Finance": "finance.yahoo.com",
    "YouTube": "youtube.com",
    "Zendesk": "zendesk.com",
    "Zoom": "zoom.us",
    "iCloud": "icloud.com",
    "n8n": "n8n.io",
}


def slug(s: str) -> str:
    s = re.sub(r"[\"“”'’]", "", s.lower())
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-") or "x"


UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36"}


def get(url: str) -> bytes | None:
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:  # noqa: S310
            return r.read()
    except Exception:  # noqa: BLE001
        return None


def image(raw: bytes | None) -> Image.Image | None:
    if not raw:
        return None
    try:
        im = Image.open(io.BytesIO(raw))
        if getattr(im, "n_frames", 1) > 1 or im.format == "ICO":
            im = max((im.copy() for _ in [0]), key=lambda i: i.width)
        im.load()
        return im
    except Exception:  # noqa: BLE001
        return None


def candidates(domain: str):
    # 1. the favicon service at 128 px; 2. the site's own apple-touch-icon / large icons
    yield f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
    yield f"https://{domain}/apple-touch-icon.png"
    html = get(f"https://{domain}/")
    if html:
        text = html.decode("utf-8", "ignore")
        for tag in re.findall(r"<link[^>]+>", text, re.I):
            if re.search(r"rel=[\"'][^\"']*(apple-touch-icon|icon)[^\"']*[\"']", tag, re.I):
                m = re.search(r"href=[\"']([^\"']+)[\"']", tag, re.I)
                if m and not m.group(1).endswith(".svg"):
                    yield urllib.parse.urljoin(f"https://{domain}/", m.group(1))


def fetch(domain: str) -> Image.Image | None:
    best = None
    for url in candidates(domain):
        im = image(get(url))
        if im is not None and (best is None or im.width > best.width):
            best = im
        if best is not None and best.width >= 96:
            break
    if best is None or best.width < 48:  # 16-32 px favicons look mushy when scaled up
        print(f"  ! {domain}: best {best.width if best else 0}px, skipped", file=sys.stderr)
        return None
    return best.convert("RGBA").resize((128, 128), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    cache: dict[str, str | None] = {}
    mapping: dict[str, dict[str, str]] = {}
    for name, domain in sorted(DOMAINS.items()):
        if domain not in cache:
            im = fetch(domain)
            file = None
            if im is not None:
                file = slug(domain.replace(".", "-")) + ".webp"
                im.save(OUT / file, "WEBP", quality=88, method=6)
            cache[domain] = file
        if cache[domain]:
            mapping[slug(name)] = {"file": cache[domain], "domain": domain}
            print(f"{name:28s} {domain:28s} {cache[domain]}")
    killers: dict[str, str] = {}
    kdir = OUT / "k"
    kdir.mkdir(exist_ok=True)
    kills = json.loads((ROOT / "site" / "kills.json").read_text())["kills"]
    seen: set[str] = set()
    for k in kills:
        h = (k.get("handle") or "").lower()
        av = k.get("avatar") or ""
        if not h or h in seen or not av.startswith("https://pbs.twimg.com/"):
            continue
        seen.add(h)
        im = image(get(re.sub(r"_(normal|bigger|400x400)\.", "_200x200.", av)) or get(av))
        if im is None:
            print(f"  ! @{h}: avatar unavailable", file=sys.stderr)
            continue
        file = slug(h) + ".webp"
        im.convert("RGB").resize((96, 96), Image.LANCZOS).save(kdir / file, "WEBP", quality=82, method=6)
        killers[h] = "k/" + file
    data = {
        "note": "Victim logos, fetched once at build time by scripts/fetch_logos.py and self-hosted. Nominative use in a parody; no endorsement implied.",
        "victims": mapping,
        "killers": killers,
    }
    (OUT / "logos.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
