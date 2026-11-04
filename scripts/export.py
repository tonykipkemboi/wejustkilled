# Writes the handoff exports docs/WeJustKilled_all_kills.{md,csv,docx} from data/kills.json.
# Run from the repo root: python3 scripts/export.py  (docx needs python-docx, see requirements.txt)
import json
import csv
import collections
import re

try:
    import docx
except ImportError:  # python-docx is optional; md and csv are written regardless
    docx = None
D = json.load(open("data/kills.json"))
K = sorted(D["kills"], key=lambda r: r["created_at"])
M = D["meta"]
for n, r in enumerate(K, 1):
    r["case"] = f"#{n:04d}"
mc = collections.Counter(r["created_at"][:7] for r in K)
vc = collections.Counter(v for r in K for v in r["victims"])
newn = sum(1 for r in K if r.get("batch") == "backfill")
o = M.get("origin", {})
L = []
V = M.get("verification", {})
RM = json.load(open("data/removed.json")) if __import__("os").path.exists("data/removed.json") else []
bs = V.get("by_status", {})


def cell(t):
    return str(t).replace("|", "/").replace("\n", " ")


VER = [
    "## Verification",
    f"- **When:** {V.get('verified_at', '')} (America/New_York).",
    "- **Method:** " + V.get("method", ""),
    "- **Scope:** "
    + f"{V.get('reviewed_deep', 0)} cases got the deep review (every case with an inferred or blank killer, an ambiguous victim, a satirical or meta tone, or an unclear product, plus the duplicate checks). The other {V.get('reviewed_total', 0) - V.get('reviewed_deep', 0)} name their own product and victim in the post text and were re-fetched live.",
    "- **Status meanings:**",
    "  - confirmed: the stored values are supported by the evidence",
    "  - corrected: the killer was filled in or changed from the evidence",
    "  - unverified: kept, but the killer is still unclear and left blank",
    "  - removed: not a genuine first-party kill, or a duplicate",
    f"- **Counts:** {bs.get('confirmed', 0)} confirmed · {bs.get('corrected', 0)} corrected · {bs.get('unverified', 0)} unverified · {bs.get('removed', 0)} removed. That takes the total from {V.get('count_before', '?')} to {V.get('count_after', '?')}.",
    f"- **Confidence of kept cases:** {V.get('confidence_kept', {})}.",
    "",
    "### Removed cases",
    "",
    "| Post | Likes | Reason | Evidence |",
    "|---|---|---|---|",
]
VER += [f"| @{x['handle']} {x['url']} | {x['likes']} | {cell(x['reason'])} | {x['evidence_url']} |" for x in RM]
VER += [
    "",
    "### Corrected and unverified cases",
    "",
    "| Case | Post | Status / confidence | Change | Rationale | Evidence |",
    "|---|---|---|---|---|---|",
]
VER += [
    f"| {r['case']} | @{r['handle']} {r['url']} | {r['verification']['status']} / {r['verification']['confidence']} | {cell('; '.join(r['verification']['fields_changed']) or 'none')} | {cell(r['verification']['rationale'])} | {r['verification']['evidence_url']} |"
    for r in K
    if r.get("verification", {}).get("status") in ("corrected", "unverified")
]
VER += [""]
L += [
    '# We Just Killed: every "we just killed X" launch post on X',
    "",
    "## About this project",
    '**We Just Killed** is a fun static site, built for Tony Kipkemboi. It is a crime-scene-themed wall of launch posts on X where a founder or product account says its product "just killed" another product, tool, job or habit. The victims are all, as far as anyone can tell, still alive.',
    "",
    f'- **Origin post:** {o.get("url", "https://x.com/arieljrubin/status/2117698113217741099")} by @arieljrubin: "everyone needs to relax"',
    "- **Data source:** the X API full-archive search (`search_posts_all`), via the X connector. Every record below is a real post and every metric was returned by the API. Nothing was invented or estimated.",
    "- **Collected:** 2026-11-04. Metrics are a snapshot from collection time (v1 posts were captured earlier the same day).",
    "- **Date range searched:** 2023-01-01 to 2026-11-04 (UTC). 2022 was not searched because 2023 had no genuine cases.",
    f"- **Date range found:** {K[0]['created_at'][:10]} to {K[-1]['created_at'][:10]}",
    f"- **Totals:** {len(K)} kill claims after verification, {len(vc)} distinct victims, {len({r['handle'].lower() for r in K})} distinct killers (accounts).",
    "",
    "## Curation rules",
    '- **Kept:** first-person or product-account claims ("we/I just killed X", "today we killed X") made while launching or promoting the author\'s own product or feature. X can be a product, a category, a workflow or a habit.',
    "- **Dropped:**",
    '  - third-party hype ("Company Y just killed X", "AI just killed X")',
    "  - games, sports, gym posts, crime, war, politics and news",
    "  - jokes and lyrics",
    "  - meta-commentary about the meme",
    "  - copycat and quote-dunk posts",
    "  - announcements that an author killed their *own* product, plan, free tier, trial, waitlist or fees",
    '  - migration stories ("we moved off Zapier")',
    "  - posts whose victim is unclear or cut off",
    "- **Deduplication:** by post id. Where one account or a copypasta template posted the same text several times, one representative is kept (normally the earliest or most-liked original).",
    "- **Victim and killer labels** are the curator's short labels taken from the post text. The killer is the named product, and is blank when the post doesn't name one.",
    "",
    *VER,
    "## Known gaps and caveats",
    "- **Result cap.** X relevancy search returned at most about 25 posts per call, and the `next_token` pages after that came back empty. So coverage depends on query wording and window splitting. Long-tail posts with zero engagement in dense months (Jul–Nov 2026) are probably under-sampled.",
    "- **Before mid-2025 the data is thin for a real reason.** Windows in 2023–H1 2025 returned well under the cap, and almost every result was noise. The meme takes off around Jun 2025 and explodes from Jul 2026.",
    "- **Phrasings searched:**",
    '  - "we just killed"',
    '  - "today we killed"',
    '  - "we\'ve just killed"',
    '  - "i think we just killed"',
    '  - "we killed" plus launch words or named products',
    '  - "just killed" plus launch, open-source or alternative wording',
    '  - "I just killed" plus launch words',
    '  - teen-founder variants ("I\'m 16 and I just killed")',
    '- **Not searched:** other phrasings such as "RIP X" or "X is dead". Posts in languages other than English are rare and may be missed.',
    "- **Media:** `image_url` is the first photo or video thumbnail. Posts with only a link card have no image.",
    "- **Deleted posts:** posts deleted after collection will 404.",
    "",
    "## Field glossary",
    "| Field | Meaning |",
    "|---|---|",
    "| case | Case number in chronological order (#0001 = oldest) |",
    "| id | X post id |",
    "| date | Post creation time (UTC, ISO 8601) |",
    "| author_name / handle | Display name and @username at collection time |",
    "| verified_type | X verification type (blue, business, none) |",
    "| url | Link to the post on x.com |",
    "| victims | What the post claims to have killed (`;`-separated in CSV) |",
    "| killer | The product doing the killing, if the post names it |",
    "| likes / reposts / replies / quotes / views / bookmarks | X public metrics at collection |",
    "| image_url | First attached media image or video thumbnail |",
    "| batch | `v1` = original set, `backfill` = added by the 2026-11-04 backfill |",
    "| verification_status / confidence | Verification result (confirmed, corrected, unverified) and confidence (high, medium, low) |",
    "| rationale / evidence_url / fields_changed | Why, the supporting link, and what was changed |",
    "| text | Full post text (long-form note text where available) |",
    "",
    "## Month-by-month count",
    "",
    "| Month | Kills |",
    "|---|---|",
]
L += [f"| {k} | {v} |" for k, v in sorted(mc.items())]
L += [
    "",
    "Months searched with zero kept: every month 2023-01 to 2025-05 except 2024-03 (2) and 2024-11 (1).",
    "",
    "## Victim leaderboard (2+ kills)",
    "",
    "| Rank | Victim | Times killed |",
    "|---|---|---|",
]
L += [f"| {i} | {v} | {c} |" for i, (v, c) in enumerate([x for x in vc.most_common() if x[1] > 1], 1)]
L += ["", "## Most viral kills (by likes)", ""]
L += [
    f"{i}. @{r['handle']}: {', '.join(r['victims'])} ({r['likes']:,} likes, {r['views']:,} views), {r['url']}"
    for i, r in enumerate(sorted(K, key=lambda r: -r["likes"])[:10], 1)
]
L += ["", "## Case files (chronological)", ""]
for r in K:
    L += [
        f"### Case {r['case']} | {r['created_at'][:10]} | @{r['handle']} killed {', '.join(r['victims'])}",
        "",
        f"- **Date:** {r['created_at']}",
        f"- **Author:** {r['name']} (@{r['handle']}){' ✓' + str(r.get('verified_type')) if r.get('verified') else ''}",
        f"- **Post:** {r['url']}",
        f"- **Victim(s):** {'; '.join(r['victims'])}",
        f"- **Killer product:** {r['killer'] or 'not named'}",
        f"- **Metrics:** {r['likes']:,} likes · {r['reposts']:,} reposts · {r['replies']:,} replies · {r.get('views') or 0:,} views",
        f"- **Image:** {r['image'] or 'none'}",
        f"- **Verification:** {r.get('verification', {}).get('status', 'n/a')} ({r.get('verification', {}).get('confidence', 'n/a')} confidence): {r.get('verification', {}).get('rationale', '')} Evidence: {r.get('verification', {}).get('evidence_url', '')}",
        "",
        "\n".join("> " + ln if ln else ">" for ln in r["text"].split("\n")),
        "",
    ]
