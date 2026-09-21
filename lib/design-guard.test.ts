/**
 * Design guard — fails when UI code bypasses the design tokens in
 * app/globals.css. This stands in for lint rules (`npm run lint` is broken on
 * Next 16). See docs/plans/design-standardization-2026-09.md and DESIGN.md.
 *
 * If a rule fires, use the token/primitive named in its message instead of
 * adding an exception. Exceptions live in IGNORED_FILES and need a reason.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['app', 'components', 'page-components'];

// Files that legitimately need raw values.
// next/og ImageResponse (opengraph-image / twitter-image) only understands
// inline styles and literal colours, so those files are skipped by name.
const OG_IMAGE_FILE = /(^|[\\/])(opengraph|twitter)-image\.tsx$/;
const IGNORED_FILES = new Set(
  [
    // The loader's tile palette is a self-contained illustration (left as-is by request).
    'components/ui/LoaderScreen.tsx',
  ].map((p) => p.replace(/\//g, path.sep)),
);

interface Rule {
  name: string;
  pattern: RegExp;
  fix: string;
  /** Directories (relative, posix) where the rule does not apply. */
  exceptIn?: string[];
}

const RULES: Rule[] = [
  { name: 'inline font-family', pattern: /fontFamily\s*:/, fix: 'use font-display / font-sans / font-wordmark' },
  { name: 'arbitrary font size', pattern: /\btext-\[\d+(\.\d+)?(px|rem|em)\]/, fix: 'use text-display/h1/h2/h3/title/lead or text-xs…xl' },
  { name: 'oversized preset font size', pattern: /\btext-(6xl|7xl|8xl|9xl)\b/, fix: 'use text-display or text-h1' },
  { name: 'no-op class', pattern: /\btext-md\b|\btext-wrap-balance\b/, fix: 'text-base / text-balance' },
  { name: 'arbitrary radius', pattern: /\brounded(-[a-z]{1,2})?-\[/, fix: 'use rounded-control / rounded-card / rounded-panel / rounded-full' },
  { name: 'off-scale radius', pattern: /\brounded(-[tblrse]{1,2})?-(lg|xl|2xl|3xl|4xl)\b/, fix: 'rounded-control (12px) / rounded-card (20px) / rounded-panel (28px)' },
  { name: 'arbitrary shadow', pattern: /\bshadow-\[/, fix: 'use shadow-soft / card / card-hover / elevated / glow-solar' },
  { name: 'untinted preset shadow', pattern: /(?<![\w-])shadow-(sm|md|lg|xl|2xl)\b/, fix: 'use shadow-soft / card / elevated (navy-tinted)' },
  { name: 'hex colour in class', pattern: /-\[#[0-9a-fA-F]{3,8}\]/, fix: 'use a colour token' },
  { name: 'hex/rgb literal', pattern: /['"`]#[0-9a-fA-F]{3,8}['"`]|\brgba?\(\s*\d/, fix: 'use a colour token or var(--color-…)' },
  { name: 'banned hue', pattern: /\b(purple|violet|indigo|fuchsia|pink)-\d{2,3}\b/, fix: 'purple is off-brand; use navy / solar / slate tones' },
  { name: 'second neutral family', pattern: /\b(gray|zinc|neutral|stone)-\d{2,3}\b/, fix: 'slate is the only neutral' },
  { name: 'amber duplicate', pattern: /\bamber-\d{2,3}\b/, fix: 'use the solar-* scale' },
  { name: 'low-contrast text', pattern: /(?<!(disabled|placeholder):)\btext-slate-(300|400)\b/, fix: 'text-fg-muted (slate-600) or text-fg-subtle (slate-500, white bg only)' },
  { name: 'unloaded or renamed font', pattern: /(?<![\w-])font-(serif|montserrat)\b/, fix: 'font-display / font-sans / font-wordmark' },
  { name: 'removed CSS utility', pattern: /\b(bg-warm|bg-warm-gold|glass|glass-light|blob-shape|blob-shape-2|animate-float-slow|animate-float-slower|animate-spin-slow|solar-panel-[a-z-]+|bg-dots-light|bg-solar-light|section-curve)\b/, fix: 'deleted from globals.css; use Section tone / tokens' },
  { name: 'arbitrary tracking', pattern: /\btracking-\[/, fix: 'use the eyebrow / caps utilities or tracking-tight/wide', exceptIn: ['components/ui'] },
  { name: 'internal <a href>', pattern: /<a\s[^>]*href=["']\/(?!\/|api\/)/, fix: 'use next/link (or <Button href>) so navigation stays client-side' },
];

function listTsx(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  return (readdirSync(abs, { recursive: true }) as string[])
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => path.join(dir, f));
}

interface Violation {
  file: string;
  line: number;
  rule: string;
  fix: string;
  text: string;
}

function scan(): Violation[] {
  const out: Violation[] = [];
  for (const file of SCAN_DIRS.flatMap(listTsx)) {
    if (IGNORED_FILES.has(file) || OG_IMAGE_FILE.test(file)) continue;
    const posix = file.split(path.sep).join('/');
    const lines = readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);
    lines.forEach((text, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(text)) return; // comments
      for (const rule of RULES) {
        if (rule.exceptIn?.some((d) => posix.startsWith(d + '/'))) continue;
        if (rule.pattern.test(text)) {
          out.push({ file: posix, line: i + 1, rule: rule.name, fix: rule.fix, text: text.trim().slice(0, 120) });
        }
      }
    });
  }
  return out;
}

describe('design guard', () => {
  test('UI code uses design tokens and primitives', () => {
    const violations = scan();
    const report = violations.map((v) => `${v.file}:${v.line}  [${v.rule}] → ${v.fix}\n    ${v.text}`).join('\n');
    expect(violations, `\n${violations.length} design-guard violation(s):\n${report}\n`).toHaveLength(0);
  });
});
