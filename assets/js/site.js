(function () {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const progressBar = document.getElementById('scrollProgress');

    if (progressBar) {
        let scrollFrame = null;

        const updateProgress = function () {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const percentage = scrollable > 0
                ? Math.min((window.scrollY / scrollable) * 100, 100)
                : 0;

            progressBar.style.width = percentage + '%';
            scrollFrame = null;
        };

        window.addEventListener('scroll', function () {
            if (!scrollFrame) {
                scrollFrame = window.requestAnimationFrame(updateProgress);
            }
        }, { passive: true });

        updateProgress();
    }

    const revealItems = document.querySelectorAll('.reveal, .tool-card');

    if (revealItems.length) {
        if (reducedMotion || !('IntersectionObserver' in window)) {
            revealItems.forEach(function (item) {
                item.classList.add('visible');
            });
        } else {
            const observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.08 });

            revealItems.forEach(function (item) {
                observer.observe(item);
            });
        }
    }

    const themeToggle = document.getElementById('themeToggle');
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    function updateThemeButton() {
        if (!themeToggle) return;

        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const target = current === 'dark' ? 'light' : 'dark';
        const label = 'Switch to ' + target + ' mode';

        themeToggle.setAttribute('aria-label', label);
        themeToggle.setAttribute('title', label);

        if (themeColorMeta) {
            themeColorMeta.setAttribute(
                'content',
                current === 'dark' ? '#020617' : '#2563eb'
            );
        }
    }

    if (themeToggle) {
        updateThemeButton();

        themeToggle.addEventListener('click', function () {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', next);

            try {
                localStorage.setItem('theme', next);
            } catch (error) {}

            updateThemeButton();
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        function closeMenu(returnFocus) {
            navLinks.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-label', 'Open navigation menu');
            menuToggle.textContent = 'Menu';

            if (returnFocus) {
                menuToggle.focus();
            }
        }

        menuToggle.addEventListener('click', function () {
            const isOpen = navLinks.classList.toggle('open');

            menuToggle.setAttribute('aria-expanded', String(isOpen));
            menuToggle.setAttribute(
                'aria-label',
                isOpen ? 'Close navigation menu' : 'Open navigation menu'
            );

            menuToggle.textContent = isOpen ? 'Close' : 'Menu';
        });

        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                closeMenu(false);
            });
        });

        document.addEventListener('click', function (event) {
            if (!event.target.closest('nav') && navLinks.classList.contains('open')) {
                closeMenu(false);
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && navLinks.classList.contains('open')) {
                closeMenu(true);
            }
        });
    }

    const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(function (question) {
    if (question.tagName.toLowerCase() === 'summary') {
        return;
    }

    question.setAttribute('role', 'button');
    question.setAttribute('tabindex', '0');
    question.setAttribute('aria-expanded', 'false');

    function toggleFaq() {
        const item = question.closest('.faq-item');

        if (!item) {
            return;
        }

        const isOpen = item.classList.toggle('open');
        question.setAttribute('aria-expanded', String(isOpen));
    }

    question.addEventListener('click', toggleFaq);

    question.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleFaq();
        }
    });
});

    const currentYear = document.getElementById('currentYear');

    if (currentYear) {
        currentYear.textContent = String(new Date().getFullYear());
    }
}());

// Dynamic Table of Contents Generator & Smooth Scroll
document.addEventListener("DOMContentLoaded", function () {
  const tocList = document.getElementById("dynamic-toc");
  const articleContent = document.querySelector(".post-content");

  if (tocList && articleContent) {
    const headings = articleContent.querySelectorAll("h2, h3");

    headings.forEach((heading, index) => {
      // Heading ID check karo ya new assign karo
      if (!heading.id) {
        heading.id = "toc-heading-" + index;
      }

      const li = document.createElement("li");
      const a = document.createElement("a");

      a.href = "#" + heading.id;
      a.innerHTML = `<span class="toc-bullet"></span>${heading.textContent}`;

      // Level based styling (H3 ko slightly indent karne ke liye)
      if (heading.tagName.toLowerCase() === "h3") {
        li.classList.add("toc-subitem");
      }

      // Smooth Scroll click handler
      a.addEventListener("click", function (e) {
        e.preventDefault();
        const targetElement = document.getElementById(heading.id);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
          history.pushState(null, null, "#" + heading.id);
        }
      });

      li.appendChild(a);
      tocList.appendChild(li);
    });
  }
});