open("docs/WeJustKilled_all_kills.md", "w").write("\n".join(L))
with open("docs/WeJustKilled_all_kills.csv", "w", newline="") as f:
    w = csv.writer(f)
    cols = [
        "case",
        "id",
        "date",
        "author_name",
        "handle",
        "verified_type",
        "url",
        "victims",
        "killer",
        "likes",
        "reposts",
        "replies",
        "quotes",
        "views",
        "bookmarks",
        "image_url",
        "batch",
        "verification_status",
        "confidence",
        "rationale",
        "evidence_url",
        "fields_changed",
        "text",
    ]
    w.writerow(cols)
    for r in K:
        w.writerow(
            [
                r["case"],
                r["id"],
                r["created_at"],
                r["name"],
                r["handle"],
                r.get("verified_type") or "",
                r["url"],
                "; ".join(r["victims"]),
                r["killer"] or "",
                r["likes"],
                r["reposts"],
                r["replies"],
                r.get("quotes", 0),
                r.get("views", 0),
                r.get("bookmarks", 0),
                r["image"] or "",
                r.get("batch", "v1"),
                r.get("verification", {}).get("status", ""),
                r.get("verification", {}).get("confidence", ""),
                r.get("verification", {}).get("rationale", ""),
                r.get("verification", {}).get("evidence_url", ""),
                "; ".join(r.get("verification", {}).get("fields_changed", [])),
                r["text"],
            ]
        )
# docx
if docx is None:
    raise SystemExit("python-docx not installed: wrote md and csv, skipped docx")
doc = docx.Document()
for ln in L:
    if ln.startswith("### "):
        doc.add_heading(ln[4:], 3)
    elif ln.startswith("## "):
        doc.add_heading(ln[3:], 2)
    elif ln.startswith("# "):
        doc.add_heading(ln[2:], 1)
    elif ln.startswith("|---"):
        continue
    elif ln.startswith("> ") or ln == ">":
        p = doc.add_paragraph(ln[2:] if len(ln) > 1 else "")
        p.style = "Quote" if "Quote" in [s.name for s in doc.styles] else p.style
    elif ln.startswith("- ") or re.match(r"^\d+\. ", ln) or ln.startswith("  - "):
        doc.add_paragraph(re.sub(r"\*\*", "", re.sub(r"^(\s*- |\d+\. )", "", ln)), style="List Bullet")
    elif ln.startswith("|"):
        doc.add_paragraph(" · ".join(c.strip() for c in ln.strip("|").split("|")))
    elif ln.strip():
        doc.add_paragraph(re.sub(r"\*\*", "", ln))
doc.save("docs/WeJustKilled_all_kills.docx")
print(len(K), newn)
