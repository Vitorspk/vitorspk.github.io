/* eslint-disable no-console */
'use strict';

/*
 * build-i18n.js — shared plumbing generator for the multilingual site.
 *
 * English is authored at the repo root and is the single source of truth.
 * Each translated page is authored as its own committed file under pt/ and es/
 * (full prose, hand-translated — NOT a key/dictionary system). This script owns
 * only the shared, mechanical plumbing inside those files, so translators never
 * hand-maintain it and it can never drift out of sync:
 *
 *   1. A managed <head> block (self-referencing canonical + reciprocal hreflang
 *      alternates + x-default + og:url + og:locale) between the markers
 *        <!-- i18n:links:start --> ... <!-- i18n:links:end -->
 *   2. A managed language-switcher block between
 *        <!-- i18n:switcher:start --> ... <!-- i18n:switcher:end -->
 *   3. <html lang="..."> set to the locale's lang.
 *   4. A per-page source-hash stamp comment (locale files only)
 *        <!-- i18n:src-sha=<sha> src=<relpath> -->
 *      recording the English source SHA the translation was made from. CI fails
 *      (--check) if the English page changed and the translation was not
 *      refreshed + restamped — this is the anti-double-maintenance guard
 *      (same idea as content/resume-artifact.json's source SHA).
 *
 * It also:
 *   - regenerates sitemap.xml with xhtml:link alternates for every locale that
 *     actually exists on disk (hreflang is never emitted for a missing file —
 *     that would surface as errors in Search Console);
 *   - verifies parity: the set of id="" and data-tab="" values on each
 *     translated page must equal the English page's (catches a translator
 *     accidentally translating an id, a data-tab, or dropping a section);
 *   - verifies each translated page's JSON-LD url == its canonical and
 *     inLanguage == its lang.
 *
 * Modes:
 *   node scripts/build-i18n.js            write plumbing + sitemap in place
 *   node scripts/build-i18n.js --check    verify everything is in sync (CI gate)
 *   node scripts/build-i18n.js --restamp  update source-hash stamps to current
 *                                         English SHA (run deliberately AFTER
 *                                         retranslating a drifted page)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ORIGIN = 'https://vitorschiavo.dev';

// Locale registry. `dir: ''` is the English root. Order here is the order the
// hreflang alternates and the switcher links are emitted in.
const LOCALES = [
  { code: 'en', dir: '', lang: 'en', hreflang: 'en', ogLocale: 'en_US', label: 'EN', name: 'English', switchLabel: 'Language', default: true },
  { code: 'pt', dir: 'pt', lang: 'pt-BR', hreflang: 'pt-BR', ogLocale: 'pt_BR', label: 'PT', name: 'Português', switchLabel: 'Idioma' },
  { code: 'es', dir: 'es', lang: 'es', hreflang: 'es', ogLocale: 'es_ES', label: 'ES', name: 'Español', switchLabel: 'Idioma' },
];
const DEFAULT_LOCALE = LOCALES.find((l) => l.default);
const TRANSLATED = LOCALES.filter((l) => !l.default);

// Markers (kept identical across every page).
const LINKS = { start: '<!-- i18n:links:start -->', end: '<!-- i18n:links:end -->' };
const SWITCH = { start: '<!-- i18n:switcher:start -->', end: '<!-- i18n:switcher:end -->' };
const STAMP_RE = /<!-- i18n:src-sha=([a-f0-9]{40}) src=([^\s]+) -->/;

/**
 * Discover the English source pages (the translation originals).
 * @returns {string[]} repo-relative paths, e.g. 'index.html', 'cases/x/index.html'
 */
function discoverSourcePages() {
  const pages = ['index.html', 'resume.html'];
  const casesDir = path.join(ROOT, 'cases');
  for (const entry of fs.readdirSync(casesDir, { withFileTypes: true })) {
    if (entry.isDirectory() && fs.existsSync(path.join(casesDir, entry.name, 'index.html'))) {
      pages.push(path.posix.join('cases', entry.name, 'index.html'));
    }
  }
  return pages;
}

