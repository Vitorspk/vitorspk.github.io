/* eslint-disable no-undef */
// Pre-render readable, accessible case diagrams. No runtime renderer or library.
// Edit content/case-visuals.json, then npm run build:visuals.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const visuals = JSON.parse(fs.readFileSync(path.join(root, 'content/case-visuals.json'), 'utf8'));
const check = process.argv.includes('--check');
const paths = {
    code: 'm8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18',
    layers: 'm12 3 10 5-10 5L2 8l10-5Zm-9 10 9 5 9-5M3 18l9 5 9-5',
    check: 'm5 12 4 4L19 6',
    branch: 'M6 3v12a4 4 0 0 0 4 4h7M6 8h7a4 4 0 0 0 4-4V3M4 3h4M15 3h4M15 17l3 2-3 2',
    cube: 'm12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10',
    cloud: 'M7 19a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1-1 11H7Z',
    activity: 'M2 12h5l3-9 4 18 3-9h5',
    shield: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4ZM8 12l3 3 5-6',
    cost: 'M20 5H4v14h16V5ZM8 9h.01M8 15h.01M12 9h5M12 15h5',
    database: 'M20 5c0 2-16 2-16 0s16-2 16 0ZM4 5v14c0 3 16 3 16 0V5M4 12c0 3 16 3 16 0',
    person: 'M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3',
    chip: 'M6 6h12v12H6V6Zm3 3h6v6H9V9ZM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
};
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = name => {
    if (!paths[name]) throw new Error('Unknown visual icon: ' + name);
    return '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + paths[name] + '"></path></svg>';
};
function render(visual) {
    if (visual.nodes.length !== 3) throw new Error('Expected three stages: ' + visual.id);
    const nodes = visual.nodes.map(node => '<div class="case-map-node">' + icon(node.icon) + '<strong>' + escape(node.label) + '</strong><span>' + escape(node.detail) + '</span></div>');
    const arrow = '<span class="case-map-arrow" aria-hidden="true">' + icon('arrow') + '</span>';
    return '<figure class="case-map" data-case-visual="' + visual.id + '" data-visual-area="' + visual.category + '">\n' +
        '<figcaption><span>Solution at a glance</span><strong>' + escape(visual.title) + '</strong></figcaption>\n' +
        '<div class="case-map-flow">\n' + nodes.join('\n' + arrow + '\n') + '\n</div>\n' +
        '<p class="case-map-note">' + escape(visual.note) + '</p>\n</figure>\n';
}
// Controlled markup contract: generated figures and header marks must not nest
// figures/spans; case-title text must match cardTitle with the decoded entities below.
const strip = source => source.replace(/\n?<span class="case-header-mark"[\s\S]*?<\/span>\n?/g, '').replace(/\n?<figure class="case-map" data-case-visual="[^"]*"[\s\S]*?<\/figure>\n?/g, '');
const outputs = new Map();
const indexPath = path.join(root, 'index.html');
const source = strip(fs.readFileSync(indexPath, 'utf8'));
const start = source.indexOf('<section id="cases"');
const end = source.indexOf('<section id="experience"');
if (start < 0 || end < start) throw new Error('Catalog boundaries not found');
const parts = source.slice(start, end).split(/(?=<(?:article|div) class="case-study" )/);
const used = new Set();
const catalog = parts.map((part, index) => {
    if (index === 0) return part;
    const heading = part.match(/class="case-title"[^>]*>([\s\S]*?)<\/h3>/);
    const title = heading && heading[1].replace(/<[^>]*>/g, '').trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const visual = visuals.find(item => item.cardTitle === title);
    if (!visual || used.has(visual.id)) throw new Error('Missing or duplicate catalog visual at ' + index);
    used.add(visual.id);
    const marker = '<span class="case-header-mark" data-visual-area="' + visual.category + '" aria-hidden="true">' + icon(visual.nodes[0].icon) + '</span>';
    return part.replace('<div class="case-header">', '<div class="case-header">\n' + marker + '\n').replace('<div class="case-body">', '<div class="case-body">\n' + render(visual));
}).join('');
if (used.size !== visuals.length) throw new Error('Unmatched visual definitions');
outputs.set(indexPath, source.slice(0, start) + catalog + source.slice(end));
for (const visual of visuals.filter(item => item.article)) {
    const file = path.join(root, 'cases', visual.article, 'index.html');
    const article = strip(fs.readFileSync(file, 'utf8'));
    if (!article.includes('<div class="doc-body">')) throw new Error('Article body not found: ' + file);
    outputs.set(file, article.replace('<div class="doc-body">', '<div class="doc-body">\n' + render(visual)));
}
let stale = false;
for (const [file, content] of outputs) {
    if (check) {
        if (fs.readFileSync(file, 'utf8') !== content) {
            process.stderr.write('Stale case visual: ' + path.relative(root, file) + '\n');
            stale = true;
        }
    } else fs.writeFileSync(file, content);
}
if (stale) process.exitCode = 1;
else process.stdout.write((check ? 'Verified ' : 'Rendered ') + visuals.length + ' catalog diagrams and ' + (outputs.size - 1) + ' article diagrams.\n');
