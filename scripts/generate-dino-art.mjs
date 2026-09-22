#!/usr/bin/env node
/**
 * Streakosaurus — Dino World artwork generator
 * =============================================
 * Emits the files the app's asset pipeline resolves:
 *   src/assets/dinos/<slug>/{egg,juvenile,adult,grown}.svg
 *
 * Art direction: polished 2D collectible roster. One visual grammar for all
 * 25 species — dark earth outline, layered volume shading, rim light, soft
 * ground shadow, transparent background, no scenery.
 *
 * Stages (egg / child / adult / fully grown) change PROPORTIONS, not scale.
 *
 * Usage:
 *   node scripts/generate-dino-art.mjs            # whole roster
 *   node scripts/generate-dino-art.mjs --batch 3  # achievements 11-15 only
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'src', 'assets', 'dinos');
const GALLERY = join(ROOT, '.freebuff', 'dino-gallery.html');
const GROUND = 158;

// ============================================================
// Colour utilities
// ============================================================
const OUTLINE = '#15110D';
const CREAM = '#F2E7CE';
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => toHex(toRgb(a).map((v, i) => v + (toRgb(b)[i] - v) * t));
const darken = (c, t) => mix(c, '#100C09', t);
const lighten = (c, t) => mix(c, CREAM, t);

// ============================================================
// Geometry helpers
// ============================================================
const n = (v) => (Math.round(v * 10) / 10).toString();
const pt = (p) => `${n(p[0])} ${n(p[1])}`;
const lerp = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
const unit = (p) => {
  const l = Math.hypot(p[0], p[1]) || 1;
  return [p[0] / l, p[1] / l];
};
/** Rotated ellipse as a cubic path — the workhorse body shape */
function oval(cx, cy, rx, ry, a = 0) {
  const k = 0.5523;
  const R = (px, py) => {
    const dx = px - cx;
    const dy = py - cy;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [cx + dx * c - dy * s, cy + dx * s + dy * c];
  };
  const L = R(cx - rx, cy);
  const T = R(cx, cy - ry);
  const Rt = R(cx + rx, cy);
  const B = R(cx, cy + ry);
  const c1 = R(cx - rx, cy - ry * k);
  const c2 = R(cx - rx * k, cy - ry);
  const c3 = R(cx + rx * k, cy - ry);
  const c4 = R(cx + rx, cy - ry * k);
  const c5 = R(cx + rx, cy + ry * k);
  const c6 = R(cx + rx * k, cy + ry);
  const c7 = R(cx - rx * k, cy + ry);
  const c8 = R(cx - rx, cy + ry * k);
  return `M ${pt(L)} C ${pt(c1)} ${pt(c2)} ${pt(T)} C ${pt(c3)} ${pt(c4)} ${pt(Rt)} C ${pt(c5)} ${pt(c6)} ${pt(B)} C ${pt(c7)} ${pt(c8)} ${pt(L)} Z`;
}
/** Bounding box of a rotated ellipse */
function ovalBox(cx, cy, rx, ry, a = 0) {
  const w = Math.abs(rx * Math.cos(a)) + Math.abs(ry * Math.sin(a));
  const h = Math.abs(rx * Math.sin(a)) + Math.abs(ry * Math.cos(a));
  return [cx - w, cy - h, cx + w, cy + h];
}

// ============================================================
// SVG primitives
// ============================================================
function part(d, fill, sw = 2.3) {
  return `<path d="${d}" fill="${fill}" stroke="${OUTLINE}" stroke-width="${n(sw)}" stroke-linejoin="round" stroke-linecap="round"/>`;
}
function tube(d, w, fill, sw = 2.3) {
  return (
    `<path d="${d}" fill="none" stroke="${OUTLINE}" stroke-width="${n(w + sw * 2)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}
const tapered = (fill, sw = 2.3) => (p0, c, p1, w0, w1) => {
  const d0 = unit([c[0] - p0[0], c[1] - p0[1]]);
  const d1 = unit([p1[0] - c[0], p1[1] - c[1]]);
  const n0 = [-d0[1], d0[0]];
  const n1 = [-d1[1], d1[0]];
  const nm = unit([n0[0] + n1[0], n0[1] + n1[1]]);
  const h0 = w0 / 2;
  const h1 = w1 / 2;
  const hm = (h0 + h1) / 2;
  const a = [p0[0] + n0[0] * h0, p0[1] + n0[1] * h0];
  const b = [p1[0] + n1[0] * h1, p1[1] + n1[1] * h1];
  const ca = [c[0] + nm[0] * hm, c[1] + nm[1] * hm];
  const da = [p0[0] - n0[0] * h0, p0[1] - n0[1] * h0];
  const db = [p1[0] - n1[0] * h1, p1[1] - n1[1] * h1];
  const cb = [c[0] - nm[0] * hm, c[1] - nm[1] * hm];
  return part(`M ${pt(a)} Q ${pt(ca)} ${pt(b)} L ${pt(db)} Q ${pt(cb)} ${pt(da)} Z`, fill, sw);
};
const T = (fill, sw) => tapered(fill, sw);

function groundShadow(cx, rx, ry = 9) {
  return `<ellipse cx="${n(cx)}" cy="${GROUND + 2}" rx="${n(rx)}" ry="${n(ry)}" fill="url(#gsh)"/>`;
}

function eye(x, y, r, iris, brow = true) {
  const b = brow
    ? `<path d="M ${n(x - r * 1.5)} ${n(y - r * 1.5)} Q ${n(x)} ${n(y - r * 2.6)} ${n(x + r * 1.7)} ${n(y - r * 1.2)}" fill="none" stroke="${OUTLINE}" stroke-width="${n(r * 0.8)}" stroke-linecap="round" opacity="0.85"/>`
    : '';
  return (
    b +
    `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * 1.42)}" ry="${n(r * 1.28)}" fill="${darken(iris, 0.55)}"/>` +
    `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r)}" ry="${n(r * 0.92)}" fill="${iris}"/>` +
    `<circle cx="${n(x - r * 0.34)}" cy="${n(y - r * 0.36)}" r="${n(r * 0.34)}" fill="${CREAM}" opacity="0.92"/>`
  );
}

function teeth(x0, x1, y, count, depth, fill = CREAM) {
  const step = (x1 - x0) / count;
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + step * i;
    const w = Math.max(1.4, step * 0.6);
    out += `<path d="M ${n(x)} ${n(y)} L ${n(x + w * 0.5)} ${n(y + depth)} L ${n(x + w)} ${n(y)} Z" fill="${fill}"/>`;
  }
  return out;
}

/** Hand claws: a small fan of curved talons */
function claws(x, y, dir, len, fill = CREAM) {
  return [-0.42, 0, 0.42]
    .map((a, i) => {
      const tip = [x + dir * len * Math.cos(a), y + len * Math.sin(a)];
      return `<path d="M ${n(x)} ${n(y)} Q ${n(x + dir * len * 0.6)} ${n(y + len * 0.35 + (i - 1) * len * 0.25)} ${n(tip[0])} ${n(tip[1])} Q ${n(x + dir * len * 0.5)} ${n(y + (i - 1) * len * 0.3)} ${n(x)} ${n(y)} Z" fill="${fill}"/>`;
    })
    .join('');
}

/** Integrated foot: palm plus three forward toes with claw tips */
function foot(x, y, w, color, claw = CREAM) {
  let out = '';
  for (let i = -1; i <= 1; i++) {
    const a = i * 0.34;
    const len = w * 1.02 - Math.abs(i) * w * 0.16;
    const tx = x + Math.cos(a) * len;
    const ty = y + Math.sin(a) * len;
    out +=
      tube(`M ${n(x)} ${n(y)} Q ${n(x + Math.cos(a) * len * 0.55)} ${n(y + Math.sin(a) * len * 0.5)} ${n(tx)} ${n(ty)}`, w * 0.36, color) +
      (claw ? tube(`M ${n(tx)} L ${n(tx + Math.cos(a) * w * 0.24)} ${n(ty + Math.sin(a) * w * 0.22 + 0.4)}`, w * 0.17, claw) : '');
  }
  return out;
}

/** Stylised plate/horn kite with a tinted inner face */
function plate(cx, cy, w, h, fill, rim, sw = 5.5) {
  const kite = (shrink) =>
    `M ${n(cx)} ${n(cy - h * shrink)} ` +
    `C ${n(cx + w * 0.5 * shrink)} ${n(cy - h * 0.66 * shrink)} ${n(cx + w * 0.6 * shrink)} ${n(cy - h * 0.16 * shrink)} ${n(cx + w * 0.52 * shrink)} ${n(cy + h * 0.1 * shrink)} ` +
    `L ${n(cx - w * 0.52 * shrink)} ${n(cy + h * 0.1 * shrink)} ` +
    `C ${n(cx - w * 0.6 * shrink)} ${n(cy - h * 0.16 * shrink)} ${n(cx - w * 0.5 * shrink)} ${n(cy - h * 0.66 * shrink)} ${n(cx)} ${n(cy - h * shrink)} Z`;
  return part(kite(1), rim, sw) + part(kite(0.62), fill, 0);
}

/** Scalloped fan silhouette (ceratopsian frill) */
function scalloped(cx, cy, rx, ry, bumps, bulge = 1.3) {
  const P = (a) => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  const from = Math.PI;
  const to = Math.PI * 2;
  const step = (to - from) / bumps;
  let d = `M ${pt(P(from))}`;
  for (let i = 0; i < bumps; i++) {
    const p0 = P(from + step * i);
    const p1 = P(from + step * (i + 1));
    const chord = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const r = (chord / 2) * bulge;
    d += ` A ${n(r)} ${n(r)} 0 0 1 ${pt(p1)}`;
  }
  d += ` Q ${n(cx + rx * 0.15)} ${n(cy + ry * 1.5)} ${pt(P(from))} Z`;
  return d;
}

/**
 * Body with automatic volume: base + top shadow + lit belly + rim darkening
 * + silhouette rim light + two highlight streaks, all clipped to the silhouette.
 */
function torso(id, d, box, pal) {
  const [x0, y0, x1, y1] = box;
  const w = x1 - x0;
  const h = y1 - y0;
  return (
    part(d, pal.base) +
    `<g clip-path="url(#${id})">` +
    `<ellipse cx="${n(x0 + w * 0.45)}" cy="${n(y0 + h * 0.2)}" rx="${n(w * 0.8)}" ry="${n(h * 0.72)}" fill="${darken(pal.base, 0.36)}" opacity="0.78"/>` +
    `<ellipse cx="${n(x0 + w * 0.56)}" cy="${n(y0 + h * 1.2)}" rx="${n(w * 0.58)}" ry="${n(h * 0.42)}" fill="${lighten(pal.base, 0.46)}" opacity="0.4"/>` +
    `<path d="${d}" fill="none" stroke="${darken(pal.base, 0.42)}" stroke-width="7" opacity="0.38"/>` +
    `<path d="${d}" fill="none" stroke="${lighten(pal.base, 0.9)}" stroke-width="2.6" opacity="0.2"/>` +
    `<path d="M ${n(x0 + w * 0.22)} ${n(y0 + h * 0.34)} Q ${n(x0 + w * 0.5)} ${n(y0 + h * 0.24)} ${n(x0 + w * 0.8)} ${n(y0 + h * 0.4)}" fill="none" stroke="${lighten(pal.base, 0.75)}" stroke-width="${n(Math.max(2, h * 0.12))}" stroke-linecap="round" opacity="0.16"/>` +
    `<path d="M ${n(x0 + w * 0.28)} ${n(y0 + h * 0.66)} Q ${n(x0 + w * 0.54)} ${n(y0 + h * 0.56)} ${n(x0 + w * 0.76)} ${n(y0 + h * 0.68)}" fill="none" stroke="${lighten(pal.base, 0.7)}" stroke-width="${n(Math.max(1.6, h * 0.08))}" stroke-linecap="round" opacity="0.12"/>` +
    `</g>`
  );
}