/** Map an English source page + locale to the served URL (trailing-slash aware). */
function pageUrl(srcRel, locale) {
  const dir = locale.dir ? locale.dir + '/' : '';
  if (srcRel === 'index.html') return `${ORIGIN}/${dir}`;
  if (srcRel === 'resume.html') return `${ORIGIN}/${dir}resume.html`;
  // cases/<slug>/index.html -> /<dir>cases/<slug>/
  const slug = srcRel.replace(/^cases\//, '').replace(/\/index\.html$/, '');
  return `${ORIGIN}/${dir}cases/${slug}/`;
}

/** Map an English source page + locale to the on-disk file path. */
function pageFile(srcRel, locale) {
  return locale.dir ? path.join(ROOT, locale.dir, srcRel) : path.join(ROOT, srcRel);
}

/** Blank out the generator-managed regions + stamp so plumbing churn on the
 *  English source (a new locale, a switcher tweak, a links-format change) does
 *  NOT falsely mark every translation stale. Only real content changes do. */
function stripManaged(html) {
  html = replaceBlock(html, LINKS, LINKS.start + LINKS.end).html;
  html = replaceBlock(html, SWITCH, SWITCH.start + SWITCH.end).html;
  return html.replace(STAMP_RE, '');
}

/** The source-hash a translation is stamped against: the English page's content
 *  with managed regions stripped, CRLF-normalised for OS stability. */
function hashSource(srcRel) {
  const raw = fs.readFileSync(pageFile(srcRel, DEFAULT_LOCALE), 'utf8').replace(/\r\n/g, '\n');
  return crypto.createHash('sha1').update(stripManaged(raw)).digest('hex');
}

/**
 * Rewrite internal case / résumé / home links on a translated page to the
 * locale version when that file exists on disk, else fall back to the English
 * path (which always exists). Idempotent: each case batch flips its own links
 * automatically, and nothing ever points at a page that isn't there yet.
 */
function localizeInternalLinks(html, locale) {
  const pick = (srcRel) => {
    const target = fs.existsSync(pageFile(srcRel, locale)) ? locale : DEFAULT_LOCALE;
    return pageUrl(srcRel, target).replace(ORIGIN, '') || '/';
  };
  // Case links in href="…" and in the "href": "…" platform JSON.
  html = html.replace(/(href=")\/(?:pt\/|es\/)?cases\/([a-z0-9-]+)\/(")/g,
    (_m, a, slug, b) => a + pick(`cases/${slug}/index.html`) + b);
  html = html.replace(/("href":\s*")\/(?:pt\/|es\/)?cases\/([a-z0-9-]+)\/(")/g,
    (_m, a, slug, b) => a + pick(`cases/${slug}/index.html`) + b);
  // Résumé page link.
  html = html.replace(/(href=")\/(?:pt\/|es\/)?resume\.html(")/g,
    (_m, a, b) => a + pick('resume.html') + b);
  // Home root and same-site home anchors (e.g. /#contact).
  html = html.replace(/(href=")\/(?:pt\/|es\/)?(#[a-z0-9-]+)?(")/g,
    (_m, a, frag, b) => a + pick('index.html') + (frag || '') + b);
  return html;
}

/** Fail if any internal href/src ("/…") on the page does not resolve on disk. */
function auditInternalLinks(html, rel, errors) {
  const re = /(?:href|src)="(\/[^"#?]*)/g;
  const seen = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    if (!m[1].startsWith('//')) seen.add(m[1]);
  }
  for (const p of seen) {
    const onDisk = p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1);
    if (!fs.existsSync(path.join(ROOT, onDisk))) {
      errors.push(`${rel}: internal link "${p}" does not resolve on disk (${onDisk})`);
    }
  }
}

