(() => {
    'use strict';

    const calcBtn = document.getElementById('calculateBtn');
    const totalInput = document.getElementById('totalStudents');
    const rankInput = document.getElementById('yourRank');
    const result = document.getElementById('calcResult');
    const resultValue = document.getElementById('resultValue');
    const resultTier = document.getElementById('resultTier');
    const resultExtra = document.getElementById('resultExtra');
    const copyBtn = document.getElementById('copyBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (
        !calcBtn ||
        !totalInput ||
        !rankInput ||
        !result ||
        !resultValue ||
        !resultTier ||
        !resultExtra ||
        !copyBtn ||
        !resetBtn
    ) {
        return;
    }

    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    );

    function launchConfetti() {
        if (prefersReducedMotion.matches) {
            return;
        }

        const colors = [
            '#2563eb',
            '#06b6d4',
            '#3b82f6',
            '#22d3ee',
            '#1d4ed8'
        ];

        for (let i = 0; i < 40; i += 1) {
            const confetti = document.createElement('div');

            confetti.className = 'confetti';

            confetti.style.background =
                colors[
                    Math.floor(
                        Math.random() *
                        colors.length
                    )
                ];

            confetti.style.left =
                (
                    50 +
                    (
                        Math.random() -
                        0.5
                    ) *
                    20
                ) +
                '%';

            confetti.style.top =
                '50%';

            confetti.style.setProperty(
                '--x',
                (
                    (
                        Math.random() -
                        0.5
                    ) *
                    600
                ) +
                'px'
            );

            confetti.style.setProperty(
                '--y',
                (
                    Math.random() *
                    400 +
                    100
                ) +
                'px'
            );

            confetti.style.borderRadius =
                Math.random() > 0.5
                    ? '50%'
                    : '2px';

            confetti.style.animationDelay =
                (
                    Math.random() *
                    0.3
                ) +
                's';

            document.body.appendChild(
                confetti
            );

            window.setTimeout(
                () => {
                    confetti.remove();
                },
                2000
            );
        }
    }

    function readPositiveInteger(input) {
        const raw =
            input.value.trim();

        if (raw === '') {
            return null;
        }

        const value =
            Number(raw);

        if (
            !Number.isFinite(value) ||
            !Number.isInteger(value) ||
            value <= 0
        ) {
            return null;
        }

        return value;
    }

    function showValidationMessage(
        message,
        input
    ) {
        window.alert(message);
        input.focus();
    }

    function animatePercentile(
        percentile
    ) {
        if (
            prefersReducedMotion.matches
        ) {
            resultValue.textContent =
                percentile.toFixed(1) +
                '%';

            return;
        }

        const duration =
            800;

        const start =
            performance.now();

        const animate =
            (time) => {
                const progress =
                    Math.min(
                        (
                            time -
                            start
                        ) /
                        duration,
                        1
                    );

                const eased =
                    1 -
                    Math.pow(
                        1 -
                        progress,
                        3
                    );

                const displayed =
                    (
                        eased *
                        percentile
                    ).toFixed(1);

                resultValue.textContent =
                    displayed +
                    '%';

                if (
                    progress <
                    1
                ) {
                    requestAnimationFrame(
                        animate
                    );
                }
            };

        requestAnimationFrame(
            animate
        );
    }

    function setTier(
        topPercent
    ) {
        let tier =
            'Top Half';

        let tierClass =
            'tier-good';

        if (
            topPercent <=
            10
        ) {
            tier =
                'Top 10%';

            tierClass =
                'tier-excellent';
        } else if (
            topPercent <=
            25
        ) {
            tier =
                'Top 25%';

            tierClass =
                'tier-excellent';
        } else if (
            topPercent <=
            50
        ) {
            tier =
                'Top Half';

            tierClass =
                'tier-good';
        } else if (
            topPercent <=
            75
        ) {
            tier =
                'Bottom Half';

            tierClass =
                'tier-average';
        } else {
            tier =
                'Bottom 25%';

            tierClass =
                'tier-low';
        }

        resultTier.textContent =
            tier;

        resultTier.className =
            'calc-result-tier ' +
            tierClass;
    }

    function calculate() {
        const total =
            readPositiveInteger(
                totalInput
            );

        const rank =
            readPositiveInteger(
                rankInput
            );

        if (
            total ===
            null
        ) {
            showValidationMessage(
                'Please enter total students as a whole number greater than 0.',
                totalInput
            );

            return;
        }

        if (
            rank ===
            null
        ) {
            showValidationMessage(
                'Please enter your rank as a whole number greater than 0.',
                rankInput
            );

            return;
        }

        if (
            rank >
            total
        ) {
            showValidationMessage(
                'Your rank cannot be higher than total students.',
                rankInput
            );

            return;
        }

        const percentile =
            (
                (
                    total -
                    rank +
                    1
                ) /
                total
            ) *
            100;

        const topPercent =
            (
                rank /
                total
            ) *
            100;

        animatePercentile(
            percentile
        );

        setTier(
            topPercent
        );

        resultExtra.innerHTML =
            'You rank <strong>#' +
            rank +
            ' out of ' +
            total +
            '</strong>, which is the <strong>top ' +
            topPercent.toFixed(1) +
            '%</strong> of your class.';

        result.classList.add(
            'visible'
        );

        result.scrollIntoView({
            behavior:
                prefersReducedMotion
                    .matches
                    ? 'auto'
                    : 'smooth',

            block:
                'center'
        });

        if (
            topPercent <=
            10
        ) {
            launchConfetti();
        }

        if (
            typeof window.gtag ===
            'function'
        ) {
            window.gtag(
                'event',
                'calculator_used',
                {
                    tool:
                        'class_rank_calculator'
                }
            );
        }
    }

    async function copyToClipboard(
        text
    ) {
        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {
            await navigator
                .clipboard
                .writeText(
                    text
                );

            return;
        }

        const temporary =
            document.createElement(
                'textarea'
            );

        temporary.value =
            text;

        temporary.setAttribute(
            'readonly',
            ''
        );

        temporary.style.position =
            'fixed';

        temporary.style.opacity =
            '0';

        temporary.style.pointerEvents =
            'none';

        document.body.appendChild(
            temporary
        );

        temporary.select();

        const copied =
            document.execCommand(
                'copy'
            );

        temporary.remove();

        if (!copied) {
            throw new Error(
                'Copy failed'
            );
        }
    }

    calcBtn.addEventListener(
        'click',
        calculate
    );

    [
        totalInput,
        rankInput
    ].forEach(
        (input) => {
            input.addEventListener(
                'keydown',
                (event) => {
                    if (
                        event.key ===
                        'Enter'
                    ) {
                        event.preventDefault();

                        calculate();
                    }
                }
            );
        }
    );

    copyBtn.addEventListener(
        'click',
        async () => {
            const text =
                'My Class Rank Percentile: ' +
                resultValue.textContent +
                ' (' +
                resultTier.textContent +
                ') — ' +
                resultExtra.textContent;

            const originalText =
                copyBtn.textContent;

            try {
                await copyToClipboard(
                    text
                );

                copyBtn.textContent =
                    '✓ Copied!';
            } catch (error) {
                copyBtn.textContent =
                    'Copy failed';
            }

            window.setTimeout(
                () => {
                    copyBtn.textContent =
                        originalText;
                },
                1500
            );
        }
    );

    resetBtn.addEventListener(
        'click',
        () => {
            result.classList.remove(
                'visible'
            );

            totalInput.value =
                '';

            rankInput.value =
                '';

            totalInput.focus();
        }
    );
})();
