/**
 * whatwhatboy Gaming Community - Main Script
 * Consolidated vanilla JS (no jQuery) for the entire site.
 *
 * Modules:
 *  1. Sidebar Navigation
 *  2. Game Search + Category Filter
 *  3. Hero Typing Animation
 *  4. Stats Counter Animation
 *  5. Scroll Effects (fade-in, back-to-top)
 *  6. FAQ Accordion
 *  7. FAQ Search
 *  8. Service Worker Registration
 *  9. Smooth Scroll
 * 10. Blog Category Filter
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initSearch();
    initHeroAnimations();
    initStatsCounters();
    initScrollEffects();
    initFaqAccordion();
    initFaqSearch();
    initBlogFilter();
    initSmoothScroll();
    initServiceWorker();
});

/* ==========================================================================
   1. Sidebar Navigation
   ========================================================================== */

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const mobileBtn = document.getElementById('mobile-sidebar-btn');
    const mainContent = document.getElementById('main-content');

    if (!sidebar) return;

    const STORAGE_KEY = 'sidebarCollapsed';
    let backdrop = null;

    // ---- helpers ----------------------------------------------------------

    /** Lazily create (or return existing) backdrop overlay for mobile. */
    const getBackdrop = () => {
        if (backdrop) return backdrop;
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', closeMobileSidebar);
        return backdrop;
    };

    const isMobile = () => window.innerWidth <= 768;

    // ---- desktop ---------------------------------------------------------

    const toggleDesktop = () => {
        sidebar.classList.toggle('collapsed');
        if (mainContent) mainContent.classList.toggle('sidebar-collapsed');
        localStorage.setItem(STORAGE_KEY, sidebar.classList.contains('collapsed'));
        updateToggleIcon();
    };

    const restoreDesktopState = () => {
        if (isMobile()) return;
        const collapsed = localStorage.getItem(STORAGE_KEY) === 'true';
        if (collapsed) {
            sidebar.classList.add('collapsed');
            if (mainContent) mainContent.classList.add('sidebar-collapsed');
        }
        updateToggleIcon();
    };

    // ---- mobile ----------------------------------------------------------

    const openMobileSidebar = () => {
        sidebar.classList.add('active');
        getBackdrop().classList.add('active');
        document.body.style.overflow = 'hidden';
        updateToggleIcon();
    };

    const closeMobileSidebar = () => {
        sidebar.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
        updateToggleIcon();
    };

    // ---- icon swap -------------------------------------------------------

    const updateToggleIcon = () => {
        const btn = toggle || mobileBtn;
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (!icon) return;

        const isOpen = isMobile()
            ? sidebar.classList.contains('active')
            : !sidebar.classList.contains('collapsed');

        icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    };

    // ---- event listeners -------------------------------------------------

    if (toggle) {
        toggle.addEventListener('click', () => {
            if (isMobile()) {
                sidebar.classList.contains('active')
                    ? closeMobileSidebar()
                    : openMobileSidebar();
            } else {
                toggleDesktop();
            }
        });
    }

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.contains('active')
                ? closeMobileSidebar()
                : openMobileSidebar();
        });
    }

    // Close mobile sidebar on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMobile() && sidebar.classList.contains('active')) {
            closeMobileSidebar();
        }
    });

    // Close mobile sidebar when a nav link is clicked (event delegation)
    sidebar.addEventListener('click', (e) => {
        if (isMobile() && e.target.closest('a')) {
            closeMobileSidebar();
        }
    });

    // Clean up mobile state when resizing to desktop
    window.addEventListener('resize', () => {
        if (!isMobile()) {
            closeMobileSidebar();
            restoreDesktopState();
        }
    });

    // Restore saved collapsed state on load
    restoreDesktopState();
}

/* ==========================================================================
   2. Game Search + Category Filter
   ========================================================================== */

