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

/** sha1 of a file's bytes, normalising CRLF so the stamp is OS-stable. */
function sha1File(file) {
  const buf = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return crypto.createHash('sha1').update(buf).digest('hex');
}

/** Which locales actually have a file on disk for this source page. */
function existingLocales(srcRel) {
  return LOCALES.filter((l) => fs.existsSync(pageFile(srcRel, l)));
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

/** Extract the sorted set of attribute values for a given attribute name. */
function attrSet(html, attr) {
  const re = new RegExp(`${attr}="([^"]+)"`, 'g');
  const set = new Set();
  let m;
  while ((m = re.exec(html)) !== null) set.add(m[1]);
  return [...set].sort();
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Parse the first application/ld+json Person/TechArticle block. */
function parseJsonLd(html) {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch (e) {
    return { __parseError: e.message };
  }
}

/**
 * Process one translated page: inject plumbing (or verify it in check mode).
 * Returns { changed, errors[] }.
 */
function processTranslatedPage(srcRel, locale, mode) {
  const file = pageFile(srcRel, locale);
  const srcFile = pageFile(srcRel, DEFAULT_LOCALE);
  const errors = [];
  const rel = path.posix.join(locale.dir, srcRel);

  let html = fs.readFileSync(file, 'utf8');
  const original = html;
  const present = existingLocales(srcRel);
  const currentSrcSha = sha1File(srcFile);

  // 1. <html lang="...">
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${locale.lang}">`);

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

  // 4. Source-hash stamp.
  const stampMatch = original.match(STAMP_RE);
  let stampSha = stampMatch ? stampMatch[1] : null;
  if (mode === 'restamp' || (mode === 'write' && !stampSha)) {
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

  // 7. JSON-LD sanity. The Person/TechArticle url varies by page (a résumé's
  // Person points at the locale home, not /resume.html), so we only require the
  // url to live under this locale's subtree — and inLanguage to match the lang.
  const ld = parseJsonLd(html);
  if (ld && !ld.__parseError) {
    const localeBase = `${ORIGIN}/${locale.dir ? locale.dir + '/' : ''}`;
    if (ld.url && !ld.url.startsWith(localeBase)) {
      errors.push(`${rel}: JSON-LD url "${ld.url}" is not under ${localeBase}`);
    }
    if (ld.inLanguage && ld.inLanguage !== locale.lang) {
      errors.push(`${rel}: JSON-LD inLanguage is "${ld.inLanguage}", expected "${locale.lang}"`);
    }
  } else if (ld && ld.__parseError) {
    errors.push(`${rel}: JSON-LD failed to parse (${ld.__parseError})`);
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
  return { changed, errors };
}

/** Regenerate sitemap.xml with per-page xhtml:link alternates. */
function buildSitemap(pages, mode) {
  const today = new Date().toISOString().slice(0, 10);
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
      lines.push('  <url>');
      lines.push(`    <loc>${pageUrl(srcRel, locale)}</loc>`);
      lines.push(`    <lastmod>${today}</lastmod>`);
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

  const pages = discoverSourcePages();
  const allErrors = [];
  let anyChanged = false;

  for (const srcRel of pages) {
    const en = processEnglishPage(srcRel, mode);
    allErrors.push(...en.errors);
    anyChanged = anyChanged || en.changed;

    for (const locale of TRANSLATED) {
      if (!fs.existsSync(pageFile(srcRel, locale))) continue;
      const res = processTranslatedPage(srcRel, locale, mode);
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