/** Species-tinted egg with motif */
function eggArt(pal, motif) {
  const shell = lighten(pal.base, 0.3);
  const cx = 120;
  const cy = 118;
  const rx = 31;
  const ry = 39;
  const shellPath = `M ${n(cx - rx)} ${n(cy)} C ${n(cx - rx)} ${n(cy - ry * 0.86)} ${n(cx - rx * 0.55)} ${n(cy - ry)} ${n(cx)} ${n(cy - ry)} C ${n(cx + rx * 0.55)} ${n(cy - ry)} ${n(cx + rx)} ${n(cy - ry * 0.86)} ${n(cx + rx)} ${n(cy)} C ${n(cx + rx)} ${n(cy + ry * 0.82)} ${n(cx + rx * 0.5)} ${n(cy + ry)} ${n(cx)} ${n(cy + ry)} C ${n(cx - rx * 0.5)} ${n(cy + ry)} ${n(cx - rx)} ${n(cy + ry * 0.82)} ${n(cx - rx)} ${n(cy)} Z`;
  const bandY = (y) => Math.sqrt(Math.max(0, 1 - Math.pow((y - cy) / ry, 2))) * rx;
  let motifs = '';

  if (motif === 'speckles') {
    const spots = [[-14, -16, 4.6], [6, -22, 3.4], [15, -4, 4.2], [-9, 4, 3.2], [9, 15, 4], [-16, 15, 2.8], [0, -6, 2.4], [17, -20, 2.4]];
    motifs = spots.map(([dx, dy, r]) => `<ellipse cx="${n(cx + dx)}" cy="${n(cy + dy)}" rx="${n(r)}" ry="${n(r * 0.86)}" fill="${darken(pal.base, 0.3)}" opacity="0.5"/>`).join('');
  } else if (motif === 'bands') {
    motifs = [0, 1, 2, 3]
      .map((i) => {
        const y = cy - 24 + i * 16;
        const hw = bandY(y);
        return `<path d="M ${n(cx - hw * 0.86)} ${n(y)} Q ${n(cx)} ${n(y + 5)} ${n(cx + hw * 0.86)} ${n(y)}" fill="none" stroke="${darken(pal.base, 0.34)}" stroke-width="3.6" stroke-linecap="round" opacity="0.4"/>`;
      })
      .join('');
  } else if (motif === 'plates') {
    motifs = [-1, 0, 1]
      .map((i) => {
        const a = -Math.PI / 2 + i * 0.34;
        return plate(cx + Math.cos(a) * rx * 0.72, cy + Math.sin(a) * ry * 0.72, 13, 12, lighten(pal.base, 0.02), darken(pal.base, 0.32), 3);
      })
      .join('');
  } else if (motif === 'horns') {
    motifs =
      tapered(darken(pal.base, 0.24), 1.4)([cx - 8, cy - ry * 0.42], [cx - 14, cy - ry * 0.8], [cx - 18, cy - ry * 1.0], 6.5, 1.5) +
      tapered(darken(pal.base, 0.24), 1.4)([cx + 10, cy - ry * 0.44], [cx + 15, cy - ry * 0.78], [cx + 17, cy - ry * 0.98], 6.5, 1.5);
  } else if (motif === 'clubs') {
    motifs =
      [0, 1, 2, 3]
        .map((i) => `<circle cx="${n(cx - 16 + i * 11)}" cy="${n(cy + 8 + (i % 2) * 6)}" r="4" fill="${darken(pal.base, 0.32)}" opacity="0.45"/>`)
        .join('') +
      `<path d="M ${n(cx - 18)} ${n(cy + 2)} Q ${n(cx)} ${n(cy + 12)} ${n(cx + 18)} ${n(cy + 2)}" fill="none" stroke="${darken(pal.base, 0.3)}" stroke-width="3" opacity="0.4" stroke-linecap="round"/>`;
  } else if (motif === 'sail') {
    motifs =
      [0, 1, 2, 3, 4]
        .map((i) => {
          const x = cx - 15 + i * 8;
          const h = 8 + Math.sin((i / 4) * Math.PI) * 9;
          return `<path d="M ${n(x - 3)} ${n(cy - 4)} L ${n(x)} ${n(cy - 4 - h)} L ${n(x + 3)} ${n(cy - 4)} Z" fill="${darken(pal.base, 0.26)}" opacity="0.5"/>`;
        })
        .join('');
  } else {
    // ridges (default): stacked chevrons
    motifs = [0, 1, 2, 3]
      .map((i) => {
        const y = cy - 18 + i * 11;
        const hw = bandY(y) * 0.7;
        return `<path d="M ${n(cx - hw)} ${n(y + 4)} L ${n(cx)} ${n(y - 4)} L ${n(cx + hw)} ${n(y + 4)}" fill="none" stroke="${darken(pal.base, 0.3)}" stroke-width="3" stroke-linecap="round" opacity="0.42"/>`;
      })
      .join('');
  }

  return (
    groundShadow(120, 44, 8) +
    part(shellPath, shell, 2.6) +
    `<g clip-path="url(#clipEgg)">` +
    `<ellipse cx="${n(cx + rx * 0.5)}" cy="${n(cy - ry * 0.2)}" rx="${n(rx * 0.9)}" ry="${n(ry * 0.95)}" fill="${darken(shell, 0.28)}" opacity="0.45"/>` +
    `<ellipse cx="${n(cx - rx * 0.3)}" cy="${n(cy + ry * 0.55)}" rx="${n(rx * 0.7)}" ry="${n(ry * 0.5)}" fill="${lighten(shell, 0.5)}" opacity="0.5"/>` +
    `${motifs}` +
    `</g>`
  );
}

