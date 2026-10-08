/* ==========================================================================
   Images d'aperçu des fiches (LinkedIn, Discord, WhatsApp…)
   --------------------------------------------------------------------------
   Pour chaque page de realisations/, fabrique assets/og/<nom>.png (1200 × 630) :
   le numéro, le titre de la fiche et son schéma, aux couleurs du site.
   build.js les utilise ensuite automatiquement dans les balises og:image.

   À relancer quand tu changes le titre ou le schéma d'une fiche :
     1. dans un terminal :  python -m http.server 8000
     2. dans un autre    :  node _outils/og-images.mjs
     3. puis              :  node build.js

   Il faut Google Chrome (ou Edge) installé. Si le script ne le trouve pas,
   indique son chemin : set CHROME=C:\chemin\vers\chrome.exe (Windows).
   Aucun module à installer : le script pilote Chrome directement
   (Chrome DevTools Protocol), avec Node 22 ou plus récent.
   ========================================================================== */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "http://localhost:8000";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "assets", "og");
const fiches = fs.readdirSync(path.join(root, "realisations")).filter((f) => f.endsWith(".html"));

const candidates = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);
const chromePath = candidates.find((p) => fs.existsSync(p));
if (!chromePath) { console.error("Chrome introuvable : indique son chemin dans la variable CHROME."); process.exit(1); }

try { await fetch(SITE); } catch { console.error(`Le site ne répond pas sur ${SITE} : lance d'abord « python -m http.server 8000 ».`); process.exit(1); }

/* ---------- Petit pilote Chrome ---------- */
const port = 9222 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "og-chrome-"));
const chrome = spawn(chromePath, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 100 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json()).webSocketDebuggerUrl; } catch {}
  await sleep(200);
}
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }, { name: "prefers-reduced-motion", value: "reduce" }] });

/* ---------- Mise en page de l'image, dans la fiche elle-même ----------
   On garde la page (polices, couleurs, schéma) et on remplace l'affichage par
   une composition 1200 × 630 : numéro + titre à gauche, schéma à droite. */
const compose = `(() => {
  document.documentElement.setAttribute("data-theme", "light");
  document.documentElement.classList.add("no-intro");
  const num = document.querySelector(".page-num").textContent.trim();
  const title = document.querySelector(".page-head h1").innerHTML;
  const svg = document.querySelector(".prose .fig svg, .mini .fig svg");
  const og = document.createElement("div");
  og.className = "og";
  og.innerHTML = '<div class="og__text"><p class="kicker">Réalisation ' + num + ' · BTS SIO SISR</p><p class="og__title">' + title + '</p><p class="og__who">Thomas Giraud · thomasgiraud.me</p></div><div class="og__fig"></div>';
  if (svg) og.querySelector(".og__fig").appendChild(svg); // on déplace le schéma (pas de copie : ses identifiants restent uniques)
  document.body.appendChild(og);
  if (svg && svg.pauseAnimations) { if (svg.setCurrentTime) svg.setCurrentTime(4); svg.pauseAnimations(); }
  const long = document.querySelector(".page-head h1").textContent.length > 28;
  const style = document.createElement("style");
  style.textContent = \`
    html, body { height: 630px; overflow: hidden; }
    body > :not(.og) { display: none !important; }
    .og { position: fixed; inset: 0; display: grid; grid-template-columns: minmax(0, 1fr) 470px; gap: 48px; align-items: center;
          padding: 70px 64px 56px 72px; background: var(--grain-img) var(--bg); border-top: 14px solid var(--ink); }
    .og .kicker { font-size: 17px; }
    .og__title { font-family: var(--serif-display); font-weight: 600; font-size: \${long ? 62 : 76}px; line-height: .98; letter-spacing: -.035em;
                 font-variation-settings: "opsz" 144; margin: 20px 0 30px; text-wrap: balance; }
    .og__title em { font-weight: 400; color: var(--red); }
    .og__who { font: 22px var(--sans); color: var(--ink-2); }
    .og__fig svg { display: block; width: 100%; height: auto; margin: 0; overflow: visible; min-width: 0 !important; }
    .og__fig text { font-family: var(--mono); font-size: 13px; }
    .og .node .halo { display: none; }
  \`;
  document.head.appendChild(style);
  return document.fonts.ready.then(() => true);
})()`;

fs.mkdirSync(outDir, { recursive: true });
for (const file of fiches) {
  await send("Page.navigate", { url: `${SITE}/realisations/${file}` });
  await sleep(2000);
  const res = await send("Runtime.evaluate", { expression: compose, awaitPromise: true });
  if (res.result.exceptionDetails) { console.error(file, ":", res.result.exceptionDetails.exception?.description); continue; }
  await sleep(400);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  const out = path.join(outDir, file.replace(/\.html$/, ".png"));
  fs.writeFileSync(out, Buffer.from(shot.result.data, "base64"));
  console.log("image :", path.relative(root, out));
}
ws.close();
chrome.kill();
