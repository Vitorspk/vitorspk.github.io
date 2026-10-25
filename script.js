// ─── Utilities ───────────────────────────────────────────────────────────────

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────

const TAB_DEFAULT = 'overview';
// Tracks the currently active tab — used by keyboard navigation to derive
// the current index without re-parsing location.hash (which may be stale
// when pushState=false, e.g., on initial load with no fragment).
let activeTab = TAB_DEFAULT;

// All DOM-dependent setup runs after the document is ready.
// tabNames is derived here (not at module level) so the code is safe if
// the script tag is ever moved to <head> with defer.
document.addEventListener('DOMContentLoaded', () => {
    // Derive tab order from the sidebar tablist buttons — HTML is the single
    // source of truth. Buttons (not panels) define the order so keyboard
    // Arrow/Home/End navigation matches the VISUAL order users see
    // (WCAG 2.4.3 Focus Order). The sidebar and mobile tablists must list
    // tabs in the same order. Adding a new tab to both tablists in
    // index.html automatically includes it here.
    const tabNames = Array.from(
        document.querySelectorAll('.sidebar-nav [role="tab"]'),
        b => b.dataset.tab
    );

    // Cache NodeLists once
    const navItems  = Array.from(document.querySelectorAll('.nav-item'));
    const mobTabs   = Array.from(document.querySelectorAll('.mobile-tab'));
    const tabPanels = Array.from(document.querySelectorAll('.tab-content'));

    // Evaluate once — used by activateTab (mobile auto-scroll) and barObserver
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ─── Localised UI strings ─────────────────────────────────────────────────
    // Longer prose (the platform explorer) is authored per page in a JSON block
    // (#platform-views-data); only these short, JS-generated strings live here,
    // keyed off <html lang>. English is the fallback for any unknown locale.
    const I18N = {
        en: {
            caseCount: (shown, total) => shown + ' of ' + total + ' case studies and projects',
            emailCopied: 'Email address copied.',
            emailCopyFail: addr => 'Copy unavailable. Please select ' + addr + ' above, or use Email Vitor.',
            themeToLight: 'Switch to light theme',
            themeToDark: 'Switch to dark theme',
            tenure: (years, months) => {
                const parts = [];
                if (years > 0) parts.push(years + (years === 1 ? ' year' : ' years'));
                if (months > 0) parts.push(months + (months === 1 ? ' month' : ' months'));
                return parts.length ? parts.join(' ') : 'less than a month';
            },
        },
        'pt-BR': {
            caseCount: (shown, total) => shown + ' de ' + total + ' estudos de caso e projetos',
            emailCopied: 'Endereço de e-mail copiado.',
            emailCopyFail: addr => 'Cópia indisponível. Selecione ' + addr + ' acima, ou use Enviar e-mail.',
            themeToLight: 'Mudar para o tema claro',
            themeToDark: 'Mudar para o tema escuro',
            tenure: (years, months) => {
                const parts = [];
                if (years > 0) parts.push(years + (years === 1 ? ' ano' : ' anos'));
                if (months > 0) parts.push(months + (months === 1 ? ' mês' : ' meses'));
                return parts.length ? parts.join(' e ') : 'menos de um mês';
            },
        },
        es: {
            caseCount: (shown, total) => shown + ' de ' + total + ' casos de estudio y proyectos',
            emailCopied: 'Dirección de correo copiada.',
            emailCopyFail: addr => 'Copia no disponible. Selecciona ' + addr + ' arriba, o usa Enviar correo.',
            themeToLight: 'Cambiar al tema claro',
            themeToDark: 'Cambiar al tema oscuro',
            tenure: (years, months) => {
                const parts = [];
                if (years > 0) parts.push(years + (years === 1 ? ' año' : ' años'));
                if (months > 0) parts.push(months + (months === 1 ? ' mes' : ' meses'));
                return parts.length ? parts.join(' y ') : 'menos de un mes';
            },
        },
    };
    const T = I18N[document.documentElement.getAttribute('lang')] || I18N.en;

    let activeFilter = 'all';

    // ─── activateTab ─────────────────────────────────────────────────────────

    function activateTab(tabName, pushState = true) {
        const name = tabName || TAB_DEFAULT;

        // Guard: if the tab is already active, skip the update and don't push a
        // duplicate history entry (clicking the active tab shouldn't add Back steps)
        if (name === activeTab && pushState) return;

        activeTab = name; // keep module-level tracker in sync

        // Sidebar nav items
        navItems.forEach(btn => {
            const isActive = btn.dataset.tab === name;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            btn.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // Mobile tab strip
        mobTabs.forEach(btn => {
            const isActive = btn.dataset.tab === name;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            btn.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // Content panels
        tabPanels.forEach(panel => {
            const isActive = panel.id === name;
            panel.classList.toggle('active', isActive);
            panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
            panel.inert = !isActive;
        });

        if (pushState) {
            const suffix = name === 'cases' && activeFilter !== 'all' ? '/' + activeFilter : '';
            history.pushState({ tab: name }, '', `#${name}${suffix}`);
        }

        // Scroll to the active panel (not the page top) so users land at the
        // beginning of the new content. .section-anchor on each panel provides
        // scroll-margin-top to clear the sticky header / mobile tab bar.
        if (pushState) {
            const panel = tabPanels.find(p => p.id === name);
            if (panel) {
                panel.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
        }

        // Auto-scroll the active mobile tab button into view so it's never
        // clipped off-screen after a tab switch (especially important for the
        // rightmost tabs on narrow viewports).
        const activeMobTab = mobTabs.find(b => b.dataset.tab === name);
        if (activeMobTab) {
            activeMobTab.scrollIntoView({
                block: 'nearest',
                inline: 'center',
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
            });
        }

        // Move focus to the active panel when the tab was activated by keyboard
        // within the tablist (not on URL load or programmatic navigation).
        // tabindex="-1" on panels allows programmatic focus without entering tab order.
        const focused = document.activeElement;
        if (focused && focused.closest('[role="tablist"]')) {
            const panel = tabPanels.find(p => p.id === name);
            if (panel) panel.focus();
        }
    }

    // ─── Delegated click handler ──────────────────────────────────────────────
    // Registered inside DOMContentLoaded so navItems/mobTabs/tabPanels are
    // guaranteed to be populated when a click fires.
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tab]');
        if (!btn) return;
        const tab = btn.dataset.tab;
        if (!tabNames.includes(tab)) return;
        activateTab(tab);
    });

    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.getElementById('main-content');
    if (skipLink && mainContent) skipLink.addEventListener('click', event => {
        event.preventDefault();
        mainContent.focus({ preventScroll: true });
        mainContent.scrollIntoView({ behavior: 'auto', block: 'start' });
    });

    // Resolve current and retired links from HTML, not a second navigation list.
    const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
    const catalogCases = Array.from(document.querySelectorAll('#cases .case-study'));
    const caseCount = document.getElementById('case-count');
    function filterCases(value) {
        const known = filterButtons.some(button => button.dataset.filter === value);
        activeFilter = known ? value : 'all';
        filterButtons.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter));
        });
        let shown = 0;
        catalogCases.forEach(study => {
            const matches = activeFilter === 'all' || study.dataset.category === activeFilter;
            study.hidden = !matches;
            if (matches) shown++;
        });
        if (caseCount) caseCount.textContent = T.caseCount(shown, catalogCases.length);
    }

    function restoreLocation() {
        const raw = location.hash.slice(1).trim();
        const [section, category] = raw.split('/');
        const aliasPanel = section && tabPanels.find(panel => (panel.dataset.legacy || '').split(' ').includes(section));
        const name = tabNames.includes(section) ? section : aliasPanel ? aliasPanel.id : TAB_DEFAULT;
        const aliasFilter = filterButtons.find(button => button.dataset.legacy === section);
        filterCases(name === 'cases' ? category || (aliasFilter && aliasFilter.dataset.filter) || 'all' : 'all');
        activateTab(name, false);
        // Canonicalize old links and invalid categories without an extra Back step.
        const canonical = '#' + name + (name === 'cases' && activeFilter !== 'all' ? '/' + activeFilter : '');
        if (raw && location.hash !== canonical) history.replaceState({ tab: name }, '', canonical);
    }

    window.addEventListener('popstate', restoreLocation);
    // Modern browsers fire popstate for fragment edits as well as traversal.
    // Listening to hashchange too would restore every traversal twice.
    restoreLocation();

    filterButtons.forEach(button => button.addEventListener('click', () => {
        if (button.dataset.filter === activeFilter) return;
        filterCases(button.dataset.filter);
        history.pushState({ tab: activeTab }, '', '#cases' + (activeFilter === 'all' ? '' : '/' + activeFilter));
    }));

    document.querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', () => {
        const target = document.getElementById(button.dataset.jump);
        if (!target) return;
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }));

    const copyEmail = document.getElementById('copy-email');
    const copyStatus = document.getElementById('copy-status');
    const emailLink = document.querySelector('#contact a[href^="mailto:"]');
    const emailAddress = emailLink ? emailLink.getAttribute('href').slice(7) : '';
    if (copyEmail && copyStatus && emailAddress) copyEmail.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(emailAddress);
            copyStatus.textContent = T.emailCopied;
        } catch {
            copyStatus.textContent = T.emailCopyFail(emailAddress);
        }
    });

    // The home explorer shows documented decisions, never simulated live status.
    // Content (incl. locale-correct case hrefs) is authored per page in the
    // #platform-views-data JSON block, so no prose lives in this shared script.
    let platformViews = {};
    const platformData = document.getElementById('platform-views-data');
    if (platformData) {
        try { platformViews = JSON.parse(platformData.textContent); } catch { platformViews = {}; }
    }
    const platformButtons = Array.from(document.querySelectorAll('[data-platform-view]'));
    platformButtons.forEach(button => button.addEventListener('click', () => {
        const view = platformViews[button.dataset.platformView];
        if (!view) return;
        platformButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        document.getElementById('platform-story-title').textContent = view.title;
        document.getElementById('platform-story-summary').textContent = view.summary;
        document.getElementById('platform-story-result').textContent = view.result;
        document.getElementById('platform-story-link').setAttribute('href', view.href);
        view.nodes.forEach((label, index) => {
            document.querySelector('[data-platform-node="' + index + '"]').textContent = label;
            document.querySelector('[data-platform-foundation="' + index + '"]').textContent = view.foundation[index];
            document.querySelector('[data-platform-detail="' + index + '"]').textContent = view.details[index];
        });
    }));

    // ─── Scroll to Top Button ─────────────────────────────────────────────────
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (scrollToTopBtn) {
        const onScroll = debounce(() => {
            scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
        }, 80);
        window.addEventListener('scroll', onScroll, { passive: true });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
    }

    // ─── Reading Progress Bar ─────────────────────────────────────────────────
    // rAF throttle is used here (instead of debounce) because the progress bar
    // is a purely visual element that should update as smoothly as possible —
    // locking updates to the paint cycle via rAF produces better visual fidelity
    // than a fixed debounce interval which may skip or batch frames.
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        let rafId = null;
        window.addEventListener('scroll', () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                const docH = document.documentElement.scrollHeight - window.innerHeight;
                const pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
                progressBar.style.width = pct + '%';
                rafId = null;
            });
        }, { passive: true });
    }

    // ─── Dual tablist inert/aria sync ─────────────────────────────────────────
    // sidebar-nav is visually hidden on mobile; mobile-tabs is hidden on desktop.
    // IMPORTANT CONTRACT: whichever nav is off-screen MUST stay inert + aria-hidden.
    // Without this, screen readers see two competing tablists pointing at the same panels.
    // syncTablists() is called on init and on every breakpoint crossing via matchMedia.
    const sidebarNav = document.querySelector('.sidebar-nav');
    const mobileNav  = document.querySelector('.mobile-tabs');

    if (sidebarNav && mobileNav) {
        const mq = window.matchMedia('(max-width: 768px)');
        // A breakpoint can hide the focused parent before matchMedia runs.
        // Remember focus intent, but clear it when the user targets another control.
        let themeHadFocus = false;
        const rememberThemeFocus = event => {
            themeHadFocus = Boolean(event.target.closest('#themeToggle'));
        };
        document.addEventListener('focusin', rememberThemeFocus);
        document.addEventListener('pointerdown', rememberThemeFocus);

        const syncTablists = function syncTablists() {
            const isMobile = mq.matches;
            const themeControl = document.getElementById('themeToggle');
            const themeContainer = document.querySelector(isMobile ? '.topbar' : '.brand-controls');
            if (themeControl && themeContainer && themeControl.parentElement !== themeContainer) {
                const hadFocus = document.activeElement === themeControl || themeHadFocus;
                themeContainer.appendChild(themeControl);
                if (hadFocus) themeControl.focus({ preventScroll: true });
            }

            sidebarNav.inert = isMobile;
            mobileNav.inert  = !isMobile;
            sidebarNav.setAttribute('aria-hidden', isMobile ? 'true' : 'false');
            mobileNav.setAttribute('aria-hidden', isMobile ? 'false' : 'true');

            // Update aria-labelledby on panels to point to the VISIBLE tablist's
            // button IDs — sidebar IDs on desktop, mobile IDs on mobile.
            // This ensures aria-labelledby never references a hidden/inert element.
            tabPanels.forEach(panel => {
                const tabName = panel.id;
                const labelId = isMobile
                    ? `mobile-tab-${tabName}`
                    : `tab-${tabName}`;
                panel.setAttribute('aria-labelledby', labelId);
            });
        };

        mq.addEventListener('change', syncTablists);
        syncTablists(); // set initial state
    }

    // ─── Keyboard Navigation (Arrow / Home / End) ─────────────────────────────
    const navContainers = [sidebarNav, mobileNav].filter(Boolean);

    navContainers.forEach(container => {
        container.addEventListener('keydown', (e) => {
            // Use module-level activeTab tracker — avoids stale location.hash
            // when pushState=false (e.g., initial load with no URL fragment)
            const idx = tabNames.indexOf(activeTab);
            const len = tabNames.length;
            let targetIdx = -1;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                targetIdx = (idx + 1) % len;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                targetIdx = (idx - 1 + len) % len;
            } else if (e.key === 'Home') {
                e.preventDefault();
                targetIdx = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                targetIdx = len - 1;
            }

            if (targetIdx < 0) return;
            activateTab(tabNames[targetIdx]);
            // Move focus to the newly active button so keyboard users keep their place
            const target = container.querySelector(`[data-tab="${tabNames[targetIdx]}"]`);
            if (target) target.focus();
        });
    });

    // ─── Case Study Collapse/Expand ─────────────────────────────────────────
    const caseStudies = Array.from(document.querySelectorAll('.case-study'));

    caseStudies.forEach(study => {
        const header = study.querySelector('.case-header');
        const body = study.querySelector('.case-body');
        if (!header || !body) return;

        // Initial state is set in HTML (aria-expanded="false") to avoid FOUC

        // Add chevron indicator
        const toggle = document.createElement('span');
        toggle.className = 'case-toggle';
        toggle.setAttribute('aria-hidden', 'true');
        toggle.textContent = '▼';
        header.appendChild(toggle);

        // Make header keyboard-accessible
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');
        const bodyId = 'case-body-' + caseStudies.indexOf(study);
        body.id = bodyId;
        header.setAttribute('aria-controls', bodyId);
        body.hidden = true;
        body.inert = true;

        const toggleCase = () => {
            const isExpanded = study.getAttribute('data-expanded') === 'true';
            const next = isExpanded ? 'false' : 'true';
            study.setAttribute('data-expanded', next);
            header.setAttribute('aria-expanded', next);
            body.hidden = isExpanded;
            body.inert = isExpanded;
        };

        header.addEventListener('click', event => {
            if (!event.target.closest('a')) toggleCase();
        });
        header.addEventListener('keydown', (e) => {
            if (e.target !== header) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCase();
            }
        });
    });

    // ─── Theme Toggle ─────────────────────────────────────────────────────────
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');

    if (themeToggle) {
        // Restore saved theme (default: dark)
        let saved = 'dark';
        try { saved = localStorage.getItem('theme') || 'dark'; } catch { /* Storage may be blocked. */ }
        applyTheme(saved);

        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            try { localStorage.setItem('theme', next); } catch { /* Theme still works without persistence. */ }
        });
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (themeIcon) themeIcon.textContent = theme === 'dark' ? '◐' : '◑';
        if (themeToggle) {
            themeToggle.setAttribute('aria-label',
                theme === 'dark' ? T.themeToLight : T.themeToDark
            );
        }
        // Update meta theme-color from the active CSS --bg-base value
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            const bgBase = getComputedStyle(document.documentElement).getPropertyValue('--bg-base').trim();
            meta.setAttribute('content', bgBase);
        }
    }

    // ─── Dynamic copyright year ──────────────────────────────────────────────
    const yearEl = document.getElementById('copyright-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ─── Dynamic tenure for the current ("Present") role ──────────────────────
    // Computes "X years Y months" from a data-tenure-since="YYYY-MM" attribute
    // so the current-role duration never goes stale. Falls back to the static
    // HTML text if the attribute is missing or malformed.
    document.querySelectorAll('[data-tenure-since]').forEach(tenureEl => {
        const since = tenureEl.dataset.tenureSince.split('-');
        const startYear = Number(since[0]);
        const startMonth = Number(since[1]);
        if (!startYear || !startMonth) return;
        const now = new Date();
        const months = (now.getFullYear() - startYear) * 12 + (now.getMonth() + 1 - startMonth);
        if (months < 0) return;
        const years = Math.floor(months / 12);
        const rem = months % 12;
        // months === 0 (start month == current month) → T.tenure returns a
        // "less than a month" label instead of leaving the static text.
        tenureEl.textContent = T.tenure(years, rem);
    });
});