// ============================================================
// Heads — local space, origin at the neck attachment, facing right
// ============================================================
const HEADS = {
  /** Generic theropod skull. opts: snout, depth, jawOpen, dental, crest, horns, brow */
  theropod(pal, o = {}) {
    const L = (o.snout ?? 52) * (o.slim ?? 1);
    const D = o.depth ?? 1;
    const dark = (t) => darken(pal.base, t);
    const upper = `M -14 ${n(-7 * D)} C -6 ${n(-18 * D)} 8 ${n(-19 * D)} 22 ${n(-11 * D)} L ${n(L * 0.82)} ${n(2 * D)} C ${n(L * 0.94)} ${n(4 * D)} ${n(L * 0.94)} ${n(9 * D)} ${n(L * 0.8)} ${n(9.5 * D)} L -9 ${n(9 * D)} C -15 ${n(6 * D)} -16 ${n(-1 * D)} -14 ${n(-7 * D)} Z`;
    const lower = `M -11 ${n(11 * D)} C 2 ${n(13.4 * D)} 21 ${n(13.2 * D)} 34 ${n(10 * D)} L ${n(L * 0.8)} ${n(9.4 * D)} C ${n(L * 0.78)} ${n(13.4 * D)} 36 ${n(16.4 * D)} 26 ${n(17.6 * D)} C 11 ${n(19.6 * D)} -3 ${n(17 * D)} -11 ${n(14 * D)} Z`;
    const teethRow = o.dental === false ? '' : teeth(-4, L * 0.55, 10 * D, o.dental ?? 6, 3.6 * D);
    const crest = o.crest
      ? T(dark(-0.18), 2)([-6, -16 * D], [2, -30 * D], [14, -26 * D], 12, 3)
      : '';
    const horns = o.horns
      ? T(dark(-0.05), 2)([6, -16 * D], [16, -26 * D], [22 + 3, -20 - 14], 8, 2) +
        T(dark(0.3), 1.8)([-2, -14 * D], [8, -24 * D], [14, -16 - 12 * D], 6.5, 2)
      : '';
    const brow = o.brow
      ? `<path d="M -2 ${n(-9 * D)} Q 8 ${n(-15 * D)} 18 ${n(-10 * D)}" fill="none" stroke="${dark(0.35)}" stroke-width="4" stroke-linecap="round"/>`
      : '';
    return (
      part(upper, pal.base) +
      part(lower, dark(0.16)) +
      `<g clip-path="url(#clipHead)">` +
      `<path d="M -18 ${n(-12 * D)} L ${n(L)} ${n(2 * D)}" stroke="${dark(0.32)}" stroke-width="${n(11 * D)}" opacity="0.5" fill="none"/>` +
      `<path d="M -8 ${n(12 * D)} L ${n(L * 0.7)} ${n(11 * D)}" stroke="${lighten(pal.base, 0.5)}" stroke-width="${n(6 * D)}" opacity="0.4" fill="none"/>` +
      `</g>` +
      `<path d="M -12 ${n(10.5 * D)} L ${n(L * 0.78)} ${n(9.6 * D)}" stroke="${OUTLINE}" stroke-width="1.6" opacity="0.7" fill="none"/>` +
      teethRow +
      crest +
      horns +
      brow +
      (o.nostril === false ? '' : `<ellipse cx="${n(L * 0.72)}" cy="${n(0.6 * D)}" rx="2.5" ry="1.6" fill="${OUTLINE}" opacity="0.75"/>`) +
      eye(o.eyeX ?? -3, o.eyeY ?? -4 * D, o.eyeR ?? 2.9, pal.iris, o.brow !== false)
    );
  },
  /** Pachycephalosaur dome */
  pachy(pal) {
    return (
      part(`M -14 -4 C -8 -14 6 -16 18 -10 L 34 -1 C 41 2 44 8 41 12 C 38 16 30 15 24 12 L -7 10 C -14 7 -17 2 -14 -4 Z`, pal.base) +
      part(`M -10 -10 C -2 -22 14 -24 26 -14 C 32 -9 32 -2 28 1 C 22 -6 10 -9 0 -7 C -6 -5 -10 -7 -10 -10 Z`, lighten(pal.base, 0.2), 2.2) +
      `<g clip-path="url(#clipHead)"><path d="M -16 -8 L 40 2" stroke="${darken(pal.base, 0.32)}" stroke-width="9" opacity="0.4" fill="none"/></g>` +
      [0, 1, 2].map((i) => `<circle cx="${n(-8 + i * 7)}" cy="${n(-9 + Math.abs(i - 1) * 2)}" r="2.6" fill="${darken(pal.base, 0.3)}" opacity="0.55"/>`).join('') +
      part(`M 37 2 C 44 4 47 10 44 13 C 41 16 35 14 32 11 C 35 8 36 5 37 2 Z`, darken(pal.base, 0.45), 1.8) +
      eye(-3, 1, 2.7, pal.iris)
    );
  },
  /** Ceratopsian: scalloped frill + configurable horn kit */
  ceratopsian(pal, o = {}) {
    const hornScale = o.hornScale ?? 1;
    const frill = lighten(pal.base, 0.12);
    const fr = o.frill ?? { rx: 28, ry: 31, cx: -5, cy: -20, bumps: 7, spikes: 0 };
    const face = `M -6 -16 C 6 -22 24 -19 34 -9 L 44 -2 C 50 2 50 10 44 13 C 34 18 14 18 2 12 C -6 8 -10 -2 -6 -16 Z`;
    const frillSpikes = fr.spikes
      ? Array.from({ length: fr.spikes }, (_, i) => {
          const a = Math.PI * 1.06 + (i / (fr.spikes - 1)) * 0.9;
          const bx = fr.cx + Math.cos(a) * fr.rx;
          const by = fr.cy + Math.sin(a) * fr.ry;
          const tipX = fr.cx + Math.cos(a) * (fr.rx + 13 * hornScale);
          const tipY = fr.cy + Math.sin(a) * (fr.ry + 13 * hornScale);
          return T(darken(pal.base, 0.2), 1.8)([bx, by], [(bx + tipX) / 2, (by + tipY) / 2], [tipX, tipY], 7.5, 1.6);
        }).join('')
      : '';
    const browHorns =
      o.horns === 'brow'
        ? T(darken(pal.base, 0.08), 2.2)([14, -22], [28, -34], [40, -30 - 20 * hornScale], 3.5 + 7 * hornScale, 1.7) +
          T(darken(pal.base, 0.32), 2)([4, -20], [16, -30], [26, -26 - 16 * hornScale], 3 + 6 * hornScale, 1.5)
        : '';
    const boss =
      o.horns === 'boss'
        ? part(`M 12 -24 C 20 -30 32 -28 36 -20 C 39 -13 33 -6 24 -7 C 15 -8 9 -16 12 -24 Z`, darken(pal.base, 0.18), 2.2)
        : '';
    return (
      frillSpikes +
      part(scalloped(fr.cx, fr.cy, fr.rx, fr.ry, fr.bumps), frill, 2.4) +
      `<ellipse cx="${n(fr.cx)}" cy="${n(fr.cy + 6)}" rx="${n(fr.rx * 0.6)}" ry="${n(fr.ry * 0.58)}" fill="${darken(pal.base, 0.24)}" opacity="0.28"/>` +
      [0, 1, 2, 3, 4]
        .map((i) => {
          const a = Math.PI * 1.16 + i * 0.34;
          return `<circle cx="${n(fr.cx + Math.cos(a) * fr.rx * 0.68)}" cy="${n(fr.cy + Math.sin(a) * fr.ry * 0.68)}" r="3.3" fill="${darken(pal.accent, 0.08)}" opacity="0.95"/>`;
        })
        .join('') +
      part(face, pal.base) +
      `<g clip-path="url(#clipHead)"><path d="M -8 -18 L 48 4" stroke="${darken(pal.base, 0.3)}" stroke-width="13" opacity="0.38" fill="none"/><path d="M 0 14 L 44 12" stroke="${lighten(pal.base, 0.5)}" stroke-width="7" opacity="0.32" fill="none"/></g>` +
      part(`M 38 -2 C 49 1 54 9 51 15 C 48 20 41 20 36 16 C 42 11 42 4 38 -2 Z`, darken(pal.base, 0.46), 2) +
      `<path d="M 39 0 C 45 4 47 10 45 15" stroke="${CREAM}" stroke-width="1.6" fill="none" opacity="0.5"/>` +
      (o.noseHorn === false
        ? ''
        : T(darken(pal.base, 0.24), 1.8)([32, -6], [36, -14], [37, -4 - 16 * hornScale], 2.5 + 4.5 * hornScale, 1.5)) +
      browHorns +
      boss +
      eye(14, -2, 3.1, pal.iris)
    );
  },
  /** Stegosaur: short deep skull with beak */
  stegosaur(pal) {
    return (
      part(`M -13 -8 C -4 -17 9 -17 17 -10 L 27 -3 C 33 1 34 8 29 11 C 24 14 12 13 4 10 L -7 7 C -13 4 -16 -2 -13 -8 Z`, pal.base) +
      `<g clip-path="url(#clipHead)"><path d="M -16 -10 L 32 -1" stroke="${darken(pal.base, 0.32)}" stroke-width="10" opacity="0.4" fill="none"/><path d="M -4 9 L 28 6" stroke="${lighten(pal.base, 0.5)}" stroke-width="6" opacity="0.32" fill="none"/></g>` +
      part(`M 25 1 C 32 3 34 9 31 12 C 28 15 22 13 20 10 C 23 7 24 4 25 1 Z`, darken(pal.base, 0.45), 1.8) +
      `<circle cx="6" cy="7" r="3.2" fill="${darken(pal.base, 0.36)}" opacity="0.5"/>` +
      eye(-2, 0, 2.7, pal.iris)
    );
  },
  /** Ankylosaur: wide flat skull with a beak and cheek horns */
  ankylosaur(pal, o = {}) {
    const w = o.width ?? 1;
    return (
      part(`M -16 -6 C -8 -14 6 -15 16 -9 L ${n(30 * w)} -2 C ${n(38 * w)} 1 ${n(40 * w)} 8 ${n(36 * w)} 11 C ${n(31 * w)} 15 18 13 8 10 L -8 8 C -15 6 -18 0 -16 -6 Z`, pal.base) +
      T(darken(pal.base, 0.3), 1.8)([-2, -10], [8, -18], [16, -12], 7, 2.5) +
      T(darken(pal.base, 0.3), 1.8)([-10, -7], [-2, -15], [5, -10], 6, 2.5) +
      `<g clip-path="url(#clipHead)"><path d="M -18 -8 L ${n(36 * w)} 1" stroke="${darken(pal.base, 0.32)}" stroke-width="9" opacity="0.4" fill="none"/></g>` +
      part(`M ${n(32 * w)} 2 C ${n(40 * w)} 4 ${n(42 * w)} 10 ${n(38 * w)} 13 C ${n(34 * w)} 16 28 13 26 10 C ${n(29 * w)} 7 ${n(31 * w)} 5 ${n(32 * w)} 2 Z`, darken(pal.base, 0.45), 1.8) +
      `<circle cx="4" cy="6" r="3" fill="${darken(pal.base, 0.34)}" opacity="0.5"/>` +
      eye(-3, 0, 2.6, pal.iris)
    );
  },
  /** Hadrosaur: duckbill with a crest kit */
  hadrosaur(pal, o = {}) {
    const crest = o.crest ?? 'flat';
    const tube =
      crest === 'tube'
        ? T(darken(pal.base, 0.12), 2.4)([6, -12], [-14, -27], [-36, -33], 15, 5)
        : '';
    const helmet =
      crest === 'flat'
        ? part(`M -14 -12 C -6 -24 10 -25 22 -16 C 27 -12 27 -6 24 -3 C 16 -10 2 -12 -8 -9 Z`, lighten(pal.base, 0.16), 2.2)
        : '';
    const spike =
      crest === 'thumb'
        ? T(darken(pal.base, 0.1), 2)([10, 8], [16, 2], [22, -4], 7, 2.2)
        : '';
    return (
      tube +
      helmet +
      part(`M -13 -7 C -5 -16 8 -17 18 -10 L 32 -2 C 39 1 42 7 38 11 C 34 15 24 14 16 11 L -6 9 C -13 6 -16 0 -13 -7 Z`, pal.base) +
      `<g clip-path="url(#clipHead)"><path d="M -16 -9 L 40 2" stroke="${darken(pal.base, 0.3)}" stroke-width="10" opacity="0.4" fill="none"/><path d="M -2 10 L 34 7" stroke="${lighten(pal.base, 0.5)}" stroke-width="5.5" opacity="0.34" fill="none"/></g>` +
      part(`M 30 1 C 40 3 43 10 39 13 C 35 17 26 15 24 11 C 27 8 29 5 30 1 Z`, darken(pal.base, 0.4), 1.9) +
      [[0, 0], [6, 1], [12, 3]].map(([dx, dy]) => `<circle cx="${n(30 + dx * 0.3)}" cy="${n(8 + dy)}" r="1.5" fill="${CREAM}" opacity="0.5"/>`).join('') +
      spike +
      eye(-3, -1, 2.7, pal.iris)
    );
  },
  /** Sauropod: small skull, optional nasal crest */
  sauropod(pal, o = {}) {
    const crest = o.crest
      ? part(`M 2 -12 C 6 -19 14 -21 18 -17 C 15 -13 12 -10 10 -8 C 7 -10 4 -11 2 -12 Z`, lighten(pal.base, 0.2), 2)
      : '';
    const len = o.snout ?? 40;
    return (
      crest +
      part(`M -12 -5 C -5 -13 6 -13 14 -8 L ${n(len * 0.72)} -4 C ${n(len * 0.92)} -2 ${n(len)} 2 ${n(len * 0.96)} 6 C ${n(len * 0.92)} 10 ${n(len * 0.8)} 11 27 10 L -5 9 C -12 7 -15 0 -12 -5 Z`, pal.base) +
      `<g clip-path="url(#clipHead)"><path d="M -14 -7 L ${n(len * 0.9)} 1" stroke="${darken(pal.base, 0.3)}" stroke-width="9" opacity="0.4" fill="none"/></g>` +
      `<ellipse cx="${n(len * 0.72)}" cy="0" rx="2.4" ry="1.6" fill="${OUTLINE}" opacity="0.75"/>` +
      eye(-4, 0, 2.6, pal.iris)
    );
  },
  /** Archaeopteryx: small toothed bird skull */
  bird(pal) {
    return (
      part(`M -11 -5 C -5 -13 6 -14 14 -8 L 30 -2 C 36 0 38 5 35 8 C 32 11 24 10 18 8 L -5 8 C -11 6 -14 0 -11 -5 Z`, pal.base) +
      `<g clip-path="url(#clipHead)"><path d="M -13 -7 L 34 1" stroke="${darken(pal.base, 0.3)}" stroke-width="8" opacity="0.4" fill="none"/></g>` +
      teeth(-2, 20, 6.5, 4, 3, CREAM) +
      eye(0, -2, 3, pal.iris)
    );
  },
  /** Spinosaur: long narrow crocodilian snout */
  spinosaur(pal, o = {}) {
    const L = o.snout ?? 62;
    return (
      part(`M -14 -6 C -6 -15 8 -16 20 -10 L ${n(L * 0.8)} -3 C ${n(L * 0.94)} -1 ${n(L * 0.96)} 4 ${n(L * 0.88)} 6 L -8 8 C -14 5 -16 0 -14 -6 Z`, pal.base) +
      part(`M -10 10 C 4 12 24 10 36 7 L ${n(L * 0.86)} 5 C ${n(L * 0.82)} 11 ${n(L * 0.7)} 14 26 15 C 12 17 -2 15 -10 13 Z`, darken(pal.base, 0.16)) +
      `<g clip-path="url(#clipHead)"><path d="M -18 -9 L ${n(L)} 0" stroke="${darken(pal.base, 0.32)}" stroke-width="10" opacity="0.45" fill="none"/></g>` +
      `<path d="M -11 8.5 L ${n(L * 0.86)} 6" stroke="${OUTLINE}" stroke-width="1.5" opacity="0.7" fill="none"/>` +
      teeth(-4, L * 0.6, 8, 9, 3.6) +
      `<ellipse cx="${n(L * 0.76)}" cy="-1" rx="2.6" ry="1.7" fill="${OUTLINE}" opacity="0.75"/>` +
      eye(-4, -3, 2.9, pal.iris)
    );
  },
};

// ============================================================
// Stage morphs
// ============================================================
const MORPHS = {
  child: { sx: 0.82, sy: 0.86, tail: 0.6, neck: 0.66, head: 1.34, feat: 0.34, leg: 0.9, detail: 0 },
  adult: { sx: 1, sy: 1, tail: 1, neck: 1, head: 1, feat: 1, leg: 1, detail: 1 },
  grown: { sx: 1.04, sy: 1.03, tail: 1.06, neck: 1.06, head: 1.05, feat: 1.3, leg: 1.02, detail: 2 },
};

// ============================================================
// Body plans — all authored facing right, feet on y=158
// ============================================================

