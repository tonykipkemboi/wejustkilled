# Provenance: built dossier.json from raw X API lookups (not committed).
import json
import glob

posts = {}
users = {}
refs = {}
for f in ["fbbfb1dc", "54a1faec", "b93926cf", "f8cf3fbd"]:
    s = open(glob.glob(f + "*.txt")[0]).read().split("\n")[0]
    d = json.loads(s)
    for p in d.get("data", []):
        posts[p["id"]] = p
    for u in d.get("includes", {}).get("users", []):
        users[u["id"]] = u
    for t in d.get("includes", {}).get("tweets", []):
        refs[t["id"]] = t
    if d.get("errors"):
        print("ERR", len(d["errors"]), [e.get("resource_id") or e.get("value") for e in d["errors"]][:20])
print(len(posts), len(users))
out = {}
for i, p in posts.items():
    u = users.get(p["author_id"], {})
    links = [
        dict(
            url=x.get("unwound_url") or x.get("expanded_url"),
            title=x.get("title"),
            desc=(x.get("description") or "")[:200],
        )
        for x in p.get("entities", {}).get("urls", [])
        if "x.com/" not in (x.get("expanded_url") or "")
        or "/status/" in (x.get("expanded_url") or "")
        and "/photo/" not in x.get("expanded_url")
        and "/video/" not in x.get("expanded_url")
    ]
    uurl = [x.get("expanded_url") for x in u.get("entities", {}).get("url", {}).get("urls", [])]
    mentions = [m["username"] for m in p.get("entities", {}).get("mentions", [])]
    rt = [(r["type"], refs.get(r["id"], {}).get("text", "")[:300]) for r in p.get("referenced_tweets", [])]
    out[i] = dict(
        conv=p.get("conversation_id"),
        links=links,
        bio=u.get("description"),
        uurl=uurl,
        uname=u.get("name"),
        pinned=u.get("pinned_tweet_id"),
        mentions=mentions,
        refs=rt,
        metrics=p.get("public_metrics"),
    )
json.dump(out, open("dossier.json", "w"), indent=1, ensure_ascii=False)
