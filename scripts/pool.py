import json
import sys
import os
import re

# Merges raw X API v2 search responses (files given on the command line) into data/pool.json.
# Run from the repo root. pool.json is a local working file and is not committed.
pool_f = "data/pool.json"
pool = json.load(open(pool_f)) if os.path.exists(pool_f) else {}
new = 0
for f in sys.argv[1:]:
    raw = open(f).read()
    m = re.search(r"^\{.*\}$", raw, re.M)
    if not m:
        print("nojson", f)
        continue
    d = json.loads(m.group(0))
    inc = d.get("includes", {})
    users = {u["id"]: u for u in inc.get("users", [])}
    media = {x["media_key"]: x for x in inc.get("media", [])}
    data = d.get("data", [])
    if isinstance(data, dict):
        data = [data]
    allp = data + inc.get("tweets", [])
    for p in allp:
        if p["id"] in pool:
            continue
        if p.get("text", "").startswith("RT @"):
            continue
        u = users.get(p.get("author_id"), {})
        mk = (p.get("attachments") or {}).get("media_keys", [])
        img = None
        for k in mk:
            mm = media.get(k)
            if mm:
                img = mm.get("url") or mm.get("preview_image_url")
                break
        pool[p["id"]] = dict(
            id=p["id"],
            url=f"https://x.com/{u.get('username', 'i')}/status/{p['id']}",
            name=u.get("name"),
            handle=u.get("username"),
            avatar=(u.get("profile_image_url") or "").replace("_normal", "_400x400"),
            verified=u.get("verified"),
            verified_type=u.get("verified_type"),
            created_at=p.get("created_at"),
            text=(p.get("note_tweet") or {}).get("text") or p.get("text"),
            metrics=p.get("public_metrics", {}),
            image=img,
            lang=p.get("lang"),
            refs=p.get("referenced_tweets"),
            src=os.path.basename(f),
        )
        new += 1
        t = pool[p["id"]]["text"]
        print(
            p["id"],
            "@" + str(u.get("username")),
            pool[p["id"]]["metrics"].get("like_count"),
            "|",
            t[:230].replace("\n", " "),
        )
    print("META", d.get("meta"))
json.dump(pool, open(pool_f, "w"), indent=1)
print("new", new, "total", len(pool))