/** Bipedal carnivore family: T-Rex, Allosaurus, Dilophosaurus, Carnotaurus, Albertosaurus, Spinosaurus, Baryonyx, Pachycephalosaurus */
function planTheropod(m, sp) {
  const pal = sp.pal;
  const o = sp.o || {};
  const { tail: tF, neck: nF, head: hF, feat, leg, detail } = m;
  const bulk = o.bulk ?? 1;
  const bulkY = o.bulkY ?? 1;
  const bodyCX = o.bodyCX ?? 118;
  const bodyCY = o.bodyCY ?? 98;
  const bodyRX = 34 * bulk;
  const bodyRY = 21 * bulkY;
  const tilt = o.tilt ?? -0.16;
  const bodyPath = oval(bodyCX, bodyCY, bodyRX, bodyRY, tilt);
  const hipX = bodyCX - bodyRX * 0.35;
  const chestX = bodyCX + bodyRX * 0.8;
  const tailBase = [hipX - bodyRX * 0.2, bodyCY - bodyRY * 0.4];
  const tailCtrl = o.tailCtrl ?? [tailBase[0] - 38, tailBase[1] - 14];
  const tailTip = o.tailTip ?? [tailBase[0] - 74, tailBase[1] + 22];
  // Neck rises steeply out of the shoulders, then the head leans forward over the chest.
  const neckBase = [chestX - 3, bodyCY - bodyRY * 0.68];
  const neckCtrl = o.neckCtrl ?? [neckBase[0] + 3, neckBase[1] - 20];
  const neckTop = o.neckTop ?? [neckBase[0] + 17, neckBase[1] - 36];
  const legLen = o.legLen ?? 1;
  // Digitigrade leg: thigh sweeps forward, shin tucks back to a planted foot.
  const legs = (side) => {
    const far = side === 'far';
    const dx = far ? -14 : 8;
    const c = far ? darken(pal.base, 0.3) : pal.base;
    const hip = [hipX + dx, bodyCY + bodyRY * 0.26];
    const knee = [hip[0] + 5, hip[1] + 26 * leg * legLen];
    const ankle = [hip[0] - 6, hip[1] + 48 * leg * legLen];
    return (
      tube(`M ${pt(hip)} Q ${pt([hip[0] - 3, hip[1] + 13 * leg])} ${pt(knee)}`, far ? 16 : 18.5, c) +
      tube(`M ${pt(knee)} Q ${pt([knee[0] - 4, knee[1] + 10 * leg])} ${pt(ankle)}`, far ? 9.5 : 11, darken(c, 0.07)) +
      foot(ankle[0] - 1, ankle[1] + 2, 13, darken(c, 0.12), CREAM)
    );
  };
  const sail = o.sail
    ? (() => {
        // Smooth spine-backed sail: one continuous arc along the back, no zig-zag.
        const pts = [];
        const steps = 12;
        for (let i = 0; i <= steps; i++) {
          const f = i / steps;
          const x = tailBase[0] + f * (neckBase[0] - tailBase[0]);
          const baseY = bodyCY - bodyRY * 0.82 + Math.sin(f * Math.PI) * 2;
          const h = Math.sin(f * Math.PI) * o.sail * (feat >= 1 ? 1 : 0.42);
          pts.push([x, baseY, h]);
        }
        let d = `M ${n(pts[0][0])} ${n(pts[0][1])} `;
        // Top edge: quadratic smoothing through the peak heights.
        for (let i = 1; i <= steps; i++) {
          const [px, py, ph] = pts[i - 1];
          const [x, y, h] = pts[i];
          d += `Q ${n((px + x) / 2)} ${n(Math.min(py - ph, y - h) - 4)} ${n(x)} ${n(y - h)} `;
        }
        for (let i = pts.length - 1; i >= 0; i--) d += `L ${n(pts[i][0])} ${n(pts[i][1])} `;
        d += 'Z';
        // Faint spar lines so the sail reads as support rays, not teeth.
        const rays = pts.filter((_, i) => i % 3 === 1 && i < steps - 1)
          .map(([x, y, h]) => `<path d="M ${n(x)} ${n(y)} L ${n(x)} ${n(y - h * 0.72)}" stroke="${darken(pal.accent, 0.35)}" stroke-width="1.4" opacity="0.4" fill="none"/>`)
          .join('');
        return part(d, darken(pal.accent, 0.05), 2.2) + rays;
      })()
    : '';
  const dorsal = o.dorsal && detail >= 2
    ? Array.from({ length: o.dorsal }, (_, i) => {
        const f = i / (o.dorsal - 1);
        const x = tailBase[0] + 6 + f * (neckBase[0] - tailBase[0] - 8);
        const y = bodyCY - bodyRY * 0.9 + Math.sin(f * Math.PI) * 1.5;
        return tapered(darken(pal.base, 0.34))([x, y], [x + 3, y - 8], [x + 1, y - 1], 8, 2);
      }).join('')
    : '';
  const armW = o.arms ?? 8;
  // Two-segment arm with a bent elbow so it reads as a limb, not a stub.
  const arm = o.arms === 0
    ? ''
    : (() => {
        const shoulder = [chestX - 6, bodyCY + bodyRY * 0.34];
        const elbow = [shoulder[0] + 4, shoulder[1] + 14];
        const wrist = [shoulder[0] + 13, shoulder[1] + 20];
        return (
          tube(`M ${pt(shoulder)} Q ${pt([shoulder[0] + 5, shoulder[1] + 8])} ${pt(elbow)}`, armW, darken(pal.base, 0.2)) +
          tube(`M ${pt(elbow)} Q ${pt([elbow[0] + 6, elbow[1] + 2])} ${pt(wrist)}`, armW * 0.72, darken(pal.base, 0.28)) +
          claws(wrist[0] + 4, wrist[1] + 3, 1, armW * 0.72, CREAM)
        );
      })();
  return (
    groundShadow(bodyCX - 2, 68 * bulk, 9) +
    legs('far') +
    T(darken(pal.base, 0.16))(tailBase, lerp(tailBase, tailCtrl, tF), lerp(tailBase, tailTip, tF), o.tailW ?? 30, 3) +
    (o.tailHorns
      ? T(darken(pal.base, 0.42), 1.8)([tailBase[0] + 4, tailBase[1] - 16], [tailBase[0] - 6, tailBase[1] - 30], [tailBase[0] - 12, tailBase[1] - 36], 6, 1.8)
      : '') +
    sail +
    dorsal +
    T(pal.base)(neckBase, lerp(neckBase, neckCtrl, nF), lerp(neckBase, neckTop, nF), o.neckW ?? 24, o.neckW2 ?? 15) +
    torso('clipTorso', bodyPath, ovalBox(bodyCX, bodyCY, bodyRX, bodyRY, tilt), pal) +
    legs('near') +
    arm +
    (o.scars && detail >= 2
      ? `<path d="M ${n(bodyCX - 14)} ${n(bodyCY + 6)} L ${n(bodyCX - 6)} ${n(bodyCY + 12)} M ${n(bodyCX - 10)} ${n(bodyCY + 2)} L ${n(bodyCX - 3)} ${n(bodyCY + 7)}" stroke="${darken(pal.base, 0.5)}" stroke-width="1.6" opacity="0.5" fill="none" stroke-linecap="round"/>`
      : '') +
    (o.backStripe && feat >= 1
      ? `<path d="M ${n(tailBase[0] + 4)} ${n(bodyCY - bodyRY * 0.9)} C ${n(bodyCX)} ${n(bodyCY - bodyRY * 1.1)} ${n(chestX - 6)} ${n(bodyCY - bodyRY * 0.9)} ${n(neckBase[0])} ${n(neckBase[1] - 4)}" fill="none" stroke="${pal.accent}" stroke-width="4" opacity="0.35" stroke-linecap="round"/>`
      : '') +
    (() => {
      const tip = lerp(neckBase, neckTop, nF);
      return `<g transform="translate(${n(tip[0] + (o.headDX ?? 2))} ${n(tip[1] + (o.headDY ?? 5))}) rotate(${o.headRot ?? -2}) scale(${n((o.headScale ?? 0.84) * hF)})">${HEADS[o.head](pal, o.headOpts || {})}</g>`;
    })()
  );
}

/** Raptor family: Velociraptor, Deinonychus, Utahraptor */
function planRaptor(m, sp) {
  const pal = sp.pal;
  const o = sp.o || {};
  const { tail: tF, neck: nF, head: hF, feat, leg, detail } = m;
  const bulk = o.bulk ?? 1;
  const bodyCX = 114;
  const bodyCY = 98;
  const bodyRX = 27 * bulk;
  const bodyRY = 17 * bulk;
  const bodyPath = oval(bodyCX, bodyCY, bodyRX, bodyRY, -0.1);
  const tailBase = [bodyCX - bodyRX * 0.8, bodyCY - 2];
  const tailCtrl = [tailBase[0] - 34, tailBase[1] - 10];
  const tailTip = [tailBase[0] - 76, tailBase[1] - 4];
  const hipX = bodyCX - bodyRX * 0.4;
  const feather = lighten(pal.base, 0.45);
  const fan = (() => {
    // Blade-like tail fan: feathers run back ALONG the tail from its midpoint, not upward.
    const count = detail >= 2 ? 6 : 5;
    let out = '';
    for (let i = 0; i < count; i++) {
      const f = i / (count - 1);
      const along = 0.34 + f * 0.52; // mount point along the tail
      const base = lerp(tailBase, lerp(tailCtrl, tailTip, tF), along);
      const tip = lerp(tailBase, lerp(tailCtrl, tailTip, tF), Math.min(1, along + 0.42));
      const len = 20 + Math.sin(f * Math.PI) * 9;
      const dir = unit([tip[0] - base[0], tip[1] - base[1]]);
      const perp = [-dir[1], dir[0]];
      const splay = (f - 0.5) * 14; // fan the tips vertically
      const end = [tip[0] + dir[0] * len * 0.4 + perp[0] * splay, tip[1] + dir[1] * len * 0.4 + perp[1] * splay];
      out += T(feather, 1.8)([base[0], base[1] - 3], [lerp(base, end, 0.55)[0], lerp(base, end, 0.55)[1] - 2], end, 6.5, 2);
    }
    return out;
  })();
  const legLen = o.legLen ?? 1;
  const legs = (side) => {
    const far = side === 'far';
    const dx = far ? -13 : 8;
    const c = far ? darken(pal.base, 0.32) : pal.base;
    const hip = [hipX + dx, bodyCY + bodyRY * 0.4];
    const knee = [hip[0] + 6, hip[1] + 22 * leg * legLen];
    const ankle = [hip[0] - 3, hip[1] + 45 * leg * legLen];
    return (
      tube(`M ${pt(hip)} Q ${pt([hip[0] - 4, hip[1] + 12])} ${pt(knee)}`, far ? 13 : 15 * bulk, c) +
      tube(`M ${pt(knee)} Q ${pt([knee[0] - 3, knee[1] + 10])} ${pt(ankle)}`, far ? 7 : 8.5, darken(c, 0.05)) +
      foot(ankle[0], ankle[1] + 2, 10, darken(c, 0.08), CREAM) +
      `<path d="M ${n(ankle[0] + 7)} ${n(ankle[1] - 1)} Q ${n(ankle[0] + 14)} ${n(ankle[1] - 2)} ${n(ankle[0] + 13)} ${n(ankle[1] + 8)}" fill="none" stroke="${CREAM}" stroke-width="2.6" stroke-linecap="round"/>`
    );
  };
  const neckBase = [bodyCX + bodyRX * 0.72, bodyCY - bodyRY * 0.6];
  const neckCtrl = [neckBase[0] + 8, neckBase[1] - 20];
  const neckTop = [neckBase[0] + 16, neckBase[1] - 37];
  const armX = bodyCX + bodyRX * 0.62;
  return (
    groundShadow(bodyCX - 2, 52 * bulk, 8) +
    legs('far') +
    fan +
    T(darken(pal.base, 0.18))(tailBase, lerp(tailBase, tailCtrl, tF), lerp(tailBase, tailTip, tF), 20 * bulk, 2.6) +
    T(pal.base)(neckBase, lerp(neckBase, neckCtrl, nF), lerp(neckBase, neckTop, nF), 16 * bulk, 11) +
    torso('clipTorso', bodyPath, ovalBox(bodyCX, bodyCY, bodyRX, bodyRY, -0.1), pal) +
    legs('near') +
    tube(`M ${n(armX)} ${n(bodyCY + bodyRY * 0.4)} Q ${n(armX + 9)} ${n(bodyCY + bodyRY * 0.9)} ${n(armX + 13)} ${n(bodyCY + bodyRY * 1.1)}`, 6.5, darken(pal.base, 0.1)) +
    [0, 1, 2, 3]
      .map((i) => T(feather, 1.6)([armX + i * 1.4, bodyCY + bodyRY * 0.3 + i * 3.2], [armX + 9 + i * 2.4, bodyCY + bodyRY * 0.4 + i * 3.6], [armX + 15 + i * 3, bodyCY + bodyRY * 0.7 + i * 4], 5, 1.8))
      .join('') +
    claws(armX + 15, bodyCY + bodyRY * 1.2, 1, 5.5, CREAM) +
    (detail >= 2
      ? T(lighten(pal.base, 0.35), 1.8)([neckBase[0] - 8, neckBase[1] - 4], [neckBase[0] - 2, neckBase[1] - 14], [neckBase[0] + 4, neckBase[1] - 22], 6, 2) +
        T(lighten(pal.base, 0.3), 1.8)([neckBase[0] - 12, neckBase[1] - 2], [neckBase[0] - 4, neckBase[1] - 8], [neckBase[0] + 4, neckBase[1] - 14], 5.5, 2)
      : '') +
    (() => {
      const tip = lerp(neckBase, neckTop, nF);
      return `<g transform="translate(${n(tip[0] + 1)} ${n(tip[1] + 3)}) rotate(${o.headRot ?? 6}) scale(${n((o.headScale ?? 0.74) * hF)})">${HEADS.theropod(pal, { ...(o.headOpts || {}), dental: 7, snout: 48, depth: 0.95 })}</g>`;
    })()
  );
}

