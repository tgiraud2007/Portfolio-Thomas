/* Générateur des icônes PWA / apple-touch-icon, sans dépendance externe.
   Réutilise l'encodeur PNG de build-og-image.js.

   Usage :  node assets/build-favicon-png.js
   Sortie : assets/apple-touch-icon.png (180), icon-192.png, icon-512.png
*/
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const SIZES = [180, 192, 512];

const hex = (h) => {
  h = h.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
};
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const mix = (c1, c2, t) => [lerp(c1[0],c2[0],t), lerp(c1[1],c2[1],t), lerp(c1[2],c2[2],t)];

const C_BLUE   = hex("#1b5def");
const C_ORANGE = hex("#e25327");
const C_DARK   = hex("#0a0b0d");
const C_WHITE  = [244,244,244];
const C_RED    = hex("#ff5f57");
const C_YELLOW = hex("#ffbd2e");
const C_GREEN  = hex("#15803d");

let S = 180;
let fb = null;

function setPx(x, y, [r,g,b], a = 255) {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  if (a < 255) {
    const af = a / 255, naf = 1 - af;
    fb[i]   = Math.round(r * af + fb[i]   * naf);
    fb[i+1] = Math.round(g * af + fb[i+1] * naf);
    fb[i+2] = Math.round(b * af + fb[i+2] * naf);
    fb[i+3] = 255;
  } else {
    fb[i] = r; fb[i+1] = g; fb[i+2] = b; fb[i+3] = 255;
  }
}

function fillRect(x, y, w, h, color, alpha = 255) {
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) setPx(x + i, y + j, color, alpha);
}

function inRoundedRect(px, py, x, y, w, h, r) {
  if (px < x || px >= x + w || py < y || py >= y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r - 1);
  const cy = Math.min(Math.max(py, y + r), y + h - r - 1);
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

// --- Police 5x7 (reprise de build-og-image.js + glyphes > et <) ------------
const FONT5x7 = {
  ' ':["00000","00000","00000","00000","00000","00000","00000"],
  '>':["00001","00010","00100","01000","00100","00010","00001"],
  '<':["10000","01000","00100","00010","00100","01000","10000"],
  'A':["01110","10001","10001","11111","10001","10001","10001"],
  'B':["11110","10001","10001","11110","10001","10001","11110"],
  'C':["01111","10000","10000","10000","10000","10000","01111"],
  'D':["11110","10001","10001","10001","10001","10001","11110"],
  'E':["11111","10000","10000","11110","10000","10000","11111"],
  'F':["11111","10000","10000","11110","10000","10000","10000"],
  'G':["01111","10000","10000","10011","10001","10001","01111"],
  'H':["10001","10001","10001","11111","10001","10001","10001"],
  'I':["11111","00100","00100","00100","00100","00100","11111"],
  'J':["00111","00010","00010","00010","00010","10010","01100"],
  'K':["10001","10010","10100","11000","10100","10010","10001"],
  'L':["10000","10000","10000","10000","10000","10000","11111"],
  'M':["10001","11011","10101","10101","10001","10001","10001"],
  'N':["10001","11001","10101","10011","10001","10001","10001"],
  'O':["01110","10001","10001","10001","10001","10001","01110"],
  'P':["11110","10001","10001","11110","10000","10000","10000"],
  'Q':["01110","10001","10001","10001","10101","10010","01101"],
  'R':["11110","10001","10001","11110","10100","10010","10001"],
  'S':["01111","10000","10000","01110","00001","00001","11110"],
  'T':["11111","00100","00100","00100","00100","00100","00100"],
  'U':["10001","10001","10001","10001","10001","10001","01110"],
  'V':["10001","10001","10001","10001","10001","01010","00100"],
  'W':["10001","10001","10001","10101","10101","11011","10001"],
  'X':["10001","10001","01010","00100","01010","10001","10001"],
  'Y':["10001","10001","01010","00100","00100","00100","00100"],
  'Z':["11111","00001","00010","00100","01000","10000","11111"],
  '0':["01110","10001","10011","10101","11001","10001","01110"],
  '1':["00100","01100","00100","00100","00100","00100","01110"],
  '2':["01110","10001","00001","00010","00100","01000","11111"],
  '3':["01110","10001","00001","00110","00001","10001","01110"],
  '4':["00010","00110","01010","10010","11111","00010","00010"],
  '5':["11111","10000","11110","00001","00001","10001","01110"],
  '6':["01110","10000","11110","10001","10001","10001","01110"],
  '7':["11111","00001","00010","00100","01000","01000","01000"],
  '8':["01110","10001","10001","01110","10001","10001","01110"],
  '9':["01110","10001","10001","01111","00001","00001","01110"],
};

function drawText(text, x, y, scale, color) {
  let cx = x;
  for (const raw of text) {
    const ch = raw.toUpperCase();
    const glyph = FONT5x7[ch] || FONT5x7[" "];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === "1") {
          for (let sy = 0; sy < scale; sy++)
            for (let sx = 0; sx < scale; sx++)
              setPx(cx + col*scale + sx, y + row*scale + sy, color);
        }
      }
    }
    cx += 6 * scale;
  }
}

// --- Rendu d'une icône à la taille courante (S) ----------------------------
function renderIcon() {
  // Fond : dégradé diagonal bleu -> orange, masque arrondi
  const r = Math.round(S / 4.5);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const t = (x + y) / (2 * S);
      if (inRoundedRect(x, y, 0, 0, S, S, r)) setPx(x, y, mix(C_BLUE, C_ORANGE, t));
    }
  }

  // Fenêtre terminale
  const winX = Math.round(S * 0.20), winY = Math.round(S * 0.235);
  const winW = Math.round(S * 0.60), winH = Math.round(S * 0.53);
  fillRect(winX, winY, winW, winH, C_DARK);

  // Barre de titre : 3 points
  const dot = Math.round(S / 20), gap = Math.round(S / 18);
  const dotY = winY + Math.round(S / 18);
  fillRect(winX + Math.round(S / 16), dotY, dot, dot, C_RED);
  fillRect(winX + Math.round(S / 16) + gap, dotY, dot, dot, C_YELLOW);
  fillRect(winX + Math.round(S / 16) + 2 * gap, dotY, dot, dot, C_GREEN);

  // Prompt ">tg" + curseur
  const glyphW = Math.max(2, Math.round(S / 30));
  const txtW = 3 * glyphW;
  const x0 = Math.round(S / 2 - txtW / 2);
  const y0 = Math.round(S * 0.41);
  drawText(">tg", x0, y0, glyphW, C_WHITE);
  fillRect(x0 + txtW + 2, y0 + glyphW * 2, Math.round(glyphW * 1.7), Math.round(glyphW * 4.6), C_ORANGE);
}

// --- Encodage PNG ----------------------------------------------------------
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng() {
  const raw = Buffer.alloc((S * 4 + 1) * S);
  for (let y = 0; y < S; y++) {
    raw[y * (S * 4 + 1)] = 0; // filter None
    fb.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0);
  ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// --- Génération ------------------------------------------------------------
const names = { 180: "apple-touch-icon.png", 192: "icon-192.png", 512: "icon-512.png" };
for (const size of SIZES) {
  S = size;
  fb = Buffer.alloc(S * S * 4);
  renderIcon();
  const png = encodePng();
  const out = path.join(__dirname, names[size]);
  fs.writeFileSync(out, png);
  console.log("OK", names[size], ":", png.length, "octets ->", out);
}
