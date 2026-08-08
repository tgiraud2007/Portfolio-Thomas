/* Générateur d'og-image PNG (1200x630) sans dépendance externe.
   Utilise uniquement l'API standard de Node (zlib, fs, Buffer).
   Encodage PNG RGBA + filtrage par scanlines.

   Usage :  node assets/build-og-image.js
   Sortie : assets/og-image.png
*/
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const W = 1200, H = 630;

// --- Helpers couleur -------------------------------------------------------
const hex = (h) => {
  h = h.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
};
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const mix = (c1, c2, t) => [lerp(c1[0],c2[0],t), lerp(c1[1],c2[1],t), lerp(c1[2],c2[2],t)];

// Palette
const C_BG_TOP = hex("#0a0b0d");
const C_BG_MID = hex("#111215");
const C_BG_BOT = hex("#1b1d22");
const C_WHITE  = [244,244,244];
const C_BLUE   = hex("#4a7ff7");
const C_ORANGE = hex("#e8734b");
const C_DIM    = [169,178,195];
const C_GRID   = [255,255,255];

// --- Framebuffer RGBA ------------------------------------------------------
const fb = Buffer.alloc(W * H * 4);

function setPx(x, y, [r,g,b], a = 255) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  if (a < 255) {
    // alpha-blend over existing
    const af = a / 255, naf = 1 - af;
    fb[i]   = Math.round(r * af + fb[i]   * naf);
    fb[i+1] = Math.round(g * af + fb[i+1] * naf);
    fb[i+2] = Math.round(b * af + fb[i+2] * naf);
    fb[i+3] = 255;
  } else {
    fb[i] = r; fb[i+1] = g; fb[i+2] = b; fb[i+3] = 255;
  }
}

// --- Remplissages ----------------------------------------------------------
function fillBgGradient() {
  for (let y = 0; y < H; y++) {
    let row;
    if (y / H < 0.55) row = mix(C_BG_TOP, C_BG_MID, (y / H) / 0.55);
    else              row = mix(C_BG_MID, C_BG_BOT, (y / H - 0.55) / 0.45);
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      fb[i] = row[0]; fb[i+1] = row[1]; fb[i+2] = row[2]; fb[i+3] = 255;
    }
  }
}

function drawGrid() {
  for (let y = 0; y < H; y += 40) {
    for (let x = 0; x < W; x++) setPx(x, y, C_GRID, 10);
  }
  for (let x = 0; x < W; x += 40) {
    for (let y = 0; y < H; y++) setPx(x, y, C_GRID, 10);
  }
}

function fillRect(x, y, w, h, color, alpha = 255) {
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) setPx(x + i, y + j, color, alpha);
}
function strokeRect(x, y, w, h, color, alpha) {
  for (let i = 0; i < w; i++) { setPx(x+i, y, color, alpha); setPx(x+i, y+h-1, color, alpha); }
  for (let j = 0; j < h; j++) { setPx(x, y+j, color, alpha); setPx(x+w-1, y+j, color, alpha); }
}

// --- Police 5x7 bitmap (réduite à l'essentiel : A-Z 0-9 ponctuation) -------
// Chaque glyphe = 7 lignes de 5 bits (string), '1' = pixel allumé.
const FONT5x7 = {
  ' ':["00000","00000","00000","00000","00000","00000","00000"],
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
  '.':["00000","00000","00000","00000","00000","00100","00100"],
  ',':["00000","00000","00000","00000","00100","00100","01000"],
  '-':["00000","00000","00000","11111","00000","00000","00000"],
  ':':["00000","00100","00000","00000","00000","00100","00000"],
  '/':["00001","00010","00010","00100","01000","01000","10000"],
  '(':["00010","00100","01000","01000","01000","00100","00010"],
  ')':["01000","00100","00010","00010","00010","00100","01000"],
  '&':["00000","01000","10101","01000","10100","10010","01101"],
  '?':["01110","10001","00001","00110","00100","00000","00100"],
  '!':["00100","00100","00100","00100","00100","00000","00100"],
  '_':["00000","00000","00000","00000","00000","00000","11111"],
  '#':["01010","01010","11111","01010","11111","01010","01010"],
  "'":["00100","00100","01000","00000","00000","00000","00000"],
};

function drawText(text, x, y, scale, color, alpha = 255) {
  let cx = x;
  for (const raw of text) {
    const ch = raw.toUpperCase();
    const glyph = FONT5x7[ch] || FONT5x7[" "];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === "1") {
          for (let sy = 0; sy < scale; sy++)
            for (let sx = 0; sx < scale; sx++)
              setPx(cx + col*scale + sx, y + row*scale + sy, color, alpha);
        }
      }
    }
    cx += 6 * scale; // 5px glyph + 1px gap
  }
}

// Barre accent dégradée en haut
function drawAccentBar() {
  for (let x = 0; x < W; x++) {
    const t = x / W;
    const c = mix(C_BLUE, C_ORANGE, t);
    for (let y = 0; y < 6; y++) setPx(x, y, c, 255);
  }
}

// --- Rendu de la scène -----------------------------------------------------
fillBgGradient();
drawGrid();
drawAccentBar();

// Ligne de prompt orange "// thomasgiraud.me"
drawText("// thomasgiraud.me", 80, 110, 5, C_ORANGE);
// Nom principal (scale 12 : "Thomas Giraud" ~= 13*6*12 = 936px, tient largement)
drawText("Thomas Giraud", 78, 220, 12, C_WHITE);
// Rôle
drawText("BTS SIO (SISR)", 82, 380, 7, C_BLUE);
drawText("ADMINISTRATION SYSTEMES & RESEAUX", 82, 446, 4, C_DIM);

// Tags pills (2 par ligne pour éviter tout débordement)
function pill(text, x, y, color, scale = 4) {
  const w = text.length * 6 * scale + 24;
  const h = 7 * scale + 18;
  fillRect(x, y, w, h, color, 38);
  strokeRect(x, y, w, h, color, 100);
  drawText(text, x + 12, y + 9, scale, color);
  return w;
}
// Ligne 1 (y=500)
let px = 82, py = 500;
px += pill("ACTIVE DIRECTORY", px, py, C_BLUE, 3) + 14;
px += pill("IPFIRE", px, py, C_ORANGE, 3) + 14;
// Ligne 2 (y=500+39+16=555, fin en bas 555+39=594 = juste avant status bar 594)
px = 82; py = 555;
px += pill("CISCO IOS", px, py, C_BLUE, 3) + 14;
px += pill("VIRTUALISATION", px, py, [46,204,113], 3) + 14;

// Status bar mock en bas
fillRect(0, H-36, W, 36, hex("#0a0b0d"), 255);
// point vert
for (let j=0;j<10;j++) for(let i=0;i<10;i++) setPx(35+i, H-18-5+j, [46,204,113], 255);
drawText("AD_ONLINE . CISCO_UP . SYSTEM.READY", 58, H-26, 3, [122,130,144]);
drawText("TG", W-60, H-26, 3, [122,130,144]);

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
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Construit les données brutes avec filtre 0 (None) par scanline
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0; // filter byte
  fb.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
}
const idat = zlib.deflateSync(raw, { level: 9 });

const sig = Buffer.from([137,80,78,71,13,10,26,10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 6;   // color type RGBA
ihdr[10] = 0;  // compression
ihdr[11] = 0;  // filter
ihdr[12] = 0;  // interlace

const png = Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);

const out = path.join(__dirname, "og-image.png");
fs.writeFileSync(out, png);
console.log("OK og-image.png genéré :", png.length, "octets ->", out);
