(() => {
    'use strict';

    const nav = document.querySelector('.methodology-nav');

    const links = Array.from(
        document.querySelectorAll(
            '.methodology-nav a[href^="#"]'
        )
    );

    const sections = Array.from(
        document.querySelectorAll(
            '.methodology-section[id]'
        )
    );

    const footerMethodologyLink =
        document.querySelector(
            'footer a[href="/calculator-methodology/"]'
        );

    if (footerMethodologyLink) {
        footerMethodologyLink.setAttribute(
            'aria-current',
            'page'
        );
    }

    if (
        !nav ||
        !links.length ||
        !sections.length
    ) {
        return;
    }

    let ticking = false;

    function setActiveLink(
        activeId
    ) {
        links.forEach(
            (link) => {
                const isActive =
                    link.getAttribute(
                        'href'
                    ) ===
                    `#${activeId}`;

                link.classList.toggle(
                    'active',
                    isActive
                );

                if (isActive) {
                    link.setAttribute(
                        'aria-current',
                        'location'
                    );
                } else {
                    link.removeAttribute(
                        'aria-current'
                    );
                }
            }
        );
    }

    function updateActiveSection() {
        let activeId =
            sections[0].id;

        sections.forEach(
            (section) => {
                const rect =
                    section.getBoundingClientRect();

                if (
                    rect.top <=
                    150
                ) {
                    activeId =
                        section.id;
                }
            }
        );

        setActiveLink(
            activeId
        );
    }

    function requestActiveSectionUpdate() {
        if (ticking) {
            return;
        }

        ticking = true;

        window.requestAnimationFrame(
            () => {
                updateActiveSection();
                ticking = false;
            }
        );
    }

    links.forEach(
        (link) => {
            link.addEventListener(
                'click',
                () => {
                    const targetId =
                        link
                            .getAttribute(
                                'href'
                            )
                            .slice(1);

                    if (targetId) {
                        setActiveLink(
                            targetId
                        );
                    }
                }
            );
        }
    );

    window.addEventListener(
        'scroll',
        requestActiveSectionUpdate,
        {
            passive: true
        }
    );

    window.addEventListener(
        'resize',
        requestActiveSectionUpdate
    );

    window.addEventListener(
        'hashchange',
        requestActiveSectionUpdate
    );

    updateActiveSection();
})();