/** Which locales actually have a file on disk for this source page. */
function existingLocales(srcRel) {
  return LOCALES.filter((l) => fs.existsSync(pageFile(srcRel, l)));
}

/** The page's real last-modified date (YYYY-MM-DD) from git, so <lastmod>
 *  reflects when the page actually changed rather than when the build ran.
 *  Falls back to today for an untracked file or when git is unavailable. */
function lastmodFor(srcRel, locale) {
  const rel = path.relative(ROOT, pageFile(srcRel, locale));
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', rel],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch (e) { /* untracked or no git — fall through */ }
  return new Date().toISOString().slice(0, 10);
}

/** Parse the #platform-views-data JSON block (the explorer's content). */
function extractPlatformViews(html) {
  const m = html.match(/<script type="application\/json" id="platform-views-data">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { return { __parseError: e.message }; }
}

/** Build the managed <head> links block for one page in one locale. */
function buildLinksBlock(srcRel, locale, present) {
  const lines = [LINKS.start];
  lines.push(`<link rel="canonical" href="${pageUrl(srcRel, locale)}">`);
  for (const l of present) {
    lines.push(`<link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(srcRel, l)}">`);
  }
  // x-default always points at the English version of this page.
  lines.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl(srcRel, DEFAULT_LOCALE)}">`);
  lines.push(`<meta property="og:url" content="${pageUrl(srcRel, locale)}">`);
  lines.push(`<meta property="og:locale" content="${locale.ogLocale}">`);
  for (const l of present) {
    if (l.code !== locale.code) {
      lines.push(`<meta property="og:locale:alternate" content="${l.ogLocale}">`);
    }
  }
  lines.push(LINKS.end);
  return lines.join('\n');
}

/** Build the managed language-switcher block for one page in one locale. */
function buildSwitcherBlock(srcRel, locale, present) {
  const lines = [SWITCH.start];
  // A labelled group, not a <nav> landmark: the switcher is rendered twice
  // (desktop sidebar + mobile topbar), and two navigation landmarks with the
  // same name would violate the unique-landmark rule. role="group" is announced
  // via aria-label but is not a landmark.
  lines.push(`<div class="lang-switcher" role="group" aria-label="${locale.switchLabel}">`);
  for (const l of present) {
    const current = l.code === locale.code;
    const href = pageUrl(srcRel, l).replace(ORIGIN, '') || '/';
    if (current) {
      lines.push(`<span class="lang-switcher__item lang-switcher__item--current" lang="${l.hreflang}" aria-current="true">${l.label}</span>`);
    } else {
      lines.push(`<a class="lang-switcher__item" lang="${l.hreflang}" hreflang="${l.hreflang}" href="${href}">${l.label}</a>`);
    }
  }
  lines.push('</div>');
  lines.push(SWITCH.end);
  return lines.join('\n');
}

/**
 * Replace the content of every start/end marker region with `block` (which
 * itself re-includes the markers). Scans left-to-right past each end marker, so
 * repeated regions (e.g. a switcher in both the desktop and mobile nav) are all
 * refreshed. Returns { html, count } — count 0 means the markers were absent.
 */
function replaceBlock(html, marker, block) {
  let result = '';
  let idx = 0;
  let count = 0;
  for (;;) {
    const s = html.indexOf(marker.start, idx);
    if (s === -1) { result += html.slice(idx); break; }
    const e = html.indexOf(marker.end, s);
    if (e === -1) { result += html.slice(idx); break; }
    result += html.slice(idx, s) + block;
    idx = e + marker.end.length;
    count++;
  }
  return { html: result, count };
}

/** Extract the sorted set of values for a given attribute name. Anchored so
 *  `id` does not also match `data-id`, `aria-labelledby`, etc. */
