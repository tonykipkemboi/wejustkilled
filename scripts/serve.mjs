// Local static server for site/ that applies the same response headers as vercel.json,
// so the Content-Security-Policy can be tested before deploying.
// Usage: node scripts/serve.mjs [port]   (default 8780, binds 127.0.0.1 only)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(process.env.SITE_DIR || fileURLToPath(new URL("../site", import.meta.url)));
const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
// Vercel "source" patterns used here are simple path-to-regexp globs like /(.*) and /assets/fonts/(.*).
// eslint-disable-next-line security/detect-non-literal-regexp -- pattern comes from our own vercel.json
const rules = vercel.headers.map((r) => ({ re: new RegExp(`^${r.source}$`), headers: r.headers }));

export const startServer = (port = 8780) =>
  new Promise((ok) => {
    const server = createServer(async (req, res) => {
      const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      for (const r of rules) if (r.re.test(path)) for (const h of r.headers) res.setHeader(h.key, h.value);
      const file = normalize(join(ROOT, path.endsWith("/") ? path + "index.html" : path));
      if (file !== ROOT && !file.startsWith(ROOT + sep)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      try {
        if (!(await stat(file)).isFile()) throw new Error("not a file");
        res.setHeader("Content-Type", TYPES[extname(file)] || "application/octet-stream");
        res.end(await readFile(file));
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" }).end("not found");
      }
    });
    server.listen(port, "127.0.0.1", () => ok(server));
  });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || process.env.PORT || 8780);
  await startServer(port);
  console.log(`Serving site/ with vercel.json headers on http://127.0.0.1:${port}/`);
}
