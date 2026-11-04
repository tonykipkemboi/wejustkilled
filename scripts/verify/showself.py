import json
import glob

for f in sorted(glob.glob("self/*.json")):
    s = open(f).read()
    d = json.loads(next(l for l in s.split("\n") if l.startswith("{")))
    U = {u["id"]: u["username"] for u in d.get("includes", {}).get("users", [])}
    print(
        "#####",
        f,
        "n=",
        d.get("meta", {}).get("result_count"),
        [l[-80:] for l in s.split("\n") if "reads left" in l][:1],
    )
    for p in sorted(d.get("data", []), key=lambda p: p.get("conversation_id", "?")):
        t = ((p.get("note_tweet") or {}).get("text") or p["text"]).replace("\n", " ")
        links = [
            (x.get("unwound_url") or x.get("expanded_url"))
            for x in p.get("entities", {}).get("urls", [])
            if "x.com/" not in (x.get("expanded_url") or "")
        ]
        print(f" - {p.get('conversation_id', '?')} @{U.get(p['author_id'])} {t[:230]} {links}")