function attrSet(html, attr) {
  const re = new RegExp(`(?:^|\\s)${attr}="([^"]+)"`, 'g');
  const set = new Set();
  let m;
  while ((m = re.exec(html)) !== null) set.add(m[1]);
  return [...set].sort();
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Parse every application/ld+json block on the page. */
function parseJsonLdBlocks(html) {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  const blocks = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    try { blocks.push(JSON.parse(m[1])); } catch (e) { blocks.push({ __parseError: e.message }); }
  }
  return blocks;
}

/**
 * Process one translated page: inject plumbing (or verify it in check mode).
 * Returns { changed, errors[] }.
 */
function processTranslatedPage(srcRel, locale, mode, restampTarget) {
  const file = pageFile(srcRel, locale);
  const srcFile = pageFile(srcRel, DEFAULT_LOCALE);
  const errors = [];
  const rel = path.posix.join(locale.dir, srcRel);

  let html = fs.readFileSync(file, 'utf8');
  const original = html;
  const present = existingLocales(srcRel);
  const currentSrcSha = hashSource(srcRel);

  // 1. <html lang="...">
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${locale.lang}">`);

  // 1b. Point internal links at the locale page when it exists, else English.
  html = localizeInternalLinks(html, locale);

  // 2. Managed head links block (exactly one expected, in <head>).
  const linksRes = replaceBlock(html, LINKS, buildLinksBlock(srcRel, locale, present));
  if (linksRes.count === 0) {
    errors.push(`${rel}: missing ${LINKS.start} / ${LINKS.end} markers in <head>`);
  } else {
    html = linksRes.html;
  }

  // 3. Managed switcher block (one or more — desktop + mobile nav).
  const switcherRes = replaceBlock(html, SWITCH, buildSwitcherBlock(srcRel, locale, present));
  if (switcherRes.count === 0) {
    errors.push(`${rel}: missing ${SWITCH.start} / ${SWITCH.end} markers in <body>`);
  } else {
    html = switcherRes.html;
  }

  // 4. Source-hash stamp. --restamp updates it (optionally only for a targeted
  // locale code or page path); any non-check mode initialises a missing stamp.
  const stampMatch = original.match(STAMP_RE);
  let stampSha = stampMatch ? stampMatch[1] : null;
  const restampHit = mode === 'restamp' &&
    (!restampTarget || restampTarget === locale.code || restampTarget === rel);
  if (restampHit || (mode !== 'check' && !stampSha)) {
    stampSha = currentSrcSha;
  }
  const stampComment = `<!-- i18n:src-sha=${stampSha || currentSrcSha} src=${srcRel} -->`;
  if (stampMatch) {
    html = html.replace(STAMP_RE, stampComment);
  } else {
    // Insert right after <!DOCTYPE html>.
    html = html.replace(/(<!DOCTYPE html>)/i, `$1\n${stampComment}`);
  }

  // 5. Drift guard (check mode only): stored stamp must equal current source SHA.
  if (mode === 'check') {
    if (!stampMatch) {
      errors.push(`${rel}: no source-hash stamp — run "node scripts/build-i18n.js" then commit`);
    } else if (stampSha !== currentSrcSha) {
      errors.push(
        `${rel}: STALE — English source ${srcRel} changed since this page was translated.\n` +
        `        Retranslate it, then run "node scripts/build-i18n.js --restamp" and commit.`
      );
    }
  }

  // 6. Parity: id and data-tab value sets must match the English source.
  const srcHtml = fs.readFileSync(srcFile, 'utf8');
  for (const attr of ['id', 'data-tab']) {
    const a = attrSet(srcHtml, attr);
    const b = attrSet(html, attr);
    if (!arraysEqual(a, b)) {
      const missing = a.filter((v) => !b.includes(v));
      const extra = b.filter((v) => !a.includes(v));
      errors.push(
        `${rel}: ${attr} parity mismatch vs ${srcRel}` +
        (missing.length ? ` — missing: ${missing.join(', ')}` : '') +
        (extra.length ? ` — unexpected: ${extra.join(', ')}` : '')
      );
    }
  }

  // 7. JSON-LD sanity across every ld+json block. The Person/TechArticle url
  // varies by page (a résumé's Person points at the locale home, not
  // /resume.html), so we only require the url to live under this locale's
  // subtree — and inLanguage to match the lang.
  const localeBase = `${ORIGIN}/${locale.dir ? locale.dir + '/' : ''}`;
  for (const ld of parseJsonLdBlocks(html)) {
    if (ld.__parseError) {
      errors.push(`${rel}: JSON-LD failed to parse (${ld.__parseError})`);
      continue;
    }
    if (ld.url && !ld.url.startsWith(localeBase)) {
      errors.push(`${rel}: JSON-LD url "${ld.url}" is not under ${localeBase}`);
    }
    if (ld.inLanguage && ld.inLanguage !== locale.lang) {
      errors.push(`${rel}: JSON-LD inLanguage is "${ld.inLanguage}", expected "${locale.lang}"`);
    }
  }

  // 8. Platform-explorer JSON (home only): script.js silently falls back to {}
  // on a parse error, so validate it here instead — same keys and array shapes
  // as English, so a translator's typo fails CI rather than killing the explorer.
  if (srcRel === 'index.html') {
    const en = extractPlatformViews(srcHtml);
    const loc = extractPlatformViews(html);
    if (!loc) {
      errors.push(`${rel}: #platform-views-data block is missing`);
    } else if (loc.__parseError) {
      errors.push(`${rel}: #platform-views-data is invalid JSON (${loc.__parseError})`);
    } else if (en && !en.__parseError) {
      const ek = Object.keys(en).sort();
      const lk = Object.keys(loc).sort();
      if (ek.join(',') !== lk.join(',')) {
        errors.push(`${rel}: #platform-views-data keys ${lk.join(',')} differ from English ${ek.join(',')}`);
      } else {
        for (const k of ek) {
          for (const arr of ['nodes', 'foundation', 'details']) {
            if ((en[k][arr] || []).length !== (loc[k][arr] || []).length) {
              errors.push(`${rel}: #platform-views-data ${k}.${arr} length differs from English`);
            }
          }
        }
      }
    }
  }

  // 9. Dead-link guard (check mode): every internal href/src must resolve.
  if (mode === 'check') {
    auditInternalLinks(html, rel, errors);
  }

  const changed = html !== original;
  if (mode !== 'check' && changed && errors.length === 0) {
    fs.writeFileSync(file, html);
  }
  if (mode === 'check' && changed && errors.length === 0) {
    errors.push(`${rel}: plumbing is out of date — run "node scripts/build-i18n.js" and commit`);
  }
  return { changed, errors };
}

