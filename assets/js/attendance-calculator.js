(() => {
    'use strict';

    const form =
        document.getElementById('attendanceForm');

    const totalInput =
        document.getElementById('totalClasses');

    const attendedInput =
        document.getElementById('attendedClasses');

    const targetInput =
        document.getElementById('targetPercent');

    const remainingInput =
        document.getElementById('remainingClasses');

    const errorBox =
        document.getElementById('calcError');

    const result =
        document.getElementById('calcResult');

    const resultValue =
        document.getElementById('resultValue');

    const resultTier =
        document.getElementById('resultTier');

    const resultExtra =
        document.getElementById('resultExtra');

    const copyBtn =
        document.getElementById('copyBtn');

    const resetBtn =
        document.getElementById('resetBtn');

    if (
        !form ||
        !totalInput ||
        !attendedInput ||
        !targetInput ||
        !remainingInput ||
        !errorBox ||
        !result ||
        !resultValue ||
        !resultTier ||
        !resultExtra ||
        !copyBtn ||
        !resetBtn
    ) {
        return;
    }

    const inputs = [
        totalInput,
        attendedInput,
        targetInput,
        remainingInput
    ];

    const prefersReducedMotion =
        window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        );

    function setNeutralResult() {
        result.classList.remove('visible');

        resultValue.textContent = '--';

        resultTier.textContent = 'Result';

        resultTier.className =
            'calc-result-tier';

        resultExtra.textContent =
            'Enter your attendance details to calculate your result.';
    }

    function clearValidation() {
        errorBox.hidden = true;
        errorBox.textContent = '';

        inputs.forEach((input) => {
            input.removeAttribute(
                'aria-invalid'
            );
        });
    }

    function showError(
        message,
        input
    ) {
        clearValidation();

        errorBox.textContent = message;
        errorBox.hidden = false;

        if (input) {
            input.setAttribute(
                'aria-invalid',
                'true'
            );

            input.focus();
        }
    }

    function parseNumber(input) {
        const rawValue =
            input.value.trim();

        if (rawValue === '') {
            return null;
        }

        const value =
            Number(rawValue);

        if (!Number.isFinite(value)) {
            return null;
        }

        return value;
    }

    function validateInputs() {
        clearValidation();

        const total =
            parseNumber(totalInput);

        const attended =
            parseNumber(attendedInput);

        const target =
            parseNumber(targetInput);

        const remaining =
            parseNumber(remainingInput);

        if (total === null) {
            showError(
                'Enter the total number of classes held.',
                totalInput
            );

            return null;
        }

        if (
            total <= 0 ||
            !Number.isInteger(total)
        ) {
            showError(
                'Total classes must be a whole number greater than 0.',
                totalInput
            );

            return null;
        }

        if (attended === null) {
            showError(
                'Enter the number of classes attended.',
                attendedInput
            );

            return null;
        }

        if (
            attended < 0 ||
            !Number.isInteger(attended)
        ) {
            showError(
                'Classes attended must be a whole number of 0 or more.',
                attendedInput
            );

            return null;
        }

        if (attended > total) {
            showError(
                'Classes attended cannot exceed total classes held.',
                attendedInput
            );

            return null;
        }

        if (target === null) {
            showError(
                'Enter your target attendance percentage.',
                targetInput
            );

            return null;
        }

        if (
            target < 0 ||
            target > 100
        ) {
            showError(
                'Target attendance must be between 0 and 100.',
                targetInput
            );

            return null;
        }

        if (remaining === null) {
            showError(
                'Enter the number of remaining classes.',
                remainingInput
            );

            return null;
        }

        if (
            remaining < 0 ||
            !Number.isInteger(remaining)
        ) {
            showError(
                'Remaining classes must be a whole number of 0 or more.',
                remainingInput
            );

            return null;
        }

        return {
            total,
            attended,
            target,
            remaining
        };
    }

    function formatTarget(target) {
        return Number.isInteger(target)
            ? String(target)
            : target.toFixed(1)
                .replace(/\.0$/, '');
    }

    function getTier(
        percent,
        target
    ) {
        if (percent < 60) {
            return {
                name: 'Critical',
                className: 'tier-low'
            };
        }

        if (percent < target) {
            return {
                name: 'Below Target',
                className: 'tier-average'
            };
        }

        if (percent < 85) {
            return {
                name: 'Safe',
                className: 'tier-good'
            };
        }

        return {
            name: 'Excellent',
            className: 'tier-excellent'
        };
    }

    function getProjectionMessage(
        total,
        attended,
        target,
        remaining,
        percent
    ) {
        const targetLabel =
            formatTarget(target);

        if (remaining === 0) {
            if (percent >= target) {
                return (
                    `You currently meet your ` +
                    `<strong>${targetLabel}%</strong> ` +
                    `attendance target. No remaining classes were entered.`
                );
            }

            return (
                `You are currently below your ` +
                `<strong>${targetLabel}%</strong> ` +
                `target, and no remaining classes were entered.`
            );
        }

        const finalTotal =
            total + remaining;

        const requiredAttendance =
            (target / 100) *
            finalTotal;

        const tolerance = 1e-9;

        if (percent >= target) {
            const rawMisses =
                attended +
                remaining -
                requiredAttendance;

            const possibleMisses =
                Math.floor(
                    rawMisses +
                    tolerance
                );

            const safeMisses =
                Math.max(
                    0,
                    Math.min(
                        remaining,
                        possibleMisses
                    )
                );

            return (
                `You can miss up to ` +
                `<strong>${safeMisses}</strong> ` +
                `of the ${remaining} remaining classes ` +
                `and still maintain ${targetLabel}%.`
            );
        }

        const rawNeeded =
            requiredAttendance -
            attended;

        const needed =
            Math.max(
                0,
                Math.ceil(
                    rawNeeded -
                    tolerance
                )
            );

        if (needed <= remaining) {
            return (
                `You need to attend at least ` +
                `<strong>${needed}</strong> ` +
                `of the ${remaining} remaining classes ` +
                `to reach ${targetLabel}%.`
            );
        }

        const maxPossible =
            (
                (
                    attended +
                    remaining
                ) /
                finalTotal
            ) *
            100;

        return (
            `Even if you attend all ${remaining} ` +
            `remaining classes, you cannot reach ` +
            `${targetLabel}%. Your max possible: ` +
            `<strong>${maxPossible.toFixed(2)}%</strong>.`
        );
    }

    async function copyText(text) {
        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {
            await navigator.clipboard.writeText(
                text
            );

            return;
        }

        const textarea =
            document.createElement(
                'textarea'
            );

        textarea.value = text;

        textarea.setAttribute(
            'readonly',
            ''
        );

        textarea.style.position =
            'fixed';

        textarea.style.opacity =
            '0';

        document.body.appendChild(
            textarea
        );

        textarea.select();

        const copied =
            document.execCommand(
                'copy'
            );

        textarea.remove();

        if (!copied) {
            throw new Error(
                'Copy failed'
            );
        }
    }

    form.addEventListener(
        'submit',
        (event) => {
            event.preventDefault();

            const values =
                validateInputs();

            if (!values) {
                setNeutralResult();
                return;
            }

            const {
                total,
                attended,
                target,
                remaining
            } = values;

            const percent =
                (
                    attended /
                    total
                ) *
                100;

            resultValue.textContent =
                `${percent.toFixed(2)}%`;

            const tier =
                getTier(
                    percent,
                    target
                );

            resultTier.textContent =
                tier.name;

            resultTier.className =
                `calc-result-tier ${tier.className}`;

            resultExtra.innerHTML =
                getProjectionMessage(
                    total,
                    attended,
                    target,
                    remaining,
                    percent
                );

            result.classList.add(
                'visible'
            );

            result.scrollIntoView({
                behavior:
                    prefersReducedMotion.matches
                        ? 'auto'
                        : 'smooth',
                block: 'center'
            });

            if (
                typeof window.gtag ===
                'function'
            ) {
                window.gtag(
                    'event',
                    'calculator_used',
                    {
                        tool:
                            'attendance_calculator'
                    }
                );
            }
        }
    );

    copyBtn.addEventListener(
        'click',
        async () => {
            const cleanDetails =
                resultExtra.textContent
                    .trim();

            const text =
                `My Attendance: ` +
                `${resultValue.textContent} ` +
                `(${resultTier.textContent}) - ` +
                cleanDetails;

            const label =
                copyBtn.querySelector(
                    'span'
                );

            const originalText =
                label
                    ? label.textContent
                    : 'Copy Result';

            try {
                await copyText(text);

                if (label) {
                    label.textContent =
                        'Copied';
                }
            } catch (error) {
                if (label) {
                    label.textContent =
                        'Copy failed';
                }
            }

            window.setTimeout(
                () => {
                    if (label) {
                        label.textContent =
                            originalText;
                    }
                },
                1500
            );
        }
    );

    resetBtn.addEventListener(
        'click',
        () => {
            totalInput.value = '';
            attendedInput.value = '';
            targetInput.value = '75';
            remainingInput.value = '';

            clearValidation();
            setNeutralResult();

            totalInput.focus();
        }
    );

    inputs.forEach((input) => {
        input.addEventListener(
            'input',
            () => {
                clearValidation();
                setNeutralResult();
            }
        );
    });

    setNeutralResult();
})();
