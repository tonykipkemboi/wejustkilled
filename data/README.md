# data/

- `kills.json`: the canonical dataset (`meta` + `kills`). `scripts/build.py` writes it together with `site/kills.json` and `site/data.js` (it needs the local, git-ignored `pool.json`).
- `removed.json`: cases removed during verification, with the reason for each.
- `curation.txt`, `curation2.txt`: manual victim/killer labels (`id|victim|killer`) used by `scripts/build.py`.

Raw X API responses and the search pool (`pool.json`, backups) are local working files and are git-ignored.
