/* Cache-busting : ajoute ?v=<empreinte> aux liens vers css/style.css et js/main.js
   dans toutes les pages HTML, pour que les visiteurs récupèrent la dernière version.

   Usage : node build.js   (à lancer avant chaque mise en ligne)
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const assets = ["css/style.css", "js/main.js"];
const hashes = Object.fromEntries(assets.map((a) => [
  a, crypto.createHash("sha1").update(fs.readFileSync(path.join(root, a))).digest("hex").slice(0, 8),
]));

const pages = [
  ...fs.readdirSync(root).filter((f) => f.endsWith(".html")),
  ...fs.readdirSync(path.join(root, "realisations")).filter((f) => f.endsWith(".html")).map((f) => "realisations/" + f),
];

for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, "utf8");
  for (const a of assets) {
    const escaped = a.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    const re = new RegExp("(" + escaped + ")(\\?v=[0-9a-f]+)?", "g");
    html = html.replace(re, "$1?v=" + hashes[a]);
  }
  fs.writeFileSync(file, html, "utf8");
  console.log("à jour :", page);
}
