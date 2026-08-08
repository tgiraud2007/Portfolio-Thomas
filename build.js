/* Build léger : cache-busting des assets statiques.
   Ajoute ?v=<hash> sur css/style.css et js/script.js dans index.html.

   Usage :  node build.js
*/
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const root = __dirname;
const htmlPath = path.join(root, "index.html");
let html = fs.readFileSync(htmlPath, "utf8");

const assets = [
  { ref: 'href="css/style.css', file: "css/style.css" },
  { ref: 'src="js/script.js', file: "js/script.js" },
];

let changed = false;
for (const { ref, file } of assets) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.warn("Introuvable, ignoré :", file);
    continue;
  }
  const hash = crypto.createHash("sha1")
    .update(fs.readFileSync(full))
    .digest("hex")
    .slice(0, 8);
  const pattern = new RegExp(ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '([^"\']*)');
  html = html.replace(pattern, ref + "?v=" + hash);
  changed = true;
  console.log("cache-busting :", file, "-> v=" + hash);
}

if (changed) {
  fs.writeFileSync(htmlPath, html, "utf8");
  console.log("index.html mis à jour.");
} else {
  console.log("Aucun changement.");
}
