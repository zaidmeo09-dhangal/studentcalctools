(function () {
    const searchInput = document.getElementById('calculatorSearch');
    const clearSearch = document.getElementById('clearSearch');
    const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
    const cards = Array.from(document.querySelectorAll('[data-tool-card]'));
    const categorySections = Array.from(document.querySelectorAll('[data-category-section]'));
    const resultCount = document.getElementById('resultCount');
    const noResults = document.getElementById('noResults');

    if (
        !searchInput ||
        !clearSearch ||
        !resultCount ||
        !noResults ||
        !cards.length
    ) {
        return;
    }

    let activeFilter = 'all';

    function normalize(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');
    }

    function updateDirectory() {
        const term = normalize(searchInput.value);
        let visibleCount = 0;

        cards.forEach(function (card) {
            const matchesFilter =
                activeFilter === 'all' ||
                card.dataset.category === activeFilter;

            const searchableText = normalize(
                (card.dataset.search || '') + ' ' + card.textContent
            );

            const matchesSearch =
                !term || searchableText.includes(term);

            const isVisible =
                matchesFilter && matchesSearch;

            card.hidden = !isVisible;

            if (isVisible) {
                visibleCount += 1;
            }
        });

        categorySections.forEach(function (section) {
            const hasVisibleCard = Boolean(
                section.querySelector('[data-tool-card]:not([hidden])')
            );

            section.hidden = !hasVisibleCard;
        });

        resultCount.textContent =
            visibleCount === 1
                ? 'Showing 1 calculator'
                : 'Showing ' + visibleCount + ' calculators';

        noResults.hidden = visibleCount !== 0;
        clearSearch.hidden = searchInput.value.length === 0;
    }

    searchInput.addEventListener('input', updateDirectory);

    searchInput.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && searchInput.value) {
            searchInput.value = '';
            updateDirectory();
        }
    });

    clearSearch.addEventListener('click', function () {
        searchInput.value = '';
        updateDirectory();
        searchInput.focus();
    });

    filterButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            activeFilter = button.dataset.filter;

            filterButtons.forEach(function (candidate) {
                candidate.setAttribute(
                    'aria-pressed',
                    String(candidate === button)
                );
            });

            updateDirectory();
        });
    });

    cards.forEach(function (card) {
        const link = card.querySelector('.tool-link');

        if (!link) {
            return;
        }

        link.addEventListener('click', function () {
            if (typeof gtag === 'function') {
                gtag('event', 'calculator_directory_click', {
                    tool_name: link.dataset.toolName,
                    tool_category: card.dataset.category
                });
            }
        });
    });

    updateDirectory();
}());
