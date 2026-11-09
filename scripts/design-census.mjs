#!/usr/bin/env node
/**
 * Runtime design census — the rendered-page counterpart of
 * lib/design-guard.test.ts. Visits every public route at desktop (1280) and
 * mobile (375) widths against a running dev server and checks:
 *   - exactly one <h1> per page
 *   - every h1–h3 renders as a type token (display/h1/h2/h3/title/caps)
 *   - every <button>/button-styled link is a pill
 *   - no horizontal overflow at 375px
 *   - text contrast ≥ 4.5:1 (3:1 for large text) against its effective
 *     background (text over photos is skipped — check those by eye)
 *   - no console errors
 *
 * Usage:  node scripts/design-census.mjs [--base=http://localhost:3000] [--shots=dir]
 * Exit code 1 when any check fails. Report JSON is written next to the shots
 * (or to .design-census.json).
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const BASE = args.base || 'http://localhost:3000';
const SHOTS = typeof args.shots === 'string' ? path.resolve(args.shots) : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const STATIC_ROUTES = [
  '/', '/services', '/projects', '/products', '/calculator', '/locations', '/results',
  '/booking', '/booking/consultation', '/booking/site-assessment', '/booking/maintenance',
  '/this-page-does-not-exist',
];
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 812 },
];

// Runs in the page.
function measure() {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const blend = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
  };
  const isPhoto = (node) => {
    const s = getComputedStyle(node);
    return node.tagName === 'IMG' || node.tagName === 'VIDEO' || !!node.querySelector('img,video') ||
      (s.backgroundImage !== 'none' && s.backgroundImage.includes('url('));
  };
  // A page-level fixed photo (the home hero layer) sits behind any text whose
  // ancestors never reach an opaque background.
  const fixedPhoto = [...document.querySelectorAll('body *')].some((n) => getComputedStyle(n).position === 'fixed' && isPhoto(n));
  // Text drawn over a photo can't be scored from CSS alone — skip it (manual check).
  const overPhoto = (el) => {
    const r = el.getBoundingClientRect();
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage.includes('url(')) return true;
      if ((parse(s.backgroundColor)?.a ?? 0) >= 1) return false;
      for (const sib of n.parentElement ? n.parentElement.children : []) {
        if (sib === n) continue;
        const ss = getComputedStyle(sib);
        if (!['absolute', 'fixed'].includes(ss.position) || !isPhoto(sib)) continue;
        const b = sib.getBoundingClientRect();
        if (b.left <= r.left + 1 && b.right >= r.right - 1 && b.top <= r.top + 1 && b.bottom >= r.bottom - 1) return true;
      }
    }
    return fixedPhoto;
  };
  // Effective background: walk up, compositing translucent layers, until opaque.
  const background = (el) => {
    let layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    let out = { r: 255, g: 255, b: 255, a: 1 };
    for (const l of layers.reverse()) out = blend(l, out);
    return out;
  };

  // Every heading must render as one of the type tokens (app/globals.css).
  const TOKENS = [
    { name: 'display', family: 'Poppins', weight: 900, em: -0.025 },
    { name: 'h1', family: 'Poppins', weight: 900, em: -0.02 },
    { name: 'h2', family: 'Poppins', weight: 800, em: -0.015 },
    { name: 'h3', family: 'Poppins', weight: 700, em: -0.01 },
    { name: 'title', family: 'Geist', weight: 600, em: 0 },
    { name: 'caps', family: 'Geist', weight: 600, em: 0.08 },
  ];
  const tokenFor = (s) => {
    const family = s.fontFamily.split(',')[0].replace(/"/g, '').trim();
    const weight = Number(s.fontWeight);
    const size = parseFloat(s.fontSize);
    const em = s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing) / size;
    const hit = TOKENS.find((t) => family.startsWith(t.family) && t.weight === weight && Math.abs(t.em - em) < 0.003);
    return { token: hit?.name ?? null, sig: `${family} w${weight} ${em.toFixed(3)}em` };
  };

  const out = { h1: 0, headings: [], buttons: [], contrast: [], overflowX: 0 };
  for (const el of document.querySelectorAll('h1,h2,h3')) {
    if (!visible(el)) continue;
    if (el.tagName === 'H1') out.h1++;
    const s = getComputedStyle(el);
    const { token, sig } = tokenFor(s);
    out.headings.push({ tag: el.tagName, text: el.textContent.trim().slice(0, 40), token, sig, size: Math.round(parseFloat(s.fontSize)) });
  }
  for (const el of document.querySelectorAll('button, a')) {
    if (!visible(el) || el.closest('[data-census-ignore]')) continue;
    const s = getComputedStyle(el);
    const filled = (parse(s.backgroundColor)?.a ?? 0) > 0.5;
    const bordered = s.borderStyle !== 'none' && parseFloat(s.borderWidth) >= 1;
    const r = el.getBoundingClientRect();
    const looksLikeButton = (filled || bordered) && r.height >= 32 && r.height <= 64 && parseFloat(s.paddingLeft) >= 12 && el.textContent.trim().length > 0;
    if (!looksLikeButton) continue;
    const radius = parseFloat(s.borderTopLeftRadius);
    out.buttons.push({ text: el.textContent.trim().slice(0, 30), pill: radius >= r.height / 2 - 1, radius: s.borderTopLeftRadius });
  }
  const seen = new Set();
  for (const el of document.querySelectorAll('p, span, a, li, label, button, h1, h2, h3, h4, td, th, dd, dt')) {
    if (!visible(el)) continue;
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (text.length < 2) continue;
    if (overPhoto(el)) continue;
    const s = getComputedStyle(el);
    const fg = parse(s.color);
    const bg = background(el);
    if (!fg || !bg) continue;
    const color = blend(fg, bg);
    const [l1, l2] = [lum(color), lum(bg)].sort((a, b) => b - a);
    const ratio = (l1 + 0.05) / (l2 + 0.05);
    const size = parseFloat(s.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700);
    const min = large ? 3 : 4.5;
    if (ratio < min) {
      const key = `${text.slice(0, 30)}|${s.color}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.contrast.push({ text: text.slice(0, 40), ratio: Math.round(ratio * 100) / 100, min, color: s.color, tag: el.tagName });
    }
  }
  out.overflowX = document.documentElement.scrollWidth - window.innerWidth;
  return out;
}

const browser = await chromium.launch();
const failures = [];
const report = { base: BASE, pages: {} };

async function discover(page) {
  const found = [];
  for (const [route, prefix, depth] of [['/services', '/services/', 3], ['/locations', '/locations/', 3], ['/products', '/products/', 3]]) {
    try {
      await page.goto(BASE + route, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(4500);
      const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
      const hit = hrefs.find((h) => h && h.startsWith(prefix) && h.split('/').length === depth);
      if (hit) found.push(hit);
      if (hit && prefix === '/locations/') {
        await page.goto(BASE + hit, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(3000);
        const deep = (await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))).find((h) => h && h.startsWith(hit + '/'));
        if (deep) found.push(deep);
      }
    } catch (e) {
      console.warn(`discover ${route}: ${e.message}`);
    }
  }
  return found;
}

const probe = await (await browser.newContext()).newPage();
const routes = [...STATIC_ROUTES, ...(await discover(probe))];
console.log(`Routes: ${routes.join(', ')}`);

const offToken = new Map();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  for (const route of routes) {
    const id = `${route === '/' ? 'home' : route.slice(1).replace(/\//g, '__')}.${vp.name}`;
    const errors = [];
    const onConsole = (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); };
    page.on('console', onConsole);
    try {
      await page.goto(BASE + route, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(4500); // loader screen
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 150));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(800);
      const m = await page.evaluate(measure);
      m.consoleErrors = errors.filter((e) => !/Download the React DevTools|favicon|\[Fast Refresh\]|webpack-hmr|Failed to load resource.*(404|analytics)/i.test(e));
      report.pages[id] = m;

      const expect404 = route === '/this-page-does-not-exist';
      if (m.h1 !== 1) failures.push(`${id}: ${m.h1} <h1> elements (want 1)`);
      if (vp.name === 'mobile' && m.overflowX > 1) failures.push(`${id}: horizontal overflow ${m.overflowX}px`);
      for (const b of m.buttons.filter((b) => !b.pill)) failures.push(`${id}: non-pill button "${b.text}" (radius ${b.radius})`);
      for (const c of m.contrast) failures.push(`${id}: contrast ${c.ratio}:1 < ${c.min} on ${c.tag} "${c.text}" (${c.color})`);
      if (!expect404) for (const e of m.consoleErrors) failures.push(`${id}: console error ${e}`);
      if (vp.name === 'desktop') {
        for (const h of m.headings) {
          if (h.token) continue;
          const key = `${h.tag} ${h.sig}`;
          if (!offToken.has(key)) offToken.set(key, []);
          offToken.get(key).push(`${route} "${h.text}"`);
        }
      }
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${id}.png`), fullPage: true });
      console.log(`✓ ${id}`);
    } catch (e) {
      failures.push(`${id}: failed to load (${e.message})`);
    }
    page.off('console', onConsole);
  }
  await ctx.close();
}

for (const [key, where] of offToken) {
  failures.push(`off-token heading ${key} ×${where.length}, e.g. ${where.slice(0, 3).join('; ')}`);
}

report.failures = failures;
const reportPath = SHOTS ? path.join(SHOTS, 'census.json') : path.resolve('.design-census.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 1));
await browser.close();

console.log(`\n${failures.length ? `✗ ${failures.length} issue(s)` : '✓ all checks passed'} — report: ${reportPath}`);
for (const f of failures) console.log(`  - ${f}`);
process.exit(failures.length ? 1 : 0);
