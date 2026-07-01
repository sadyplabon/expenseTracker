/**
 * Generates app icon PNGs using pure Node.js (no native deps).
 * Creates: assets/icon.png, assets/adaptive-icon.png, assets/splash.png
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// CRC32 implementation
function makeCRCTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  return table;
}
const CRC_TABLE = makeCRCTable();
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeB = Buffer.from(type, 'ascii');
  const lenB = Buffer.alloc(4); lenB.writeUInt32BE(data.length, 0);
  const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([lenB, typeB, data, crcB]);
}

function buildPNG(pixels, w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    for (let x = 0; x < w; x++) {
      const dst = y * (1 + w * 4) + 1 + x * 4;
      const src = (y * w + x) * 4;
      raw[dst] = pixels[src]; raw[dst+1] = pixels[src+1];
      raw[dst+2] = pixels[src+2]; raw[dst+3] = pixels[src+3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Blue gradient background
      const t = (x + y) / (size * 2);
      const r = Math.round(21 + t * 44);   // #1565C0 -> #42A5F5
      const g = Math.round(101 + t * 64);
      const b = Math.round(192 + t * 61);

      pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255;

      // White rounded rectangle (wallet body)
      const wx = size * 0.18, wy = size * 0.30;
      const ww = size * 0.64, wh = size * 0.40;
      const wr = size * 0.06;
      if (inRoundedRect(x, y, wx, wy, ww, wh, wr)) {
        pixels[i] = 255; pixels[i+1] = 255; pixels[i+2] = 255; pixels[i+3] = 245;
      }

      // Wallet flap (semi-transparent white)
      const fx = size * 0.18, fy = size * 0.22;
      const fw = size * 0.44, fh = size * 0.14;
      if (inRoundedRect(x, y, fx, fy, fw, fh, wr)) {
        pixels[i] = 255; pixels[i+1] = 255; pixels[i+2] = 255; pixels[i+3] = 180;
      }

      // Blue circle (coin slot)
      const coinCx = size * 0.655, coinCy = size * 0.50, coinR = size * 0.095;
      if (Math.sqrt((x-coinCx)**2 + (y-coinCy)**2) < coinR) {
        pixels[i] = 25; pixels[i+1] = 118; pixels[i+2] = 210; pixels[i+3] = 255;
      }

      // White dot in coin
      const dotR = size * 0.032;
      if (Math.sqrt((x-coinCx)**2 + (y-coinCy)**2) < dotR) {
        pixels[i] = 255; pixels[i+1] = 255; pixels[i+2] = 255; pixels[i+3] = 255;
      }
    }
  }
  return pixels;
}

function inRoundedRect(px, py, rx, ry, rw, rh, cr) {
  if (px < rx || px > rx + rw || py < ry || py > ry + rh) return false;
  // Check corners
  const corners = [
    [rx + cr, ry + cr], [rx + rw - cr, ry + cr],
    [rx + cr, ry + rh - cr], [rx + rw - cr, ry + rh - cr],
  ];
  for (const [cx, cy] of corners) {
    if (px < rx + cr && py < ry + cr && Math.sqrt((px-cx)**2+(py-cy)**2) > cr) return false;
    if (px > rx+rw-cr && py < ry+cr && Math.sqrt((px-cx)**2+(py-cy)**2) > cr) return false;
    if (px < rx+cr && py > ry+rh-cr && Math.sqrt((px-cx)**2+(py-cy)**2) > cr) return false;
    if (px > rx+rw-cr && py > ry+rh-cr && Math.sqrt((px-cx)**2+(py-cy)**2) > cr) return false;
  }
  return true;
}

function createSplash(w, h) {
  const pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const t = (x + y) / (w + h);
      pixels[i]   = Math.round(21 + t * 44);
      pixels[i+1] = Math.round(101 + t * 64);
      pixels[i+2] = Math.round(192 + t * 61);
      pixels[i+3] = 255;
    }
  }
  // Draw centered icon
  const iconSize = Math.round(w * 0.35);
  const ox = Math.round((w - iconSize) / 2);
  const oy = Math.round((h - iconSize) / 2);
  const iconPx = createIcon(iconSize);
  for (let y = 0; y < iconSize; y++) {
    for (let x = 0; x < iconSize; x++) {
      const src = (y * iconSize + x) * 4;
      const dx = ox + x, dy = oy + y;
      if (dx < 0 || dx >= w || dy < 0 || dy >= h) continue;
      const dst = (dy * w + dx) * 4;
      const a = iconPx[src + 3] / 255;
      if (a > 0) {
        pixels[dst]   = Math.round(iconPx[src]   * a + pixels[dst]   * (1 - a));
        pixels[dst+1] = Math.round(iconPx[src+1] * a + pixels[dst+1] * (1 - a));
        pixels[dst+2] = Math.round(iconPx[src+2] * a + pixels[dst+2] * (1 - a));
        pixels[dst+3] = 255;
      }
    }
  }
  return pixels;
}

const assetsDir = path.join(__dirname, '..', 'assets');

console.log('Generating icon.png (1024x1024)...');
const iconPx = createIcon(1024);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), buildPNG(iconPx, 1024, 1024));

console.log('Generating adaptive-icon.png (1024x1024)...');
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), buildPNG(iconPx, 1024, 1024));

console.log('Generating splash.png (1284x2778)...');
const splashPx = createSplash(1284, 2778);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), buildPNG(splashPx, 1284, 2778));

console.log('Done! All assets generated.');
