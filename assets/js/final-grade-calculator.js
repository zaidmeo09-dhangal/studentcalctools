(() => {
    'use strict';

    const form = document.getElementById('finalGradeForm');
    const currentInput = document.getElementById('currentGrade');
    const targetInput = document.getElementById('targetGrade');
    const weightInput = document.getElementById('finalWeight');
    const errorBox = document.getElementById('calcError');
    const result = document.getElementById('calcResult');
    const resultValue = document.getElementById('resultValue');
    const resultTier = document.getElementById('resultTier');
    const resultExtra = document.getElementById('resultExtra');
    const copyBtn = document.getElementById('copyBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (
        !form ||
        !currentInput ||
        !targetInput ||
        !weightInput ||
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
        currentInput,
        targetInput,
        weightInput
    ];

    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    );

    function setNeutralResult() {
        result.classList.remove('visible');

        resultValue.textContent = '--';
        resultTier.textContent = 'Result';
        resultTier.className = 'calc-result-tier';

        resultExtra.textContent =
            'Enter your grades and final exam weight to calculate the score you need.';
    }

    function clearValidation() {
        errorBox.hidden = true;
        errorBox.textContent = '';

        inputs.forEach((input) => {
            input.removeAttribute('aria-invalid');
        });
    }

    function showError(message, input) {
        clearValidation();

        errorBox.textContent = message;
        errorBox.hidden = false;

        if (input) {
            input.setAttribute('aria-invalid', 'true');
            input.focus();
        }
    }

    function parseInput(input) {
        const rawValue = input.value.trim();

        if (rawValue === '') {
            return null;
        }

        const value = Number(rawValue);

        return Number.isFinite(value)
            ? value
            : null;
    }

    function validateInputs() {
        clearValidation();

        const current = parseInput(currentInput);
        const target = parseInput(targetInput);
        const weight = parseInput(weightInput);

        if (current === null) {
            showError(
                'Enter your current grade.',
                currentInput
            );

            return null;
        }

        if (current < 0 || current > 100) {
            showError(
                'Current grade must be between 0 and 100.',
                currentInput
            );

            return null;
        }

        if (target === null) {
            showError(
                'Enter your target grade.',
                targetInput
            );

            return null;
        }

        if (target < 0 || target > 100) {
            showError(
                'Target grade must be between 0 and 100.',
                targetInput
            );

            return null;
        }

        if (weight === null) {
            showError(
                'Enter the final exam weight.',
                weightInput
            );

            return null;
        }

        if (weight <= 0 || weight > 100) {
            showError(
                'Final exam weight must be greater than 0 and no more than 100.',
                weightInput
            );

            return null;
        }

        return {
            current,
            target,
            weight
        };
    }

    function formatPercent(value) {
        return `${value.toFixed(2)}%`;
    }

    function setResultDetails(
        needed,
        current,
        target,
        weightDecimal
    ) {
        let tier = 'Achievable';
        let tierClass = 'tier-good';
        let extra = '';

        if (needed > 100) {
            const maxPossible =
                current * (1 - weightDecimal) +
                100 * weightDecimal;

            tier = 'Not Possible';
            tierClass = 'tier-low';

            extra =
                `Even a perfect 100% on the final cannot reach your target. ` +
                `Your max possible grade: <strong>${maxPossible.toFixed(2)}%</strong>.`;
        } else if (needed <= 0) {
            tier = 'Already There';
            tierClass = 'tier-excellent';

            extra =
                'You have already secured your target mathematically. ' +
                'The minimum final exam score needed is <strong>0.00%</strong>.';
        } else if (needed <= 60) {
            tier = 'Easy Target';
            tierClass = 'tier-excellent';

            extra =
                `Score this or higher on your final to reach ` +
                `<strong>${target.toFixed(2)}%</strong>.`;
        } else if (needed <= 80) {
            tier = 'Achievable';
            tierClass = 'tier-good';

            extra =
                `Score this or higher on your final to reach ` +
                `<strong>${target.toFixed(2)}%</strong>.`;
        } else if (needed <= 95) {
            tier = 'Challenging';
            tierClass = 'tier-average';

            extra =
                `This is a high score. Score this or higher to reach ` +
                `<strong>${target.toFixed(2)}%</strong>.`;
        } else {
            tier = 'Very Hard';
            tierClass = 'tier-low';

            extra =
                `Almost a perfect score is required to reach ` +
                `<strong>${target.toFixed(2)}%</strong>.`;
        }

        resultTier.textContent = tier;
        resultTier.className =
            `calc-result-tier ${tierClass}`;

        resultExtra.innerHTML = extra;
    }

    function animateResult(finalValue) {
        if (
            prefersReducedMotion.matches ||
            finalValue === 0
        ) {
            resultValue.textContent =
                formatPercent(finalValue);

            return;
        }

        const duration = 800;
        const start = performance.now();

        function animate(time) {
            const progress = Math.min(
                (time - start) / duration,
                1
            );

            const eased =
                1 - Math.pow(1 - progress, 3);

            resultValue.textContent =
                formatPercent(eased * finalValue);

            if (progress < 1) {
                window.requestAnimationFrame(
                    animate
                );
            } else {
                resultValue.textContent =
                    formatPercent(finalValue);
            }
        }

        window.requestAnimationFrame(
            animate
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
            document.createElement('textarea');

        textarea.value = text;
        textarea.setAttribute(
            'readonly',
            ''
        );

        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';

        document.body.appendChild(
            textarea
        );

        textarea.select();

        const copied =
            document.execCommand('copy');

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
                current,
                target,
                weight
            } = values;

            const weightDecimal =
                weight / 100;

            const needed =
                (
                    target -
                    current *
                    (1 - weightDecimal)
                ) /
                weightDecimal;

            const displayedNeeded =
                Math.max(
                    0,
                    needed
                );

            setResultDetails(
                needed,
                current,
                target,
                weightDecimal
            );

            result.classList.add(
                'visible'
            );

            animateResult(
                displayedNeeded
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
                            'final_grade_calculator'
                    }
                );
            }
        }
    );

    copyBtn.addEventListener(
        'click',
        async () => {
            const text =
                `Final Exam Required: ` +
                `${resultValue.textContent} ` +
                `(${resultTier.textContent})`;

            const originalText =
                copyBtn.textContent;

            try {
                await copyText(text);

                copyBtn.textContent =
                    'Copied';
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
            currentInput.value = '';
            targetInput.value = '';
            weightInput.value = '';

            clearValidation();
            setNeutralResult();

            currentInput.focus();
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