/** Refresh the managed head links block on the ENGLISH page (reciprocity). */
function processEnglishPage(srcRel, mode) {
  const file = pageFile(srcRel, DEFAULT_LOCALE);
  const errors = [];
  let html = fs.readFileSync(file, 'utf8');
  const original = html;
  const present = existingLocales(srcRel);

  // English only gets the managed head block + switcher when translations exist.
  // If markers are present we always keep them current; if absent and there are
  // no translations yet, that's fine (English can ship alone).
  if (html.includes(LINKS.start)) {
    html = replaceBlock(html, LINKS, buildLinksBlock(srcRel, DEFAULT_LOCALE, present)).html;
  }
  if (html.includes(SWITCH.start)) {
    html = replaceBlock(html, SWITCH, buildSwitcherBlock(srcRel, DEFAULT_LOCALE, present)).html;
  }

  const changed = html !== original;
  if (mode !== 'check' && changed) fs.writeFileSync(file, html);
  if (mode === 'check' && changed) {
    errors.push(`${srcRel}: plumbing is out of date — run "node scripts/build-i18n.js" and commit`);
  }
  // Audit internal links only on pages this script manages (index, résumé),
  // not the case pages (out of scope here, and they predate this work).
  if (mode === 'check' && html.includes(LINKS.start)) {
    auditInternalLinks(html, srcRel, errors);
  }
  return { changed, errors };
}

