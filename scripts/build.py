# Builds data/kills.json, site/kills.json and site/data.js from the curation lists.
# Run from the repo root. Needs data/pool.json and data/kills_v1_backup.json, which are
# local working files (raw search results) and are not committed.
import json
import html

pool = json.load(open("data/pool.json"))
old = json.load(open("data/kills_v1_backup.json"))
oldrec = {k["id"]: k for k in old["kills"]}
brands = set(old["meta"]["brand_victims"]) | {
    "Yahoo Finance",
    "Google Search",
    "Zoom",
    "The Chrome Web Store",
    "Overleaf",
    "OpenAI Prism",
    "Google Forms",
    "Cursor",
    "Obsidian",
    "Zendesk",
    "Higgsfield",
    "Jobscan",
    "Teal",
    "Kickresume",
    "Careerflow",
    "Plausible",
    "ChatGPT Spaces",
    "Exa",
    "Tavily",
    "Brave",
    "Google Drive",
    "Instantly",
    "LinkedIn Helper",
    "LinkedIn Recruiter",
    "Pangram",
    "LinkedIn",
    "Mobin",
    "Clay",
    "Apollo",
    "Lemlist",
    "BitChat",
    "Google Translate",
    "Duolingo",
    "Photoshop",
    "Grammarly",
    "Wispr Flow",
    "Superwhisper",
    "Willow Voice",
    "Vector Databases",
    "Graph Databases",
}
seen = set()
new = []
out = []
for fn, isnew in (("data/curation.txt", False), ("data/curation2.txt", True)):
    for line in open(fn):
        line = line.strip()
        if not line:
            continue
        i, v, kl = (line.split("|") + ["", ""])[:3]
        if i in seen:
            continue
        seen.add(i)
        if i in oldrec and not isnew:
            r = dict(oldrec[i])
            r["batch"] = "v1"
            out.append(r)
            continue
        p = pool[i]
        m = p["metrics"]
        vs = [x.strip() for x in v.split(";") if x.strip()]
        r = dict(
            id=i,
            url=p["url"],
            name=p["name"],
            handle=p["handle"],
            avatar=p["avatar"],
            verified=p.get("verified"),
            verified_type=p.get("verified_type"),
            created_at=p["created_at"],
            text=html.unescape(p["text"]),
            victims=vs,
            victim=vs[0],
            killer=kl.strip() or None,
            likes=m.get("like_count", 0),
            reposts=m.get("retweet_count", 0),
            replies=m.get("reply_count", 0),
            quotes=m.get("quote_count", 0),
            views=m.get("impression_count", 0),
            bookmarks=m.get("bookmark_count", 0),
            image=p.get("image"),
            lang=p.get("lang"),
            batch="backfill",
        )
        out.append(r)
        new.append(i)
out.sort(key=lambda r: r["created_at"], reverse=True)
meta = dict(old["meta"])
meta["generated_at"] = "2026-11-04"
meta["count"] = len(out)
meta["brand_victims"] = sorted({v for r in out for v in r["victims"] if v in brands})
meta["search_window"] = "2023-01-01 to 2026-11-04 (UTC)"
data = {"meta": meta, "kills": out}
json.dump(data, open("data/kills.json", "w"), ensure_ascii=False, indent=1)
json.dump(data, open("site/kills.json", "w"), ensure_ascii=False)
open("site/data.js", "w").write("window.WJK=" + json.dumps(data, ensure_ascii=False) + ";")
print("total", len(out), "new", len(new), "oldest", out[-1]["created_at"], "newest", out[0]["created_at"])
print("victims", len({v for r in out for v in r["victims"]}))