/** Archaeopteryx: small toothed bird with wings and a feathered tail */
function planBird(m, sp) {
  const pal = sp.pal;
  const { tail: tF, neck: nF, head: hF, feat, leg, detail } = m;
  const bodyCX = 116;
  const bodyCY = 96;
  const bodyRX = 24;
  const bodyRY = 18;
  const bodyPath = oval(bodyCX, bodyCY, bodyRX, bodyRY, -0.18);
  const feather = lighten(pal.base, 0.5);
  const tailBase = [bodyCX - bodyRX * 0.8, bodyCY - 1];
  const tailTip = [tailBase[0] - 74, tailBase[1] + 26];
  // Wing: an overlapping blade-shaped feather group sweeping back from the shoulder —
  // wide at the base, tapered tips, layered two-tone so it reads as a folded wing.
  const wingFeathers = (() => {
    const ax = bodyCX + 3;
    const ay = bodyCY - bodyRY * 0.35;
    let out = '';
    const count = 5;
    for (let i = 0; i < count; i++) {
      const f = i / (count - 1);
      const ang = -0.22 + f * 0.72;
      const len = (34 + Math.sin(f * Math.PI) * 16) * (detail >= 2 ? 1.1 : 1);
      const tipX = ax - Math.cos(ang) * len;
      const tipY = ay + Math.sin(ang) * len;
      const c1 = [ax + (tipX - ax) * 0.45, ay + (tipY - ay) * 0.28 - 7];
      const c2 = [ax + (tipX - ax) * 0.72, ay + (tipY - ay) * 0.68 - 3];
      const fill = i % 2 ? feather : lighten(pal.base, 0.34);
      const w = 9.5 - f * 3;
      out += T(fill, 1.7)([ax + f * 3, ay - f * 2], c1, [tipX, tipY], w, 1.8);
    }
    // Wing coverts: short layered row over the feather roots.
    for (let i = 0; i < 3; i++) {
      const f = i / 2.4;
      out += T(lighten(pal.base, 0.6), 1.4)([ax - f * 6, ay + 2 + f * 4], [ax - f * 14, ay + 4 + f * 5], [ax - f * 22 - 4, ay + 6 + f * 7], 6.5, 1.6);
    }
    return out;
  })();
  const legs = (side) => {
    const dx = side === 'far' ? -9 : 6;
    const c = side === 'far' ? darken(pal.base, 0.32) : pal.base;
    const hip = [bodyCX - 6 + dx, bodyCY + bodyRY * 0.6];
    const knee = [hip[0] - 3, hip[1] + 22 * leg];
    const ankle = [hip[0] + 1, hip[1] + 42 * leg];
    return (
      tube(`M ${pt(hip)} Q ${pt([hip[0] - 5, hip[1] + 12])} ${pt(knee)}`, 11, c) +
      tube(`M ${pt(knee)} L ${pt(ankle)}`, 6.5, darken(c, 0.05)) +
      foot(ankle[0], ankle[1] + 2, 7.5, darken(c, 0.1), CREAM)
    );
  };
  const neckBase = [bodyCX + bodyRX * 0.7, bodyCY - bodyRY * 0.55];
  const neckTop = [neckBase[0] + 14, neckBase[1] - 26];
  return (
    groundShadow(bodyCX - 2, 40, 7) +
    legs('far') +
    T(darken(pal.base, 0.14))(
      tailBase,
      lerp(tailBase, [tailBase[0] - 34, tailBase[1] + 8], tF),
      lerp(tailBase, tailTip, tF),
      13,
      2.4
    ) +
    [0, 1, 2, 3]
      .map((i) => {
        const f = i / 3;
        const base = lerp(tailBase, lerp(tailBase, tailTip, tF), 0.42 + f * 0.5);
        return T(feather, 1.5)([base[0] + 3, base[1] - 3], [base[0] - 9, base[1] + 3], [base[0] - 16, base[1] + 9], 5.5, 1.8);
      })
      .join('') +
    T(pal.base)(neckBase, lerp(neckBase, [neckBase[0] + 8, neckBase[1] - 12], nF), lerp(neckBase, neckTop, nF), 11, 7.5) +
    torso('clipTorso', bodyPath, ovalBox(bodyCX, bodyCY, bodyRX, bodyRY, -0.18), pal) +
    wingFeathers +
    legs('near') +
    (() => {
      const tip = lerp(neckBase, neckTop, nF);
      return `<g transform="translate(${n(tip[0] + 1)} ${n(tip[1] - 1)}) rotate(-2) scale(${n(0.8 * hF)})">${HEADS.bird(pal)}</g>`;
    })()
  );
}

/** Ceratopsian family: Triceratops, Styracosaurus, Pachyrhinosaurus */
function planCeratopsian(m, sp) {
  const pal = sp.pal;
  const o = sp.o || {};
  const { tail: tF, neck: nF, head: hF, feat, leg, detail } = m;
  const hornScale = o.hornScaleFromFeat ? Math.max(0.35, Math.min(1.24, feat * 0.95)) : o.hornScale ?? 1;
  const bodyCX = 112;
  const bodyCY = 102;
  const bodyRX = 52;
  const bodyRY = 26;
  const bodyPath = oval(bodyCX, bodyCY, bodyRX, bodyRY, -0.02);
  const hindX = bodyCX - bodyRX * 0.45;
  const foreX = bodyCX + bodyRX * 0.62;
  const legs = (side) => {
    const far = side === 'far';
    const c = far ? darken(pal.base, 0.3) : pal.base;
    const set = far ? [[hindX - 13, bodyCY], [foreX - 13, bodyCY - 3]] : [[hindX, bodyCY + 2], [foreX, bodyCY - 1]];
    return set
      .map(([hx, hy]) => {
        const kneeY = hy + 24 * leg;
        const ankleY = hy + 58 * leg;
        return (
          tube(`M ${pt([hx, hy])} Q ${pt([hx - 3, hy + 12 * leg])} ${pt([hx - 1, kneeY])}`, 24, c) +
          tube(`M ${pt([hx - 1, kneeY])} L ${pt([hx - 2, ankleY])}`, 13.5, darken(c, 0.05)) +
          foot(hx - 2, ankleY, 15, darken(c, 0.08), CREAM)
        );
      })
      .join('');
  };
  const tailBase = [bodyCX - bodyRX * 0.86, bodyCY - 2];
  const neckBase = [bodyCX + bodyRX * 0.82, bodyCY - 6];
  const neckTip = () => lerp(neckBase, [neckBase[0] + 22, neckBase[1] + 8], nF);
  const nasal = o.nasal === 'horn';
  return (
    groundShadow(bodyCX, 78, 10) +
    legs('far') +
    T(darken(pal.base, 0.18))(tailBase, [tailBase[0] - 26, tailBase[1] + 2], lerp(tailBase, [tailBase[0] - 48, tailBase[1] + 16], tF), 25, 5) +
    T(pal.base)(neckBase, lerp(neckBase, [neckBase[0] + 14, neckBase[1] + 4], nF), neckTip(), 31, 25) +
    legs('near') +
    torso('clipTorso', bodyPath, ovalBox(bodyCX, bodyCY, bodyRX, bodyRY, -0.02), pal) +
    (detail >= 2
      ? `<path d="M ${n(bodyCX - 40)} ${n(bodyCY - 8)} C ${n(bodyCX - 20)} ${n(bodyCY - 18)} ${n(bodyCX + 18)} ${n(bodyCY - 18)} ${n(bodyCX + 42)} ${n(bodyCY - 6)}" fill="none" stroke="${pal.accent}" stroke-width="3.4" opacity="0.4" stroke-linecap="round"/>`
      : '') +
    (() => {
      const tip = neckTip();
      return `<g transform="translate(${n(tip[0] - 4)} ${n(tip[1] - 12)}) rotate(${o.headRot ?? -4}) scale(${n(0.84 * hF)})">${HEADS.ceratopsian(pal, { hornScale, horns: o.horns, noseHorn: nasal, frill: o.frill })}</g>`;
    })()
  );
}

