/* Préparation du site avant chaque mise en ligne :   node build.js

   1. Blocs communs (dossier _partials/) recopiés dans chaque page :
        <!-- @head --> … <!-- /@head -->              balises communes du <head>
        <!-- @header accueil --> … <!-- /@header -->  lien d'évitement + en-tête
        <!-- @footer --> … <!-- /@footer -->          pied de page + scripts
      Le mot après @header (accueil, realisations, parcours, contact, ou rien)
      indique le lien du menu à souligner. Tout ce qui est ENTRE les deux
      commentaires est réécrit : on modifie _partials/, jamais les pages.
      Les balises Open Graph (aperçu LinkedIn, Discord…) sont déduites du
      <title>, de la <meta name="description"> et du <link rel="canonical">
      de chaque page. Image d'aperçu : assets/og/<nom-de-la-fiche>.png si elle
      existe (voir _outils/og-images.mjs), sinon assets/og-image.png.

   2. Empreintes (?v=…) sur les CSS et les JS, pour que les visiteurs
      récupèrent la nouvelle version après une mise en ligne.

   3. Content-Security-Policy : la liste des scripts autorisés. Les scripts
      écrits directement dans une page (<script>…</script>) sont autorisés
      par leur empreinte, recalculée ici à chaque fois.

   4. sitemap.xml, régénéré à partir de la liste des pages.
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SITE = "https://thomasgiraud.me";
const root = __dirname;
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
// N'écrit que si le contenu change. Si le fichier est bloqué un instant (antivirus,
// synchronisation, aperçu ouvert…), on réessaie jusqu'à 5 fois.
function write(f, text) {
  const file = path.join(root, f);
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === text) return false;
  for (let i = 0; ; i++) {
    try { fs.writeFileSync(file, text, "utf8"); console.log("mis à jour :", f); return true; }
    catch (e) {
      if (i >= 4) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250); // pause de 250 ms
    }
  }
}
const exists = (f) => fs.existsSync(path.join(root, f));
const hash = (f) => crypto.createHash("sha1").update(fs.readFileSync(path.join(root, f))).digest("hex").slice(0, 8);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const attr = (s) => s.replace(/"/g, "&quot;");

// Triées : le résultat doit être identique sur Windows et sur GitHub (Linux)
const pages = [
  ...fs.readdirSync(root).filter((f) => f.endsWith(".html")).sort(),
  ...fs.readdirSync(path.join(root, "realisations")).filter((f) => f.endsWith(".html")).sort().map((f) => "realisations/" + f),
];

/* ---------- 1. Blocs communs ---------- */
const partial = {
  head: read("_partials/head.html").trim(),
  header: read("_partials/header.html").trim(),
  footer: read("_partials/footer.html").trim(),
};

function pageInfo(page, html) {
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "Thomas Giraud";
  const description = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1] || "";
  const url = (html.match(/<link rel="canonical" href="([^"]*)">/) || [])[1] || SITE + "/";
  const slug = path.basename(page, ".html");
  const og = page.startsWith("realisations/") && exists(`assets/og/${slug}.png`) ? `/assets/og/${slug}.png` : "/assets/og-image.png";
  return { title, description, url, image: SITE + og };
}

function fillPartials(page, html) {
  const info = pageInfo(page, html);
  const head = partial.head
    // (fonctions de remplacement : un « $ » dans un texte ne serait pas interprété)
    .replace("{{title}}", () => attr(info.title))
    .replace("{{description}}", () => info.description)
    .replace("{{url}}", () => info.url)
    .replace("{{image}}", () => info.image);
  return html
    .replace(/(<!-- @head -->)[\s\S]*?(<!-- \/@head -->)/, (_, open, close) => `${open}\n${head}\n${close}`)
    .replace(/(<!-- @header ?(\w*) -->)[\s\S]*?(<!-- \/@header -->)/, (_, open, current, close) => {
      let header = partial.header;
      if (current) {
        // Sur une fiche, « Réalisations » est la rubrique en cours (aria-current="true"), pas la page elle-même
        const value = current === "realisations" ? "true" : "page";
        header = header.replace(`data-nav="${current}"`, `data-nav="${current}" aria-current="${value}"`);
      }
      if (current === "realisations") header = header.replace('class="masthead"', 'class="masthead" data-progress');
      return `${open}\n${header}\n${close}`;
    })
    .replace(/(<!-- @footer -->)[\s\S]*?(<!-- \/@footer -->)/, (_, open, close) => `${open}\n${partial.footer}\n${close}`);
}

/* ---------- 2. Empreintes de cache ---------- */
// "fichier(?v=ancien)" → "fichier?v=nouveau", seulement dans un attribut href="…" ou src="…"
function stampAttr(text, ref, version) {
  return text.replace(new RegExp(`((?:href|src)="[^"]*${escapeRe(ref)})(\\?v=[0-9a-f]+)?`, "g"), `$1?v=${version}`);
}

// Modules importés par js/app.js (d'abord, car cela change l'empreinte de app.js)
let app = read("js/app.js");
for (const mod of fs.readdirSync(path.join(root, "js/modules")).filter((f) => f.endsWith(".js"))) {
  app = app.replace(new RegExp(`(\\./modules/${escapeRe(mod)})(\\?v=[0-9a-f]+)?`, "g"), `$1?v=${hash("js/modules/" + mod)}`);
}
write("js/app.js", app);

const assets = ["css/style.css", "css/motion.css", "js/head.js", "js/main.js", "js/app.js"];
const versions = Object.fromEntries(assets.map((a) => [a, hash(a)]));

/* ---------- 3. Content-Security-Policy ---------- */
function csp(html) {
  const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attrs]) => !/application\/ld\+json/.test(attrs)) // données JSON-LD : jamais exécutées
    .map(([, , code]) => `'sha256-${crypto.createHash("sha256").update(code, "utf8").digest("base64")}'`);
  return [
    "default-src 'self'",
    `script-src 'self' ${[...new Set(inline)].join(" ")}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://formspree.io",
    "form-action https://formspree.io",
    "base-uri 'none'",
    "object-src 'none'",
  ].join("; ");
}

for (const page of pages) {
  let html = fillPartials(page, read(page));
  for (const a of assets) html = stampAttr(html, a, versions[a]);
  html = html.replace("{{csp}}", () => csp(html));
  write(page, html);
}

/* ---------- 4. sitemap.xml ---------- */
const urls = pages
  .filter((p) => p !== "404.html")
  .sort((a, b) => (b === "index.html") - (a === "index.html")) // l'accueil en premier
  .map((p) => pageInfo(p, read(p)).url);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`);
console.log("Terminé : le site est prêt à être mis en ligne.");
