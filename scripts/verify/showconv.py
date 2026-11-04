import json
import sys

for f in sys.argv[1:]:
    s = open(f).read()
    d = json.loads(next(l for l in s.split("\n") if l.startswith("{")))
    U = {u["id"]: u for u in d.get("includes", {}).get("users", [])}
    print("#####", f, "n=", len(d.get("data", [])), [l for l in s.split("\n") if "reads left" in l][:1])
    for p in d.get("data", []):
        t = ((p.get("note_tweet") or {}).get("text") or p["text"]).replace("\n", " ")
        print(
            f" - @{U.get(p.get('author_id'), {}).get('username', '?')} [{p.get('public_metrics', {}).get('like_count', '')}] {p.get('created_at', '')[:10]} {t[:260]}"
        )