/** Stegosaurus */
function planStegosaur(m, sp) {
  const pal = sp.pal;
  const { tail: tF, neck: nF, head: hF, feat, leg, detail } = m;
  const bodyCX = 110;
  const bodyCY = 100;
  const bodyRX = 54;
  const bodyRY = 28;
  const bodyPath = oval(bodyCX, bodyCY, bodyRX, bodyRY, -0.02);
  const plateFill = lighten(pal.base, 0.14);
  const plateSet = (sp.o?.plates ?? [[78, 20], [98, 30], [116, 34], [134, 27], [150, 18]]);
  const hindX = bodyCX - bodyRX * 0.42;
  const foreX = bodyCX + bodyRX * 0.6;
  const legs = (side) => {
    const far = side === 'far';
    const c = far ? darken(pal.base, 0.3) : pal.base;
    const set = far
      ? [[hindX - 12, bodyCY + 2, 20, 54], [foreX - 13, bodyCY - 2, 16, 50]]
      : [[hindX, bodyCY + 4, 22, 56], [foreX, bodyCY, 17, 52]];
    return set
      .map(([hx, hy, w, len]) => {
        const kneeY = hy + 20 * leg;
        const ankleY = hy + len * leg;
        return (
          tube(`M ${pt([hx, hy])} Q ${pt([hx - 3, hy + 10 * leg])} ${pt([hx - 1, kneeY])}`, w * 1.1, c) +
          tube(`M ${pt([hx - 1, kneeY])} L ${pt([hx - 2, ankleY])}`, w * 0.6, darken(c, 0.05)) +
          foot(hx - 2, ankleY, w * 0.72, darken(c, 0.1), CREAM)
        );
      })
      .join('');
  };
  const tailBase = [bodyCX - bodyRX * 0.86, bodyCY + 4];
  const tailTip = lerp(tailBase, [bodyCX - 104, bodyCY - 22], tF);
  const neckBase = [bodyCX + bodyRX * 0.82, bodyCY + 2];
  const neckTip = lerp(neckBase, [bodyCX + 76, bodyCY + 16], nF);
  return (
    groundShadow(bodyCX, 80, 10) +
    legs('far') +
    T(pal.base)(tailBase, lerp(tailBase, [tailBase[0] - 34, tailBase[1] - 10], tF), tailTip, 25, 4) +
    (() => {
      const base = lerp(tailBase, tailTip, 0.86);
      const s = feat >= 1 ? 1 : 0.4;
      return (
        T(darken(pal.base, 0.2), 2)([base[0] + 4, base[1] - 8], [base[0] - 4, base[1] - 16], [base[0] - 14 * s - 6, base[1] - 20 * s], 8 * s + 2, 1.6) +
        T(darken(pal.base, 0.2), 2)([base[0] - 4, base[1] - 1], [base[0] - 12, base[1] - 8], [base[0] - 20 * s - 10, base[1] - 12 * s], 7.5 * s + 2, 1.6) +
        T(darken(pal.base, 0.26), 1.8)([base[0] + 8, base[1] - 12], [base[0], base[1] - 20], [base[0] - 6 * s - 2, base[1] - 26 * s], 6.5 * s + 2, 1.5)
      );
    })() +
    T(pal.base)(neckBase, lerp(neckBase, [neckBase[0] + 14, neckBase[1] + 5], nF), neckTip, 22, 16) +
    legs('near') +
    torso('clipTorso', bodyPath, ovalBox(bodyCX, bodyCY, bodyRX, bodyRY, -0.02), pal) +
    (detail >= 2
      ? `<path d="M ${n(bodyCX - 34)} ${n(bodyCY - 10)} C ${n(bodyCX - 10)} ${n(bodyCY - 20)} ${n(bodyCX + 22)} ${n(bodyCY - 18)} ${n(bodyCX + 48)} ${n(bodyCY - 6)}" fill="none" stroke="${pal.accent}" stroke-width="4.5" opacity="0.4" stroke-linecap="round"/>`
      : '') +
    plateSet
      .map(([x, h]) => plate(x, bodyCY - bodyRY + Math.pow(x - bodyCX, 2) / 210 + h * 0.06, 15 + h * 0.34, h * feat, plateFill, darken(pal.accent, 0.3)))
      .join('') +
    `<g transform="translate(${n(neckTip[0] + 2)} ${n(neckTip[1] - 2)}) scale(${n(0.74 * hF)})">${HEADS.stegosaur(pal)}</g>`
  );
}

/** Ankylosaur family: Ankylosaurus, Euoplocephalus, Nodosaurus */
function planAnkylosaur(m, sp) {
  const pal = sp.pal;
  const o = sp.o || {};
  const { tail: tF, neck: nF, head: hF, feat, leg, detail } = m;
  const bodyCX = 112;
  const bodyCY = 106;
  const bodyRX = 56;
  const bodyRY = 21;
  const bodyPath = oval(bodyCX, bodyCY, bodyRX, bodyRY, 0.02);
  const armor = darken(pal.base, 0.22);
  const hindX = bodyCX - bodyRX * 0.45;
  const foreX = bodyCX + bodyRX * 0.6;
  const legs = (side) => {
    const far = side === 'far';
    const c = far ? darken(pal.base, 0.3) : pal.base;
    const set = far ? [[hindX - 12, bodyCY + 6], [foreX - 13, bodyCY + 4]] : [[hindX, bodyCY + 8], [foreX, bodyCY + 6]];
    return set
      .map(([hx, hy]) => {
        const kneeY = hy + 18 * leg;
        const ankleY = hy + 42 * leg;
        return (
          tube(`M ${pt([hx, hy])} Q ${pt([hx - 3, hy + 9 * leg])} ${pt([hx - 1, kneeY])}`, 23, c) +
          tube(`M ${pt([hx - 1, kneeY])} L ${pt([hx - 2, ankleY])}`, 13, darken(c, 0.05)) +
          foot(hx - 2, ankleY, 15, darken(c, 0.08), CREAM)
        );
      })
      .join('');
  };
  const tailBase = [bodyCX - bodyRX * 0.86, bodyCY - 1];
  const tailTip = lerp(tailBase, [bodyCX - 92, bodyCY + 8], tF);
  const club = o.club
    ? (() => {
        const c = tailTip;
        const r = (9 + 3 * feat) * (feat >= 1 ? 1 : 0.6);
        return (
          part(oval(c[0] - r * 0.2, c[1], r * 1.5, r, 0.15), darken(pal.base, 0.3), 2.4) +
          T(darken(pal.base, 0.34), 1.6)([c[0] - r, c[1] - r * 0.6], [c[0] - r * 1.5, c[1] - r * 0.9], [c[0] - r * 1.8, c[1] - r * 0.4], 6, 2)
        );
      })()
    : '';
  const rows = (() => {
    const bands = o.bands ?? 4;
    let out = '';
    for (let b = 0; b < bands; b++) {
      const f = b / (bands - 1);
      const x = bodyCX - bodyRX * 0.7 + f * bodyRX * 1.5;
      const count = 3;
      for (let i = 0; i < count; i++) {
        const y = bodyCY - bodyRY * 0.75 + i * bodyRY * 0.72;
        const r = (2.6 + (o.spikes ?? 1) * 1.1) * (feat >= 1 ? 1 : 0.55);
        out +=
          part(oval(x, y, r * 1.55, r * 0.72, 0.18), darken(pal.base, 0.26), 1.15) +
          `<ellipse cx="${n(x - r * 0.2)}" cy="${n(y - r * 0.28)}" rx="${n(r * 0.5)}" ry="${n(r * 0.26)}" fill="${lighten(pal.base, 0.5)}" opacity="0.24"/>` +
          (i === 0 || o.spikes === 2
            ? T(darken(pal.base, 0.38), 1.2)([x, y - r * 0.5], [x + 2, y - r * 1.9], [x + 1, y - r * 2.5], 4.6, 1.6)
            : '');
      }
    }
    return out;
  })();
  const neckBase = [bodyCX + bodyRX * 0.8, bodyCY - 3];
  const neckTip = lerp(neckBase, [neckBase[0] + 20, bodyCY - 5], nF);
  return (
    groundShadow(bodyCX, 82, 10) +
    legs('far') +
    T(darken(pal.base, 0.16))(tailBase, lerp(tailBase, [tailBase[0] - 40, tailBase[1] + 2], tF), tailTip, 24, o.club ? 12 : 5) +
    club +
    T(pal.base)(neckBase, lerp(neckBase, [neckBase[0] + 10, neckBase[1] + 2], nF), neckTip, 28, 22) +
    legs('near') +
    torso('clipTorso', bodyPath, ovalBox(bodyCX, bodyCY, bodyRX, bodyRY, 0.02), pal) +
    rows +
    (detail >= 2
      ? `<path d="M ${n(bodyCX - 42)} ${n(bodyCY - 10)} C ${n(bodyCX - 16)} ${n(bodyCY - 20)} ${n(bodyCX + 20)} ${n(bodyCY - 20)} ${n(bodyCX + 46)} ${n(bodyCY - 8)}" fill="none" stroke="${pal.accent}" stroke-width="3.4" opacity="0.4" stroke-linecap="round"/>`
      : '') +
    `<g transform="translate(${n(neckTip[0] + 1)} ${n(neckTip[1] - 1)}) scale(${n(0.68 * hF)})">${HEADS.ankylosaur(pal, { width: o.headWidth ?? 1 })}</g>`
  );
}

/** Hadrosaur family: Parasaurolophus, Edmontosaurus, Iguanodon */
function planHadrosaur(m, sp) {
  const pal = sp.pal;
  const o = sp.o || {};
  const { tail: tF, neck: nF, head: hF, feat, leg, detail } = m;
  const bipedal = o.bipedal ?? false;
  const bodyCX = 112;
  const bodyCY = 98;
  const bodyRX = 40;
  const bodyRY = 25;
  const bodyPath = oval(bodyCX, bodyCY, bodyRX, bodyRY, -0.06);
  const hindX = bodyCX - bodyRX * 0.5;
  const foreX = bodyCX + bodyRX * 0.62;
  const legs = (side) => {
    const far = side === 'far';
    const c = far ? darken(pal.base, 0.3) : pal.base;
    const out = [];
    if (!bipedal) {
      const set = far ? [[foreX - 12, bodyCY + 2, 17]] : [[foreX, bodyCY + 4, 18]];
      set      .forEach(([hx, hy, w]) => {
        const kneeY = hy + 22 * leg;
        const ankleY = hy + 54 * leg;
        out.push(
          tube(`M ${pt([hx, hy])} Q ${pt([hx - 3, hy + 11 * leg])} ${pt([hx - 1, kneeY])}`, w * 1.05, c) +
            tube(`M ${pt([hx - 1, kneeY])} L ${pt([hx - 2, ankleY])}`, w * 0.64, darken(c, 0.05)) +
            foot(hx - 2, ankleY, w * 0.72, darken(c, 0.08), CREAM)
        );
      });
    }
    const hx = far ? hindX - 12 : hindX;
    const hy = far ? bodyCY + 2 : bodyCY + 4;
    const kneeY = hy + 30 * leg;
    const ankleY = hy + 56 * leg;
    out.push(
      tube(`M ${pt([hx, hy])} Q ${pt([hx - 4, hy + 14 * leg])} ${pt([hx - 2, kneeY])}`, 24, c) +
        tube(`M ${pt([hx - 2, kneeY])} L ${pt([hx - 3, ankleY])}`, 13.5, darken(c, 0.05)) +
        foot(hx - 3, ankleY, 15, darken(c, 0.08), CREAM)
    );
    return out.join('');
  };
  const tailBase = [bodyCX - bodyRX * 0.84, bodyCY - 6];
  const neckBase = [bodyCX + bodyRX * 0.78, bodyCY - bodyRY * 0.6];
  const neckTip = () => lerp(neckBase, [neckBase[0] + 26, neckBase[1] - 22], nF);
  return (
    groundShadow(bodyCX, 72, 10) +
    legs('far') +
    T(darken(pal.base, 0.16))(tailBase, lerp(tailBase, [tailBase[0] - 40, tailBase[1] - 4], tF), lerp(tailBase, [tailBase[0] - 84, tailBase[1] + 16], tF), 26, 3) +
    T(pal.base)(neckBase, lerp(neckBase, [neckBase[0] + 14, neckBase[1] - 12], nF), neckTip(), 26, 16) +
    legs('near') +
    torso('clipTorso', bodyPath, ovalBox(bodyCX, bodyCY, bodyRX, bodyRY, -0.06), pal) +
    (detail >= 2
      ? `<path d="M ${n(bodyCX - 30)} ${n(bodyCY - 10)} C ${n(bodyCX - 8)} ${n(bodyCY - 20)} ${n(bodyCX + 16)} ${n(bodyCY - 18)} ${n(bodyCX + 34)} ${n(bodyCY - 8)}" fill="none" stroke="${pal.accent}" stroke-width="3.4" opacity="0.38" stroke-linecap="round"/>`
      : '') +
    (() => {
      const tip = neckTip();
      return `<g transform="translate(${n(tip[0] - 2)} ${n(tip[1] - 2)}) rotate(${o.headRot ?? -4}) scale(${n(0.76 * hF)})">${HEADS.hadrosaur(pal, { crest: o.crest })}</g>`;
    })()
  );
}

