/* Cache-busting : ajoute ?v=<empreinte> aux liens vers les CSS et JS, pour que
   les visiteurs récupèrent la dernière version après une mise en ligne.

   1. dans js/app.js : les imports des modules (./modules/xxx.js?v=…)
   2. dans toutes les pages HTML : css/style.css, css/motion.css, js/main.js, js/app.js

   Usage : node build.js   (à lancer avant chaque mise en ligne)
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const hash = (f) => crypto.createHash("sha1").update(fs.readFileSync(path.join(root, f))).digest("hex").slice(0, 8);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

// Remplace "fichier(?v=ancien)" par "fichier?v=nouveau" dans un texte
function stamp(text, ref, version) {
  return text.replace(new RegExp("(" + escape(ref) + ")(\\?v=[0-9a-f]+)?", "g"), "$1?v=" + version);
}

// 1. Modules importés par js/app.js (d'abord, car cela change l'empreinte de app.js)
let app = read("js/app.js");
for (const mod of fs.readdirSync(path.join(root, "js/modules")).filter((f) => f.endsWith(".js"))) {
  app = stamp(app, "./modules/" + mod, hash("js/modules/" + mod));
}
fs.writeFileSync(path.join(root, "js/app.js"), app, "utf8");
console.log("à jour : js/app.js");

// 2. Pages HTML
const assets = ["css/style.css", "css/motion.css", "js/main.js", "js/app.js"];
const hashes = Object.fromEntries(assets.map((a) => [a, hash(a)]));

const pages = [
  ...fs.readdirSync(root).filter((f) => f.endsWith(".html")),
  ...fs.readdirSync(path.join(root, "realisations")).filter((f) => f.endsWith(".html")).map((f) => "realisations/" + f),
];

for (const page of pages) {
  let html = read(page);
  for (const a of assets) html = stamp(html, a, hashes[a]);
  fs.writeFileSync(path.join(root, page), html, "utf8");
  console.log("à jour :", page);
}
