import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "site");
const port = process.env.PORT ?? 4173;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  const urlPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(root, decodeURIComponent(urlPath.split("?")[0]));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("verboden");
    return;
  }

  try {
    await stat(filePath);
    const inhoud = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" });
    res.end(inhoud);
  } catch {
    res.writeHead(404);
    res.end("niet gevonden");
  }
});

server.listen(port, () => {
  console.log(`site draait op http://localhost:${port}`);
});