/** Sauropod family: Brachiosaurus (upright neck), Diplodocus (horizontal neck, whiplash tail) */
function planSauropod(m, sp) {
  const pal = sp.pal;
  const o = sp.o || {};
  const { tail: tF, neck: nF, head: hF, feat, leg, detail } = m;
  const bodyCX = 112;
  const bodyCY = 98;
  const bodyRX = o.bodyRX ?? 58;
  const bodyRY = o.bodyRY ?? 34;
  const bodyPath = oval(bodyCX, bodyCY, bodyRX, bodyRY, 0.01);
  const hindX = bodyCX - bodyRX * 0.42;
  const foreX = bodyCX + bodyRX * 0.56;
  const legs = (side) => {
    const far = side === 'far';
    const c = far ? darken(pal.base, 0.3) : pal.base;
    const set = far ? [[hindX - 13, bodyCY + 4], [foreX - 14, bodyCY + 2]] : [[hindX, bodyCY + 6], [foreX, bodyCY + 4]];
    return set
      .map(([hx, hy]) => {
        const kneeY = hy + 24 * leg;
        const ankleY = hy + 60 * leg;
        return (
          tube(`M ${pt([hx, hy])} Q ${pt([hx - 3, hy + 12 * leg])} ${pt([hx - 1, kneeY])}`, 28, c) +
          tube(`M ${pt([hx - 1, kneeY])} L ${pt([hx - 2, ankleY])}`, 17, darken(c, 0.04)) +
          foot(hx - 2, ankleY, 18, darken(c, 0.08), CREAM)
        );
      })
      .join('');
  };
  const tailBase = [bodyCX - bodyRX * 0.86, bodyCY - 6];
  const tailTip = lerp(tailBase, o.tailTip ?? [bodyCX - 118, bodyCY + 22], tF);
  const neckBase = [bodyCX + bodyRX * 0.72, bodyCY - bodyRY * 0.72];
  const neckCtrl = o.neckCtrl ?? [neckBase[0] + 26, neckBase[1] - 40];
  const neckTop = o.neckTop ?? [neckBase[0] + 42, neckBase[1] - 64];
  return (
    groundShadow(bodyCX, 86, 11) +
    legs('far') +
    T(darken(pal.base, 0.16))(tailBase, lerp(tailBase, [tailBase[0] - 34, tailBase[1] + 6], tF), tailTip, 26, o.whip ? 1.6 : 3.6) +
    (o.tailFeathers
      ? [0, 1, 2, 3].map((i) => T(lighten(pal.base, 0.4), 1.6)([tailTip[0] + i * 2, tailTip[1] + isOdd(i) * 2], [tailTip[0] - 10 - i * 2, tailTip[1] - 6 + i], [tailTip[0] - 18 - i * 3, tailTip[1] - 12 + i * 2], 5, 2)).join('')
      : '') +
    T(pal.base)(neckBase, lerp(neckBase, neckCtrl, nF), lerp(neckBase, neckTop, nF), o.neckW ?? 32, o.neckW2 ?? 12) +
    [0.3, 0.48, 0.66, 0.82]
      .map((f) => {
        const P1 = lerp(neckBase, neckTop, nF);
        const C = lerp(neckBase, neckCtrl, nF);
        const x = (1 - f) * (1 - f) * neckBase[0] + 2 * (1 - f) * f * C[0] + f * f * P1[0];
        const y = (1 - f) * (1 - f) * neckBase[1] + 2 * (1 - f) * f * C[1] + f * f * P1[1];
        const hw = (((o.neckW ?? 32) / 2) * (1 - f) + ((o.neckW2 ?? 12) / 2) * f) * 0.82;
        return `<path d="M ${n(x - hw)} ${n(y - hw * 0.5)} Q ${n(x)} ${n(y + hw * 0.45)} ${n(x + hw)} ${n(y - hw * 0.5)}" fill="none" stroke="${darken(pal.base, 0.34)}" stroke-width="1.7" opacity="0.32" stroke-linecap="round"/>`;
      })
      .join('') +
    legs('near') +
    torso('clipTorso', bodyPath, ovalBox(bodyCX, bodyCY, bodyRX, bodyRY, 0.01), pal) +
    (detail >= 2
      ? `<path d="M ${n(bodyCX - 46)} ${n(bodyCY - 16)} C ${n(bodyCX - 18)} ${n(bodyCY - 28)} ${n(bodyCX + 20)} ${n(bodyCY - 28)} ${n(bodyCX + 48)} ${n(bodyCY - 14)}" fill="none" stroke="${pal.accent}" stroke-width="4" opacity="0.35" stroke-linecap="round"/>` +
        [0, 1, 2, 3, 4]
          .map((i) => {
            const x = bodyCX - 40 + i * 20;
            const y = bodyCY - bodyRY + Math.pow(x - bodyCX, 2) / 240;
            return tapered(darken(pal.base, 0.3))([x, y], [x + 3, y - 8], [x + 1, y - 2], 7, 2);
          })
          .join('')
      : '') +
    (() => {
      const tip = lerp(neckBase, neckTop, nF);
      return `<g transform="translate(${n(tip[0] + 1)} ${n(tip[1] - 3)}) rotate(${o.headRot ?? -8}) scale(${n((o.headScale ?? 0.92) * hF)})">${HEADS.sauropod(pal, { crest: o.headCrest, snout: o.headSnout ?? 46 })}</g>`;
    })()
  );
}
const isOdd = (i) => (i % 2 === 0 ? 1 : -1);

const PLANS = {
  theropod: planTheropod,
  raptor: planRaptor,
  bird: planBird,
  ceratopsian: planCeratopsian,
  stegosaur: planStegosaur,
  ankylosaur: planAnkylosaur,
  hadrosaur: planHadrosaur,
  sauropod: planSauropod,
};

// ============================================================
// The 25-species roster
// ============================================================
const P = (base, accent, iris, belly) => ({ base, accent, iris, belly });

const ROSTER = [
  { ord: '01', id: 'no_excuses', slug: 'no-excuses', plan: 'theropod', egg: 'speckles',
    pal: P('#6E7A4A', '#A9603A', '#C9922F'),
    o: { head: 'theropod', headOpts: { snout: 52, depth: 1.06, dental: 6 }, bulk: 1.02, bulkY: 1.05, dorsal: 5, scars: true, backStripe: true } },
  { ord: '02', id: 'early_bird', slug: 'early-bird', plan: 'raptor', egg: 'bands',
    pal: P('#8A6A46', '#C0A468', '#D9A63C'),
    o: { bulk: 1, headScale: 0.8 } },
  { ord: '03', id: 'threepeat', slug: 'threepeat', plan: 'ceratopsian', egg: 'horns',
    pal: P('#77805C', '#B2703F', '#2A2119'),
    o: { horns: 'brow', hornScaleFromFeat: true, nasal: 'horn', frill: { rx: 28, ry: 31, cx: -5, cy: -20, bumps: 7 } } },
  { ord: '04', id: 'week_warrior', slug: 'week-warrior', plan: 'stegosaur', egg: 'plates',
    pal: P('#5F6B45', '#A85F33', '#2A2119'),
    o: {} },
  { ord: '05', id: 'fortnight_fighter', slug: 'fortnight-fighter', plan: 'sauropod', egg: 'bands',
    pal: P('#6B7A72', '#8E7B52', '#2A2119'),
    o: { headCrest: true, neckCrest: true } },
  { ord: '06', id: 'month_master', slug: 'month-master', plan: 'ankylosaur', egg: 'clubs',
    pal: P('#707B5E', '#B99A4E', '#2A2119'),
    o: { club: true, bands: 4, spikes: 2 } },
  { ord: '07', id: 'centurion', slug: 'centurion', plan: 'theropod', egg: 'speckles',
    pal: P('#7D6144', '#A9603A', '#D9A63C'),
    o: { head: 'theropod', headOpts: { snout: 50, depth: 0.92, brow: true, crest: true, dental: 7 }, bulk: 0.92, bulkY: 0.95, arms: 9, tailHorns: true, scars: true } },
  { ord: '08', id: 'brick_by_brick', slug: 'brick-by-brick', plan: 'theropod', egg: 'ridges',
    pal: P('#93805E', '#B99A4E', '#2A2119'),
    o: { head: 'pachy', bulk: 1.0, bulkY: 1.02, arms: 6.5, headScale: 0.82, neckW: 20, neckW2: 13, tailW: 26, tailCtrl: [64, 78], tailTip: [40, 96], backStripe: true } },
  { ord: '09', id: 'consistent_creature', slug: 'consistent-creature', plan: 'sauropod', egg: 'ridges',
    pal: P('#6D7A6C', '#8E7B52', '#2A2119'),
    o: {
      bodyRX: 54, bodyRY: 26,
      neckCtrl: [176, 66], neckTop: [220, 82], neckW: 22, neckW2: 11,
      whip: true, tailTip: [2, 92], tailW: 22,
      headScale: 0.72, headSnout: 42, headRot: 6, headDY: 0,
    } },
  { ord: '10', id: 'growth_spurt', slug: 'growth-spurt', plan: 'theropod', egg: 'sail',
    pal: P('#8A6244', '#B99A4E', '#D9A63C'),
    o: { head: 'theropod', headOpts: { snout: 46, depth: 0.82, crest: true, dental: 8 }, bulk: 0.82, bulkY: 0.86, neckW: 19, neckW2: 12, tailHorns: true } },
  { ord: '11', id: 'focus_mode', slug: 'focus-mode', plan: 'theropod', egg: 'speckles',
    pal: P('#8C5A3C', '#A9603A', '#D9A63C'),
    o: { head: 'theropod', headOpts: { snout: 42, depth: 1.1, horns: true, dental: 6 }, bulk: 0.95, bulkY: 1.05, arms: 5, tailHorns: true, neckW: 22, neckW2: 15 } },
  { ord: '12', id: 'project_pioneer', slug: 'project-pioneer', plan: 'raptor', egg: 'clubs',
    pal: P('#77665A', '#C0A468', '#D9A63C'),
    o: { bulk: 1.24, legLen: 0.96, headScale: 0.86 } },
  { ord: '13', id: 'idea_hatchling', slug: 'idea-hatchling', plan: 'bird', egg: 'ridges',
    pal: P('#96825C', '#A9603A', '#D9A63C'),
    o: {} },
  { ord: '14', id: 'calendar_keeper', slug: 'calendar-keeper', plan: 'hadrosaur', egg: 'bands',
    pal: P('#6F7C63', '#B99A4E', '#2A2119'),
    o: { crest: 'tube', headRot: -6 } },
  { ord: '15', id: 'report_ranger', slug: 'report-ranger', plan: 'ceratopsian', egg: 'horns',
    pal: P('#6C7550', '#A85F33', '#2A2119'),
    o: { horns: 'none', hornScaleFromFeat: true, nasal: 'horn', frill: { rx: 26, ry: 30, cx: -5, cy: -20, bumps: 6, spikes: 5 } } },
  { ord: '16', id: 'dna_researcher', slug: 'dna-researcher', plan: 'theropod', egg: 'sail',
    pal: P('#5F6F73', '#B99A4E', '#D9A63C'),
    o: { head: 'spinosaur', bulk: 1.0, bulkY: 1.0, sail: 26, arms: 9, tailW: 34, neckW: 24, neckW2: 16, headScale: 0.86 } },
  { ord: '17', id: 'expedition_starter', slug: 'expedition-starter', plan: 'theropod', egg: 'sail',
    pal: P('#61706B', '#C0A468', '#D9A63C'),
    o: { head: 'spinosaur', headOpts: { snout: 56 }, bulk: 0.92, sail: 0, arms: 11, neckW: 22, neckW2: 15, headScale: 0.8 } },
  { ord: '18', id: 'absolute_unit', slug: 'absolute-unit', plan: 'raptor', egg: 'speckles',
    pal: P('#7A6A56', '#C0A468', '#D9A63C'),
    o: { bulk: 1.1, legLen: 1.04, headScale: 0.82 } },
  { ord: '19', id: 'extinction_survivor', slug: 'extinction-survivor', plan: 'ceratopsian', egg: 'horns',
    pal: P('#767F5B', '#A85F33', '#2A2119'),
    o: { horns: 'boss', hornScaleFromFeat: true, nasal: false, frill: { rx: 25, ry: 28, cx: -5, cy: -18, bumps: 6 } } },
  { ord: '20', id: 'balance_seeker', slug: 'balance-seeker', plan: 'hadrosaur', egg: 'ridges',
    pal: P('#6B7752', '#B99A4E', '#2A2119'),
    o: { crest: 'thumb', bipedal: true, headRot: -2, neck: 'short' } },
  { ord: '21', id: 'night_owl', slug: 'night-owl', plan: 'hadrosaur', egg: 'ridges',
    pal: P('#79805F', '#8E7B52', '#2A2119'),
    o: { crest: 'flat', headRot: -5 } },
  { ord: '22', id: 'water_break', slug: 'water-break', plan: 'theropod', egg: 'speckles',
    pal: P('#6E5844', '#B99A4E', '#D9A63C'),
    o: { head: 'theropod', headOpts: { snout: 46, depth: 0.9, brow: true, dental: 7 }, bulk: 0.9, bulkY: 0.95, arms: 7, dorsal: 4 } },
  { ord: '23', id: 'move_more', slug: 'move-more', plan: 'ankylosaur', egg: 'clubs',
    pal: P('#6E7560', '#B99A4E', '#2A2119'),
    o: { club: true, bands: 5, spikes: 1, headWidth: 1.04 } },
  { ord: '24', id: 'mindful_one', slug: 'mindful-one', plan: 'ankylosaur', egg: 'ridges',
    pal: P('#6F6A58', '#8E7B52', '#2A2119'),
    o: { club: false, bands: 5, spikes: 1, headWidth: 0.9 } },
  { ord: '25', id: 'legendary', slug: 'legendary', plan: 'theropod', egg: 'speckles',
    pal: P('#8A6B3E', '#C49A45', '#E0B84A'),
    o: { head: 'theropod', headOpts: { snout: 54, depth: 1.12, dental: 6, nostril: true }, bulk: 1.12, bulkY: 1.1, dorsal: 6, arms: 9, backStripe: true, scars: true, headScale: 1.04 } },
];