function initSearch() {
    const searchInput = document.getElementById('gameSearch');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const gameCards = document.querySelectorAll('.game-card');

    if (!searchInput && filterBtns.length === 0) return;
    if (gameCards.length === 0) return;

    let activeCategory = 'all';

    /** Show / hide cards based on current search text and active category. */
    const filterCards = () => {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let visibleCount = 0;

        gameCards.forEach((card) => {
            const searchText = (card.dataset.search || card.textContent).toLowerCase();
            const category = card.dataset.category || '';

            const matchesSearch = !query || searchText.includes(query);
            const matchesCategory = activeCategory === 'all' || category === activeCategory;

            const show = matchesSearch && matchesCategory;
            card.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });

        // Toggle "no results" message
        const noResults = document.querySelector('.no-results');
        if (noResults) {
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', filterCards);
    }

    filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            filterBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.filter || 'all';
            filterCards();
        });
    });
}

/* ==========================================================================
   3. Hero Typing Animation
   ========================================================================== */

function initHeroAnimations() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;

    const fullText = heroTitle.dataset.text || heroTitle.textContent;

    // Reduced-motion / no data-text: show the title immediately, skip typing.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        heroTitle.textContent = fullText;
        return;
    }

    // Clear current content and set up cursor
    heroTitle.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';
    heroTitle.appendChild(cursor);

    let index = 0;
    const SPEED = 80;   // ms per character
    const DELAY = 500;  // initial delay before typing starts

    const typeChar = () => {
        if (index < fullText.length) {
            // Insert character before the cursor element
            heroTitle.insertBefore(
                document.createTextNode(fullText.charAt(index)),
                cursor
            );
            index++;
            setTimeout(typeChar, SPEED);
        }
    };

    setTimeout(typeChar, DELAY);
}

/* ==========================================================================
   4. Stats Counter Animation
   ========================================================================== */

function initStatsCounters() {
    const statElements = document.querySelectorAll('.stat h3');
    if (statElements.length === 0) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animated = false;

    /**
     * Resolve the target number and suffix for a stat element.
     *
     * Priority:
     *   1. Explicit data-target / data-suffix attributes (e.g. <h3 data-target="70" data-suffix="K+">0</h3>)
     *   2. A numeric text value like "70K+" or "1,000+"
     *   3. Non-numeric text ("Enhanced", "JTAG", ...) -> not animatable, left untouched.
     */
    const resolveStat = (el) => {
        if (el.dataset.target != null) {
            return {
                value: parseFloat(String(el.dataset.target).replace(/,/g, '')) || 0,
                suffix: el.dataset.suffix || ''
            };
        }
        const match = el.textContent.trim().match(/^([\d,.]+)\s*(.*)$/);
        if (!match) return null; // purely textual stat — don't animate or it becomes "0Enhanced"
        return {
            value: parseFloat(match[1].replace(/,/g, '')),
            suffix: match[2]
        };
    };

    const animateCounters = () => {
        if (animated) return;
        animated = true;

        const duration = 2000; // ms

        statElements.forEach((el) => {
            const stat = resolveStat(el);
            if (!stat) return; // leave non-numeric stats exactly as authored

            const { value: target, suffix } = stat;

            // Honor reduced-motion: jump straight to the final value.
            if (reduceMotion) {
                el.textContent = target + suffix;
                return;
            }

            const start = performance.now();

            const step = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // ease-out quad for a nice deceleration
                const eased = 1 - (1 - progress) * (1 - progress);
                const current = Math.floor(eased * target);
                el.textContent = current + suffix;

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = target + suffix;
                }
            };

            requestAnimationFrame(step);
        });
    };

    // Observe a parent section so counters fire when the stats area scrolls in
    const section = statElements[0].closest('section') || statElements[0].parentElement;
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.disconnect();
                }
            });
        },
        { threshold: 0.1 }
    );
    observer.observe(section);
}

/* ==========================================================================
   5. Scroll Effects (Fade-in + Back to Top)
   ========================================================================== */

function initScrollEffects() {
    // ---- Fade-in on scroll -----------------------------------------------

    const fadeEls = document.querySelectorAll('.fade-in');

    if (fadeEls.length > 0) {
        const fadeObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const el = entry.target;

                    // If the element uses staggered children, reveal them sequentially
                    if (el.classList.contains('fade-in-stagger')) {
                        Array.from(el.children).forEach((child, i) => {
                            child.style.transitionDelay = `${i * 0.1}s`;
                            child.classList.add('visible');
                        });
                    }

                    el.classList.add('visible');
                    fadeObserver.unobserve(el);
                });
            },
            { threshold: 0.1 }
        );

        fadeEls.forEach((el) => fadeObserver.observe(el));
    }

    // ---- Back to Top button -----------------------------------------------

    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }, { passive: true });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ==========================================================================
   6. FAQ Accordion
   ========================================================================== */

function initFaqAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length === 0) return;

    /** Smoothly expand an answer element. */
    const expandAnswer = (answer) => {
        if (!answer) return;
        answer.style.height = '0';
        answer.style.overflow = 'hidden';
        answer.style.display = 'block';
        const targetHeight = answer.scrollHeight;
        answer.style.height = `${targetHeight}px`;

        const onEnd = () => {
            answer.style.height = 'auto';
            answer.style.overflow = '';
            answer.removeEventListener('transitionend', onEnd);
        };
        answer.addEventListener('transitionend', onEnd);
    };

    /** Smoothly collapse an answer element. */
    const collapseAnswer = (answer) => {
        if (!answer) return;
        // Set explicit height so the transition has a starting value
        answer.style.height = `${answer.scrollHeight}px`;
        answer.style.overflow = 'hidden';
        // Force reflow so the browser registers the starting height
        void answer.offsetHeight;
        answer.style.height = '0';

        const onEnd = () => {
            answer.style.display = '';
            answer.removeEventListener('transitionend', onEnd);
        };
        answer.addEventListener('transitionend', onEnd);
    };

    faqQuestions.forEach((question) => {
        question.addEventListener('click', () => {
            const parentItem = question.closest('.faq-item');
            if (!parentItem) return;

            const isActive = parentItem.classList.contains('active');

            // Close all other FAQ items (only one open at a time)
            document.querySelectorAll('.faq-item.active').forEach((item) => {
                if (item !== parentItem) {
                    item.classList.remove('active');
                    collapseAnswer(item.querySelector('.faq-answer'));
                }
            });

            // Toggle the clicked item
            if (isActive) {
                parentItem.classList.remove('active');
                collapseAnswer(parentItem.querySelector('.faq-answer'));
            } else {
                parentItem.classList.add('active');
                expandAnswer(parentItem.querySelector('.faq-answer'));
            }
        });
    });
}

/* ==========================================================================
   7. FAQ Search
   ========================================================================== */

function initFaqSearch() {
    const faqSearch = document.getElementById('faqSearch');
    if (!faqSearch) return;

    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length === 0) return;

    // Create a "no results" message if one doesn't already exist
    let noResults = document.querySelector('.faq-no-results');
    if (!noResults) {
        noResults = document.createElement('p');
        noResults.className = 'faq-no-results';
        noResults.textContent = 'No matching questions found.';
        noResults.style.display = 'none';
        const container = faqItems[0].parentElement;
        if (container) container.appendChild(noResults);
    }

    faqSearch.addEventListener('input', () => {
        const query = faqSearch.value.toLowerCase().trim();
        let visibleCount = 0;

        faqItems.forEach((item) => {
            const questionEl = item.querySelector('.faq-question');
            const answerEl = item.querySelector('.faq-answer');
            const questionText = questionEl ? questionEl.textContent.toLowerCase() : '';
            const answerText = answerEl ? answerEl.textContent.toLowerCase() : '';

            const matches = !query || questionText.includes(query) || answerText.includes(query);
            item.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });

        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    });
}

/* ==========================================================================
   8. Service Worker Registration
   ========================================================================== */

function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => console.log('Service worker registered:', reg.scope))
        .catch((err) => console.log('Service worker registration failed:', err));
}

/* ==========================================================================
   9. Smooth Scroll for Anchor Links
   ========================================================================== */

function initSmoothScroll() {
    // Use event delegation on the document so dynamically-added links work too
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        const offset = 20; // breathing room above the target
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    });
}

/* ==========================================================================
   10. Blog Category Filter
   ========================================================================== */

function initBlogFilter() {
    const filterBtns = document.querySelectorAll('.blog-filter-btn');
    const blogCards = document.querySelectorAll('.blog-card');

    if (filterBtns.length === 0 || blogCards.length === 0) return;

    filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.dataset.category || 'all';

            blogCards.forEach((card) => {
                card.style.display =
                    (category === 'all' || card.dataset.category === category) ? '' : 'none';
            });
        });
    });
}