/** Regenerate sitemap.xml with per-page xhtml:link alternates. */
function buildSitemap(pages, mode) {
  const PRIORITY = (srcRel) => (srcRel === 'index.html' ? '1.0' : srcRel === 'resume.html' ? '0.7' : '0.9');
  const CHANGEFREQ = (srcRel) => (srcRel === 'index.html' ? 'weekly' : 'monthly');

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const srcRel of pages) {
    const present = existingLocales(srcRel);
    for (const locale of present) {
      // In check mode <lastmod> is normalised away before comparing, so use a
      // placeholder and skip the git lookups.
      const lastmod = mode === 'check' ? 'x' : lastmodFor(srcRel, locale);
      lines.push('  <url>');
      lines.push(`    <loc>${pageUrl(srcRel, locale)}</loc>`);
      lines.push(`    <lastmod>${lastmod}</lastmod>`);
      lines.push(`    <changefreq>${CHANGEFREQ(srcRel)}</changefreq>`);
      lines.push(`    <priority>${PRIORITY(srcRel)}</priority>`);
      // Only declare hreflang alternates when a page actually has more than one
      // locale — a single-locale page pointing hreflang at itself is redundant.
      if (present.length > 1) {
        for (const alt of present) {
          lines.push(`    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${pageUrl(srcRel, alt)}"/>`);
        }
        lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(srcRel, DEFAULT_LOCALE)}"/>`);
      }
      lines.push('  </url>');
    }
  }
  lines.push('</urlset>');
  lines.push('');
  const xml = lines.join('\n');

  const file = path.join(ROOT, 'sitemap.xml');
  // Compare ignoring the <lastmod> dates so a date-only diff doesn't fail CI.
  const normalise = (s) => s.replace(/<lastmod>[^<]*<\/lastmod>/g, '<lastmod/>');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const changed = normalise(current) !== normalise(xml);

  if (mode !== 'check') {
    if (changed || current !== xml) fs.writeFileSync(file, xml);
    return { changed, errors: [] };
  }
  return { changed, errors: changed ? ['sitemap.xml: out of date — run "node scripts/build-i18n.js" and commit'] : [] };
}

function main() {
  const arg = process.argv[2];
  const mode = arg === '--check' ? 'check' : arg === '--restamp' ? 'restamp' : 'write';
  // Optional --restamp target: a locale code ("pt") or a page path ("pt/index.html").
  const restampTarget = mode === 'restamp' ? (process.argv[3] || null) : null;

  const pages = discoverSourcePages();
  const allErrors = [];
  let anyChanged = false;

  for (const srcRel of pages) {
    const en = processEnglishPage(srcRel, mode);
    allErrors.push(...en.errors);
    anyChanged = anyChanged || en.changed;

    for (const locale of TRANSLATED) {
      if (!fs.existsSync(pageFile(srcRel, locale))) continue;
      const res = processTranslatedPage(srcRel, locale, mode, restampTarget);
      allErrors.push(...res.errors);
      anyChanged = anyChanged || res.changed;
    }
  }

  const sm = buildSitemap(pages, mode);
  allErrors.push(...sm.errors);
  anyChanged = anyChanged || sm.changed;

  if (mode === 'check') {
    if (allErrors.length) {
      console.error('i18n check FAILED:\n  - ' + allErrors.join('\n  - '));
      process.exit(1);
    }
    console.log('i18n check: OK (plumbing, parity, source-hash stamps and sitemap in sync).');
    return;
  }

  if (allErrors.length) {
    console.error('i18n ' + mode + ' hit errors (no partial writes for affected pages):\n  - ' + allErrors.join('\n  - '));
    process.exit(1);
  }
  console.log(`i18n ${mode}: done.${anyChanged ? '' : ' (nothing to change)'}`);
}

main();