// ============================================================
// Render
// ============================================================
function wrap(inner, clips) {
  const defs =
    `<defs>` +
    `<radialGradient id="gsh"><stop offset="0" stop-color="#000" stop-opacity="0.36"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    Object.entries(clips)
      .map(([id, d]) => `<clipPath id="${id}"><path d="${d}"/></clipPath>`)
      .join('') +
    `</defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180">${defs}${inner}</svg>`;
}

const HEAD_CLIP = 'M -40 -70 L 90 -70 L 90 40 L -40 40 Z';

function renderSpecimen(sp, stage) {
  if (stage === 'egg') {
    const cx = 120, cy = 118, rx = 31, ry = 39;
    const clip = `M ${n(cx - rx)} ${n(cy)} C ${n(cx - rx)} ${n(cy - ry * 0.86)} ${n(cx - rx * 0.55)} ${n(cy - ry)} ${n(cx)} ${n(cy - ry)} C ${n(cx + rx * 0.55)} ${n(cy - ry)} ${n(cx + rx)} ${n(cy - ry * 0.86)} ${n(cx + rx)} ${n(cy)} C ${n(cx + rx)} ${n(cy + ry * 0.82)} ${n(cx + rx * 0.5)} ${n(cy + ry)} ${n(cx)} ${n(cy + ry)} C ${n(cx - rx * 0.5)} ${n(cy + ry)} ${n(cx - rx)} ${n(cy + ry * 0.82)} ${n(cx - rx)} ${n(cy)} Z`;
    return wrap(eggArt(sp.pal, sp.egg), { clipEgg: clip });
  }
  const m = MORPHS[stage];
  const plan = PLANS[sp.plan];
  // Torso/tail/neck geometry differs per plan; collect clip paths the plan uses.
  const body = plan(m, sp);
  const torsoPath = TORSO_PATHS[sp.plan](sp);
  return wrap(`<g transform="translate(120 ${GROUND}) scale(${n(m.sx)} ${n(m.sy)}) translate(-120 -${GROUND})">${body}</g>`, {
    clipTorso: torsoPath,
    clipHead: HEAD_CLIP,
  });
}

// Plans expose their silhouette here so the shading clip matches exactly.
const TORSO_PATHS = {
  theropod: (sp) => {
    const o = sp.o || {};
    return oval(o.bodyCX ?? 118, o.bodyCY ?? 98, 34 * (o.bulk ?? 1), 21 * (o.bulkY ?? 1), o.tilt ?? -0.16);
  },
  raptor: (sp) => {
    const b = (sp.o || {}).bulk ?? 1;
    return oval(114, 98, 27 * b, 17 * b, -0.1);
  },
  bird: () => oval(116, 96, 20, 15, -0.18),
  ceratopsian: () => oval(112, 102, 52, 26, -0.02),
  stegosaur: () => oval(110, 100, 54, 28, -0.02),
  ankylosaur: () => oval(112, 106, 56, 21, 0.02),
  hadrosaur: () => oval(112, 98, 40, 25, -0.06),
  sauropod: (sp) => {
    const o = sp.o || {};
    return oval(112, 98, o.bodyRX ?? 58, o.bodyRY ?? 34, 0.01);
  },
};

// ============================================================
// Build + write
// ============================================================
const STAGE_FILES = { egg: 'egg', child: 'juvenile', adult: 'adult', grown: 'grown' };

const args = process.argv.slice(2);
const batchIdx = args.indexOf('--batch');
const batch = batchIdx >= 0 ? Number(args[batchIdx + 1]) : null;
const targets = batch
  ? ROSTER.filter((sp) => Math.floor((Number(sp.ord) - 1) / 5) + 1 === batch)
  : ROSTER;

if (batch && targets.length === 0) {
  console.error(`No species in batch ${batch} (valid: 1-5)`);
  process.exit(1);
}

const written = [];
for (const sp of targets) {
  const dir = join(OUT_DIR, sp.slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  for (const [stage, file] of Object.entries(STAGE_FILES)) {
    const svg = renderSpecimen(sp, stage);
    writeFileSync(join(dir, `${file}.svg`), svg);
    written.push({ sp, stage, file, bytes: svg.length, svg });
  }
}

// Preview gallery for the batch just generated
const stages = ['egg', 'child', 'adult', 'grown'];
const rows = targets
  .map(
    (sp) =>
      `<span class="lbl">${sp.ord} · ${sp.slug}</span>` +
      stages
        .map((st) => {
          const item = written.find((w) => w.sp === sp && w.stage === st);
          return `<div class="cell"><img src="data:image/svg+xml;utf8,${encodeURIComponent(item.svg)}"></div>`;
        })
        .join('')
  )
  .join('');

const gallery = `<!doctype html><html><head><meta charset="utf-8"><title>Dino artwork</title>
<style>
  body{background:#0C0B09;color:#D5CEBF;font:12px/1.4 system-ui;margin:0;padding:20px}
  h1{font:600 12px/1 system-ui;letter-spacing:.22em;text-transform:uppercase;color:#A69885;margin:0 0 14px}
  .grid{display:grid;grid-template-columns:150px repeat(4,1fr);gap:10px 14px;align-items:center}
  .lbl{font:500 10px/1.3 system-ui;letter-spacing:.1em;text-transform:uppercase;color:#8d8474}
  .cell{background:#14120E;border:1px solid #262019;border-radius:5px;height:178px;display:flex;align-items:flex-end;justify-content:center;padding:6px}
  .cell img{width:100%;height:100%;object-fit:contain;object-position:bottom;display:block}
  .mini{height:124px}
</style></head><body>
<h1>${batch ? `Batch ${batch}` : 'Full roster'} — ${targets.length} species x 4 stages (178px)</h1>
<div class="grid"><span class="lbl"></span>${stages.map((s) => `<span class="lbl">${s.toUpperCase()}</span>`).join('')}${rows}</div>
<h1 style="margin-top:24px">In-card size (124px)</h1>
<div class="grid"><span class="lbl"></span>${stages.map((s) => `<span class="lbl">${s.toUpperCase()}</span>`).join('')}${targets
  .map(
    (sp) =>
      `<span class="lbl">${sp.ord} · ${sp.slug}</span>` +
      stages
        .map((st) => {
          const item = written.find((w) => w.sp === sp && w.stage === st);
          return `<div class="cell mini"><img src="data:image/svg+xml;utf8,${encodeURIComponent(item.svg)}"></div>`;
        })
        .join('')
  )
  .join('')}</div>
</body></html>`;

if (!existsSync(dirname(GALLERY))) mkdirSync(dirname(GALLERY), { recursive: true });
writeFileSync(GALLERY, gallery);

// Compact roster sheet: adult + fully grown for every species in the roster
const sheetRows = ROSTER.map((sp) => {
  const adult = renderSpecimen(sp, 'adult');
  return (
    `<div class=c><span class=l>${sp.ord} · ${sp.slug}</span>` +
    `<img src="data:image/svg+xml;utf8,${encodeURIComponent(adult)}"></div>`
  );
}).join('');
const sheet = `<!doctype html><html><head><meta charset="utf-8"><title>Roster sheet</title><style>
  body{background:#0C0B09;margin:0;padding:16px;font:11px system-ui;color:#8d8474}
  h1{font:600 12px/1 system-ui;letter-spacing:.2em;text-transform:uppercase;color:#A69885;margin:0 0 12px}
  .g{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
  .c{background:#14120E;border:1px solid #262019;border-radius:6px;padding:8px}
  .l{display:block;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}
  img{width:100%;height:150px;object-fit:contain;object-position:bottom;display:block}
</style></head><body>
<h1>Roster sheet — adult stage</h1><div class=g>${sheetRows}</div></body></html>`;
writeFileSync(join(ROOT, '.freebuff', 'roster-sheet.html'), sheet);

console.log(`Wrote ${written.length} SVG assets across ${targets.length} species${batch ? ` (batch ${batch})` : ''}:`);
for (const w of written) console.log(`  ${w.sp.slug}/${w.file}.svg  (${w.bytes}b)`);
console.log(`Gallery: ${GALLERY}`);
