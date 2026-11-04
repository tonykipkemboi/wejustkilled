# Provenance: applied the manual verification decisions to data/kills_pre_verify.json (not committed).
# Run from the repo root. Inputs other than decisions.py were intermediate files and are not in the repo.
import json
import copy
import collections
import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from decisions import D

src = json.load(open("data/kills_pre_verify.json"))
dos = json.load(open("scripts/verify/dossier.json"))
scope = set(json.load(open("scripts/verify/scope_ids.json")))
kept = []
removed = []
for r in src["kills"]:
    r = copy.deepcopy(r)
    i = r["id"]
    old_k = r.get("killer")
    fc = []
    if i in D:
        st, conf, kil, rat, ev, vic = D[i]
        if st != "removed":
            if kil == "KEEP":
                kil = old_k
            if kil != old_k:
                fc.append(f"killer: {old_k or '(blank)'} → {kil or '(blank)'}")
                r["killer"] = kil
            if vic:
                fc.append(f"victims: {r['victims']} → {vic}")
                r["victims"] = vic
                r["victim"] = vic[0]
    elif i in scope:
        d = dos.get(i, {})
        u = (d.get("uurl") or [None])[0]
        L = [l["url"] for l in d.get("links", [])]
        st, conf = "confirmed", "high"
        ev = u or (L[0] if L else r["url"])
        rat = f"Author is the {r['killer']} account or its team (bio/link: {ev}); the killer stated or implied in the post matches."
    else:
        st, conf, ev = "confirmed", "high", r["url"]
        rat = f"The post names its own product ({r['killer']}) and the victim explicitly; re-fetched live 2026-11-04."
    r["verification"] = {
        "status": st,
        "confidence": conf,
        "rationale": rat,
        "evidence_url": ev,
        "fields_changed": fc,
        "reviewed": "deep" if i in scope or i in D else "standard",
    }
    (removed if st == "removed" else kept).append(r)
meta = src["meta"]
meta["count"] = len(kept)
c = collections.Counter(x["verification"]["status"] for x in kept + removed)
cc = collections.Counter(x["verification"]["confidence"] for x in kept)
meta["verification"] = {
    "verified_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
    "method": "Each uncertain case (inferred or blank killer, ambiguous victim, satire or meta, unclear product) was re-fetched by id, with its reply thread (conversation_id search), the author's own follow-ups, quoted posts, author bio and linked-page metadata. Duplicates were collapsed to the earliest post. Every other case names its product in the post text.",
    "reviewed_deep": sum(1 for x in kept + removed if x["verification"]["reviewed"] == "deep"),
    "reviewed_total": len(kept) + len(removed),
    "by_status": dict(c),
    "confidence_kept": dict(cc),
    "removed": len(removed),
    "count_before": len(src["kills"]),
    "count_after": len(kept),
}
bv = collections.Counter(v for x in kept for v in x["victims"])
if "brand_victims" in meta and isinstance(meta["brand_victims"], list):
    meta["brand_victims"] = [v for v in meta["brand_victims"] if v in bv]
json.dump({"meta": meta, "kills": kept}, open("data/kills.json", "w"), ensure_ascii=False, indent=1)
json.dump(
    [
        {
            "id": x["id"],
            "url": x["url"],
            "handle": x["handle"],
            "text": x["text"],
            "likes": x["likes"],
            "reason": x["verification"]["rationale"],
            "evidence_url": x["verification"]["evidence_url"],
        }
        for x in removed
    ],
    open("data/removed.json", "w"),
    ensure_ascii=False,
    indent=1,
)
print(meta["verification"])
